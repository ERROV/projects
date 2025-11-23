/**
 * نظام الترجمة للـ Server
 * يدعم اللغة العربية والإنجليزية
 */

const translations = {
  ar: {
    // رسائل المصادقة
    auth: {
      emailInvalid: 'البريد الإلكتروني غير صحيح',
      passwordMinLength: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      passwordRequired: 'كلمة المرور مطلوبة',
      fullNameRequired: 'الاسم الكامل مطلوب',
      studentNumberRequired: 'رقم الطالب مطلوب',
      departmentRequired: 'القسم مطلوب',
      yearLevelInvalid: 'المستوى الدراسي يجب أن يكون بين 1 و 5',
      emailExists: 'البريد الإلكتروني مستخدم بالفعل',
      studentNumberExists: 'رقم الطالب مستخدم بالفعل',
      invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      departmentNotFound: 'القسم غير موجود',
      departmentNotSelected: 'القسم مطلوب. يرجى اختيار قسم من القائمة.',
      serverError: 'خطأ في السيرفر',
      unauthorized: 'غير مصرح لك بهذا الإجراء',
      userNotFound: 'المستخدم غير موجود',
      studentNotFound: 'الطالب غير موجود',
    },
    // رسائل البصمة الحيوية
    biometric: {
      enabled: 'تم تفعيل البصمة الحيوية بنجاح',
      disabled: 'تم تعطيل البصمة الحيوية بنجاح',
      notEnabled: 'البصمة الحيوية غير مفعلة لهذا الحساب',
    },
    // رسائل الكتب
    books: {
      searchQueryRequired: 'كلمة البحث مطلوبة',
    },
  },
  en: {
    // Authentication messages
    auth: {
      emailInvalid: 'Invalid email address',
      passwordMinLength: 'Password must be at least 6 characters',
      passwordRequired: 'Password is required',
      fullNameRequired: 'Full name is required',
      studentNumberRequired: 'Student number is required',
      departmentRequired: 'Department is required',
      yearLevelInvalid: 'Year level must be between 1 and 5',
      emailExists: 'Email already exists',
      studentNumberExists: 'Student number already exists',
      invalidCredentials: 'Invalid email or password',
      departmentNotFound: 'Department not found',
      departmentNotSelected: 'Department is required. Please select a department from the list.',
      serverError: 'Server error',
      unauthorized: 'You are not authorized to perform this action',
      userNotFound: 'User not found',
      studentNotFound: 'Student not found',
    },
    // Biometric messages
    biometric: {
      enabled: 'Biometric authentication enabled successfully',
      disabled: 'Biometric authentication disabled successfully',
      notEnabled: 'Biometric authentication is not enabled for this account',
    },
    // Books messages
    books: {
      searchQueryRequired: 'Search query is required',
    },
  },
};

/**
 * الحصول على اللغة من header الطلب
 * @param {Object} req - Express request object
 * @returns {string} - اللغة ('ar' أو 'en')
 */
const getLanguage = (req) => {
  // محاولة الحصول على اللغة من header
  const acceptLanguage = req.headers['accept-language'] || '';
  const langHeader = req.headers['x-language'] || '';
  
  // إذا تم إرسال اللغة في header مخصص
  if (langHeader && (langHeader === 'ar' || langHeader === 'en')) {
    return langHeader;
  }
  
  // محاولة استخراج اللغة من Accept-Language header
  if (acceptLanguage.includes('ar')) {
    return 'ar';
  }
  
  // اللغة الافتراضية
  return 'ar';
};

/**
 * دالة الترجمة
 * @param {Object} req - Express request object
 * @param {string} key - مفتاح الترجمة (مثل: 'auth.emailInvalid')
 * @returns {string} - النص المترجم
 */
const t = (req, key) => {
  const lang = getLanguage(req);
  const keys = key.split('.');
  let value = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // إذا لم توجد الترجمة، إرجاع المفتاح
      console.warn(`Translation missing for key: ${key} in language: ${lang}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
};

module.exports = {
  t,
  getLanguage,
  translations,
};

