const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    // console.log('Token verification error:'); // Debug log
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 