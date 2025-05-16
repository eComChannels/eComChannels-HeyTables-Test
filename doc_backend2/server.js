const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { connectDB } = require('./config/database');
const routes = require('./routes');  // Import the main router
require('dotenv').config();

// Initialize express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Connect to MongoDB
connectDB();

// CORS Configuration
const corsOptions = {
  origin: '*',  // Allow all origins for now - you can restrict this later
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'], // Added x-auth-token
  credentials: true
};

// Apply CORS middleware with options
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log incoming requests to debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// API Routes - use the main router
app.use('/api', routes);

// Serve static files from the React frontend app build directory
app.use(express.static(path.join(__dirname, '../doc_frontend/build')));

// Handle any requests that don't match the API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../doc_frontend/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    console.log('Received:', message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend served at http://localhost:${PORT}`);
});

module.exports = app; 