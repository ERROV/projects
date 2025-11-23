import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setToken, getToken, clearToken } from '@/lib/api';
import { saveLastEmail, getLastEmail, setBiometricEnabled, getBiometricEnabled, clearBiometricData } from '@/lib/storage';

/**
 * واجهة بيانات المستخدم
 */
interface User {
  id: string;
  email: string;
  role: 'student' | 'admin' | 'instructor';
}

/**
 * واجهة بيانات الطالب
 */
interface Student {
  id: string;
  full_name: string;
  student_number: string;
  department: string;
  year_level: number;
  phone?: string;
  avatar_url?: string;
}

/**
 * واجهة AuthContext
 */
interface AuthContextType {
  user: User | null;
  student: Student | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, studentData: {
    full_name: string;
    student_number: string;
    phone?: string;
    department_id?: string;
    department: string;
    year_level: number;
  }, enableBiometric?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  faceLogin: (faceImage?: any) => Promise<void>;
  biometricLogin: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  isBiometricEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * مقدم Auth Context
 * يدير حالة المصادقة والبيانات المستخدم
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  /**
   * تحميل بيانات المستخدم عند بدء التطبيق
   */
  useEffect(() => {
    loadUser();
    loadBiometricStatus();
  }, []);

  /**
   * تحميل حالة البصمة الحيوية
   */
  const loadBiometricStatus = async () => {
    try {
      const enabled = await getBiometricEnabled();
      setIsBiometricEnabled(enabled);
    } catch (error) {
      console.error('Error loading biometric status:', error);
    }
  };

  /**
   * تحميل بيانات المستخدم من API
   */
  const loadUser = async () => {
    try {
      // التحقق من وجود token
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // جلب بيانات المستخدم
      const response = await api.auth.getMe();
      if (response.success) {
        const userData = (response as any).user;
        const studentData = (response as any).student;
        
        setUser(userData);
        setStudent(studentData);
      } else {
        // إذا فشل، حذف token
        clearToken();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      clearToken();
    } finally {
      setLoading(false);
    }
  };

  /**
   * تسجيل الدخول
   * @param email - البريد الإلكتروني
   * @param password - كلمة المرور
   */
  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);
      
      if (response.success) {
        const userData = (response as any).user;
        const studentData = (response as any).student;
        
        setUser(userData);
        setStudent(studentData);
        
        // حفظ آخر بريد إلكتروني مستخدم
        await saveLastEmail(email);
        
        // تحديث حالة البصمة الحيوية
        await loadBiometricStatus();
      } else {
        throw new Error((response as any).message || 'فشل تسجيل الدخول');
      }
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * تسجيل مستخدم جديد
   * @param email - البريد الإلكتروني
   * @param password - كلمة المرور
   * @param studentData - بيانات الطالب
   * @param enableBiometric - تفعيل البصمة الحيوية بعد التسجيل
   */
  const signUp = async (
    email: string,
    password: string,
    studentData: {
      full_name: string;
      student_number: string;
      phone?: string;
      department_id?: string;
      department: string;
      year_level: number;
    },
    enableBiometric: boolean = false
  ) => {
    try {
      const response = await api.auth.register({
        email,
        password,
        ...studentData,
      });

      if (response.success) {
        const userData = (response as any).user;
        const studentData = (response as any).student;
        
        setUser(userData);
        setStudent(studentData);
        
        // حفظ آخر بريد إلكتروني مستخدم
        await saveLastEmail(email);
        
        // تفعيل البصمة الحيوية إذا طلب المستخدم
        if (enableBiometric) {
          try {
            await api.auth.enableBiometric();
            await setBiometricEnabled(true);
            setIsBiometricEnabled(true);
          } catch (error) {
            console.error('Error enabling biometric:', error);
            // لا نرمي خطأ هنا، لأن التسجيل نجح بالفعل
          }
        }
      } else {
        throw new Error((response as any).message || 'فشل التسجيل');
      }
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * تسجيل الخروج
   */
  const signOut = async () => {
    try {
      api.auth.logout();
      setUser(null);
      setStudent(null);
      // لا نمسح بيانات البصمة الحيوية عند تسجيل الخروج
      // حتى يتمكن المستخدم من استخدامها في المرة القادمة
    } catch (error) {
      console.error('Error signing out:', error);
      // حتى لو فشل، نمسح البيانات المحلية
      clearToken();
      setUser(null);
      setStudent(null);
    }
  };

  /**
   * إعادة تحميل بيانات المستخدم
   */
  const refreshUser = async () => {
    await loadUser();
  };

  /**
   * تسجيل الدخول بالتعرف على الوجه
   * @param faceImage - صورة الوجه (اختياري)
   */
  const faceLogin = async (faceImage?: any) => {
    try {
      const response = await api.auth.faceLogin(faceImage);
      
      if (response.success) {
        const userData = (response as any).user;
        const studentData = (response as any).student;
        
        setUser(userData);
        setStudent(studentData);
        
        // حفظ آخر بريد إلكتروني مستخدم
        if (userData?.email) {
          await saveLastEmail(userData.email);
        }
      } else {
        throw new Error((response as any).message || 'فشل التعرف على الوجه');
      }
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * تسجيل الدخول بالبصمة الحيوية
   */
  const biometricLogin = async () => {
    try {
      // الحصول على آخر بريد إلكتروني مستخدم
      const email = await getLastEmail();
      if (!email) {
        throw new Error('لا يوجد بريد إلكتروني محفوظ. يرجى تسجيل الدخول بالطريقة العادية أولاً');
      }

      const response = await api.auth.biometricLogin(email);
      
      if (response.success) {
        const userData = (response as any).user;
        const studentData = (response as any).student;
        
        setUser(userData);
        setStudent(studentData);
      } else {
        throw new Error((response as any).message || 'فشل تسجيل الدخول بالبصمة الحيوية');
      }
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * تفعيل البصمة الحيوية
   */
  const enableBiometric = async () => {
    try {
      const response = await api.auth.enableBiometric();
      if (response.success) {
        await setBiometricEnabled(true);
        setIsBiometricEnabled(true);
      } else {
        throw new Error((response as any).message || 'فشل تفعيل البصمة الحيوية');
      }
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * تعطيل البصمة الحيوية
   */
  const disableBiometric = async () => {
    try {
      const response = await api.auth.disableBiometric();
      if (response.success) {
        await setBiometricEnabled(false);
        await clearBiometricData();
        setIsBiometricEnabled(false);
      } else {
        throw new Error((response as any).message || 'فشل تعطيل البصمة الحيوية');
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        student, 
        loading, 
        signIn, 
        signUp, 
        signOut,
        refreshUser,
        faceLogin,
        biometricLogin,
        enableBiometric,
        disableBiometric,
        isBiometricEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook لاستخدام AuthContext
 * @returns AuthContextType
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
