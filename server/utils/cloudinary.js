// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const multer = require("multer");

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "canteen_menu", // Folder name in Cloudinary
//     allowed_formats: ["jpg", "png", "jpeg"],
//   },
// });

// const upload = multer({ storage: storage });

// module.exports = { cloudinary, upload };

const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage — no disk, no multer-storage-cloudinary needed
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Upload buffer to Cloudinary (used in controllers after multer processes file)
const uploadToCloudinary = (buffer, folder = "canteen_menu") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ["jpg", "png", "jpeg"],
        transformation: [
          { width: 800, height: 600, crop: "fill", quality: "auto" },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };