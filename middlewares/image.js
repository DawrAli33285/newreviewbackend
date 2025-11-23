// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Use absolute path for better reliability
// const BASE_UPLOAD_PATH = path.join(process.cwd(), 'public/uploads');

// // Enhanced directory creation with error handling
// const createUploadDirs = () => {
//   const dirs = [
//     BASE_UPLOAD_PATH,
//     path.join(BASE_UPLOAD_PATH, 'business'),
//     path.join(BASE_UPLOAD_PATH, 'user'),
//     path.join(BASE_UPLOAD_PATH, 'temp'),
//     path.join(BASE_UPLOAD_PATH, 'products'),
//     path.join(BASE_UPLOAD_PATH, 'profiles')
//   ];

//   dirs.forEach(dir => {
//     try {
//       if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//         console.log(`Created directory: ${dir}`);
        
//         // Set permissions after creation (Linux specific)
//         fs.chmodSync(dir, 0o755);
//       }
//     } catch (error) {
//       console.error(`Error creating directory ${dir}:`, error);
//     }
//   });
// };

// createUploadDirs();

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let uploadPath = BASE_UPLOAD_PATH;

//     // More robust path detection
//     const path = req.route?.path || req.originalUrl || '';
    
//     if (path.includes('product')) {
//       uploadPath = path.join(BASE_UPLOAD_PATH, 'products');
//     } else if (path.includes('profile')) {
//       uploadPath = path.join(BASE_UPLOAD_PATH, 'profiles');
//     } else if (path.includes('business')) {
//       uploadPath = path.join(BASE_UPLOAD_PATH, 'business');
//     }

//     // Ensure directory exists
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }

//     cb(null, uploadPath);
//   },

//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const fileName = file.fieldname + '-' + uniqueName + path.extname(file.originalname);
//     cb(null, fileName);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
//   if (allowedMimes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { 
//     fileSize: 5 * 1024 * 1024, 
//     files: 5 
//   }
// });

// // Error handling middleware
// const handleMulterError = (error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ error: 'File too large' });
//     }
//     if (error.code === 'LIMIT_FILE_COUNT') {
//       return res.status(400).json({ error: 'Too many files' });
//     }
//   } else if (error) {
//     return res.status(400).json({ error: error.message });
//   }
//   next();
// };
// module.exports=upload;






var multer = require('multer')
const path=require('path')
const BASE_UPLOAD_PATH = path.join(process.cwd(), 'public/uploads');
var storage = multer.diskStorage({
    destination: function (request, file, callback) {
      console.log("HEY")
        callback(null, BASE_UPLOAD_PATH);
    },
    filename: function (request, file, callback) {
        console.log(file);
        callback(null, file.originalname)
    }
});

var upload = multer({ storage: storage });

module.exports=upload 