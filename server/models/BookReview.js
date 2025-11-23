const mongoose = require('mongoose');

const bookReviewSchema = new mongoose.Schema({
  book_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'معرف الكتاب مطلوب'],
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'معرف المستخدم مطلوب'],
  },
  rating: {
    type: Number,
    required: [true, 'التقييم مطلوب'],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: [true, 'التعليق مطلوب'],
    trim: true,
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});


bookReviewSchema.index({ book_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('BookReview', bookReviewSchema);

