// server/controllers/orderController.js
// ============================================================
// ORDER CONTROLLER
//
// The place-order flow (the most critical operation):
//
//  1. validateCart endpoint  → frontend confirms cart is valid
//  2. POST /api/orders       → this controller runs:
//     a. Re-validate cart items (double check server-side)
//     b. Check wallet balance ≥ order total
//     c. Start MongoDB session (atomic transaction)
//     d. Deduct from wallet ($inc with negative value)
//     e. Create WalletTransaction (debit, completed)
//     f. Generate order number + QR code string
//     g. Create Order document
//     h. Clear student's cart
//     i. Increment totalOrders on each MenuItem
//     j. Commit session
//     k. Emit Socket.io event to kitchen panel
//     l. Return order + QR to student
//
// All steps d–i happen inside a single MongoDB transaction.
// If any step fails, the entire thing rolls back — no partial state.
// ============================================================

const mongoose = require("mongoose");
const { Order, Cart } = require("../models/Order");
const { MenuItem } = require("../models/MenuItem");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const { AppError } = require("../middleware/errorHandler");

const WalletModel = Wallet.Wallet || Wallet;
const WalletTxModel = WalletTransaction.WalletTransaction || WalletTransaction;

// ─────────────────────────────────────────────
// HELPER — Get Socket.io instance
// Injected via app.set("io", io) in server.js
// ─────────────────────────────────────────────
const emitToKitchen = (req, event, data) => {
  try {
    const io = req.app.get("io");
    if (io) {
      io.to("kitchen").emit(event, data); // Kitchen staff join the "kitchen" room
    }
  } catch {
    // Socket failure should never break order placement
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/orders
// @access  Student only
// @desc    Place an order — the big one.
// Body: { specialNote?: string }  (optional note for kitchen)
// ─────────────────────────────────────────────
const placeOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { specialNote = "" } = req.body;
    const userId = req.user._id;

    // ── 1. Get cart ───────────────────────────
    const cart = await Cart.findOne({ userId }).populate(
      "items.menuItem",
      "name price isAvailable isSoldOut images preparationTime"
    );

    if (!cart || cart.items.length === 0) {
      throw new AppError("Your cart is empty.", 400);
    }

    // ── 2. Server-side cart validation ────────
    // We re-validate even if the frontend just called /cart/validate.
    // Never trust the client alone for money operations.
    const validatedItems = [];
    let orderTotal = 0;
    let maxPrepTime = 0;

    for (const cartItem of cart.items) {
      const menuItem = cartItem.menuItem;

      if (!menuItem || !menuItem.isAvailable) {
        throw new AppError(
          `'${menuItem?.name || "An item"}' is no longer available. Please update your cart.`,
          400
        );
      }

      if (menuItem.isSoldOut) {
        throw new AppError(
          `'${menuItem.name}' is sold out. Please remove it from your cart.`,
          400
        );
      }

      // Use the snapshotted price from cart (not current menu price)
      // This is intentional — price was locked when student added the item.
      // If price changed since then, validateCart would have caught it.
      const itemTotal = cartItem.price * cartItem.quantity;
      orderTotal += itemTotal;
      maxPrepTime = Math.max(maxPrepTime, menuItem.preparationTime || 10);

      validatedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,                               // snapshot
        price: cartItem.price,                             // snapshot (paise)
        imageUrl: menuItem.images?.[0] || null,            // snapshot
        quantity: cartItem.quantity,
        specialInstructions: cartItem.specialInstructions || "",
        subtotal: itemTotal,
      });
    }

    // ── 3. Check wallet balance ───────────────
    const wallet = await WalletModel.findOne({ userId, isActive: true });

    if (!wallet) {
      throw new AppError("Wallet not found. Please contact support.", 404);
    }

    if (wallet.balance < orderTotal) {
      throw new AppError(
        `Insufficient wallet balance. Order total is ₹${orderTotal / 100} but your balance is ₹${wallet.balance / 100}. Please top up your wallet.`,
        400
      );
    }

    // ── 4. Generate order number + QR string ──
    const orderNumber = await Order.generateOrderNumber();
    // QR code is just the order number string.
    // Frontend generates the actual QR image from this.
    const qrCode = orderNumber;

    // ── 5. Atomic DB operations ───────────────
    // Deduct wallet
    const updatedWallet = await WalletModel.findOneAndUpdate(
      {
        userId,
        isActive: true,
        balance: { $gte: orderTotal }, // Extra safety: only deduct if balance is still enough
      },
      {
        $inc: {
          balance: -orderTotal,
          totalDebited: orderTotal,
        },
      },
      { new: true, session }
    );

    if (!updatedWallet) {
      throw new AppError(
        "Payment failed — wallet balance may have changed. Please try again.",
        400
      );
    }

    // Create wallet debit transaction
    const walletTransaction = await WalletTxModel.create(
      [
        {
          walletId: wallet._id,
          userId,
          type: "debit",
          amount: orderTotal,
          description: `Payment for order ${orderNumber}`,
          status: "completed",
          balanceAfter: updatedWallet.balance,
        },
      ],
      { session }
    );

    // Create the order
    const [order] = await Order.create(
      [
        {
          orderNumber,
          userId,
          items: validatedItems,
          totalAmount: orderTotal,
          status: "placed",
          qrCode,
          kitchenNote: specialNote.trim(),
          walletTransactionId: walletTransaction[0]._id,
          estimatedTime: maxPrepTime + 5, // prep time + 5 min buffer
          statusHistory: [
            {
              status: "placed",
              timestamp: new Date(),
              updatedBy: userId,
            },
          ],
          paymentStatus: "paid",
        },
      ],
      { session }
    );

    // Update wallet transaction with order reference
    await WalletTxModel.findByIdAndUpdate(
      walletTransaction[0]._id,
      { orderId: order._id },
      { session }
    );

    // Increment totalOrders on each menu item (for analytics)
    await Promise.all(
      validatedItems.map((item) =>
        MenuItem.findByIdAndUpdate(
          item.menuItem,
          { $inc: { totalOrders: item.quantity } },
          { session }
        )
      )
    );

    // Clear cart
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalAmount: 0 },
      { session }
    );

    await session.commitTransaction();

    // ── 6. Notify kitchen via Socket.io ───────
    // This happens AFTER commit — we don't want to notify if order failed
    emitToKitchen(req, "new_order", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      items: validatedItems.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        specialInstructions: i.specialInstructions,
      })),
      totalAmount: orderTotal / 100,
      specialNote,
      placedAt: order.createdAt,
    });

    // ── 7. Return order to student ────────────
    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        qrCode: order.qrCode,         // Frontend renders QR image from this string
        items: validatedItems.map((i) => ({
          ...i,
          price: i.price / 100,
          subtotal: i.subtotal / 100,
        })),
        totalAmount: orderTotal / 100,
        status: order.status,
        estimatedTime: order.estimatedTime,
        walletBalanceAfter: updatedWallet.balance / 100,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/orders
