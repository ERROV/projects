import React, { useEffect, useState, useCallback } from 'react';
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
  Bell,
  CheckCircle,
  Trash2,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  BookOpen,
  TrendingUp,
  Newspaper,
  Clock,
} from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { Platform } from 'react-native';

// استيراد expo-notifications فقط على الأجهزة المحمولة
let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.warn('expo-notifications not available:', error);
  }
}

/**
 * واجهة بيانات الإشعار
 */
interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'lecture' | 'payment' | 'borrowing' | 'attendance' | 'news' | 'event';
  category: 'lecture' | 'payment' | 'borrowing' | 'attendance' | 'news' | 'event' | 'system' | 'general';
  is_read: boolean;
  read_at?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  action_data?: any;
  createdAt: string;
}

/**
 * صفحة الإشعارات
 * تعرض جميع إشعارات المستخدم
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  /**
   * تحميل الإشعارات
   */
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: 1,
        limit: 50,
      };
      
      if (filter === 'unread') {
        params.is_read = false;
      }

      const response = await api.notifications.getAll(params);
      
      if (response.success && response.data) {
        setNotifications(response.data);
        if (response.unreadCount !== undefined) {
          setUnreadCount(response.unreadCount);
        }
      } else {
        setNotifications([]);
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  /**
   * تحميل عدد الإشعارات غير المقروءة
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await api.notifications.getUnreadCount();
      if (response.success && response.count !== undefined) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, []);

  /**
   * إعداد الإشعارات المحلية
   */
  useEffect(() => {
    // إعداد الإشعارات فقط على الأجهزة المحمولة
    if (Platform.OS === 'web' || !Notifications) {
      return;
    }

    // إعداد معالج الإشعارات
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // طلب الأذونات
    Notifications.requestPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        console.log('Notification permissions granted');
      }
    });

    // الاستماع للإشعارات الواردة
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // إعادة تحميل الإشعارات عند استلام إشعار جديد
      loadNotifications();
      loadUnreadCount();
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  /**
   * تحميل البيانات عند بدء الصفحة
   */
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  /**
   * إعادة تحميل البيانات (pull to refresh)
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await loadUnreadCount();
    setRefreshing(false);
  };

  /**
   * تحديد إشعار كمقروء
   */
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await api.notifications.markAsRead(id);
      if (response.success) {
        await loadNotifications();
        await loadUnreadCount();
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    }
  };

  /**
   * تحديد جميع الإشعارات كمقروءة
   */
  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.notifications.markAllAsRead();
      if (response.success) {
        await loadNotifications();
        await loadUnreadCount();
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    }
  };

  /**
   * حذف إشعار
   */
  const handleDelete = async (id: string) => {
    Alert.alert(
      t('notifications.delete'),
      language === 'ar' ? 'هل تريد حذف هذا الإشعار؟' : 'Do you want to delete this notification?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.notifications.delete(id);
              if (response.success) {
                await loadNotifications();
                await loadUnreadCount();
              }
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('common.error'));
            }
          },
        },
      ]
    );
  };

  /**
   * حذف جميع الإشعارات
   */
  const handleDeleteAll = async () => {
    Alert.alert(
      t('notifications.deleteAll'),
      language === 'ar' ? 'هل تريد حذف جميع الإشعارات؟' : 'Do you want to delete all notifications?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.notifications.deleteAll();
              if (response.success) {
                setNotifications([]);
                setUnreadCount(0);
              }
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('common.error'));
            }
          },
        },
      ]
    );
  };

  /**
   * الحصول على أيقونة النوع
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture':
        return <Calendar size={20} color="#7c3aed" />;
      case 'payment':
        return <DollarSign size={20} color="#f59e0b" />;
      case 'borrowing':
        return <BookOpen size={20} color="#3b82f6" />;
      case 'attendance':
        return <TrendingUp size={20} color="#10b981" />;
      case 'news':
      case 'event':
        return <Newspaper size={20} color="#8b5cf6" />;
      case 'success':
        return <CheckCircle2 size={20} color="#10b981" />;
      case 'error':
        return <XCircle size={20} color="#dc2626" />;
      case 'warning':
        return <AlertCircle size={20} color="#f59e0b" />;
      default:
        return <Info size={20} color="#64748b" />;
    }
  };

  /**
   * الحصول على لون النوع
   */
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'lecture':
        return '#7c3aed';
      case 'payment':
        return '#f59e0b';
      case 'borrowing':
        return '#3b82f6';
      case 'attendance':
        return '#10b981';
      case 'news':
      case 'event':
        return '#8b5cf6';
      case 'success':
        return '#10b981';
      case 'error':
        return '#dc2626';
      case 'warning':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  /**
   * الحصول على نص النوع
   */
  const getTypeText = (type: string): string => {
    return t(`notifications.${type}`) || type;
  };

  /**
   * تنسيق التاريخ
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (language === 'ar') {
      if (diffInHours < 1) return 'الآن';
      if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
      if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
      return date.toLocaleDateString('ar-IQ');
    } else {
      if (diffInHours < 1) return 'Now';
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString('en-US');
    }
  };

  /**
   * معالجة الضغط على إشعار
   */
  const handleNotificationPress = async (notification: Notification) => {
    // تحديد كمقروء إذا لم يكن مقروءاً
    if (!notification.is_read) {
      await handleMarkAsRead(notification._id);
    }

    // الانتقال إلى الصفحة المحددة إذا كان هناك action_url
    if (notification.action_url) {
      router.push(notification.action_url as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              {t('notifications.all')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
              {t('notifications.unread')}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Actions */}
        {notifications.length > 0 && (
          <View style={styles.actions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMarkAllAsRead}
              >
                <CheckCircle size={18} color="#10b981" />
                <Text style={styles.actionText}>{t('notifications.markAllAsRead')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteAll}
            >
              <Trash2 size={18} color="#dc2626" />
              <Text style={[styles.actionText, styles.deleteText]}>
                {t('notifications.deleteAll')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('common.loading')}</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('notifications.emptyState')}</Text>
            <Text style={styles.emptySubText}>{t('notifications.emptyStateDesc')}</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification._id}
              style={[
                styles.notificationCard,
                !notification.is_read && styles.unreadCard,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationHeader}>
                <View style={[styles.iconContainer, { backgroundColor: getTypeColor(notification.type) + '20' }]}>
                  {getTypeIcon(notification.type)}
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={[styles.notificationTitle, !notification.is_read && styles.unreadTitle]}>
                      {notification.title}
                    </Text>
                    {!notification.is_read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <View style={styles.notificationMeta}>
                    <View style={styles.typeBadge}>
                      <Text style={[styles.typeText, { color: getTypeColor(notification.type) }]}>
                        {getTypeText(notification.category)}
                      </Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Clock size={12} color="#64748b" />
                      <Text style={styles.timeText}>
                        {formatDate(notification.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.notificationActions}>
                {!notification.is_read && (
                  <TouchableOpacity
                    style={styles.markReadButton}
                    onPress={() => handleMarkAsRead(notification._id)}
                  >
                    <CheckCircle size={16} color="#10b981" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(notification._id)}
                >
                  <Trash2 size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  badge: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
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
  filterBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  deleteText: {
    color: '#dc2626',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderColor: '#1e40af',
    borderWidth: 2,
    backgroundColor: '#eff6ff',
  },
  notificationHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e40af',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  markReadButton: {
    padding: 8,
  },
});

