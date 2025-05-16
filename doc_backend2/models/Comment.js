const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  viewId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'View'
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  rowId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: String,
    size: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema); 