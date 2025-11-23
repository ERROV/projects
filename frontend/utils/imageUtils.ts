/**
 * ملف مساعدات الصور (Image Utilities)
 * يحتوي على دوال مساعدة لمعالجة وعرض الصور
 */

import { Book } from '@/types';
import Constants from 'expo-constants';

/**
 * بناء URL كامل للصورة
 * @param book - بيانات الكتاب
 * @returns URL الصورة أو undefined إذا لم تكن متوفرة
 */
export const getBookImageUrl = (book: Book): string | undefined => {
  // للكتب الخارجية (Open Library و Google Books)
  if (book.source === 'openlibrary' || book.source === 'googlebooks') {
    // جرب cover_url أولاً (صورة كبيرة)
    if (book.cover_url) {
      const url = book.cover_url.trim();
      // إذا كان URL يبدأ بـ //، أضف https:
      if (url.startsWith('//')) {
        return `https:${url}`;
      }
      // إذا كان URL يبدأ بـ http:// أو https://، استخدمه مباشرة
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
    }
    // جرب thumbnail_url كبديل
    if (book.thumbnail_url) {
      const url = book.thumbnail_url.trim();
      if (url.startsWith('//')) {
        return `https:${url}`;
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
    }
    return undefined;
  }
  
  // للكتب الجامعية
  const imageUrl = book.cover_image_url;
  if (!imageUrl) return undefined;
  
  // إذا كان URL كامل بالفعل
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // بناء URL كامل من base URL
  const baseUrl = Constants.expoConfig?.extra?.apiUrl || 
                  process.env.EXPO_PUBLIC_API_URL || 
                  'http://192.168.0.119:5000';
  
  // إزالة /api من baseUrl إذا كان موجوداً
  const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
  
  // التأكد من أن imageUrl يبدأ بـ /
  const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${cleanBaseUrl}${cleanImageUrl}`;
};

/**
 * بناء URL كامل للصورة العامة
 * @param imageUrl - رابط الصورة (قد يكون نسبي أو مطلق)
 * @returns URL الصورة الكامل
 */
export const getImageUrl = (imageUrl?: string): string | undefined => {
  if (!imageUrl) return undefined;
  
  // إذا كان URL كامل بالفعل
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // إذا كان URL نسبي يبدأ بـ //
  if (imageUrl.startsWith('//')) {
    return `https:${imageUrl}`;
  }
  
  // بناء URL كامل من base URL
  const baseUrl = Constants.expoConfig?.extra?.apiUrl || 
                  process.env.EXPO_PUBLIC_API_URL || 
                  'http://192.168.0.119:5000';
  
  const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
  const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${cleanBaseUrl}${cleanImageUrl}`;
};

