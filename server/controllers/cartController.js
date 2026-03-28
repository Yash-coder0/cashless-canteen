// server/controllers/cartController.js
// ============================================================
// CART CONTROLLER
//
// Protected: students only (enforced in routes)
//
// Design decisions:
// - One cart document per user (upserted)
// - Prices are snapshotted at add-to-cart time
// - Cart is validated before order placement (Week 4)
// - soldOut items are rejected at add time
// ============================================================

const { Cart } = require("../models/Order");
const { MenuItem } = require("../models/MenuItem");
const { AppError } = require("../middleware/errorHandler");

// ─────────────────────────────────────────────
// HELPER — Recalculate cart total from items
// ─────────────────────────────────────────────
const calculateTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// ─────────────────────────────────────────────
// HELPER — Format cart for response (paise → rupees)
// ─────────────────────────────────────────────
const formatCart = (cart) => ({
  _id: cart._id,
  userId: cart.userId,
  items: cart.items.map((item) => ({
    ...item,
    price: item.price / 100,           // Display price in rupees
    priceInPaise: item.price,          // Keep raw value
    subtotal: (item.price * item.quantity) / 100,
  })),
  totalAmount: cart.totalAmount / 100, // Display total in rupees
  totalAmountInPaise: cart.totalAmount,
  itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  updatedAt: cart.updatedAt,
});

// ─────────────────────────────────────────────
// @route   GET /api/cart
// @access  Student only
// @desc    Get current user's cart
// ─────────────────────────────────────────────
const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate("items.menuItem", "name images isAvailable isSoldOut price")
      .lean();

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          totalAmount: 0,
          totalAmountInPaise: 0,
          itemCount: 0,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: formatCart(cart),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/cart/add
