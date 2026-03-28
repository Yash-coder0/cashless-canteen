// server/utils/seeder.js
// ============================================================
// DATABASE SEEDER
// Run this ONCE to populate the DB with sample categories
// and menu items so you have data to test against.
//
// Usage:
//   node utils/seeder.js --seed    → Add sample data
//   node utils/seeder.js --clear   → Remove all seeded data
//
// ⚠️  Only run in development — never in production.
// ============================================================

require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const { Category, MenuItem } = require("../models/MenuItem");

const sampleCategories = [
  { name: "Snacks", description: "Quick bites and light snacks", sortOrder: 1 },
  { name: "Meals", description: "Full meals and lunch combos", sortOrder: 2 },
  { name: "Beverages", description: "Hot and cold drinks", sortOrder: 3 },
  { name: "Desserts", description: "Sweet treats and ice cream", sortOrder: 4 },
  { name: "Specials", description: "Today's chef specials", sortOrder: 5 },
];

// Prices are in PAISE (₹ × 100)
const getSampleItems = (categoryMap) => [
  // ── Snacks ───────────────────────────────────
  {
    name: "Samosa (2 pcs)",
    description: "Crispy fried pastry filled with spiced potatoes and peas",
    price: 2000,        // ₹20
    category: categoryMap["Snacks"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647187/samosa_tjnjmp.png"],
    isVegetarian: true,
    isSpicy: true,
    preparationTime: 5,
    tags: ["bestseller"],
  },
  {
    name: "Vada Pav",
    description: "Mumbai-style spicy potato fritter in a soft bun",
    price: 1500,        // ₹15
    category: categoryMap["Snacks"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647187/vada_Pav_djipqg.png"],
    isVegetarian: true,
    isSpicy: true,
    preparationTime: 5,
    tags: ["popular"],
  },
  {
    name: "Bread Pakora",
    description: "Stuffed bread slices dipped in chickpea batter and fried",
    price: 2500,        // ₹25
    category: categoryMap["Snacks"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647185/Bread_Pakora_ey4uhx.png"],
    isVegetarian: true,
    preparationTime: 8,
  },
  {
    name: "French Fries",
    description: "Crispy golden fries with ketchup",
    price: 5000,        // ₹50
    category: categoryMap["Snacks"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647179/french_fries_f7xocy.png"],
    isVegetarian: true,
    preparationTime: 10,
    tags: ["popular"],
  },
  {
    name: "Idli Sambar",
    description: "Steamed rice cakes with lentil soup",
    price: 3000,        // ₹30
    category: categoryMap["Snacks"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647181/idli_jqgze6.png"],
    isVegetarian: true,
    preparationTime: 10,
    tags: ["popular"],
  },

  // ── Meals ────────────────────────────────────
  {
    name: "Rajma Chawal",
    description: "Classic kidney bean curry with steamed rice",
    price: 7000,        // ₹70
    category: categoryMap["Meals"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647179/rajma_chawal_rumwjd.png"],
    isVegetarian: true,
    preparationTime: 15,
    tags: ["bestseller"],
  },
  {
    name: "Chole Bhature",
    description: "Spicy chickpea curry with two fluffy fried breads",
    price: 8000,        // ₹80
    category: categoryMap["Meals"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647178/chole_bhature_ff4fa7.png"],
    isVegetarian: true,
    isSpicy: true,
    preparationTime: 15,
    tags: ["popular"],
  },
  {
    name: "Egg Rice",
    description: "Fried rice with eggs and vegetables",
    price: 6000,        // ₹60
    category: categoryMap["Meals"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647175/egg_rice_hwkyzk.png"],
    isVegetarian: false,
    preparationTime: 12,
  },
  {
    name: "Paneer Wrap",
    description: "Grilled paneer and veggies wrapped in a chapati",
    price: 7500,        // ₹75
    category: categoryMap["Meals"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647174/paneer_roll_v8pghh.png"],
    isVegetarian: true,
    preparationTime: 12,
  },

  // ── Beverages ─────────────────────────────────
  {
    name: "Chai",
    description: "Freshly brewed Indian masala tea",
    price: 1000,        // ₹10
    category: categoryMap["Beverages"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647174/chai_aaj9ae.png"],
    isVegetarian: true,
    preparationTime: 3,
    tags: ["bestseller"],
  },
  {
    name: "Cold Coffee",
    description: "Blended iced coffee with milk and sugar",
    price: 4000,        // ₹40
    category: categoryMap["Beverages"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647174/cold_coffee_yfqbdo.png"],
    isVegetarian: true,
    preparationTime: 5,
    tags: ["popular"],
  },
  {
    name: "Fresh Lime Soda",
    description: "Refreshing lime juice with soda water",
    price: 3000,        // ₹30
    category: categoryMap["Beverages"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647174/lime_soda_ezaiox.png"],
    isVegetarian: true,
    preparationTime: 3,
  },
  {
    name: "Lassi",
    description: "Thick yoghurt-based drink, sweet or salted",
    price: 3500,        // ₹35
    category: categoryMap["Beverages"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647173/lassi_jjgifo.png"],
    isVegetarian: true,
    preparationTime: 5,
    tags: ["bestseller"],
  },

  // ── Desserts ─────────────────────────────────
  {
    name: "Gulab Jamun (2 pcs)",
    description: "Soft milk-solid balls soaked in rose sugar syrup",
    price: 3000,        // ₹30
    category: categoryMap["Desserts"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647173/gulab_jamun_j3bnff.png"],
    isVegetarian: true,
    preparationTime: 2,
    tags: ["popular"],
  },
  {
    name: "Ice Cream",
    description: "Single scoop — vanilla, chocolate, or strawberry",
    price: 4000,        // ₹40
    category: categoryMap["Desserts"],
    images: ["https://res.cloudinary.com/dtct3h1ax/image/upload/v1774647173/ice_cream_srjvc5.png"],
    isVegetarian: true,
    preparationTime: 2,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    console.log("🗑️  Cleared existing categories and menu items");

    // Create categories
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Build a name → _id map for easy reference
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    // Create menu items
    const items = getSampleItems(categoryMap);
    const createdItems = await MenuItem.insertMany(items);
    console.log(`✅ Created ${createdItems.length} menu items`);

    console.log("\n🎉 Seeding complete! Your menu is ready to test.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

const clear = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    console.log("🗑️  All categories and menu items removed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Clear failed:", error.message);
    process.exit(1);
  }
};

// Run based on CLI flag
const flag = process.argv[2];
if (flag === "--seed") seed();
else if (flag === "--clear") clear();
else {
  console.log("Usage:");
  console.log("  node utils/seeder.js --seed    → populate sample data");
  console.log("  node utils/seeder.js --clear   → remove all data");
  process.exit(0);
}
