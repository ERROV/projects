import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  Camera,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import NotificationIconWhite from '@/components/NotificationIconWhite';

/**
 * واجهة بيانات الطالب
 */
interface StudentData {
  full_name: string;
  student_number: string;
  department: string;
  year_level: number;
}

/**
 * واجهة الإحصائيات
 */
interface Stats {
  activeBorrowings: number;
  todayAttendance: boolean;
  upcomingLectures: number;
  pendingPayments: number;
}

/**
 * صفحة الرئيسية
 * تعرض معلومات الطالب والإحصائيات
 */
export default function HomeScreen() {
  const router = useRouter();
  const { student } = useAuth();
  const { t, language } = useLanguage();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [stats, setStats] = useState<Stats>({
    activeBorrowings: 0,
    todayAttendance: false,
    upcomingLectures: 0,
    pendingPayments: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * تحميل بيانات الطالب والإحصائيات
   */
  const loadData = async () => {
    try {
      setLoading(true);

      // تحميل بيانات الطالب
      if (student) {
        setStudentData({
          full_name: student.full_name,
          student_number: student.student_number,
          department: student.department,
          year_level: student.year_level,
        });
      }

      // تحميل الإحصائيات
      await loadStats();
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert(t('common.error'), t('home.loadError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * تحميل الإحصائيات من API
   */
  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // جلب الاستعارات النشطة
      const borrowingsResponse = await api.borrowings.getAll({ status: 'active' });
      const activeBorrowings = borrowingsResponse.success && borrowingsResponse.data
        ? borrowingsResponse.data.length
        : 0;

      // جلب سجلات الحضور لليوم
      const attendanceResponse = await api.attendance.getAll({ date: today });
      const todayAttendance = attendanceResponse.success && attendanceResponse.data
        ? attendanceResponse.data.length > 0
        : false;

      // جلب المحاضرات القادمة (اليوم الحالي)
      const currentDay = getCurrentDay();
      const lecturesResponse = await api.lectures.getAll({ day_of_week: currentDay });
      const upcomingLectures = lecturesResponse.success && lecturesResponse.data
        ? lecturesResponse.data.length
        : 0;

      // جلب الدفعات المعلقة
      const paymentsResponse = await api.payments.getAll();
      let pendingPayments = 0;
      if (paymentsResponse.success && paymentsResponse.data) {
        pendingPayments = paymentsResponse.data.filter(
          (p: any) => p.status === 'pending' || p.status === 'partial'
        ).length;
      }

      setStats({
        activeBorrowings,
        todayAttendance,
        upcomingLectures,
        pendingPayments,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  /**
   * الحصول على اليوم الحالي
   */
  const getCurrentDay = (): string => {
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
   * إعادة تحميل البيانات (pull to refresh)
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [student]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('home.greeting')}</Text>
          <Text style={styles.userName}>
            {studentData?.full_name || student?.full_name || t('home.student')}
          </Text>
          <Text style={styles.studentNumber}>
            {studentData?.student_number || student?.student_number || ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationIconWhite />
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => router.push('/attendance/face-recognition')}
          >
            <Camera size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statCard, styles.blueCard]}
          onPress={() => router.push('/library')}
        >
          <BookOpen size={28} color="#ffffff" />
          <Text style={styles.statValue}>{stats.activeBorrowings}</Text>
          <Text style={styles.statLabel}>{t('home.borrowedBooks')}</Text>
        </TouchableOpacity>

        <View style={[styles.statCard, styles.greenCard]}>
          <Clock size={28} color="#ffffff" />
          <Text style={styles.statValue}>
            {stats.todayAttendance ? '✓' : '-'}
          </Text>
          <Text style={styles.statLabel}>{t('home.todayAttendance')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.statCard, styles.purpleCard]}
          onPress={() => router.push('/schedule')}
        >
          <Calendar size={28} color="#ffffff" />
          <Text style={styles.statValue}>{stats.upcomingLectures}</Text>
          <Text style={styles.statLabel}>{t('home.upcomingLectures')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, styles.orangeCard]}
          onPress={() => router.push('/tuition')}
        >
          <DollarSign size={28} color="#ffffff" />
          <Text style={styles.statValue}>{stats.pendingPayments}</Text>
          <Text style={styles.statLabel}>{t('home.pendingPayments')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.quickAccess')}</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/library')}
        >
          <View style={styles.menuIcon}>
            <BookOpen size={24} color="#1e40af" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>{t('home.searchBook')}</Text>
            <Text style={styles.menuDescription}>
              {t('home.searchBookDesc')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/attendance/nfc')}
        >
          <View style={styles.menuIcon}>
            <TrendingUp size={24} color="#059669" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>{t('home.recordAttendance')}</Text>
            <Text style={styles.menuDescription}>
              {t('home.recordAttendanceDesc')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/schedule')}
        >
          <View style={styles.menuIcon}>
            <Calendar size={24} color="#7c3aed" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>{t('home.mySchedule')}</Text>
            <Text style={styles.menuDescription}>
              {t('home.myScheduleDesc')}
            </Text>
          </View>
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
  header: {
    backgroundColor: '#1e40af',
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  studentNumber: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 4,
  },
  cameraButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  blueCard: {
    backgroundColor: '#3b82f6',
  },
  greenCard: {
    backgroundColor: '#10b981',
  },
  purpleCard: {
    backgroundColor: '#8b5cf6',
  },
  orangeCard: {
    backgroundColor: '#f59e0b',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  menuDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
  },
});
