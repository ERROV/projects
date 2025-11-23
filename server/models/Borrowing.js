const mongoose = require('mongoose');

const borrowingSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  book_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  borrow_date: {
    type: Date,
    default: Date.now,
  },
  return_date: {
    type: Date,
  },
  due_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue'],
    default: 'active',
  },
}, {
  timestamps: true,
});


borrowingSchema.pre('save', function(next) {
  if (this.return_date) {
    this.status = 'returned';
  } else if (this.due_date < new Date() && this.status === 'active') {
    this.status = 'overdue';
  }
  next();
});

module.exports = mongoose.model('Borrowing', borrowingSchema);

