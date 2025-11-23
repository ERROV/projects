/**
 * مكون مؤشر التحميل المشترك (Loading Spinner Component)
 * يعرض مؤشر تحميل موحد في جميع أنحاء التطبيق
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

/**
 * مكون مؤشر التحميل
 */
export default function LoadingSpinner({
  message,
  size = 'large',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { t } = useLanguage();

  const content = (
    <View style={styles.container}>
      <ActivityIndicator size={size} color="#1e40af" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  message: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
});

