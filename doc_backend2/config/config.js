module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/doc_workflow',
  port: process.env.PORT || 5001
}; 