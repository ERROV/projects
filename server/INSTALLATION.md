# دليل التثبيت والتشغيل

## المتطلبات الأساسية

1. **Node.js** (الإصدار 14 أو أحدث)
   - تحميل من: https://nodejs.org/
   - التحقق من التثبيت: `node --version`

2. **MongoDB** (محلي أو Atlas)
   - محلي: https://www.mongodb.com/try/download/community
   - Atlas (سحابي): https://www.mongodb.com/cloud/atlas

3. **npm** (يأتي مع Node.js)
   - التحقق: `npm --version`

## خطوات التثبيت

### 1. تثبيت الحزم
```bash
cd server
npm install
```

### 2. إعداد ملف البيئة

أنشئ ملف `.env` في مجلد `server/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alhikma-university
JWT_SECRET=alhikma-university-secret-key-2024
JWT_EXPIRE=7d
NODE_ENV=development
```

**ملاحظات:**
- إذا كنت تستخدم MongoDB Atlas، استبدل `MONGODB_URI` بـ connection string الخاص بك
- غيّر `JWT_SECRET` إلى قيمة عشوائية قوية في الإنتاج

### 3. تشغيل MongoDB

#### إذا كنت تستخدم MongoDB محلي:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# أو
mongod
```

#### إذا كنت تستخدم MongoDB Atlas:
- لا حاجة لتشغيل أي شيء، فقط تأكد من أن connection string صحيح

### 4. إنشاء البيانات الأولية

```bash
npm run seed
```

سيتم إنشاء:
- مستخدمين تجريبيين (طلاب ومدير)
- كتب
- محاضرات
- سجلات حضور
- دفعات
- أخبار وفعاليات
- استعارات

**بيانات الدخول:**
- طالب 1: `ahmed@example.com` / `123456`
- طالب 2: `fatima@example.com` / `123456`
- مدير: `admin@example.com` / `admin123`

### 5. تشغيل السيرفر

#### وضع التطوير (مع auto-reload):
```bash
npm run dev
```

#### وضع الإنتاج:
```bash
npm start
```

السيرفر سيعمل على: `http://localhost:5000`

## التحقق من التشغيل

افتح المتصفح وانتقل إلى:
```
http://localhost:5000
```

يجب أن ترى:
```json
{
  "success": true,
  "message": "مرحباً بك في API جامعة الحكمة",
  "version": "1.0.0"
}
```

## اختبار API

### تسجيل الدخول:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@example.com","password":"123456"}'
```

### الحصول على الكتب:
```bash
curl http://localhost:5000/api/books
```

## ربط Frontend

### 1. إضافة متغير البيئة في Frontend

في ملف `.env` أو `app.json`:
```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. استخدام API Helper

استخدم ملف `lib/api.js` الذي تم إنشاؤه:

```javascript
import api from '@/lib/api';

// تسجيل الدخول
const response = await api.auth.login('ahmed@example.com', '123456');

// الحصول على الكتب
const books = await api.books.getAll({ category: 'علوم الحاسوب' });
```

## استكشاف الأخطاء

### خطأ: "Cannot connect to MongoDB"
**الحل:**
- تأكد من تشغيل MongoDB
- تحقق من `MONGODB_URI` في ملف `.env`
- جرب الاتصال يدوياً: `mongosh` أو `mongo`

### خطأ: "Port 5000 already in use"
**الحل:**
- غيّر `PORT` في ملف `.env` إلى منفذ آخر (مثل 5001)
- أو أوقف التطبيق الذي يستخدم المنفذ 5000

### خطأ: "Module not found"
**الحل:**
```bash
cd server
rm -rf node_modules
npm install
```

### خطأ في Authentication
**الحل:**
- تأكد من إرسال token في header
- تحقق من أن token لم ينتهِ صلاحيته
- أعد تسجيل الدخول

## البنية

```
server/
├── config/          # إعدادات قاعدة البيانات
├── middleware/      # Middleware (auth, upload)
├── models/          # نماذج MongoDB
├── routes/          # API routes
├── scripts/         # سكريبتات (seed, etc.)
├── uploads/         # الملفات المرفوعة (الصور)
├── utils/           # Utilities
├── server.js        # ملف السيرفر الرئيسي
└── package.json     # الحزم
```

## الملفات المهمة

- `server.js` - نقطة البداية
- `config/database.js` - إعدادات MongoDB
- `middleware/auth.js` - حماية routes
- `middleware/upload.js` - رفع الملفات
- `routes/` - جميع API endpoints
- `scripts/seed.js` - بيانات أولية

## الخطوات التالية

1. راجع `API.md` لمعرفة جميع الـ endpoints
2. راجع `QUICK_START.md` للبدء السريع
3. ابدأ في ربط Frontend مع Backend
4. أضف المزيد من البيانات حسب الحاجة

## الدعم

إذا واجهت أي مشاكل:
1. راجع ملفات التوثيق (`README.md`, `API.md`, `QUICK_START.md`)
2. تحقق من console للأخطاء
3. تأكد من أن جميع المتطلبات مثبتة بشكل صحيح

