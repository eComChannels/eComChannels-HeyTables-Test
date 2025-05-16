const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

// Route to handle single file uploads
router.post('/', auth, uploadController.uploadFile);

module.exports = router; 