// @access  Student only
// @desc    Add an item to cart (or increase quantity if already there).
//          Price is snapshotted from the menu at this moment.
// ─────────────────────────────────────────────
const addToCart = async (req, res, next) => {
  try {
    const { menuItemId, quantity = 1, specialInstructions = "" } = req.body;

    if (!menuItemId) throw new AppError("Menu item ID is required.", 400);

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      throw new AppError("Quantity must be a positive number.", 400);
    }

    // ── Validate the menu item ────────────────
    const menuItem = await MenuItem.findById(menuItemId);

    if (!menuItem || !menuItem.isAvailable) {
      throw new AppError("This item is not available.", 404);
    }

    if (menuItem.isSoldOut) {
      throw new AppError(
        `'${menuItem.name}' is currently sold out.`,
        400
      );
    }

    // ── Get or create cart ────────────────────
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [], totalAmount: 0 });
    }

    // ── Check if item already in cart ─────────
    const existingIndex = cart.items.findIndex(
      (item) => item.menuItem.toString() === menuItemId
    );

    if (existingIndex > -1) {
      // Item exists — increase quantity
      const newQty = cart.items[existingIndex].quantity + qty;

      if (newQty > 10) {
        throw new AppError(
          `You can only order up to 10 of the same item. You already have ${cart.items[existingIndex].quantity} in your cart.`,
          400
        );
      }

      cart.items[existingIndex].quantity = newQty;

      // Update special instructions if provided
      if (specialInstructions) {
        cart.items[existingIndex].specialInstructions = specialInstructions;
      }
    } else {
      // New item — add with current price snapshot
      if (cart.items.length >= 20) {
        throw new AppError(
          "Cart cannot have more than 20 different items. Please place an order first.",
          400
        );
      }

      cart.items.push({
        menuItem: menuItemId,
        quantity: qty,
        price: menuItem.price, // ❗ Price snapshot in paise
        specialInstructions,
      });
    }

    // ── Recalculate total ─────────────────────
    cart.totalAmount = calculateTotal(cart.items);
    await cart.save();

    // Populate for response
    await cart.populate("items.menuItem", "name images isAvailable isSoldOut");

    res.status(200).json({
      success: true,
      message: `'${menuItem.name}' added to cart.`,
      data: formatCart(cart.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/cart/update
// @access  Student only
// @desc    Update quantity of a specific item.
//          Set quantity to 0 to remove the item.
// ─────────────────────────────────────────────
const updateCartItem = async (req, res, next) => {
  try {
    const { menuItemId, quantity } = req.body;

    if (!menuItemId || quantity === undefined) {
      throw new AppError("Menu item ID and quantity are required.", 400);
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      throw new AppError("Quantity must be 0 or more.", 400);
    }

    if (qty > 10) {
      throw new AppError("Cannot order more than 10 of a single item.", 400);
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) throw new AppError("Cart not found.", 404);

    const itemIndex = cart.items.findIndex(
      (item) => item.menuItem.toString() === menuItemId
    );

    if (itemIndex === -1) {
      throw new AppError("Item not found in cart.", 404);
    }

    if (qty === 0) {
      // Remove item from cart
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = qty;
    }

    cart.totalAmount = calculateTotal(cart.items);
    await cart.save();
    await cart.populate("items.menuItem", "name images isAvailable isSoldOut");

    res.status(200).json({
      success: true,
      message: qty === 0 ? "Item removed from cart." : "Cart updated.",
      data: formatCart(cart.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/cart/remove/:menuItemId
// @access  Student only
// @desc    Remove a specific item from cart
// ─────────────────────────────────────────────
const removeFromCart = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) throw new AppError("Cart not found.", 404);

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.menuItem.toString() !== menuItemId
    );

    if (cart.items.length === initialLength) {
      throw new AppError("Item not found in cart.", 404);
    }

    cart.totalAmount = calculateTotal(cart.items);
    await cart.save();
    await cart.populate("items.menuItem", "name images isAvailable isSoldOut");

    res.status(200).json({
      success: true,
      message: "Item removed from cart.",
      data: formatCart(cart.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/cart/clear
// @access  Student only
// @desc    Empty the entire cart
// ─────────────────────────────────────────────
const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { items: [], totalAmount: 0 },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Cart cleared.",
      data: { items: [], totalAmount: 0, itemCount: 0 },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/cart/validate
// @access  Student only
// @desc    Validates cart before order placement.
//          Called by the frontend before showing the
//          payment confirmation screen.
//          Checks: items still available, prices unchanged,
//          nothing sold out.
// ─────────────────────────────────────────────
const validateCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart || cart.items.length === 0) {
      throw new AppError("Your cart is empty.", 400);
    }

    const issues = [];
    let recalculatedTotal = 0;

    for (const cartItem of cart.items) {
      const menuItem = await MenuItem.findById(cartItem.menuItem);

      if (!menuItem || !menuItem.isAvailable) {
        issues.push({
          menuItemId: cartItem.menuItem,
          issue: "no_longer_available",
          message: `'${cartItem.menuItem}' is no longer available and will be removed.`,
        });
        continue;
      }

      if (menuItem.isSoldOut) {
        issues.push({
          menuItemId: cartItem.menuItem,
          name: menuItem.name,
          issue: "sold_out",
          message: `'${menuItem.name}' is currently sold out.`,
        });
        continue;
      }

      // Check if price changed since item was added to cart
      if (menuItem.price !== cartItem.price) {
        issues.push({
          menuItemId: cartItem.menuItem,
          name: menuItem.name,
          issue: "price_changed",
          oldPrice: cartItem.price / 100,
          newPrice: menuItem.price / 100,
          message: `Price of '${menuItem.name}' has changed from ₹${cartItem.price / 100} to ₹${menuItem.price / 100}.`,
        });
        // Update to new price
        cartItem.price = menuItem.price;
      }

      recalculatedTotal += menuItem.price * cartItem.quantity;
    }

    // Remove unavailable items from cart
    cart.items = cart.items.filter((cartItem) => {
      const hasIssue = issues.find(
        (i) =>
          i.menuItemId.toString() === cartItem.menuItem.toString() &&
          i.issue === "no_longer_available"
      );
      return !hasIssue;
    });

    cart.totalAmount = recalculatedTotal;
    await cart.save();

    res.status(200).json({
      success: true,
      isValid: issues.length === 0,
      issues, // Frontend shows these as warnings/alerts
      data: formatCart(cart.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/cart/favourites/:menuItemId
// @access  Student only
// @desc    Toggle a menu item in/out of favourites
// ─────────────────────────────────────────────
const toggleFavourite = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    const user = req.user;

    const isFav = user.favourites
      .map((id) => id.toString())
      .includes(menuItemId);

    const update = isFav
      ? { $pull: { favourites: menuItemId } }   // Remove from favourites
      : { $addToSet: { favourites: menuItemId } }; // Add (no duplicates)

    const { User } = require("../models/User");
    const updatedUser = await User.findByIdAndUpdate(user._id, update, {
      new: true,
    }).select("favourites");

    res.status(200).json({
      success: true,
      message: isFav ? "Removed from favourites." : "Added to favourites.",
      isFavourite: !isFav,
      favourites: updatedUser.favourites,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCart,
  toggleFavourite,
};
