const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'العنوان مطلوب'],
  },
  content: {
    type: String,
    required: [true, 'المحتوى مطلوب'],
  },
  type: {
    type: String,
    enum: ['news', 'event'],
    required: [true, 'النوع مطلوب'],
  },
  image_url: {
    type: String,
  },
  event_date: {
    type: Date,
  },
  published_at: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
  },
  organizer: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('News', newsSchema);

