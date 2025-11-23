const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    index: true,
  },
  title: {
    type: String,
    required: [true, 'عنوان الإشعار مطلوب'],
  },
  message: {
    type: String,
    required: [true, 'محتوى الإشعار مطلوب'],
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'lecture', 'payment', 'borrowing', 'attendance', 'news', 'event'],
    default: 'info',
    index: true,
  },
  category: {
    type: String,
    enum: ['lecture', 'payment', 'borrowing', 'attendance', 'news', 'event', 'system', 'general'],
    default: 'general',
  },
  is_read: {
    type: Boolean,
    default: false,
    index: true,
  },
  read_at: {
    type: Date,
  },
  action_url: {
    type: String, // رابط للانتقال عند الضغط على الإشعار
  },
  action_data: {
    type: mongoose.Schema.Types.Mixed, // بيانات إضافية للإجراء
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  scheduled_at: {
    type: Date, // وقت جدولة الإشعار
  },
  sent_at: {
    type: Date, // وقت إرسال الإشعار
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // بيانات إضافية
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
notificationSchema.index({ user_id: 1, is_read: 1, createdAt: -1 });
notificationSchema.index({ student_id: 1, is_read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ scheduled_at: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

