import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import arTranslations from '../locales/ar.json';
import enTranslations from '../locales/en.json';

export type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = '@alhikma:language';

const translations: Record<Language, any> = {
  ar: arTranslations,
  en: enTranslations,
};

/**
 * مقدم Language Context
 * يدير حالة اللغة والترجمة
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');
  const [isRTL, setIsRTL] = useState(true);

  /**
   * تحميل اللغة المحفوظة عند بدء التطبيق
   */
  useEffect(() => {
    loadLanguage();
  }, []);

  /**
   * تحميل اللغة من AsyncStorage
   */
  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
        await setLanguage(savedLanguage as Language);
      } else {
        // استخدام اللغة الافتراضية حسب إعدادات الجهاز
        const deviceLanguage = I18nManager.isRTL ? 'ar' : 'en';
        await setLanguage(deviceLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
      setLanguageState('ar');
      setIsRTL(true);
    }
  };

  /**
   * تغيير اللغة
   */
  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      const isRTLValue = lang === 'ar';
      setIsRTL(isRTLValue);
      
      // حفظ اللغة في AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, lang);
      
      // تغيير اتجاه النص (يتطلب إعادة تشغيل التطبيق)
      if (I18nManager.isRTL !== isRTLValue) {
        I18nManager.forceRTL(isRTLValue);
        // في React Native، قد نحتاج إلى إعادة تشغيل التطبيق
        // لكن يمكننا استخدام الحالة المحلية للتحكم في الاتجاه
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  /**
   * دالة الترجمة
   * @param key - مفتاح الترجمة (مثل: "auth.login")
   * @returns النص المترجم
   */
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // إذا لم توجد الترجمة، إرجاع المفتاح
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook لاستخدام LanguageContext
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

