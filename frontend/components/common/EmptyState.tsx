/**
 * مكون الحالة الفارغة المشترك (Empty State Component)
 * يعرض رسالة عندما لا توجد بيانات للعرض
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  iconSize?: number;
  iconColor?: string;
}

/**
 * مكون الحالة الفارغة
 */
export default function EmptyState({
  icon: Icon,
  title,
  message,
  iconSize = 64,
  iconColor = '#94a3b8',
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {Icon && <Icon size={iconSize} color={iconColor} />}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 200,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

