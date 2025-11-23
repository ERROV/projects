/**
 * Script لإصلاح فهرس ISBN في مجموعة Books
 * يحذف الفهرس القديم وينشئ فهرساً جديداً مع sparse: true
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '../.env') });

// الاتصال بقاعدة البيانات
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alhikma-university');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// إصلاح الفهرس
const fixIndex = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('books');

    // حذف الفهرس القديم
    try {
      await collection.dropIndex('isbn_1');
      console.log('✅ تم حذف الفهرس القديم');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ الفهرس غير موجود، سيتم إنشاء فهرس جديد');
      } else {
        console.error('⚠️ خطأ في حذف الفهرس:', error.message);
      }
    }

    // إنشاء فهرس جديد مع sparse: true
    await collection.createIndex({ isbn: 1 }, { unique: true, sparse: true });
    console.log('✅ تم إنشاء الفهرس الجديد مع sparse: true');

    console.log('\n✅ تم إصلاح الفهرس بنجاح!');
  } catch (error) {
    console.error('❌ Error fixing index:', error);
  }
};

// تشغيل الإصلاح
const runFix = async () => {
  await connectDB();
  await fixIndex();
  process.exit(0);
};

runFix();


