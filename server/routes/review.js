const express = require("express");
const reviewRouter = express.Router();
const { getReviewsByItem, submitReview } = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/auth");

reviewRouter.get("/:menuItemId", getReviewsByItem); // public route
reviewRouter.post("/", protect, authorize("student"), submitReview); // protected student route

module.exports = reviewRouter;
