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
  isDeleted:{
   type: Boolean,
   default: false,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin_user',
    required: true,
  },
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