// @access  Student only
// @desc    Student's own order history (paginated)
// ─────────────────────────────────────────────
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-statusHistory -walletTransactionId") // Exclude heavy fields from list
        .lean(),
      Order.countDocuments(filter),
    ]);

    const formatted = orders.map(formatOrderPrices);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/orders/:id
// @access  Student (own order) | Kitchen | Admin
// @desc    Full order details including status history
// ─────────────────────────────────────────────
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email collegeId")
      .populate("statusHistory.updatedBy", "name role")
      .lean();

    if (!order) throw new AppError("Order not found.", 404);

    // Students can only see their own orders
    if (
      req.user.role === "student" &&
      order.userId._id.toString() !== req.user._id.toString()
    ) {
      throw new AppError("You do not have access to this order.", 403);
    }

    res.status(200).json({
      success: true,
      data: formatOrderPrices(order),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/orders/:id/cancel
// @access  Student only
// @desc    Student cancels order (only if still "placed")
//          Refund is issued automatically.
// ─────────────────────────────────────────────
const cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).session(session);

    if (!order) throw new AppError("Order not found.", 404);

    if (order.status !== "placed") {
      throw new AppError(
        `Order cannot be cancelled — it is already '${order.status}'. Contact the canteen if you need help.`,
        400
      );
    }

    // Issue refund to wallet
    const updatedWallet = await WalletModel.findOneAndUpdate(
      { userId: req.user._id },
      {
        $inc: {
          balance: order.totalAmount,
          totalCredited: order.totalAmount,
        },
      },
      { new: true, session }
    );

    // Create refund transaction record
    await WalletTxModel.create(
      [
        {
          walletId: updatedWallet._id,
          userId: req.user._id,
          orderId: order._id,
          type: "refund",
          amount: order.totalAmount,
          description: `Refund for cancelled order ${order.orderNumber}`,
          status: "completed",
          balanceAfter: updatedWallet.balance,
        },
      ],
      { session }
    );

    // Update order status
    order.status = "cancelled";
    order.paymentStatus = "refunded";
    order.statusHistory.push({
      status: "cancelled",
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: "Cancelled by student",
    });
    await order.save({ session });

    await session.commitTransaction();

    // Notify kitchen that this order was cancelled
    emitToKitchen(req, "order_cancelled", {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });

    res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} cancelled. ₹${order.totalAmount / 100} refunded to your wallet.`,
      data: {
        orderNumber: order.orderNumber,
        refundAmount: order.totalAmount / 100,
        walletBalance: updatedWallet.balance / 100,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/orders/:id/status
// @access  Kitchen + Admin
// @desc    Kitchen updates order status
// Body: { status: "accepted"|"cooking"|"ready", estimatedTime?, note? }
// ─────────────────────────────────────────────
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, estimatedTime, note = "" } = req.body;

    const validTransitions = {
      placed:   ["accepted", "rejected"],
      accepted: ["cooking", "rejected"],
      cooking:  ["ready"],
      ready:    ["completed"],
    };

    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError("Order not found.", 404);

    // Validate the status transition is allowed
    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      throw new AppError(
        `Cannot change status from '${order.status}' to '${status}'.`,
        400
      );
    }

    // Handle rejection — refund the student
    if (status === "rejected") {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const updatedWallet = await WalletModel.findOneAndUpdate(
          { userId: order.userId },
          {
            $inc: {
              balance: order.totalAmount,
              totalCredited: order.totalAmount,
            },
          },
          { new: true, session }
        );

        await WalletTxModel.create(
          [
            {
              walletId: updatedWallet._id,
              userId: order.userId,
              orderId: order._id,
              type: "refund",
              amount: order.totalAmount,
              description: `Refund for rejected order ${order.orderNumber}`,
              status: "completed",
              balanceAfter: updatedWallet.balance,
            },
          ],
          { session }
        );

        order.status = "rejected";
        order.paymentStatus = "refunded";
        order.rejectionReason = note || "Rejected by kitchen";
        order.statusHistory.push({
          status: "rejected",
          timestamp: new Date(),
          updatedBy: req.user._id,
          note: order.rejectionReason,
        });
        await order.save({ session });
        await session.commitTransaction();
        session.endSession();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
      }
    } else {
      // Non-rejection status update
      order.status = status;
      if (estimatedTime) order.estimatedTime = estimatedTime;
      if (status === "completed") {
        order.isPickedUp = true;
        order.pickedUpAt = new Date();
      }
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        updatedBy: req.user._id,
        note,
      });
      await order.save();
    }

    // Notify the specific student via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${order.userId}`).emit("order_status_update", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedTime: order.estimatedTime,
        message: getStatusMessage(status, order.orderNumber),
      });
    }

    res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} status updated to '${status}'.`,
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedTime: order.estimatedTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/orders/kitchen/queue
// @access  Kitchen + Admin
// @desc    Active orders queue for kitchen panel
//          Returns: placed + accepted + cooking orders, oldest first
// ─────────────────────────────────────────────
const getKitchenQueue = async (req, res, next) => {
  try {
    const orders = await Order.find({
      status: { $in: ["placed", "accepted", "cooking", "ready"] },
    })
      .populate("userId", "name collegeId")
      .sort({ createdAt: 1 }) // FIFO — oldest order first
      .lean();

    const formatted = orders.map((order) => ({
      ...formatOrderPrices(order),
      waitingTime: Math.floor((Date.now() - new Date(order.createdAt)) / 60000), // minutes
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

// Convert paise → rupees throughout order object
const formatOrderPrices = (order) => ({
  ...order,
  totalAmount: order.totalAmount / 100,
  items: order.items?.map((item) => ({
    ...item,
    price: item.price / 100,
    subtotal: item.subtotal / 100,
  })),
});

// Human-readable status messages sent to student via Socket.io
const getStatusMessage = (status, orderNumber) => {
  const messages = {
    accepted: `Great news! Your order ${orderNumber} has been accepted. Cooking starts soon!`,
    cooking:  `Your order ${orderNumber} is being prepared. Won't be long!`,
    ready:    `Your order ${orderNumber} is ready for pickup! 🎉`,
    rejected: `We're sorry — your order ${orderNumber} was rejected. Your money has been refunded.`,
    completed:`Order ${orderNumber} picked up. Enjoy your meal!`,
  };
  return messages[status] || `Order ${orderNumber} status updated to ${status}.`;
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getKitchenQueue,
};
