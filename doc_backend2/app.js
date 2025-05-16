const express = require('express');
const app = express();
const cors = require('cors');
const routes = require('./routes');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Use main router
app.use('/api', routes);

module.exports = app; 