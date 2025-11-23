/**
 * مكون تبديل وضع العرض (View Mode Toggle)
 * يسمح للمستخدم بالتبديل بين Grid, List, Horizontal
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Grid3X3, List } from 'lucide-react-native';
import { ViewMode } from '@/types';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, viewMode === 'grid' && styles.buttonActive]}
        onPress={() => onViewModeChange('grid')}
        activeOpacity={0.7}
      >
        <Grid3X3 size={20} color={viewMode === 'grid' ? '#1e40af' : '#64748b'} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, viewMode === 'list' && styles.buttonActive]}
        onPress={() => onViewModeChange('list')}
        activeOpacity={0.7}
      >
        <List size={20} color={viewMode === 'list' ? '#1e40af' : '#64748b'} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, viewMode === 'horizontal' && styles.buttonActive]}
        onPress={() => onViewModeChange('horizontal')}
        activeOpacity={0.7}
      >
        <Text style={[styles.horizontalIcon, viewMode === 'horizontal' && styles.horizontalIconActive]}>
          ⬌
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#1e40af',
  },
  horizontalIcon: {
    fontSize: 20,
    color: '#64748b',
  },
  horizontalIconActive: {
    color: '#1e40af',
  },
});

