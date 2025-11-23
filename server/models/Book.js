const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان الكتاب مطلوب'],
  },
  author: {
    type: String,
    required: [true, 'اسم المؤلف مطلوب'],
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true, // يجعل الفهرس فريداً فقط للقيم غير null
  },
  year: {
    type: Number,
  },
  category: {
    type: String,
    required: [true, 'الفئة مطلوبة'],
  },
  description: {
    type: String,
  },
  total_copies: {
    type: Number,
    required: true,
    default: 1,
    min: 0,
  },
  available_copies: {
    type: Number,
    required: true,
    default: 1,
    min: 0,
  },
  cover_image_url: {
    type: String,
  },
  digital_version_url: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Book', bookSchema);

