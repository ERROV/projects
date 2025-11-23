/**
 * نظام إدارة API احترافي
 * يدعم جميع عمليات الاتصال بالـ Backend مع معالجة الأخطاء والتخزين المحلي
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// إعدادات API
// الأولوية: app.json > .env > القيمة الافتراضية
const API_URL = Constants.expoConfig?.extra?.apiUrl || 
                process.env.EXPO_PUBLIC_API_URL || 
                'http://192.168.0.114:5000/api';

// إصلاح localhost للـ Android Emulator
const getApiUrl = () => {
  let url = API_URL;
  // استبدال localhost بـ IP Address على Android Emulator
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    url = url.replace('localhost', '192.168.0.114').replace('127.0.0.1', '192.168.0.114');
  }
  return url;
};

const FINAL_API_URL = getApiUrl();

// طباعة API URL للتأكد من الإعدادات (فقط في وضع التطوير)
if (__DEV__) {
  console.log('🔗 API URL (Original):', API_URL);
  console.log('🔗 API URL (Final):', FINAL_API_URL);
  console.log('📋 Config sources:', {
    fromExpoConfig: Constants.expoConfig?.extra?.apiUrl,
    fromEnv: process.env.EXPO_PUBLIC_API_URL,
    original: API_URL,
    final: FINAL_API_URL
  });
}

// إدارة Token باستخدام AsyncStorage
let authToken: string | null = null;

// الحصول على اللغة المحفوظة
const getLanguage = async (): Promise<string> => {
  try {
    const language = await AsyncStorage.getItem('@alhikma:language');
    return language === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
};

/**
 * حفظ Token في الذاكرة
 * @param token - JWT token
 */
export const setToken = (token: string | null) => {
  authToken = token;
};

/**
 * الحصول على Token من الذاكرة
 * @returns JWT token أو null
 */
export const getToken = (): string | null => {
  return authToken;
};

/**
 * حذف Token
 */
export const clearToken = () => {
  authToken = null;
};

/**
 * بناء URL كامل للـ endpoint
 * @param endpoint - مسار الـ endpoint
 * @returns URL كامل
 */
const buildUrl = (endpoint: string): string => {
  return `${FINAL_API_URL}${endpoint}`;
};

/**
 * بناء query string من المعاملات
 * @param params - معاملات البحث
 * @returns query string
 */
const buildQueryString = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, String(params[key]));
    }
  });
  return queryParams.toString();
};

/**
 * دالة عامة لاستدعاء API مع معالجة الأخطاء
 * @param endpoint - مسار الـ endpoint
 * @param options - خيارات الطلب
 * @returns Promise مع البيانات
 */
const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> => {
  const url = buildUrl(endpoint);
  
  // الحصول على اللغة المحفوظة
  const language = await getLanguage();
  
  // إعداد headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Language': language, // إرسال اللغة في header
    ...(options.headers as Record<string, string> || {}),
  };

  // إضافة Token إذا كان موجوداً
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // محاولة تحويل الرد إلى JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // معالجة الأخطاء
    if (!response.ok) {
      let errorMessage = `خطأ في الطلب: ${response.status}`;
      
      // محاولة استخراج رسالة الخطأ من الرد
      if (typeof data === 'object' && data !== null) {
        // إذا كان هناك أخطاء validation، عرضها
        if ((data as any)?.errors && Array.isArray((data as any).errors)) {
          const validationErrors = (data as any).errors
            .map((err: any) => err.msg || err.message || err)
            .join(', ');
          errorMessage = validationErrors || errorMessage;
        } else {
          errorMessage = (data as any)?.message || 
                        (data as any)?.error || 
                        errorMessage;
        }
      } else if (typeof data === 'string') {
        errorMessage = data;
      }
      
      // إذا كان الخطأ 401 (غير مصرح)، حذف Token
      if (response.status === 401) {
        clearToken();
      }

      throw new Error(errorMessage);
    }

    // التأكد من أن البيانات تحتوي على success
    if (typeof data === 'object' && data !== null) {
      return data as { success: boolean; data?: T; message?: string };
    }

    // إذا كانت البيانات نصية، إرجاعها كرسالة
    return {
      success: true,
      message: typeof data === 'string' ? data : 'تم بنجاح',
      data: data as T,
    };
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    
    // معالجة أخطاء الشبكة
    if (error.message === 'Network request failed' || error.message === 'Failed to fetch') {
      throw new Error('فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت');
    }

    throw error;
  }
};

