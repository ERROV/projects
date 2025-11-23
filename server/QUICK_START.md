# دليل البدء السريع

## 1. تثبيت الحزم
```bash
cd server
npm install
```

## 2. إعداد قاعدة البيانات

### خيار 1: MongoDB محلي
- تأكد من تثبيت MongoDB على جهازك
- ابدأ تشغيل MongoDB service
- MongoDB سيعمل على `mongodb://localhost:27017`

### خيار 2: MongoDB Atlas (سحابي)
- أنشئ حساب على [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- أنشئ cluster جديد
- احصل على connection string
- ضع الـ connection string في ملف `.env`

## 3. إعداد ملف البيئة

أنشئ ملف `.env` في مجلد `server/`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alhikma-university
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

## 4. إنشاء البيانات الأولية

```bash
npm run seed
```

سيتم إنشاء:
- مستخدمين تجريبيين
- كتب
- محاضرات
- بيانات أخرى

## 5. تشغيل السيرفر

### وضع التطوير (مع auto-reload)
```bash
npm run dev
```

### وضع الإنتاج
```bash
npm start
```

السيرفر سيعمل على: `http://localhost:5000`

## 6. اختبار API

### تسجيل الدخول
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "123456"
  }'
```

### الحصول على الكتب
```bash
curl http://localhost:5000/api/books
```

## 7. رفع الصور

الصور تُحفظ في:
- `server/uploads/books/` - صور الكتب
- `server/uploads/news/` - صور الأخبار
- `server/uploads/avatars/` - صور الملفات الشخصية

يمكن الوصول للصور عبر:
```
http://localhost:5000/uploads/books/book1.png
```

## 8. ربط Frontend

في ملف `.env` الخاص بالـ frontend، أضف:
```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

أو في `lib/api.js`:
```javascript
const API_URL = 'http://localhost:5000/api';
```

## استكشاف الأخطاء

### خطأ في الاتصال بـ MongoDB
- تأكد من تشغيل MongoDB
- تحقق من `MONGODB_URI` في ملف `.env`
- تأكد من أن MongoDB يعمل على المنفذ الصحيح

### خطأ في Port
- تأكد من أن المنفذ 5000 غير مستخدم
- غيّر `PORT` في ملف `.env` إذا لزم الأمر

### خطأ في Authentication
- تأكد من إرسال token في header
- تحقق من أن token لم ينتهِ صلاحيته
- أعد تسجيل الدخول إذا لزم الأمر

## المساعدة

راجع ملف `README.md` و `API.md` لمزيد من التفاصيل.

