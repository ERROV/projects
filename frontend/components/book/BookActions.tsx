/**
 * مكون أزرار الإجراءات (Book Actions)
 * يعرض أزرار القراءة والقراءة الصوتية
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BookOpen, Play, Pause } from 'lucide-react-native';

interface BookActionsProps {
  isExternalBook: boolean;
  downloadingPDF: boolean;
  isSpeaking: boolean;
  extractingPDF: boolean;
  hasPDF: boolean;
  pdfText: string | null;
  onReadBook: () => void;
  onToggleSpeech: () => void;
}

export default function BookActions({
  isExternalBook,
  downloadingPDF,
  isSpeaking,
  extractingPDF,
  hasPDF,
  pdfText,
  onReadBook,
  onToggleSpeech,
}: BookActionsProps) {
  if (isExternalBook) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>قراءة الكتاب</Text>
        <TouchableOpacity
          style={styles.readButton}
          onPress={onReadBook}
          disabled={downloadingPDF}
          activeOpacity={0.8}
        >
          {downloadingPDF ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.readButtonText}>جاري التحميل...</Text>
            </>
          ) : (
            <>
              <BookOpen size={24} color="#ffffff" />
              <Text style={styles.readButtonText}>قراءة الكتاب</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>القراءة الصوتية</Text>
      {hasPDF && (
        <Text style={styles.pdfIndicator}>
          {pdfText ? '✓ تم تحميل PDF' : '📄 جاهز للقراءة'}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.audioButton, isSpeaking && styles.audioButtonActive]}
        onPress={onToggleSpeech}
        disabled={extractingPDF}
        activeOpacity={0.8}
      >
        {extractingPDF ? (
          <>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.audioButtonText}>جاري تحميل PDF...</Text>
          </>
        ) : isSpeaking ? (
          <>
            <Pause size={24} color="#ffffff" />
            <Text style={styles.audioButtonText}>إيقاف القراءة</Text>
          </>
        ) : (
          <>
            <Play size={24} color="#ffffff" />
            <Text style={styles.audioButtonText}>
              {hasPDF ? 'قراءة PDF صوتياً' : 'قراءة صوتية'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      {hasPDF && !pdfText && (
        <Text style={styles.hint}>سيتم تحميل محتوى PDF عند الضغط على الزر</Text>
      )}
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
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  readButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  pdfIndicator: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 12,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  audioButtonActive: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  audioButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

