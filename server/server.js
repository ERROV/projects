const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const cron = require('node-cron');
const connectDB = require('./config/database');

// تحميل متغيرات البيئة
dotenv.config();

// الاتصال بقاعدة البيانات
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات الثابتة (للصور)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/biometric', require('./routes/biometric'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/barcodes', require('./routes/barcodes'));
app.use('/api/students', require('./routes/students'));
app.use('/api/books', require('./routes/books'));
app.use('/api/lectures', require('./routes/lectures'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/news', require('./routes/news'));
app.use('/api/borrowings', require('./routes/borrowings'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/debug-schedule', require('./routes/debug-schedule'));
app.use('/api/book-reviews', require('./routes/bookReviews'));
app.use('/api/pdf', require('./routes/pdfExtract'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/external-books', require('./routes/externalBooks'));

// Route للصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'مرحباً بك في API جامعة الحكمة',
    version: '1.0.0',
  });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'خطأ في السيرفر',
    error: process.env.NODE_ENV === 'development' ? err.message : 'خطأ داخلي في السيرفر',
  });
});

// معالجة 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'الصفحة غير موجودة',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// تجديد الباركودات تلقائياً كل يوم في الساعة 12:00 صباحاً
// يتم تجديد الباركودات للمحاضرات التي ستكون في اليوم الحالي
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Starting daily barcode renewal...');
    const axios = require('axios');
    const API_URL = process.env.API_URL || `http://localhost:${PORT}`;
    
    const response = await axios.post(`${API_URL}/api/barcodes/renew-daily`);
    console.log('Barcode renewal completed:', response.data);
  } catch (error) {
    console.error('Error renewing barcodes:', error.message);
  }
}, {
  scheduled: true,
  timezone: "Asia/Riyadh"
});

// تجديد الباركودات كل ساعة أيضاً (للمحاضرات القادمة خلال ساعة)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Starting hourly barcode renewal check...');
    const axios = require('axios');
    const API_URL = process.env.API_URL || `http://localhost:${PORT}`;
    
    const response = await axios.post(`${API_URL}/api/barcodes/renew-daily`);
    console.log('Hourly barcode renewal check completed:', response.data);
  } catch (error) {
    console.error('Error in hourly barcode renewal:', error.message);
  }
}, {
  scheduled: true,
  timezone: "Asia/Riyadh"
});

// إرسال إشعارات تلقائية للاستعارات القريبة من موعد الاسترجاع (كل يوم في الساعة 9 صباحاً)
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('Checking for borrowings due soon...');
    const Borrowing = require('./models/Borrowing');
    const Student = require('./models/Student');
    const Book = require('./models/Book');
    const { notifyBorrowingDueSoon } = require('./utils/notificationHelper');
    
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    // جلب الاستعارات التي تنتهي خلال 3 أيام
    const borrowings = await Borrowing.find({
      status: 'active',
      due_date: {
        $gte: today,
        $lte: threeDaysLater,
      },
    }).populate('student_id').populate('book_id');
    
    for (const borrowing of borrowings) {
      if (borrowing.student_id && borrowing.book_id) {
        const student = await Student.findById(borrowing.student_id._id || borrowing.student_id);
        if (student) {
          await notifyBorrowingDueSoon(borrowing, student, borrowing.book_id);
        }
      }
    }
    
    console.log(`Sent ${borrowings.length} borrowing reminder notifications`);
  } catch (error) {
    console.error('Error sending borrowing reminders:', error.message);
  }
}, {
  scheduled: true,
  timezone: "Asia/Riyadh"
});