// ==================== Authentication API ====================

/**
 * واجهة API للمصادقة
 */
export const authAPI = {
  /**
   * تسجيل مستخدم جديد
   * @param userData - بيانات المستخدم
   * @returns بيانات المستخدم المسجل مع Token
   */
  register: async (userData: {
    email: string;
    password: string;
    full_name: string;
    student_number: string;
    phone?: string;
    department_id?: string;
    department: string;
    year_level: number;
  }) => {
    const response = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && (response as any).token) {
      setToken((response as any).token);
    }

    return response;
  },

  /**
   * تسجيل الدخول
   * @param email - البريد الإلكتروني
   * @param password - كلمة المرور
   * @returns بيانات المستخدم مع Token
   */
  login: async (email: string, password: string) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && (response as any).token) {
      setToken((response as any).token);
    }

    return response;
  },

  /**
   * الحصول على بيانات المستخدم الحالي
   * @returns بيانات المستخدم والطالب
   */
  getMe: async () => {
    return apiCall('/auth/me');
  },

  /**
   * تسجيل الخروج
   */
  logout: () => {
    clearToken();
  },

  /**
   * تفعيل البصمة الحيوية
   */
  enableBiometric: async () => {
    return apiCall('/auth/biometric/enable', {
      method: 'POST',
    });
  },

  /**
   * تعطيل البصمة الحيوية
   */
  disableBiometric: async () => {
    return apiCall('/auth/biometric/disable', {
      method: 'POST',
    });
  },

  /**
   * الحصول على حالة البصمة الحيوية
   */
  getBiometricStatus: async () => {
    return apiCall('/auth/biometric/status');
  },

  /**
   * تسجيل الدخول بالبصمة الحيوية
   * @param email - البريد الإلكتروني المحفوظ محلياً
   */
  biometricLogin: async (email: string) => {
    const response = await apiCall('/auth/biometric/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (response.success && (response as any).token) {
      setToken((response as any).token);
    }

    return response;
  },

  /**
   * تسجيل الدخول بالتعرف على الوجه
   * @param faceImage - صورة الوجه (File أو base64)
   * @returns بيانات المستخدم مع Token
   */
  faceLogin: async (faceImage?: any) => {
    try {
      let body: any;
      let headers: Record<string, string> = {};

      if (faceImage) {
        // إذا كانت صورة، إرسالها كـ FormData
        const formData = new FormData();
        if (faceImage.uri) {
          formData.append('face_image', {
            uri: faceImage.uri,
            type: 'image/jpeg',
            name: 'face.jpg',
          } as any);
        } else {
          formData.append('face_encoding', faceImage);
        }
        body = formData;
        // لا نضيف Content-Type للـ FormData، المتصفح يضيفه تلقائياً
      } else {
        // إرسال طلب بدون صورة (للاستخدام في التطوير)
        body = JSON.stringify({});
        headers['Content-Type'] = 'application/json';
      }

      const url = buildUrl('/biometric/face-login');
      const token = getToken();
      
      const requestHeaders: HeadersInit = {
        ...headers,
      };

      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: body,
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage = (data as any)?.message || 
                            (data as any)?.error || 
                            `خطأ في الطلب: ${response.status}`;
        throw new Error(errorMessage);
      }

      // حفظ Token إذا كان موجوداً
      if ((data as any).token) {
        setToken((data as any).token);
      }

      return data as { success: boolean; data?: any; message?: string };
    } catch (error: any) {
      console.error('Face login error:', error);
      if (error.message === 'Network request failed' || error.message === 'Failed to fetch') {
        throw new Error('فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت');
      }
      throw error;
    }
  },
};

// ==================== Books API ====================

/**
 * واجهة API للكتب
 */
