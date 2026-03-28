// server/routes/cartRoutes.js
// ============================================================
// CART ROUTES — Mounted at /api/cart
// All routes are protected + student only
// ============================================================

const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCart,
  toggleFavourite,
} = require("../controllers/cartController");

const { protect, authorize } = require("../middleware/auth");

// All cart routes: must be logged in as a student
const studentOnly = [protect, authorize("student")];

router.get("/", ...studentOnly, getCart);
router.post("/add", ...studentOnly, addToCart);
router.patch("/update", ...studentOnly, updateCartItem);
router.delete("/clear", ...studentOnly, clearCart);
router.post("/validate", ...studentOnly, validateCart);
router.delete("/remove/:menuItemId", ...studentOnly, removeFromCart);

// Favourites (stored on user, accessed via cart namespace)
router.patch("/favourites/:menuItemId", ...studentOnly, toggleFavourite);

module.exports = router;
