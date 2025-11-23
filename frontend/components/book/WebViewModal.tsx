/**
 * مكون نافذة WebView للقراءة (WebView Modal)
 * يعرض WebView لقراءة الكتب مع أزرار التحكم
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { X, Play, Pause } from 'lucide-react-native';

interface WebViewModalProps {
  visible: boolean;
  url: string;
  title: string;
  hasPDF: boolean;
  isSpeaking: boolean;
  bookmarkPage: number | null;
  onClose: () => void;
  onSaveBookmark: () => void;
  onReadPage: () => void;
}

export default function WebViewModal({
  visible,
  url,
  title,
  hasPDF,
  isSpeaking,
  bookmarkPage,
  onClose,
  onSaveBookmark,
  onReadPage,
}: WebViewModalProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{title}</Text>
          {bookmarkPage && (
            <TouchableOpacity style={styles.bookmarkButton}>
              <Text style={styles.bookmarkText}>📑 {bookmarkPage}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerRight}>
          {hasPDF && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={onSaveBookmark}>
                <Text style={styles.actionText}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={onReadPage}>
                {isSpeaking ? (
                  <Pause size={20} color="#1e40af" />
                ) : (
                  <Play size={20} color="#1e40af" />
                )}
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>
      </View>
      <WebView
        source={{ uri: url }}
        style={styles.webView}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.loadingText}>جاري تحميل الكتاب...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  bookmarkButton: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookmarkText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  actionText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  webView: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
});

