const mongoose = require('mongoose');

const ViewSchema = new mongoose.Schema({
  name: String,
  type: {
    type: String,
    required: true,
    enum: ['table', 'doc', 'form', 'file'],  // Specify allowed view types
    default: 'table'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board'
  },
  // Table view specific data
  table: {
    columns: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      },
      type: { type: String },  // column type (item, person, status, date)
      title:  { type: String },
      width:  { type: Number },
      isViewOnly: { type: Boolean, default: false }, // Column is view-only for invited users
      canEdit: [
        mongoose.Schema.Types.Mixed
      ],
      canView: [
        mongoose.Schema.Types.Mixed
      ],
      statuses: [{
        value: { type: String },
        color: { type: String }
      }]
    }],
    groups: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      },
      title: { type: String },
      rows: [{
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId()
        },
        title: String,
        cells: [{
          _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
          },
          columnId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
          },
          value: mongoose.Schema.Types.Mixed
        }]
      }]
    }]
  },
  // Doc view specific data
  doc: {
    type: {
      content: String,  // Could be rich text content
      // Add other doc specific fields
    },
    default: undefined
  },
  // Form view specific data
  form: {
    type: {
      fields: [{
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId()
        },
        type: String,
        label: String,
        required: Boolean,
        // Add other field properties
      }],
      submissions: [{
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId()
        },
        data: mongoose.Schema.Types.Mixed,
        submittedAt: Date
      }]
    },
    default: undefined
  },
  // File view specific data
  file: {
    type: {
      files: [{
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId()
        },
        name: String,
        type: String,
        size: Number,
        url: String,
        // Add other file metadata
      }]
    },
    default: undefined
  }
}, { timestamps: true });

const View = mongoose.model('View', ViewSchema);

module.exports = View;