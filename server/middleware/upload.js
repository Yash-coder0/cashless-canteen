// server/middleware/upload.js
// Cloudinary + Multer image upload middleware
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { AppError } = require("./errorHandler");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store in memory (we upload directly to Cloudinary, no disk needed)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new AppError("Only image files are allowed.", 400), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Upload buffer to Cloudinary — returns secure_url
const uploadToCloudinary = (buffer, folder = "canteen") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", transformation: [{ width: 800, height: 600, crop: "fill", quality: "auto" }] },
      (error, result) => { if (error) reject(error); else resolve(result.secure_url); }
    );
    stream.end(buffer);
  });
};

// Middleware: upload single image and attach URL to req.imageUrl
const uploadSingle = (fieldName = "image") => [
  upload.single(fieldName),
  async (req, res, next) => {
    if (!req.file) return next();
    try {
      req.imageUrl = await uploadToCloudinary(req.file.buffer, "canteen/menu");
      next();
    } catch (e) { next(new AppError("Image upload failed. Please try again.", 500)); }
  },
];

// Middleware: upload multiple images (max 5)
const uploadMultiple = (fieldName = "images", maxCount = 5) => [
  upload.array(fieldName, maxCount),
  async (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();
    try {
      req.imageUrls = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer, "canteen/menu")));
      next();
    } catch (e) { next(new AppError("Image upload failed. Please try again.", 500)); }
  },
];

module.exports = { uploadSingle, uploadMultiple, uploadToCloudinary };
