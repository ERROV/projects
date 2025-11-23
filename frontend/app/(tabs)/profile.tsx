import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Hash,
  LogOut,
  Settings,
  BookOpen,
  Calendar,
  CreditCard,
  Fingerprint,
  Camera,
  Languages,
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import * as LocalAuthentication from 'expo-local-authentication';
import NotificationIconWhite from '@/components/NotificationIconWhite';

/**
 * واجهة بيانات الطالب
 */
interface StudentProfile {
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
interface ProfileStats {
  totalBorrowings: number;
  activeBorrowings: number;
  attendanceDays: number;
}

/**
 * صفحة الملف الشخصي
 * تعرض معلومات الطالب وإحصائياته
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { student, signOut } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalBorrowings: 0,
    activeBorrowings: 0,
    attendanceDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  /**
   * تحميل بيانات الملف الشخصي
   */
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      // جلب بيانات الطالب من API
      const response = await api.students.getMe();
      
      if (response.success && response.data) {
        setProfile(response.data);
      } else if (student) {
        // استخدام بيانات من AuthContext كبديل
        setProfile({
          _id: student.id,
          full_name: student.full_name,
          student_number: student.student_number,
          email: '',
          phone: student.phone,
          department: student.department,
          year_level: student.year_level,
          avatar_url: student.avatar_url,
          biometric_enabled: false,
        });
      }

      // تحميل الإحصائيات
      await loadStats();

