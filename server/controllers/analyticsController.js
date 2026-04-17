const mongoose = require("mongoose");
const { Order } = require("../models/Order");

const getStudentAnalytics = async (req, res, next) => {
  try {
    const { period = "month" } = req.query;
    const now = new Date();
    let startDate = new Date();

    if (period === "week") {
      // Start of current week (Monday)
      const day = now.getDay() || 7; 
      startDate.setDate(now.getDate() - day + 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "year") {
      // Start of current year
      startDate = new Date(now.getFullYear(), 0, 1);
    } else { // "month"
      // Start of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Fetch active orders 
    const orders = await Order.find({
      userId: req.user._id,
      createdAt: { $gte: startDate },
      status: { $nin: ["rejected", "cancelled"] }
    }).populate({
      path: "items.menuItem",
      populate: { path: "category", model: "Category" }
    }).sort({ createdAt: -1 }).lean();

    // Summary metrics
    let totalSpent = 0;
    let totalOrders = orders.length;
    
    // Detailed aggregations
    const itemMap = {}; // for top items
    const catMap = {};  // for category pie
    const trendMap = {}; // for chart (date or month)

    orders.forEach(order => {
      // Amount is in paise, convert to rupees for analytics
      const orderAmountStr = (order.totalAmount / 100).toFixed(2);
      const orderAmount = parseFloat(orderAmountStr);
      totalSpent += orderAmount;

      // Map Trend
      const d = new Date(order.createdAt);
      let tKey;
      if (period === "year") {
        tKey = d.toLocaleString('en-US', { month: 'short' }); // "Jan", "Feb"
      } else if (period === "month") {
        tKey = d.getDate().toString(); // "1", "15"
      } else { // week
        tKey = d.toLocaleString('en-US', { weekday: 'short' }); // "Mon"
      }
      trendMap[tKey] = (trendMap[tKey] || 0) + orderAmount;

      // Extract items logic
      order.items.forEach(item => {
        const lineTotal = parseFloat((item.subtotal / 100).toFixed(2));
        
        // Category map
        let catName = "Other";
        if (item.menuItem && item.menuItem.category && item.menuItem.category.name) {
          catName = item.menuItem.category.name;
        }
        catMap[catName] = (catMap[catName] || 0) + lineTotal;

        // Item map
        const itemName = item.name;
        if (!itemMap[itemName]) {
          itemMap[itemName] = {
            name: itemName,
            image: item.imageUrl || null,
            count: 0,
            totalSpent: 0
          };
        }
        itemMap[itemName].count += item.quantity;
        itemMap[itemName].totalSpent += lineTotal;
      });
    });

    const avgOrderValue = totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : 0;

    // Format trendData
    const trendData = [];
    if (period === "year") {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      months.forEach(m => trendData.push({ label: m, amount: parseFloat((trendMap[m] || 0).toFixed(2)) }));
    } else if (period === "month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        trendData.push({ label: i.toString(), amount: parseFloat((trendMap[i.toString()] || 0).toFixed(2)) });
      }
    } else {
      const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
      days.forEach(d => trendData.push({ label: d, amount: parseFloat((trendMap[d] || 0).toFixed(2)) }));
    }

    // Format categories
    const categoryBreakdown = Object.keys(catMap).map(k => ({
      category: k,
      amount: parseFloat(catMap[k].toFixed(2))
    })).sort((a,b) => b.amount - a.amount);

    // Format top items
    const topItems = Object.values(itemMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(i => ({ ...i, totalSpent: parseFloat(i.totalSpent.toFixed(2)) }));

    // Recent transactions (last 10)
    const recentTransactions = orders.slice(0, 10).map(order => ({
      date: order.createdAt,
      orderId: order.orderNumber.slice(-6), // taking last 6 chars
      items: order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
      amount: parseFloat((order.totalAmount / 100).toFixed(2))
    }));

    res.status(200).json({
      success: true,
      data: {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        totalOrders,
        avgOrderValue: parseFloat(avgOrderValue),
        trendData,
        categoryBreakdown,
        topItems,
        recentTransactions
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentAnalytics
};
