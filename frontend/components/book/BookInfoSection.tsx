/**
 * مكون قسم معلومات الكتاب (Book Info Section)
 * يعرض المعلومات الإضافية للكتاب
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Book } from '@/types';

interface BookInfoSectionProps {
  book: Book;
  isExternalBook: boolean;
}

export default function BookInfoSection({ book, isExternalBook }: BookInfoSectionProps) {
  const infoItems = [
    { label: 'الفئة', value: book.category },
    book.isbn && { label: 'ISBN', value: book.isbn },
    (book.year || book.publish_year) && {
      label: 'سنة النشر',
      value: book.publish_year || book.year,
    },
    book.page_count && { label: 'عدد الصفحات', value: book.page_count.toString() },
    book.language && {
      label: 'اللغة',
      value: book.language === 'ar' ? 'العربية' : book.language === 'en' ? 'الإنجليزية' : book.language,
    },
    !isExternalBook && book.total_copies && {
      label: 'النسخ المتاحة',
      value: `${book.available_copies} من ${book.total_copies}`,
    },
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>معلومات إضافية</Text>
      <View style={styles.content}>
        {infoItems.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.label}:</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  content: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  value: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
});

