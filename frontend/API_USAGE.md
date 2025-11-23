# دليل استخدام API في التطبيق

## ✅ ما تم إنجازه

تم تحديث جميع صفحات التطبيق لاستخدام API بشكل احترافي مع:
- ✅ نظام API محسّن مع TypeScript
- ✅ معالجة أخطاء شاملة
- ✅ إدارة Token تلقائية
- ✅ تعليقات عربية على جميع الدوال
- ✅ Custom Hooks لإدارة البيانات
- ✅ تحديث جميع الصفحات

## 📁 الملفات المحدثة

### 1. `lib/api.ts`
نظام API احترافي يحتوي على:
- دوال API لجميع endpoints
- إدارة Token تلقائية
- معالجة أخطاء شاملة
- تعليقات عربية على جميع الدوال

### 2. `contexts/AuthContext.tsx`
محدث لاستخدام API الجديد:
- تسجيل الدخول والتسجيل
- إدارة حالة المستخدم
- تحديث تلقائي للبيانات

### 3. `hooks/useAPI.ts`
Custom Hooks لإدارة البيانات:
- `useAPI` - Hook عام
- `useListAPI` - للقوائم
- `useBooks`, `useLectures`, إلخ - Hooks خاصة

### 4. الصفحات المحدثة
- ✅ `app/(tabs)/index.tsx` - الصفحة الرئيسية
- ✅ `app/(tabs)/library.tsx` - المكتبة
- ✅ `app/(tabs)/schedule.tsx` - الجدول الدراسي
- ✅ `app/(tabs)/tuition.tsx` - المنظومة المالية
- ✅ `app/(tabs)/news.tsx` - الأخبار والفعاليات
- ✅ `app/(tabs)/profile.tsx` - الملف الشخصي
- ✅ `app/auth/login.tsx` - تسجيل الدخول
- ✅ `app/auth/register.tsx` - التسجيل (يستخدم AuthContext)

## 🚀 كيفية الاستخدام

### استخدام API مباشرة

```typescript
import api from '@/lib/api';

// جلب الكتب
const response = await api.books.getAll({ category: 'علوم الحاسوب' });
if (response.success) {
  console.log(response.data);
}

// تسجيل الدخول
const loginResponse = await api.auth.login('email@example.com', 'password');
if (loginResponse.success) {
  // Token يتم حفظه تلقائياً
}
```

### استخدام Custom Hooks

```typescript
import { useBooks, useLectures } from '@/hooks/useAPI';

function MyComponent() {
  const { items, loading, error, refresh } = useBooks();
  
  useEffect(() => {
    refresh({ category: 'علوم الحاسوب' });
  }, []);
  
  // ...
}
```

### استخدام AuthContext

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, student, signIn, signOut } = useAuth();
  
  // ...
}
```

## 📝 أمثلة الاستخدام

### مثال 1: جلب الكتب مع البحث

```typescript
import api from '@/lib/api';

const loadBooks = async (searchQuery: string) => {
  try {
    const params: any = {};
    if (searchQuery) {
      params.search = searchQuery;
    }
    
    const response = await api.books.getAll(params);
    if (response.success && response.data) {
      setBooks(response.data);
    }
  } catch (error: any) {
    Alert.alert('خطأ', error.message);
  }
};
```

### مثال 2: طلب استعارة كتاب

```typescript
import api from '@/lib/api';

const handleBorrow = async (bookId: string) => {
  try {
    const response = await api.borrowings.create(bookId);
    if (response.success) {
      Alert.alert('نجح', 'تم إرسال طلب الاستعارة بنجاح');
    }
  } catch (error: any) {
    Alert.alert('خطأ', error.message);
  }
};
```

### مثال 3: تسجيل حضور

```typescript
import api from '@/lib/api';

const markAttendance = async (lectureId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + 
                 now.getMinutes().toString().padStart(2, '0');
    
    const response = await api.attendance.create({
      date: today,
      check_in_time: time,
      status: 'present',
      lecture_id: lectureId,
    });
    
    if (response.success) {
      Alert.alert('نجح', 'تم تسجيل الحضور بنجاح');
    }
  } catch (error: any) {
    Alert.alert('خطأ', error.message);
  }
};
```

## 🔧 الإعدادات

### إعداد API URL

في ملف `app.json` أو `.env`:

```json
{
  "extra": {
    "apiUrl": "http://localhost:5000/api"
  }
}
```

أو في `.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

### إعداد Backend

1. تأكد من تشغيل Backend على `http://localhost:5000`
2. تأكد من تفعيل CORS في Backend
3. استخدم البيانات الأولية: `npm run seed` في مجلد `server/`

## 📊 البنية

```
lib/
├── api.ts              # نظام API الرئيسي
hooks/
├── useAPI.ts           # Custom Hooks
contexts/
├── AuthContext.tsx     # إدارة المصادقة
app/
├── (tabs)/
│   ├── index.tsx       # الصفحة الرئيسية
│   ├── library.tsx     # المكتبة
│   ├── schedule.tsx    # الجدول الدراسي
│   ├── tuition.tsx     # المنظومة المالية
│   ├── news.tsx        # الأخبار
│   └── profile.tsx     # الملف الشخصي
└── auth/
    ├── login.tsx       # تسجيل الدخول
    └── register.tsx    # التسجيل
```

## ✨ المميزات

1. **TypeScript Support** - دعم كامل لـ TypeScript
2. **Error Handling** - معالجة أخطاء شاملة
3. **Token Management** - إدارة تلقائية للـ Token
4. **Loading States** - حالات تحميل في جميع الصفحات
5. **Pull to Refresh** - إعادة تحميل البيانات
6. **تعليقات عربية** - جميع الدوال موثقة بالعربية
7. **Type Safety** - واجهات TypeScript لجميع البيانات

## 🎯 الخطوات التالية

1. ✅ ربط Backend مع Frontend
2. ✅ اختبار جميع الـ endpoints
3. ✅ إضافة المزيد من المميزات حسب الحاجة
4. ✅ تحسين تجربة المستخدم

---

**تم تحديث جميع الصفحات بنجاح! 🎉**

