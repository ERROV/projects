/**
 * مكون وصف الكتاب (Book Description)
 * يعرض وصف الكتاب بشكل منظم
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BookDescriptionProps {
  description: string;
}

export default function BookDescription({ description }: BookDescriptionProps) {
  if (!description) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>الوصف</Text>
      <Text style={styles.text}>{description}</Text>
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
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    textAlign: 'right',
  },
});

