# ملخص Backend - جامعة الحكمة

## ✅ ما تم إنجازه

تم إنشاء backend server كامل باستخدام:
- **Node.js** + **Express**
- **MongoDB** مع **Mongoose**
- **JWT** للمصادقة
- **Multer** لرفع الصور

## 📁 البنية

```
server/
├── config/
│   └── database.js          # إعدادات MongoDB
├── middleware/
│   ├── auth.js              # حماية routes بـ JWT
│   └── upload.js            # رفع الصور (Multer)
├── models/
│   ├── User.js              # نموذج المستخدم
│   ├── Student.js           # نموذج الطالب
│   ├── Book.js              # نموذج الكتاب
│   ├── Lecture.js           # نموذج المحاضرة
│   ├── Attendance.js        # نموذج الحضور
│   ├── Payment.js           # نموذج الدفعة
│   ├── News.js              # نموذج الأخبار/الفعاليات
│   └── Borrowing.js         # نموذج الاستعارة
├── routes/
│   ├── auth.js              # تسجيل الدخول والتسجيل
│   ├── students.js          # إدارة الطلاب
│   ├── books.js             # CRUD للكتب
│   ├── lectures.js          # CRUD للمحاضرات
│   ├── attendance.js        # CRUD للحضور
│   ├── payments.js          # CRUD للدفعات
│   ├── news.js              # CRUD للأخبار
│   └── borrowings.js        # CRUD للاستعارات
├── scripts/
│   ├── seed.js              # بيانات أولية
│   └── createPlaceholderImages.js
├── utils/
│   └── generateToken.js     # توليد JWT token
├── uploads/                 # مجلد الصور
│   ├── books/
│   ├── news/
│   └── avatars/
├── server.js                # السيرفر الرئيسي
└── package.json
```

## 🔐 Authentication

- **JWT-based authentication**
- Routes محمية بـ middleware
- تسجيل دخول وتسجيل جديد
- أدوار: `student`, `admin`, `instructor`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - تسجيل جديد
- `POST /api/auth/login` - تسجيل دخول
- `GET /api/auth/me` - بيانات المستخدم الحالي

### Books
- `GET /api/books` - جميع الكتب (مع فلترة وبحث)
- `GET /api/books/:id` - كتاب محدد
- `POST /api/books` - إنشاء كتاب (Admin)
- `PUT /api/books/:id` - تحديث كتاب (Admin)
- `DELETE /api/books/:id` - حذف كتاب (Admin)

### Lectures
- `GET /api/lectures` - جميع المحاضرات
- `GET /api/lectures/:id` - محاضرة محددة
- `POST /api/lectures` - إنشاء محاضرة (Admin)
- `PUT /api/lectures/:id` - تحديث محاضرة (Admin)
- `DELETE /api/lectures/:id` - حذف محاضرة (Admin)

### Attendance
- `GET /api/attendance` - سجلات الحضور
- `POST /api/attendance` - تسجيل حضور
- `PUT /api/attendance/:id` - تحديث سجل
- `DELETE /api/attendance/:id` - حذف سجل (Admin)

### Payments
- `GET /api/payments` - جميع الدفعات (مع إحصائيات)
- `GET /api/payments/:id` - دفعة محددة
- `POST /api/payments` - إنشاء دفعة (Admin)
- `PUT /api/payments/:id` - تحديث دفعة (Admin)
- `DELETE /api/payments/:id` - حذف دفعة (Admin)

### News
- `GET /api/news` - جميع الأخبار/الفعاليات
- `GET /api/news/:id` - خبر/فعالية محددة
- `POST /api/news` - إنشاء خبر (Admin)
- `PUT /api/news/:id` - تحديث خبر (Admin)
- `DELETE /api/news/:id` - حذف خبر (Admin)

### Borrowings
- `GET /api/borrowings` - جميع الاستعارات
- `POST /api/borrowings` - إنشاء استعارة
- `PUT /api/borrowings/:id/return` - إرجاع كتاب
- `DELETE /api/borrowings/:id` - حذف استعارة (Admin)

### Students
- `GET /api/students` - جميع الطلاب (Admin)
- `GET /api/students/me` - بيانات الطالب الحالي
- `PUT /api/students/me` - تحديث بيانات الطالب

## 🖼️ رفع الصور

- الصور تُحفظ في `server/uploads/`
- دعم أنواع: jpeg, jpg, png, gif, webp
- حجم أقصى: 5MB
- مجلدات منفصلة: `books/`, `news/`, `avatars/`

## 📊 البيانات الأولية

تم إنشاء:
- ✅ 3 مستخدمين (طالبان + مدير)
- ✅ 6 كتب
- ✅ 5 محاضرات
- ✅ سجلات حضور
- ✅ دفعات
- ✅ أخبار وفعاليات
- ✅ استعارات

**بيانات الدخول:**
- طالب 1: `ahmed@example.com` / `123456`
- طالب 2: `fatima@example.com` / `123456`
- مدير: `admin@example.com` / `admin123`

## 🚀 كيفية التشغيل

1. **تثبيت الحزم:**
```bash
cd server
npm install
```

2. **إعداد `.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alhikma-university
JWT_SECRET=alhikma-university-secret-key-2024
JWT_EXPIRE=7d
NODE_ENV=development
```

3. **إنشاء البيانات الأولية:**
```bash
npm run seed
```

4. **تشغيل السيرفر:**
```bash
npm run dev  # تطوير
# أو
npm start    # إنتاج
```

## 🔗 ربط Frontend

تم إنشاء ملف `lib/api.js` في Frontend يحتوي على:
- Helper functions لجميع API calls
- Token management
- Error handling

**استخدام:**
```javascript
import api from '@/lib/api';

// تسجيل الدخول
const response = await api.auth.login('ahmed@example.com', '123456');

// الحصول على الكتب
const books = await api.books.getAll({ category: 'علوم الحاسوب' });
```

## 📝 الملفات التوثيقية

- `server/README.md` - نظرة عامة
- `server/API.md` - توثيق API كامل
- `server/QUICK_START.md` - دليل البدء السريع
- `server/INSTALLATION.md` - دليل التثبيت المفصل

## ✨ المميزات

1. ✅ **CRUD كامل** لجميع البيانات
2. ✅ **Authentication & Authorization** مع JWT
3. ✅ **رفع الصور** وحفظها على السيرفر
4. ✅ **فلترة وبحث** في البيانات
5. ✅ **صلاحيات** (Admin, Student)
6. ✅ **Error handling** شامل
7. ✅ **CORS** مفعل
8. ✅ **بيانات أولية** جاهزة
9. ✅ **API helper** للـ Frontend

## 📌 ملاحظات مهمة

1. **MongoDB:** تأكد من تشغيل MongoDB قبل تشغيل السيرفر
2. **Port:** المنفذ الافتراضي هو 5000، يمكن تغييره في `.env`
3. **JWT Secret:** غيّر `JWT_SECRET` في الإنتاج
4. **الصور:** الصور تُحفظ محلياً، يمكن ربطها بـ cloud storage لاحقاً
5. **البيانات:** استخدم `npm run seed` لإنشاء بيانات تجريبية

## 🎯 الخطوات التالية

1. ✅ ربط Frontend مع Backend
2. ✅ استبدال البيانات المحلية في Frontend بـ API calls
3. ✅ إضافة المزيد من البيانات حسب الحاجة
4. ✅ إضافة المزيد من الصور الحقيقية
5. ✅ تحسين الأمان (rate limiting, validation, etc.)

---

**تم إنشاء Backend بنجاح! 🎉**

