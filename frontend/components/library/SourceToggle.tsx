/**
 * مكون تبديل المصدر (Source Toggle)
 * يسمح بالتبديل بين كتب الجامعة والكتب الخارجية
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BookSource } from '@/types';

interface SourceToggleProps {
  source: BookSource;
  onSourceChange: (source: BookSource) => void;
  universityLabel: string;
  externalLabel: string;
}

export default function SourceToggle({
  source,
  onSourceChange,
  universityLabel,
  externalLabel,
}: SourceToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, source === 'university' && styles.buttonActive]}
        onPress={() => onSourceChange('university')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            source === 'university' && styles.buttonTextActive,
          ]}
        >
          {universityLabel}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, source === 'external' && styles.buttonActive]}
        onPress={() => onSourceChange('external')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            source === 'external' && styles.buttonTextActive,
          ]}
        >
          {externalLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#1e40af',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
});

