import NotificationIcon from '@/components/NotificationIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import Constants from 'expo-constants';
import { Calendar as CalendarIcon, Clock, MapPin, Newspaper, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * واجهة بيانات الخبر/الفعالية
 */
interface NewsEvent {
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
 * صفحة الأخبار والفعاليات
 * تعرض الأخبار والفعاليات مع إمكانية الفلترة
 */
export default function NewsScreen() {
  const { t, language } = useLanguage();
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<NewsEvent[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * تحميل الأخبار والفعاليات من API
   */
  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      
      // بناء معاملات البحث
      const params: any = {};
      if (selectedType !== 'all') {
        params.type = selectedType;
      }

      const response = await api.news.getAll(params);
      
      if (response.success && response.data) {
        setNewsEvents(response.data);
        setFilteredEvents(response.data);
      } else {
        setNewsEvents([]);
        setFilteredEvents([]);
      }
    } catch (error: any) {
      console.error('Error loading news:', error);
      setNewsEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  /**
   * تحميل البيانات عند تغيير النوع
   */
  useEffect(() => {
    loadNews();
  }, [selectedType, loadNews]);

  /**
   * إعادة تحميل البيانات (pull to refresh)
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  /**
   * معالجة الضغط على خبر/فعالية
   */
  const handleNewsPress = (item: NewsEvent) => {
    Alert.alert(
      item.title,
      item.content + 
      (item.event_date ? `\n\n📅 ${t('news.date')}: ${new Date(item.event_date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}` : '') +
      (item.location ? `\n📍 ${t('news.location')}: ${item.location}` : '') +
      (item.organizer ? `\n👥 ${t('news.organizer')}: ${item.organizer}` : ''),
      [
        { text: t('common.close'), style: 'cancel' },
        ...(item.type === 'event' ? [{ text: language === 'ar' ? 'إضافة للتقويم' : 'Add to Calendar', style: 'default' as const }] : []),
      ]
    );
  };

  /**
   * التحقق من أن الفعالية قادمة
   */
  const isUpcomingEvent = (eventDate: string): boolean => {
    const today = new Date();
    const event = new Date(eventDate);
    return event > today;
  };

  /**
   * حساب الوقت المنقضي منذ النشر
   */
  const getTimeAgo = (publishedAt: string): string => {
    const published = new Date(publishedAt);
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
   * بناء URL كامل للصورة
   */
  const getImageUrl = (imageUrl?: string): string | undefined => {
    if (!imageUrl) return undefined;
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    const baseUrl = Constants.expoConfig?.extra?.apiUrl || 
                    process.env.EXPO_PUBLIC_API_URL || 
                    'http://192.168.0.119:5000';
    
    return `${baseUrl}${imageUrl}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('news.title')}</Text>
          <NotificationIcon />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType('all')}
          >
            <Text
              style={[
                styles.filterText,
                selectedType === 'all' && styles.filterTextActive,
              ]}
            >
              {t('news.all')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === 'news' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType('news')}
          >
            <Newspaper size={16} color={selectedType === 'news' ? '#ffffff' : '#64748b'} />
            <Text
              style={[
                styles.filterText,
                selectedType === 'news' && styles.filterTextActive,
              ]}
            >
              {t('news.news')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === 'event' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType('event')}
          >
            <CalendarIcon size={16} color={selectedType === 'event' ? '#ffffff' : '#64748b'} />
            <Text
              style={[
                styles.filterText,
                selectedType === 'event' && styles.filterTextActive,
              ]}
            >
              {t('news.event')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Newspaper size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('common.loading')}</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Newspaper size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {selectedType === 'news' ? t('news.noNews') : selectedType === 'event' ? t('news.noEvents') : (language === 'ar' ? 'لا توجد أخبار أو فعاليات' : 'No news or events')}
            </Text>
            <Text style={styles.emptySubText}>
              {selectedType !== 'all' 
                ? (language === 'ar' ? 'جرب تغيير التصنيف لعرض المزيد' : 'Try changing the filter to see more')
                : (language === 'ar' ? 'سيتم إضافة محتوى جديد قريباً' : 'New content will be added soon')}
            </Text>
          </View>
        ) : (
          filteredEvents.map((item) => {
            const isUpcoming = item.event_date ? isUpcomingEvent(item.event_date) : false;
            
            return (
              <TouchableOpacity 
                key={item._id} 
                style={styles.newsCard}
                onPress={() => handleNewsPress(item)}
              >
                {item.image_url && (
                  <Image
                    source={{ uri: getImageUrl(item.image_url) }}
                    style={styles.newsImage}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                )}

                <View style={styles.newsContent}>
                  <View style={styles.typeRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        item.type === 'event' && styles.eventBadge,
                        isUpcoming && styles.upcomingBadge,
                      ]}
                    >
                      {item.type === 'event' ? (
                        <CalendarIcon size={14} color={isUpcoming ? "#059669" : "#7c3aed"} />
                      ) : (
                        <Newspaper size={14} color="#1e40af" />
                      )}
                      <Text
                        style={[
                          styles.typeText,
                          item.type === 'event' && styles.eventText,
                          isUpcoming && styles.upcomingText,
                        ]}
                      >
                        {item.type === 'event' 
                          ? (isUpcoming ? (language === 'ar' ? 'فعالية قادمة' : 'Upcoming Event') : t('news.event'))
                          : t('news.news')
                        }
                      </Text>
                    </View>

                    <View style={styles.dateRow}>
                      <Text style={styles.dateText}>
                        {getTimeAgo(item.published_at)}
                      </Text>
                      <Clock size={14} color="#64748b" />
                    </View>
                  </View>

                  <Text style={styles.newsTitle}>{item.title}</Text>
                  <Text style={styles.newsDescription} numberOfLines={3}>
                    {item.content}
                  </Text>

                  {item.type === 'event' && item.event_date && (
                    <View style={styles.eventDetails}>
                      <View style={styles.eventDateContainer}>
                        <CalendarIcon size={16} color="#7c3aed" />
                        <Text style={styles.eventDateText}>
                          {new Date(item.event_date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>

                      {item.location && (
                        <View style={styles.eventDetailRow}>
                          <MapPin size={14} color="#64748b" />
                          <Text style={styles.eventDetailText}>{item.location}</Text>
                        </View>
                      )}

                      {item.organizer && (
                        <View style={styles.eventDetailRow}>
                          <Users size={14} color="#64748b" />
                          <Text style={styles.eventDetailText}>{item.organizer}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.readMoreButton}>
                      <Text style={styles.readMoreText}>
                        {item.type === 'event' 
                          ? (language === 'ar' ? 'تفاصيل الفعالية' : 'Event Details')
                          : t('news.readMore')
                        }
                      </Text>
                    </TouchableOpacity>
                    
                    {item.type === 'event' && isUpcoming && (
                      <TouchableOpacity style={styles.registerButton}>
                        <Text style={styles.registerText}>سجل الآن</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'right',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#1e40af',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
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
  },
  emptySubText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 8,
    textAlign: 'center',
  },
  newsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  newsImage: {
    width: '100%',
    height: 200,
  },
  newsContent: {
    padding: 16,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  eventBadge: {
    backgroundColor: '#f3e8ff',
  },
  upcomingBadge: {
    backgroundColor: '#d1fae5',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  eventText: {
    color: '#7c3aed',
  },
  upcomingText: {
    color: '#059669',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
    lineHeight: 24,
  },
  newsDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'right',
  },
  eventDetails: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  eventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  eventDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
    flex: 1,
    textAlign: 'right',
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  eventDetailText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readMoreButton: {
    paddingVertical: 6,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  registerButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  registerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});
