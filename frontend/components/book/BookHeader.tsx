/**
 * مكون رأس صفحة الكتاب (Book Header)
 * يعرض غلاف الكتاب والمعلومات الأساسية
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ArrowRight, BookOpen, ExternalLink, Star } from 'lucide-react-native';
import { Book } from '@/types';
import { getBookImageUrl } from '@/utils/imageUtils';
import { useRouter } from 'expo-router';

interface BookHeaderProps {
  book: Book;
  averageRating: number;
  reviewsCount: number;
  isExternalBook: boolean;
  source?: string;
}

export default function BookHeader({
  book,
  averageRating,
  reviewsCount,
  isExternalBook,
  source,
}: BookHeaderProps) {
  const router = useRouter();
  const imageUrl = getBookImageUrl(book);
  const isAvailable = (book.available_copies ?? 0) > 0;

  /**
   * عرض النجوم
   */
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        color={i < rating ? '#fbbf24' : '#d1d5db'}
        fill={i < rating ? '#fbbf24' : 'transparent'}
      />
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowRight size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الكتاب</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Book Info */}
      <View style={styles.content}>
        <View style={styles.coverContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <BookOpen size={48} color="#64748b" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>

          {/* Badges */}
          <View style={styles.badges}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{book.category}</Text>
            </View>
            {!isExternalBook && (
              <View style={[styles.availabilityBadge, isAvailable && styles.availableBadge]}>
                <Text style={[styles.availabilityText, isAvailable && styles.availableText]}>
                  {isAvailable ? `متاح (${book.available_copies})` : 'غير متاح'}
                </Text>
              </View>
            )}
            {isExternalBook && (
              <View style={styles.externalBadge}>
                <ExternalLink size={14} color="#7c3aed" />
                <Text style={styles.externalText}>
                  {source === 'googlebooks' ? 'Google Books' : 'Open Library'}
                </Text>
              </View>
            )}
          </View>

          {/* Rating */}
          {!isExternalBook && (
            <View style={styles.rating}>
              <View style={styles.stars}>{renderStars(Math.round(averageRating))}</View>
              <Text style={styles.ratingText}>
                {averageRating > 0 ? averageRating.toFixed(1) : 'لا يوجد تقييم'} ({reviewsCount})
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  coverContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cover: {
    width: 120,
    height: 180,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
  },
  coverPlaceholder: {
    width: 120,
    height: 180,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 30,
  },
  author: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
  },
  availabilityBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  availableBadge: {
    backgroundColor: '#d1fae5',
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  availableText: {
    color: '#059669',
  },
  externalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  externalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
});

