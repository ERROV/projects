/**
 * مكون بطاقة الخبر/الفعالية المشترك (News Card Component)
 * يعرض بطاقة خبر أو فعالية بشكل موحد
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar as CalendarIcon, Clock, MapPin, Newspaper, Users } from 'lucide-react-native';
import { NewsEvent } from '@/types';
import { getImageUrl } from '@/utils/imageUtils';
import { getTimeAgo, formatDate, isUpcomingEvent } from '@/utils/dateUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface NewsCardProps {
  item: NewsEvent;
  onPress: (item: NewsEvent) => void;
}

/**
 * مكون بطاقة الخبر/الفعالية
 */
export default function NewsCard({ item, onPress }: NewsCardProps) {
  const { t, language } = useLanguage();
  const imageUrl = getImageUrl(item.image_url);
  const isEvent = item.type === 'event';
  const isUpcoming = item.event_date ? isUpcomingEvent(item.event_date) : false;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          {isEvent && isUpcoming && (
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>{t('news.upcoming')}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.typeBadge}>
            {isEvent ? (
              <CalendarIcon size={14} color="#7c3aed" />
            ) : (
              <Newspaper size={14} color="#1e40af" />
            )}
            <Text style={[styles.typeText, isEvent && styles.typeTextEvent]}>
              {isEvent ? t('news.event') : t('news.news')}
            </Text>
          </View>
          <Text style={styles.timeAgo}>{getTimeAgo(item.published_at, language)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.contentText} numberOfLines={3}>
          {item.content}
        </Text>

        {isEvent && (
          <View style={styles.eventDetails}>
            {item.event_date && (
              <View style={styles.eventDetailItem}>
                <CalendarIcon size={16} color="#64748b" />
                <Text style={styles.eventDetailText}>
                  {formatDate(item.event_date, language)}
                </Text>
              </View>
            )}
            {item.location && (
              <View style={styles.eventDetailItem}>
                <MapPin size={16} color="#64748b" />
                <Text style={styles.eventDetailText}>{item.location}</Text>
              </View>
            )}
            {item.organizer && (
              <View style={styles.eventDetailItem}>
                <Users size={16} color="#64748b" />
                <Text style={styles.eventDetailText}>{item.organizer}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8fafc',
  },
  upcomingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upcomingBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  typeTextEvent: {
    color: '#7c3aed',
  },
  timeAgo: {
    fontSize: 12,
    color: '#94a3b8',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
});

