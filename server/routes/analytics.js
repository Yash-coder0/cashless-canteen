const express = require("express");
const analyticsRouter = express.Router();
const { getStudentAnalytics } = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/auth");

// GET /api/analytics/student
analyticsRouter.get("/student", protect, authorize("student"), getStudentAnalytics);

module.exports = analyticsRouter;
