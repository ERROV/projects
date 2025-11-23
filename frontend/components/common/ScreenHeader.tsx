/**
 * مكون رأس الصفحة المشترك (Screen Header Component)
 * يعرض رأس موحد لجميع الصفحات مع إمكانية إضافة أزرار مخصصة
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationIconWhite from '@/components/NotificationIconWhite';

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  showNotificationIcon?: boolean;
  rightActions?: React.ReactNode;
  onBackPress?: () => void;
}

/**
 * مكون رأس الصفحة
 */
export default function ScreenHeader({
  title,
  showBackButton = false,
  showNotificationIcon = false,
  rightActions,
  onBackPress,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { isRTL } = useLanguage();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.header, isRTL && styles.headerRTL]}>
      <View style={styles.headerLeft}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e40af" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      
      <View style={styles.headerRight}>
        {showNotificationIcon && <NotificationIconWhite />}
        {rightActions}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
});

