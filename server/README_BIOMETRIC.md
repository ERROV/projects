# دليل البصمة الحيوية والتعرف على الوجه - Backend

## 📋 نظرة عامة

تم إضافة نظام كامل للبصمة الحيوية والتعرف على الوجه في Backend.

## 🔧 الإعدادات

### Routes المضافة

تم إضافة route جديد في `server/routes/biometric.js`:

- `POST /api/biometric/register-face` - تسجيل وجه المستخدم
- `POST /api/biometric/face-login` - تسجيل الدخول بالتعرف على الوجه
- `GET /api/biometric/status` - التحقق من حالة البصمة الحيوية

### تحديثات النماذج

تم تحديث `server/models/Student.js` لإضافة:
- `face_encoding` - ترميز الوجه (Base64)
- `biometric_enabled` - حالة تفعيل البصمة الحيوية

## 📝 ملاحظات مهمة

### للاختبار والتنمية:
- حالياً، السيرفر يستخدم منطق مبسط للتعرف على الوجه
- يتم حفظ encoding كـ base64 في قاعدة البيانات
- للاختبار، يستخدم أول طالب لديه `biometric_enabled: true`

### للإنتاج:
يجب استخدام مكتبة face recognition حقيقية مثل:

#### خيار 1: face-recognition (Node.js)
```bash
npm install face-recognition
```

#### خيار 2: face-api.js
```bash
npm install face-api.js canvas
```

#### خيار 3: TensorFlow.js
```bash
npm install @tensorflow/tfjs-node
```

## 🔐 مثال استخدام مكتبة Face Recognition

```javascript
// في server/routes/biometric.js
const faceRecognition = require('face-recognition');

// عند تسجيل الوجه
const image = faceRecognition.loadImage(faceImageBuffer);
const faceDescriptor = faceRecognition.computeFaceDescriptor(image);
const encoding = JSON.stringify(faceDescriptor);

// عند التعرف على الوجه
const inputImage = faceRecognition.loadImage(inputFaceBuffer);
const inputDescriptor = faceRecognition.computeFaceDescriptor(inputImage);

for (const student of students) {
  const savedDescriptor = JSON.parse(student.face_encoding);
  const distance = faceRecognition.faceDistance([savedDescriptor], inputDescriptor);
  
  if (distance < 0.6) { // threshold
    matchedStudent = student;
    break;
  }
}
```

## 🚀 الاستخدام

### تسجيل الوجه
```bash
POST /api/biometric/register-face
Authorization: Bearer <token>
Content-Type: multipart/form-data

face_image: <file>
```

### تسجيل الدخول بالوجه
```bash
POST /api/biometric/face-login
Content-Type: multipart/form-data

face_image: <file>
```

### التحقق من الحالة
```bash
GET /api/biometric/status
Authorization: Bearer <token>
```

## ⚠️ تحذيرات

1. **الأمان**: في الإنتاج، يجب:
   - تشفير `face_encoding` قبل الحفظ
   - إضافة rate limiting
   - إضافة تحقق إضافي (SMS code)

2. **الأداء**: 
   - استخدام queue system للمعالجة
   - تخزين مؤقت في Redis
   - تحسين خوارزمية البحث

3. **الخصوصية**:
   - الالتزام بـ GDPR
   - الحصول على موافقة المستخدم
   - حذف البيانات عند الطلب

---

**تم إضافة نظام البصمة الحيوية بنجاح! 🎉**

