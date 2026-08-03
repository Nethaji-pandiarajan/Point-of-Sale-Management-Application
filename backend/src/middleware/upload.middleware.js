const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const profileDir = path.join(__dirname, '../../uploads/profile');
const productDir = path.join(__dirname, '../../uploads/products');

if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });
if (!fs.existsSync(productDir)) fs.mkdirSync(productDir, { recursive: true });

// File Filter (PNG, JPEG, JPG, WEBP only)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(mime)) {
    return cb(null, true);
  }

  const error = new Error('Unsupported file format. Only PNG, JPEG, JPG, and WEBP images are allowed.');
  error.code = 'LIMIT_FILE_TYPES';
  error.statusCode = 415;
  return cb(error, false);
};

// Profile Photo Storage
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileDir),
  filename: (req, file, cb) => {
    const userId = req.user ? req.user.id : 'user';
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${userId}_${Date.now()}${ext}`);
  }
});

// Product Image Storage
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `prod_${Date.now()}${ext}`);
  }
});

const profileMulter = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for profile
  fileFilter
});

const productMulter = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for products
  fileFilter
});

// Profile Upload Middleware (Requires file)
const handleProfileUpload = (req, res, next) => {
  const uploadSingle = profileMulter.single('photo');

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          status: 'error',
          message: 'File size exceeds 2MB limit. Please upload a smaller image.'
        });
      }
      if (err.code === 'LIMIT_FILE_TYPES' || err.statusCode === 415) {
        return res.status(415).json({
          success: false,
          status: 'error',
          message: err.message || 'Unsupported file type. Only PNG, JPEG, JPG, and WEBP are allowed.'
        });
      }
      return res.status(400).json({
        success: false,
        status: 'error',
        message: err.message || 'Image upload failed. Please try again.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'No photo file was uploaded.'
      });
    }

    next();
  });
};

// Product Upload Middleware (Optional file)
const handleProductUpload = (req, res, next) => {
  const uploadSingle = productMulter.single('image');
  uploadSingle(req, res, (err) => {
    if (err) {
      console.warn('Product image upload warning:', err.message);
    }
    next();
  });
};

// Export middleware as callable function AND object properties for backward compatibility
const uploadMiddleware = handleProductUpload;
uploadMiddleware.handleProfileUpload = handleProfileUpload;
uploadMiddleware.handleProductUpload = handleProductUpload;

module.exports = uploadMiddleware;