      // التحقق من توفر البصمة الحيوية
      await checkBiometricAvailability();
    } catch (error: any) {
      console.error('Error loading profile:', error);
      // استخدام بيانات من AuthContext في حالة الخطأ
      if (student) {
        setProfile({
          _id: student.id,
          full_name: student.full_name,
          student_number: student.student_number,
          email: '',
          phone: student.phone,
          department: student.department,
          year_level: student.year_level,
          avatar_url: student.avatar_url,
          biometric_enabled: false,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [student]);

  /**
   * التحقق من توفر البصمة الحيوية
   */
  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.error('Error checking biometric:', error);
      setBiometricAvailable(false);
    }
  };

  /**
   * تحميل الإحصائيات
   */
  const loadStats = async () => {
    try {
      // جلب الاستعارات
      const borrowingsResponse = await api.borrowings.getAll();
      let totalBorrowings = 0;
      let activeBorrowings = 0;
      
      if (borrowingsResponse.success && borrowingsResponse.data) {
        totalBorrowings = borrowingsResponse.data.length;
        activeBorrowings = borrowingsResponse.data.filter(
          (b: any) => b.status === 'active'
        ).length;
      }

      // جلب سجلات الحضور
      const attendanceResponse = await api.attendance.getAll();
      let attendanceDays = 0;
      
      if (attendanceResponse.success && attendanceResponse.data) {
        attendanceDays = attendanceResponse.data.length;
      }

      setStats({
        totalBorrowings,
        activeBorrowings,
        attendanceDays,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  /**
   * تحميل البيانات عند بدء الصفحة
   */
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /**
   * إعادة تحميل البيانات (pull to refresh)
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  /**
   * معالجة تسجيل الخروج
   */
  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      language === 'ar' 
        ? 'هل أنت متأكد من رغبتك في تسجيل الخروج؟'
        : 'Are you sure you want to logout?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('common.error'));
            }
          },
        },
      ]
    );
  };

  /**
   * معالجة تسجيل الوجه
   */
  const handleRegisterFace = () => {
    Alert.alert(
      language === 'ar' ? 'تسجيل الوجه' : 'Face Registration',
      language === 'ar'
        ? 'سيتم فتح الكاميرا لتسجيل وجهك. تأكد من وجود إضاءة جيدة ووضع وجهك داخل الإطار.'
        : 'The camera will open to register your face. Make sure there is good lighting and position your face within the frame.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: language === 'ar' ? 'متابعة' : 'Continue',
          onPress: () => {
            router.push('/auth/register-face');
          },
        },
      ]
    );
  };

  /**
   * الحصول على الأحرف الأولى من الاسم
   */
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* رأس الملف الشخصي */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <NotificationIconWhite />
        </View>
        <View style={styles.avatarContainer}>
          {profile.avatar_url ? (
            <View style={styles.avatarImage}>
              <Text style={styles.avatarText}>صورة</Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(profile.full_name)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{profile.full_name}</Text>
        <Text style={styles.studentNumber}>{profile.student_number}</Text>
      </View>

      {/* الإحصائيات */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <BookOpen size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{stats.totalBorrowings}</Text>
          <Text style={styles.statLabel}>{t('profile.totalBorrowings')}</Text>
        </View>
        <View style={styles.statItem}>
          <BookOpen size={24} color="#10b981" />
          <Text style={styles.statValue}>{stats.activeBorrowings}</Text>
          <Text style={styles.statLabel}>{t('profile.activeBorrowings')}</Text>
        </View>
        <View style={styles.statItem}>
          <Calendar size={24} color="#8b5cf6" />
          <Text style={styles.statValue}>{stats.attendanceDays}</Text>
          <Text style={styles.statLabel}>{t('profile.attendanceDays')}</Text>
        </View>
      </View>

      {/* معلومات الطالب */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.studentInfo')}</Text>
        
        <View style={styles.infoItem}>
          <User size={20} color="#64748b" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('auth.fullName')}</Text>
            <Text style={styles.infoValue}>{profile.full_name}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Hash size={20} color="#64748b" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('profile.studentNumber')}</Text>
            <Text style={styles.infoValue}>{profile.student_number}</Text>
          </View>
        </View>

        {profile.email && (
          <View style={styles.infoItem}>
            <Mail size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.email')}</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
          </View>
        )}

        {profile.phone && (
          <View style={styles.infoItem}>
            <Phone size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoItem}>
          <GraduationCap size={20} color="#64748b" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('profile.department')}</Text>
            <Text style={styles.infoValue}>{profile.department}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Hash size={20} color="#64748b" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('profile.yearLevel')}</Text>
            <Text style={styles.infoValue}>
              {language === 'ar' ? `السنة ${profile.year_level}` : `Year ${profile.year_level}`}
            </Text>
          </View>
        </View>
      </View>

      {/* الأمان */}
      {biometricAvailable && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.biometricAuth')}</Text>
          
          {profile.biometric_enabled ? (
            <View style={styles.infoItem}>
              <Fingerprint size={20} color="#10b981" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('profile.biometricAuth')}</Text>
                <Text style={[styles.infoValue, { color: '#10b981' }]}>
                  {language === 'ar' ? 'مفعّلة' : 'Enabled'}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.menuItem} onPress={handleRegisterFace}>
              <Camera size={20} color="#1e40af" />
              <Text style={styles.menuText}>
                {language === 'ar' ? 'تسجيل الوجه للدخول السريع' : 'Register Face for Quick Login'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* الإعدادات */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
        
        {/* خيار تغيير اللغة */}
        <View style={styles.languageContainer}>
          <View style={styles.languageHeader}>
            <Languages size={20} color="#64748b" />
            <Text style={styles.menuText}>{t('profile.language')}</Text>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={language}
              onValueChange={async (itemValue) => {
                await setLanguage(itemValue);
                setShowLanguagePicker(false);
              }}
              style={styles.picker}
              dropdownIconColor="#64748b"
            >
              <Picker.Item label={t('profile.arabic')} value="ar" />
              <Picker.Item label={t('profile.english')} value="en" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#dc2626" />
          <Text style={[styles.menuText, styles.logoutText]}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  studentNumber: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'right',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoContent: {
    flex: 1,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'right',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 12,
    flex: 1,
    textAlign: 'right',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#dc2626',
  },
  languageContainer: {
    marginBottom: 16,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#1e293b',
  },
});
