const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['table', 'doc', 'form'],
    required: true,
    default: 'table'
  },
  privacy: {
    type: String,
    enum: ['main', 'private', 'shareable'],
    default: 'main'
  },
  managing_type: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  invites: [{
    email: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  views: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'View'
  }],
}, {
  timestamps: true
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board; 