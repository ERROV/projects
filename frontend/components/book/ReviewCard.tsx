/**
 * مكون بطاقة المراجعة (Review Card)
 * يعرض مراجعة واحدة بشكل منظم
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, User, X } from 'lucide-react-native';

export interface Review {
  _id: string;
  user_id: {
    _id: string;
    email: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewCardProps {
  review: Review;
  isOwnReview: boolean;
  onDelete: (reviewId: string) => void;
}

export default function ReviewCard({ review, isOwnReview, onDelete }: ReviewCardProps) {
  /**
   * عرض النجوم
   */
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        color={i < rating ? '#fbbf24' : '#d1d5db'}
        fill={i < rating ? '#fbbf24' : 'transparent'}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.user}>
          <View style={styles.avatar}>
            <User size={20} color="#64748b" />
          </View>
          <View>
            <Text style={styles.userName}>{review.user_id?.email || 'مستخدم'}</Text>
            <View style={styles.rating}>{renderStars(review.rating)}</View>
          </View>
        </View>
        {isOwnReview && (
          <TouchableOpacity onPress={() => onDelete(review._id)}>
            <X size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.comment}>{review.comment}</Text>
      <Text style={styles.date}>
        {new Date(review.createdAt).toLocaleDateString('ar-SA')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  comment: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
});

