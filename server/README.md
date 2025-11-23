# Al Hikma University - Backend Server

Backend server لتطبيق جامعة الحكمة باستخدام Node.js, Express, و MongoDB.

## المتطلبات

- Node.js (v14 أو أحدث)
- MongoDB (محلي أو MongoDB Atlas)

## التثبيت

1. تثبيت الحزم:
```bash
cd server
npm install
```

2. إنشاء ملف `.env`:
```bash
cp .env.example .env
```

3. تعديل ملف `.env` وإضافة:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alhikma-university
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

## تشغيل السيرفر

### وضع التطوير
```bash
npm run dev
```

### وضع الإنتاج
```bash
npm start
```

## إنشاء البيانات الأولية

```bash
npm run seed
```

سيتم إنشاء:
- مستخدمين (طلاب ومدير)
- كتب
- محاضرات
- سجلات حضور
- دفعات
- أخبار وفعاليات
- استعارات

### بيانات الدخول الافتراضية:

**طالب 1:**
- Email: ahmed@example.com
- Password: 123456

**طالب 2:**
- Email: fatima@example.com
- Password: 123456

**مدير:**
- Email: admin@example.com
- Password: admin123

## API Endpoints

### Authentication
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - الحصول على بيانات المستخدم الحالي

### Books
- `GET /api/books` - الحصول على جميع الكتب
- `GET /api/books/:id` - الحصول على كتاب محدد
- `POST /api/books` - إنشاء كتاب جديد (Admin)
- `PUT /api/books/:id` - تحديث كتاب (Admin)
- `DELETE /api/books/:id` - حذف كتاب (Admin)

### Lectures
- `GET /api/lectures` - الحصول على جميع المحاضرات
- `GET /api/lectures/:id` - الحصول على محاضرة محددة
- `POST /api/lectures` - إنشاء محاضرة جديدة (Admin)
- `PUT /api/lectures/:id` - تحديث محاضرة (Admin)
- `DELETE /api/lectures/:id` - حذف محاضرة (Admin)

### Attendance
- `GET /api/attendance` - الحصول على سجلات الحضور
- `POST /api/attendance` - تسجيل حضور جديد
- `PUT /api/attendance/:id` - تحديث سجل حضور
- `DELETE /api/attendance/:id` - حذف سجل حضور (Admin)

### Payments
- `GET /api/payments` - الحصول على جميع الدفعات
- `GET /api/payments/:id` - الحصول على دفعة محددة
- `POST /api/payments` - إنشاء دفعة جديدة (Admin)
- `PUT /api/payments/:id` - تحديث دفعة (Admin)
- `DELETE /api/payments/:id` - حذف دفعة (Admin)

### News
- `GET /api/news` - الحصول على جميع الأخبار والفعاليات
- `GET /api/news/:id` - الحصول على خبر أو فعالية محددة
- `POST /api/news` - إنشاء خبر أو فعالية جديدة (Admin)
- `PUT /api/news/:id` - تحديث خبر أو فعالية (Admin)
- `DELETE /api/news/:id` - حذف خبر أو فعالية (Admin)

### Borrowings
- `GET /api/borrowings` - الحصول على جميع الاستعارات
- `POST /api/borrowings` - إنشاء استعارة جديدة
- `PUT /api/borrowings/:id/return` - إرجاع كتاب
- `DELETE /api/borrowings/:id` - حذف استعارة (Admin)

## رفع الصور

الصور تُحفظ في مجلد `uploads/` مع التصنيف التالي:
- `uploads/books/` - صور أغلفة الكتب
- `uploads/avatars/` - صور الملفات الشخصية
- `uploads/news/` - صور الأخبار والفعاليات

## Authentication

يتم استخدام JWT tokens للمصادقة. أضف التوكن في header:
```
Authorization: Bearer <token>
```

## CORS

السيرفر يدعم CORS للاتصال من التطبيق. تأكد من إعداد URL التطبيق في إعدادات CORS إذا لزم الأمر.

