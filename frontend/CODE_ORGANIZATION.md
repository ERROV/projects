# تنظيم الكود - Code Organization

## البنية الجديدة (New Structure)

تم إعادة تنظيم الكود ليكون أكثر احترافية وقابلية للصيانة:

### 1. الملفات المشتركة (Shared Files)

#### Types (`types/index.ts`)
- جميع الواجهات والأنواع المستخدمة في التطبيق
- `Book`, `NewsEvent`, `StudentProfile`, `Notification`, `ApiResponse`, etc.

#### Utilities (`utils/`)
- **`imageUtils.ts`**: دوال مساعدة لمعالجة وعرض الصور
  - `getBookImageUrl(book)`: بناء URL كامل لصورة الكتاب
  - `getImageUrl(imageUrl)`: بناء URL كامل للصورة العامة

- **`dateUtils.ts`**: دوال مساعدة لمعالجة وتنسيق التواريخ
  - `getTimeAgo(dateString, language)`: حساب الوقت المنقضي
  - `getCurrentDay(language)`: الحصول على اليوم الحالي
  - `formatDate(dateString, language)`: تنسيق التاريخ
  - `isUpcomingEvent(eventDate)`: التحقق من الفعالية القادمة

#### Components (`components/common/`)
- **`BookCard.tsx`**: مكون بطاقة الكتاب المشترك
  - يدعم Grid و List view modes
  - يعرض معلومات الكتاب والأزرار المناسبة

- **`NewsCard.tsx`**: مكون بطاقة الخبر/الفعالية المشترك
  - يعرض الأخبار والفعاليات بشكل موحد

- **`ScreenHeader.tsx`**: مكون رأس الصفحة المشترك
  - يعرض رأس موحد لجميع الصفحات
  - يدعم أزرار مخصصة وإشعارات

- **`LoadingSpinner.tsx`**: مكون مؤشر التحميل المشترك
  - يعرض مؤشر تحميل موحد

- **`EmptyState.tsx`**: مكون الحالة الفارغة المشترك
  - يعرض رسالة عندما لا توجد بيانات

### 2. كيفية استخدام المكونات المشتركة

#### في صفحة Library:
```typescript
import BookCard from '@/components/common/BookCard';
import { Book, ViewMode } from '@/types';
import { getBookImageUrl } from '@/utils/imageUtils';

// استخدام BookCard
<BookCard 
  book={book} 
  viewMode={viewMode}
  onBorrow={handleBorrow}
  onDigitalRead={handleDigitalRead}
/>
```

#### في صفحة News:
```typescript
import NewsCard from '@/components/common/NewsCard';
import { NewsEvent } from '@/types';
import { getTimeAgo, formatDate } from '@/utils/dateUtils';

// استخدام NewsCard
<NewsCard 
  item={newsItem} 
  onPress={handleNewsPress}
/>
```

### 3. المزايا

✅ **إعادة الاستخدام**: المكونات المشتركة يمكن استخدامها في أي صفحة
✅ **سهولة الصيانة**: التعديلات في مكان واحد تؤثر على جميع الصفحات
✅ **التنظيم**: الكود منظم بشكل أفضل وأسهل للفهم
✅ **Type Safety**: استخدام TypeScript للأنواع المشتركة
✅ **التعليقات**: جميع الملفات تحتوي على تعليقات واضحة

### 4. الخطوات التالية

1. ✅ إنشاء ملف types مشترك
2. ✅ إنشاء utilities مشتركة
3. ✅ إنشاء components مشتركة
4. ⏳ تنظيف صفحة library.tsx
5. ⏳ تنظيف صفحة news.tsx
6. ⏳ تنظيف صفحة profile.tsx
7. ⏳ تنظيف باقي الصفحات

### 5. ملاحظات مهمة

- جميع المكونات المشتركة موجودة في `components/common/`
- جميع الأنواع موجودة في `types/index.ts`
- جميع المساعدات موجودة في `utils/`
- يجب استخدام المكونات المشتركة بدلاً من إعادة كتابة الكود

