const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const boardRoutes = require('./boards');
const viewRoutes = require('./views');
const userRoutes = require('./users');
const commentsRoutes = require('./comments');
const uploadRoutes = require('./upload');

// Use routes
router.use('/auth', authRoutes);
router.use('/boards', boardRoutes);
router.use('/views', viewRoutes);
router.use('/users', userRoutes);
router.use('/items', commentsRoutes);
router.use('/upload', uploadRoutes);

module.exports = router; 