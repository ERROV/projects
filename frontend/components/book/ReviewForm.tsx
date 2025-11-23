/**
 * مكون نموذج المراجعة (Review Form)
 * يعرض نموذج لإضافة أو تعديل مراجعة
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Star, X } from 'lucide-react-native';

interface ReviewFormProps {
  rating: number;
  comment: string;
  isEditing: boolean;
  submitting: boolean;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ReviewForm({
  rating,
  comment,
  isEditing,
  submitting,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? 'تعديل المراجعة' : 'إضافة مراجعة'}</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>التقييم:</Text>
      <View style={styles.ratingInput}>
        {Array.from({ length: 5 }, (_, i) => (
          <TouchableOpacity key={i} onPress={() => onRatingChange(i + 1)}>
            <Star
              size={32}
              color={i < rating ? '#fbbf24' : '#d1d5db'}
              fill={i < rating ? '#fbbf24' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>التعليق:</Text>
      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={onCommentChange}
        placeholder="اكتب مراجعتك هنا..."
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>إلغاء</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>إرسال</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'right',
  },
  ratingInput: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    minHeight: 100,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

