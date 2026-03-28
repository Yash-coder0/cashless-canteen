// server/controllers/kitchenController.js
const { Order } = require("../models/Order");
const { MenuItem } = require("../models/MenuItem");
const { AppError } = require("../middleware/errorHandler");

// GET /api/kitchen/queue — active orders FIFO
const getQueue = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: { $in: ["placed","accepted","cooking"] } })
      .populate("userId", "name collegeId phone")
      .sort({ createdAt: 1 })
      .lean();

    const data = orders.map(o => ({
      ...o,
      totalAmount: o.totalAmount / 100,
      items: o.items.map(i => ({ ...i, price: i.price/100, subtotal: i.subtotal/100 })),
      waitingMinutes: Math.floor((Date.now() - new Date(o.createdAt)) / 60000),
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (e) { next(e); }
};

// GET /api/kitchen/ready — orders ready for pickup
const getReadyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: "ready" })
      .populate("userId", "name collegeId")
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: orders });
  } catch (e) { next(e); }
};

// PATCH /api/kitchen/orders/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const { status, estimatedTime, note = "" } = req.body;
    const allowed = { placed:["accepted","rejected"], accepted:["cooking","rejected"], cooking:["ready"], ready:["completed"] };
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError("Order not found.", 404);
    if (!allowed[order.status]?.includes(status))
      throw new AppError(`Cannot move from '${order.status}' to '${status}'.`, 400);

    order.status = status;
    if (estimatedTime) order.estimatedTime = estimatedTime;
    if (status === "completed") { order.isPickedUp = true; order.pickedUpAt = new Date(); }
    if (status === "rejected") { order.rejectionReason = note; order.paymentStatus = "refunded"; }
    order.statusHistory.push({ status, timestamp: new Date(), updatedBy: req.user._id, note });
    await order.save();

    // Notify student
    const io = req.app.get("io");
    if (io) io.to(`user_${order.userId}`).emit("order_status_update", {
      orderId: order._id, orderNumber: order.orderNumber, status, estimatedTime: order.estimatedTime,
    });

    res.status(200).json({ success: true, message: `Order ${order.orderNumber} → ${status}`, data: { _id: order._id, status } });
  } catch (e) { next(e); }
};

// PATCH /api/kitchen/menu/:id/sold-out — toggle sold out
const toggleSoldOut = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) throw new AppError("Item not found.", 404);
    item.isSoldOut = !item.isSoldOut;
    await item.save();
    const io = req.app.get("io");
    if (io) io.emit("menu_updated", { itemId: item._id, isSoldOut: item.isSoldOut, name: item.name });
    res.status(200).json({ success: true, message: `'${item.name}' is now ${item.isSoldOut ? "sold out" : "available"}.`, data: { isSoldOut: item.isSoldOut } });
  } catch (e) { next(e); }
};

// GET /api/kitchen/stats/today
const getTodayStats = async (req, res, next) => {
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);

    const [total, completed, rejected, revenue] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: "completed" }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: "rejected" }),
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.status(200).json({
      success: true, data: {
        totalOrders: total, completed, rejected, pending: total - completed - rejected,
        revenue: (revenue[0]?.total || 0) / 100,
      },
    });
  } catch (e) { next(e); }
};

module.exports = { getQueue, getReadyOrders, updateStatus, toggleSoldOut, getTodayStats };
