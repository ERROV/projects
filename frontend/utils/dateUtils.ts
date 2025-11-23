/**
 * ملف مساعدات التاريخ والوقت (Date Utilities)
 * يحتوي على دوال مساعدة لمعالجة وتنسيق التواريخ
 */

/**
 * حساب الوقت المنقضي منذ تاريخ معين
 * @param dateString - تاريخ النشر
 * @param language - اللغة ('ar' | 'en')
 * @returns نص يوضح الوقت المنقضي
 */
export const getTimeAgo = (dateString: string, language: 'ar' | 'en' = 'ar'): string => {
  const published = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60));
  
  if (language === 'ar') {
    if (diffInHours < 1) return 'الآن';
    if (diffInHours < 24) return `قبل ${diffInHours} ساعة`;
    if (diffInHours < 168) return `قبل ${Math.floor(diffInHours / 24)} يوم`;
    return `قبل ${Math.floor(diffInHours / 168)} أسبوع`;
  } else {
    if (diffInHours < 1) return 'Now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInHours / 168)} week${Math.floor(diffInHours / 168) > 1 ? 's' : ''} ago`;
  }
};

/**
 * الحصول على اليوم الحالي
 * @param language - اللغة ('ar' | 'en')
 * @returns اسم اليوم الحالي
 */
export const getCurrentDay = (language: 'ar' | 'en' = 'ar'): string => {
  if (language === 'ar') {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = new Date().getDay();
    return days[today];
  } else {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    return days[today];
  }
};

/**
 * تنسيق التاريخ بشكل قابل للقراءة
 * @param dateString - التاريخ
 * @param language - اللغة ('ar' | 'en')
 * @returns تاريخ منسق
 */
export const formatDate = (dateString: string, language: 'ar' | 'en' = 'ar'): string => {
  const date = new Date(dateString);
  const locale = language === 'ar' ? 'ar-IQ' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * التحقق من أن الفعالية قادمة
 * @param eventDate - تاريخ الفعالية
 * @returns true إذا كانت الفعالية قادمة
 */
export const isUpcomingEvent = (eventDate: string): boolean => {
  const today = new Date();
  const event = new Date(eventDate);
  return event > today;
};

