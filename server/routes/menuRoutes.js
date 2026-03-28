// server/routes/categoryRoutes.js
// ============================================================
// CATEGORY ROUTES — Mounted at /api/categories
// ============================================================

const express = require("express");
const router = express.Router();

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { protect, authorize } = require("../middleware/auth");

// Public
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Admin only
router.post("/", protect, authorize("admin"), createCategory);
router.patch("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;


// ============================================================
// server/routes/menuRoutes.js
// MENU ROUTES — Mounted at /api/menu
// ============================================================

const menuRouter = express.Router();
const { upload } = require("../utils/cloudinary");

const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  toggleSoldOut,
} = require("../controllers/menuController");

// Public routes
menuRouter.get("/", getAllItems);
menuRouter.get("/:id", getItemById);

// Admin only
menuRouter.post("/", protect, authorize("admin"), upload.single("image"), createItem);
menuRouter.patch("/:id", protect, authorize("admin"), upload.single("image"), updateItem);
menuRouter.delete("/:id", protect, authorize("admin"), deleteItem);

// Kitchen + Admin — sold out toggle
menuRouter.patch(
  "/:id/sold-out",
  protect,
  authorize("kitchen", "admin"),
  toggleSoldOut
);

module.exports = { categoryRouter: router, menuRouter };
