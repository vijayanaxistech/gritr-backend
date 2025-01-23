const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted:{
   type: Boolean,
   default: false,
  },
  duplicateOf: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Question', 
    default: null 
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin_user',
    required: true,
  },
  moderationHistory: [
    {
      action: { type: String, required: true },
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Question', questionSchema);
