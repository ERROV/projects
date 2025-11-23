import api from '@/lib/api';
import { Calendar, Clock, MapPin, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationIcon from '@/components/NotificationIcon';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

/**
 * واجهة بيانات المحاضرة
 */
interface Lecture {
  _id: string;
  course_name: string;
  instructor_name: string;
  room_number: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  course_code?: string;
  lecture_type?: string;
}

/**
 * صفحة الجدول الدراسي
 * تعرض المحاضرات حسب اليوم المحدد
 */
export default function ScheduleScreen() {
  const { t, language } = useLanguage();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedDay, setSelectedDay] = useState(language === 'ar' ? 'السبت' : 'Saturday');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleResponse, setScheduleResponse] = useState<any>(null);

  const daysOfWeek = language === 'ar' ? [
    { id: 'السبت', name: t('schedule.saturday') },
    { id: 'الأحد', name: t('schedule.sunday') },
    { id: 'الاثنين', name: t('schedule.monday') },
    { id: 'الثلاثاء', name: t('schedule.tuesday') },
    { id: 'الأربعاء', name: t('schedule.wednesday') },
    { id: 'الخميس', name: t('schedule.thursday') },
  ] : [
    { id: 'Saturday', name: t('schedule.saturday') },
    { id: 'Sunday', name: t('schedule.sunday') },
    { id: 'Monday', name: t('schedule.monday') },
    { id: 'Tuesday', name: t('schedule.tuesday') },
    { id: 'Wednesday', name: t('schedule.wednesday') },
    { id: 'Thursday', name: t('schedule.thursday') },
  ];

  /**
   * تحميل الجدول من API
   */
  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      
      // جلب جدول الطالب الحالي حسب قسمه ومرحلته
      const response = await api.schedules.getStudent();
      setScheduleResponse(response);
      
      console.log('Schedule response:', {
        success: response.success,
        hasData: !!response.data,
        weekSchedule: response.data?.week_schedule?.length,
        message: response.message,
      });
      
      // Log detailed week_schedule structure
      if (response.data?.week_schedule) {
        console.log('Week schedule structure:', {
          days_count: response.data.week_schedule.length,
          days: response.data.week_schedule.map((d: any) => ({
            day: d?.day,
            lectures_count: d?.lectures?.length || 0,
            has_lectures: !!d?.lectures && Array.isArray(d.lectures),
          })),
        });
      }
      
      if (response.success && response.data) {
        // التحقق من وجود week_schedule
        if (!response.data.week_schedule || !Array.isArray(response.data.week_schedule)) {
          console.warn('week_schedule is missing or invalid:', {
            hasWeekSchedule: !!response.data.week_schedule,
            isArray: Array.isArray(response.data.week_schedule),
            data: response.data,
          });
          setLectures([]);
          return;
        }

        console.log('Week schedule days:', response.data.week_schedule.map((d: any) => d?.day));
        console.log('Selected day:', selectedDay);

        // البحث عن محاضرات اليوم المحدد
        const daySchedule = response.data.week_schedule.find(
          (day: any) => day && day.day === selectedDay
        );
        
        console.log('Day schedule found:', {
          found: !!daySchedule,
          day: daySchedule?.day,
          lecturesCount: daySchedule?.lectures?.length,
          lectures: daySchedule?.lectures,
        });
        
        if (daySchedule && daySchedule.lectures && Array.isArray(daySchedule.lectures)) {
          // ترتيب المحاضرات حسب وقت البدء
          const sortedLectures = [...daySchedule.lectures].sort((a: any, b: any) => {
            if (!a.start_time || !b.start_time) return 0;
            return a.start_time.localeCompare(b.start_time);
          });
          
          // تحويل إلى تنسيق Lecture مع التحقق من البيانات
          const formattedLectures = sortedLectures
            .filter((lecture: any) => lecture && lecture.course_name) // تصفية المحاضرات الفارغة
            .map((lecture: any, index: number) => ({
              _id: `${response.data._id}_${selectedDay}_${lecture.start_time || index}`,
              course_name: lecture.course_name || 'غير محدد',
              course_code: lecture.course_code || '',
              instructor_name: lecture.instructor_name || 'غير محدد',
              room_number: lecture.room_number || 'غير محدد',
              day_of_week: selectedDay,
              start_time: lecture.start_time || '00:00',
              end_time: lecture.end_time || '00:00',
              lecture_type: lecture.lecture_type || 'نظري',
            }));
          
          setLectures(formattedLectures);
        } else {
          console.log('No lectures found for selected day');
          setLectures([]);
        }
      } else {
        // لا يوجد جدول متاح
        console.log('No schedule data available:', {
          success: response.success,
          message: response.message,
          data: response.data,
        });
        setLectures([]);
      }
    } catch (error: any) {
      console.error('Error loading schedule:', error);
      setLectures([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDay]);

  /**
   * تحميل المحاضرات عند تغيير اليوم
   */
  useEffect(() => {
    loadSchedule();
  }, [selectedDay, loadSchedule]);

  /**
   * إعادة تحميل البيانات (pull to refresh)
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
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
   * التحقق إذا كانت المحاضرة جارية الآن
   */
  const isLectureNow = (lecture: Lecture): boolean => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    return lecture.day_of_week === getCurrentDay() && 
           currentTime >= lecture.start_time && 
           currentTime <= lecture.end_time;
  };

  /**
   * التحقق إذا كانت المحاضرة قادمة
   */
  const isUpcomingLecture = (lecture: Lecture): boolean => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    return lecture.day_of_week === getCurrentDay() && 
           currentTime < lecture.start_time;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('schedule.title')}</Text>
          <NotificationIcon />
        </View>
        
        {/* مؤشر اليوم الحالي */}
        <View style={styles.currentDayIndicator}>
          <Text style={styles.currentDayText}>
            {language === 'ar' ? 'اليوم: ' : 'Today: '}{getCurrentDay()}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daysContainer}
        >
          {daysOfWeek.map((day) => (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayChip,
                selectedDay === day.id && styles.dayChipActive,
                day.id === getCurrentDay() && styles.currentDayChip,
              ]}
              onPress={() => setSelectedDay(day.id)}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDay === day.id && styles.dayTextActive,
                  day.id === getCurrentDay() && styles.currentDayText,
                ]}
              >
                {day.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && lectures.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('common.loading')}</Text>
          </View>
        ) : lectures.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {t('schedule.noLectures')}
            </Text>
            <Text style={styles.emptySubText}>
              {scheduleResponse?.success === false || !scheduleResponse?.data 
                ? scheduleResponse?.message || (language === 'ar' ? 'لا يوجد جدول دراسي متاح حالياً. يرجى التواصل مع الإدارة.' : 'No schedule available at the moment. Please contact administration.')
                : scheduleResponse?.data && (!scheduleResponse.data.week_schedule || scheduleResponse.data.week_schedule.length === 0)
                ? (language === 'ar' ? 'الجدول موجود لكن لا توجد محاضرات مضافة' : 'Schedule exists but no lectures added')
                : scheduleResponse?.data?.week_schedule && scheduleResponse.data.week_schedule.length > 0
                ? (language === 'ar' ? `لا توجد محاضرات في يوم ${selectedDay}. جرب اختيار يوم آخر.` : `No lectures on ${selectedDay}. Try selecting another day.`)
                : (language === 'ar' ? 'استمتع بيومك الدراسي!' : 'Enjoy your study day!')}
            </Text>
            {scheduleResponse?.data?.week_schedule && scheduleResponse.data.week_schedule.length > 0 && (
              <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                  💡 المحاضرات متوفرة في: {scheduleResponse.data.week_schedule
                    .filter((d: any) => d?.lectures && d.lectures.length > 0)
                    .map((d: any) => d.day)
                    .join(', ')}
                </Text>
              </View>
            )}
          </View>
        ) : (
          lectures.map((lecture) => {
            const isNow = isLectureNow(lecture);
            const isUpcoming = isUpcomingLecture(lecture);
            
            return (
              <View 
                key={lecture._id} 
                style={[
                  styles.lectureCard,
                  isNow && styles.currentLectureCard,
                  isUpcoming && styles.upcomingLectureCard,
                ]}
              >
                {isNow && (
                  <View style={styles.liveIndicator}>
                    <Text style={styles.liveText}>
                      {language === 'ar' ? '● مباشر الآن' : '● Live Now'}
                    </Text>
                  </View>
                )}

                <View style={styles.timeIndicator}>
                  <Text style={[
                    styles.startTime,
                    isNow && styles.currentTimeText
                  ]}>
                    {lecture.start_time.substring(0, 5)}
                  </Text>
                  <View style={[
                    styles.timeDivider,
                    isNow && styles.currentTimeDivider
                  ]} />
                  <Text style={styles.endTime}>
                    {lecture.end_time.substring(0, 5)}
                  </Text>
                </View>

                <View style={styles.lectureInfo}>
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseName}>{lecture.course_name}</Text>
                    <View style={styles.courseCodesContainer}>
                      {lecture.course_code && (
                        <Text style={styles.courseCode}>{lecture.course_code}</Text>
                      )}
                      {lecture.lecture_type && (
                        <Text style={[styles.courseCode, styles.lectureType]}>
                          {lecture.lecture_type}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailText}>{lecture.instructor_name}</Text>
                    <User size={16} color="#64748b" />
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailText}>
                      {language === 'ar' ? `قاعة ${lecture.room_number}` : `Room ${lecture.room_number}`}
                    </Text>
                    <MapPin size={16} color="#64748b" />
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailText}>
                      {lecture.day_of_week} • {lecture.start_time} - {lecture.end_time}
                    </Text>
                    <Clock size={16} color="#64748b" />
                  </View>

                  {isUpcoming && (
                    <View style={styles.upcomingBadge}>
                      <Text style={styles.upcomingText}>قادمة</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
  },
  currentDayIndicator: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  currentDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  daysContainer: {
    flexDirection: 'row',
  },
  dayChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  dayChipActive: {
    backgroundColor: '#7c3aed',
  },
  currentDayChip: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  dayTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#94a3b8',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 8,
    textAlign: 'center',
  },
  lectureCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentLectureCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  upcomingLectureCard: {
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#facc15',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  timeIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginLeft: 12,
    minWidth: 80,
  },
  startTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
  },
  currentTimeText: {
    color: '#dc2626',
  },
  timeDivider: {
    width: 20,
    height: 1,
    backgroundColor: '#93c5fd',
    marginVertical: 4,
  },
  currentTimeDivider: {
    backgroundColor: '#dc2626',
  },
  endTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
  },
  lectureInfo: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
    flex: 1,
  },
  courseCodesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lectureType: {
    backgroundColor: '#e0e7ff',
    color: '#6366f1',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'flex-end',
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
    textAlign: 'right',
  },
  upcomingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  upcomingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
});
