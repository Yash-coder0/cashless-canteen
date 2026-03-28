const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const User = require("./models/User");

const testUser = async () => {
  try {
    const user = await User.create({
      name: "Yash",
      email: "yash@college.edu.in",
      password: "12345678",
    });

    console.log("User inserted:", user);
  } catch (err) {
    console.log("Error:", err.message);
  }
};

testUser();