export const booksAPI = {
  /**
   * الحصول على جميع الكتب
   * @param params - معاملات البحث (category, search)
   * @returns قائمة الكتب
   */
  getAll: async (params: { category?: string; search?: string } = {}) => {
    const queryString = buildQueryString(params);
    return apiCall(`/books${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * الحصول على كتاب محدد
   * @param id - معرف الكتاب
   * @returns بيانات الكتاب
   */
  getById: async (id: string) => {
    return apiCall(`/books/${id}`);
  },
};

// ==================== External Books API ====================

/**
 * واجهة API للكتب الخارجية (Open Library)
 */
export const externalBooksAPI = {
  /**
   * البحث عن كتب من Open Library
   * @param params - معاملات البحث (q, page, limit)
   * @returns قائمة الكتب
   */
  search: async (params: { q: string; page?: number; limit?: number }) => {
    const queryString = buildQueryString(params);
    return apiCall(`/external-books/search${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * الحصول على الكتب الشائعة
   * @param limit - عدد الكتب
   * @returns قائمة الكتب الشائعة
   */
  getTrending: async (limit: number = 10) => {
    return apiCall(`/external-books/trending?limit=${limit}`);
  },

  /**
   * الحصول على فئات الكتب
   * @returns قائمة الفئات
   */
  getCategories: async () => {
    return apiCall('/external-books/categories');
  },

  /**
   * الحصول على كتب من فئة محددة
   * @param category - الفئة
   * @param params - معاملات البحث (page, limit)
   * @returns قائمة الكتب
   */
  getByCategory: async (category: string, params: { page?: number; limit?: number } = {}) => {
    const queryString = buildQueryString(params);
    return apiCall(`/external-books/category/${category}${queryString ? `?${queryString}` : ''}`);
  },
};

// ==================== Lectures API ====================

/**
 * واجهة API للمحاضرات
 */
export const lecturesAPI = {
  /**
   * الحصول على جميع المحاضرات
   * @param params - معاملات البحث (day_of_week, department)
   * @returns قائمة المحاضرات
   */
  getAll: async (params: { day_of_week?: string; department?: string } = {}) => {
    const queryString = buildQueryString(params);
    return apiCall(`/lectures${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * الحصول على محاضرة محددة
   * @param id - معرف المحاضرة
   * @returns بيانات المحاضرة
   */
  getById: async (id: string) => {
    return apiCall(`/lectures/${id}`);
  },
};

// ==================== Attendance API ====================

/**
 * واجهة API للحضور
 */
export const attendanceAPI = {
  /**
   * الحصول على سجلات الحضور
   * @param params - معاملات البحث (student_id, date, lecture_id)
   * @returns قائمة سجلات الحضور
   */
  getAll: async (params: { student_id?: string; date?: string; lecture_id?: string } = {}) => {
    const queryString = buildQueryString(params);
    return apiCall(`/attendance${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * تسجيل حضور جديد
   * @param attendanceData - بيانات الحضور
   * @returns سجل الحضور المنشأ
   */
  create: async (attendanceData: {
    date: string;
    check_in_time?: string;
    check_out_time?: string;
    nfc_card_id?: string;
    status?: 'present' | 'absent' | 'late';
    lecture_id?: string;
  }) => {
    return apiCall('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  },

  /**
   * تحديث سجل حضور
   * @param id - معرف سجل الحضور
   * @param attendanceData - البيانات المحدثة
   * @returns سجل الحضور المحدث
   */
  update: async (id: string, attendanceData: Partial<{
    check_out_time: string;
    status: 'present' | 'absent' | 'late';
  }>) => {
    return apiCall(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
  },

  /**
   * تسجيل حضور عن طريق الباركود
   * @param barcode - الباركود
   * @param lecture_id - معرف المحاضرة (اختياري)
   * @returns سجل الحضور المنشأ
   */
  barcodeAttendance: async (barcode: string, lecture_id?: string) => {
    return apiCall('/attendance/barcode', {
      method: 'POST',
      body: JSON.stringify({ barcode, lecture_id }),
    });
  },
};

// ==================== Payments API ====================

/**
 * واجهة API للدفعات
 */
export const paymentsAPI = {
  /**
   * الحصول على جميع الدفعات
   * @param params - معاملات البحث (status)
   * @returns قائمة الدفعات مع الإحصائيات
   */
  getAll: async (params: { status?: string } = {}) => {
    const queryString = buildQueryString(params);
    return apiCall(`/payments${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * الحصول على دفعة محددة
   * @param id - معرف الدفعة
   * @returns بيانات الدفعة
   */
  getById: async (id: string) => {
    return apiCall(`/payments/${id}`);
  },
};

// ==================== News API ====================

/**
 * واجهة API للأخبار والفعاليات
 */
export const newsAPI = {
  /**
   * الحصول على جميع الأخبار والفعاليات
   * @param params - معاملات البحث (type: 'news' | 'event' | 'all')
   * @returns قائمة الأخبار والفعاليات
   */
  getAll: async (params: { type?: 'news' | 'event' | 'all' } = {}) => {
    const queryString = buildQueryString(params);
    return apiCall(`/news${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * الحصول على خبر أو فعالية محددة
   * @param id - معرف الخبر/الفعالية
   * @returns بيانات الخبر/الفعالية
   */
  getById: async (id: string) => {
    return apiCall(`/news/${id}`);
  },
};

// ==================== Borrowings API ====================

/**
 * واجهة API للاستعارات
 */
export const borrowingsAPI = {
  /**
   * الحصول على جميع الاستعارات
   * @param params - معاملات البحث (status)
   * @returns قائمة الاستعارات
   */
  getAll: async (params: { status?: 'active' | 'returned' | 'overdue' } = {}) => {
    const queryString = buildQueryString(params);
    return apiCall(`/borrowings${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * إنشاء استعارة جديدة
   * @param bookId - معرف الكتاب
   * @returns بيانات الاستعارة المنشأة
   */
  create: async (bookId: string) => {
    return apiCall('/borrowings', {
      method: 'POST',
      body: JSON.stringify({ book_id: bookId }),
    });
  },

  /**
   * إرجاع كتاب
   * @param id - معرف الاستعارة
   * @returns بيانات الاستعارة المحدثة
   */
  returnBook: async (id: string) => {
    return apiCall(`/borrowings/${id}/return`, {
      method: 'PUT',
    });
  },
};

// ==================== Biometric API ====================

/**
 * واجهة API للبصمة الحيوية والتعرف على الوجه
 */
export const biometricAPI = {
  /**
   * تسجيل وجه المستخدم (للمرة الأولى)
   * @param faceImage - صورة الوجه
   * @returns نتيجة التسجيل
   */
  registerFace: async (faceImage: any) => {
    const formData = new FormData();
    if (faceImage.uri) {
      formData.append('face_image', {
        uri: faceImage.uri,
        type: 'image/jpeg',
        name: 'face.jpg',
      } as any);
    } else {
      formData.append('face_encoding', faceImage);
    }

    return apiCall('/biometric/register-face', {
      method: 'POST',
      headers: {
        // لا نضيف Content-Type للـ FormData
      },
      body: formData,
    });
  },

  /**
   * التحقق من حالة تفعيل البصمة الحيوية
   * @returns حالة البصمة الحيوية
   */
  getStatus: async () => {
    return apiCall('/biometric/status');
  },
};

// ==================== Departments API ====================

/**
 * واجهة API للأقسام
 */
export const departmentsAPI = {
  /**
   * الحصول على جميع الأقسام
   * @returns قائمة الأقسام
   */
  getAll: async () => {
    return apiCall('/departments');
  },

  /**
   * الحصول على قسم محدد
   * @param id - معرف القسم
   * @returns بيانات القسم
   */
  getById: async (id: string) => {
    return apiCall(`/departments/${id}`);
  },
};

// ==================== Students API ====================

/**
 * واجهة API للطلاب
 */
export const studentsAPI = {
  /**
   * الحصول على بيانات الطالب الحالي
   * @returns بيانات الطالب
   */
  getMe: async () => {
    return apiCall('/students/me');
  },

  /**
   * تحديث بيانات الطالب الحالي
   * @param studentData - البيانات المحدثة
   * @returns بيانات الطالب المحدثة
   */
  updateMe: async (studentData: {
    phone?: string;
    full_name?: string;
  }) => {
    return apiCall('/students/me', {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },
};

// ==================== PDF API ====================

/**
 * واجهة API لاستخراج النص من PDF
 */
export const pdfAPI = {
  /**
   * استخراج النص من ملف PDF
   * @param pdfUrl - رابط ملف PDF
   * @returns النص المستخرج من PDF
   */
  extractText: async (pdfUrl: string) => {
    return apiCall('/pdf/extract-text', {
      method: 'POST',
      body: JSON.stringify({ pdf_url: pdfUrl }),
    });
  },
};

// ==================== Book Reviews API ====================

/**
 * واجهة API لمراجعات الكتب
 */
export const bookReviewsAPI = {
  /**
   * الحصول على جميع مراجعات كتاب محدد
   * @param bookId - معرف الكتاب
   * @returns قائمة المراجعات مع متوسط التقييم
   */
  getByBookId: async (bookId: string) => {
    return apiCall(`/book-reviews/${bookId}`);
  },

  /**
   * إضافة مراجعة جديدة
   * @param bookId - معرف الكتاب
   * @param rating - التقييم (1-5)
   * @param comment - التعليق
   * @returns بيانات المراجعة المنشأة
   */
  create: async (bookId: string, rating: number, comment: string) => {
    return apiCall('/book-reviews', {
      method: 'POST',
      body: JSON.stringify({ book_id: bookId, rating, comment }),
    });
  },

  /**
   * تحديث مراجعة
   * @param reviewId - معرف المراجعة
   * @param rating - التقييم (1-5)
   * @param comment - التعليق
   * @returns بيانات المراجعة المحدثة
   */
  update: async (reviewId: string, rating: number, comment: string) => {
    return apiCall(`/book-reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify({ rating, comment }),
    });
  },

  /**
   * حذف مراجعة
   * @param reviewId - معرف المراجعة
   * @returns رسالة نجاح
   */
  delete: async (reviewId: string) => {
    return apiCall(`/book-reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};

// ==================== Schedules API ====================

/**
 * واجهة API للجداول الدراسية
 */
export const schedulesAPI = {
  /**
   * الحصول على جدول الطالب الحالي
   * @returns جدول الطالب حسب قسمه ومرحلته
   */
  getStudent: async () => {
    return apiCall('/schedules/student');
  },

  /**
   * الحصول على جميع الجداول
   * @param params - معاملات البحث (department_id, year_level, academic_year, semester)
   * @returns قائمة الجداول
   */
  getAll: async (params?: {
    department_id?: string;
    year_level?: number;
    academic_year?: string;
    semester?: string;
  }) => {
    const queryString = buildQueryString(params || {});
    return apiCall(`/schedules${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * الحصول على جدول محدد
   * @param id - معرف الجدول
   * @returns بيانات الجدول
   */
  getById: async (id: string) => {
    return apiCall(`/schedules/${id}`);
  },
};

// ==================== Notifications API ====================

/**
 * واجهة API للإشعارات
 */
export const notificationsAPI = {
  /**
   * الحصول على جميع الإشعارات
   * @param params - معاملات البحث (page, limit, type, is_read, category)
   * @returns قائمة الإشعارات
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    is_read?: boolean;
    category?: string;
  }) => {
    const queryString = buildQueryString(params || {});
    return apiCall(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * الحصول على عدد الإشعارات غير المقروءة
   * @returns عدد الإشعارات غير المقروءة
   */
  getUnreadCount: async () => {
    return apiCall('/notifications/unread-count');
  },

  /**
   * تحديد إشعار كمقروء
   * @param id - معرف الإشعار
   * @returns بيانات الإشعار المحدث
   */
  markAsRead: async (id: string) => {
    return apiCall(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  /**
   * تحديد جميع الإشعارات كمقروءة
   * @returns عدد الإشعارات المحدثة
   */
  markAllAsRead: async () => {
    return apiCall('/notifications/read-all', {
      method: 'PUT',
    });
  },

  /**
   * حذف إشعار
   * @param id - معرف الإشعار
   * @returns رسالة نجاح
   */
  delete: async (id: string) => {
    return apiCall(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * حذف جميع الإشعارات
   * @returns عدد الإشعارات المحذوفة
   */
  deleteAll: async () => {
    return apiCall('/notifications', {
      method: 'DELETE',
    });
  },
};

// ==================== Export Default ====================

/**
 * كائن API الرئيسي يحتوي على جميع الواجهات
 */
const api = {
  auth: authAPI,
  biometric: biometricAPI,
  books: booksAPI,
  externalBooks: externalBooksAPI,
  bookReviews: bookReviewsAPI,
  pdf: pdfAPI,
  lectures: lecturesAPI,
  schedules: schedulesAPI,
  attendance: attendanceAPI,
  payments: paymentsAPI,
  news: newsAPI,
  borrowings: borrowingsAPI,
  students: studentsAPI,
  departments: departmentsAPI,
  notifications: notificationsAPI,
};

export default api;

