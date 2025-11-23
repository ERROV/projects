/**
 * ملف الأنواع المشتركة (Types & Interfaces)
 * يحتوي على جميع الواجهات والأنواع المستخدمة في التطبيق
 */

/**
 * واجهة بيانات الكتاب
 */
export interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  available_copies?: number;
  total_copies?: number;
  cover_image_url?: string;
  cover_url?: string;
  thumbnail_url?: string;
  digital_version_url?: string;
  source?: 'university' | 'openlibrary' | 'googlebooks';
  external_id?: string;
  publish_year?: number;
  year?: number;
  description?: string;
  page_count?: number;
  language?: string;
  preview_link?: string;
  api_source?: 'openlibrary' | 'googlebooks';
  isbn?: string;
  subjects?: string[];
}

/**
 * واجهة بيانات الخبر/الفعالية
 */
export interface NewsEvent {
  _id: string;
  title: string;
  content: string;
  type: 'news' | 'event';
  image_url?: string;
  event_date?: string;
  published_at: string;
  location?: string;
  organizer?: string;
}

/**
 * واجهة بيانات الطالب
 */
export interface StudentProfile {
  _id: string;
  full_name: string;
  student_number: string;
  email: string;
  phone?: string;
  department: string;
  year_level: number;
  avatar_url?: string;
  biometric_enabled?: boolean;
}

/**
 * واجهة الإحصائيات
 */
export interface ProfileStats {
  totalBorrowings: number;
  activeBorrowings: number;
  attendanceDays: number;
}

/**
 * واجهة الإشعار
 */
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'lecture' | 'payment' | 'borrowing' | 'attendance' | 'news' | 'event' | 'system' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  read_at?: string;
  created_at: string;
  action_url?: string;
  action_data?: any;
}

/**
 * واجهة الاستجابة من API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * نوع وضع العرض (Grid, List, Horizontal)
 */
export type ViewMode = 'grid' | 'list' | 'horizontal';

/**
 * نوع مصدر الكتب
 */
export type BookSource = 'university' | 'external';

