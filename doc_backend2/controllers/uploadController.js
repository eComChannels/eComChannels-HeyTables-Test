const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images, videos, and common document types
  const acceptedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',
    // Videos
    'video/mp4', 'video/mpeg', 'video/webm', 'video/ogg', 'video/quicktime',
    // Documents
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv', 'application/rtf'
  ];
  
  if (acceptedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images, videos, and documents are allowed.`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Handle single file upload
exports.uploadFile = (req, res) => {
  const uploadSingle = upload.single('file');
  
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred (e.g., file too large)
      return res.status(400).json({ error: err.message });
    } else if (err) {
      // An unknown error occurred
      return res.status(500).json({ error: err.message });
    }
    
    // No error, file uploaded successfully
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }
    
    // Determine file type
    let fileType = 'file';
    if (file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      fileType = 'video';
    }
    
    // Generate the URL for the uploaded file
    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('host');
    const url = `${protocol}://${host}/uploads/${file.filename}`;
    
    res.json({
      url,
      name: file.originalname,
      size: file.size,
      type: fileType
    });
  });
}; 