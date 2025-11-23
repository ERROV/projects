/**
 * مكون بطاقة الكتاب المشترك (Book Card Component)
 * يعرض بطاقة كتاب في وضع Grid أو List
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BookOpen, ExternalLink, FileText } from 'lucide-react-native';
import { Book, ViewMode } from '@/types';
import { getBookImageUrl } from '@/utils/imageUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';

interface BookCardProps {
  book: Book;
  viewMode: ViewMode;
  onBorrow?: (bookId: string) => void;
  onDigitalRead?: (url: string) => void;
}

/**
 * مكون بطاقة الكتاب
 */
export default function BookCard({ book, viewMode, onBorrow, onDigitalRead }: BookCardProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const imageUrl = getBookImageUrl(book);
  const isAvailable = (book.available_copies ?? 0) > 0;
  const isUniversityBook = book.source === 'university';
  const isExternalBook = book.source === 'openlibrary' || book.source === 'googlebooks';

  /**
   * معالجة الضغط على البطاقة
   */
  const handlePress = () => {
    if (isExternalBook) {
      router.push({
        pathname: '/book/[id]' as any,
        params: {
          id: book._id,
          source: book.source,
          external_id: book.external_id || '',
        },
      });
    } else {
      router.push(`/book/${book._id}` as any);
    }
  };

  /**
   * معالجة طلب الاستعارة
   */
  const handleBorrowPress = (e: any) => {
    e.stopPropagation();
    if (onBorrow) {
      onBorrow(book._id);
    }
  };

  /**
   * معالجة القراءة الرقمية
   */
  const handleDigitalPress = (e: any) => {
    e.stopPropagation();
    if (onDigitalRead && book.digital_version_url) {
      onDigitalRead(book.digital_version_url);
    }
  };

  if (viewMode === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={handlePress}>
        <View style={styles.listImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.listImage}
              resizeMode="cover"
              onError={(e) => {
                console.log('List image load error:', imageUrl);
              }}
            />
          ) : (
            <View style={styles.listImagePlaceholder}>
              <BookOpen size={24} color="#64748b" />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={2}>
              {book.title}
            </Text>
            {isUniversityBook && (
              <View
                style={[
                  styles.listAvailability,
                  isAvailable ? styles.available : styles.unavailable,
                ]}
              >
                <Text style={styles.listAvailabilityText}>
                  {isAvailable
                    ? `${t('library.available')} (${book.available_copies})`
                    : t('library.unavailable')}
                </Text>
              </View>
            )}
            {isExternalBook && (
              <View style={styles.externalBadge}>
                <ExternalLink size={12} color="#7c3aed" />
                <Text style={styles.externalBadgeText}>
                  {(book as any).api_source === 'googlebooks' ? 'Google Books' : 'Open Library'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.listAuthor} numberOfLines={1}>
            {book.author}
          </Text>

          <View style={styles.listMeta}>
            <Text style={styles.listCategory}>{book.category}</Text>
          </View>

          <View style={styles.listActions}>
            {isUniversityBook && isAvailable && onBorrow && (
              <TouchableOpacity style={styles.listBorrowButton} onPress={handleBorrowPress}>
                <Text style={styles.listBorrowText}>{t('library.borrow')}</Text>
              </TouchableOpacity>
            )}
            {isUniversityBook && book.digital_version_url && onDigitalRead && (
              <TouchableOpacity style={styles.listDigitalButton} onPress={handleDigitalPress}>
                <FileText size={16} color="#7c3aed" />
              </TouchableOpacity>
            )}
            {isExternalBook && (
              <TouchableOpacity
                style={styles.listExternalButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handlePress();
                }}
              >
                <ExternalLink size={14} color="#ffffff" />
                <Text style={styles.listExternalText}>{t('library.viewDetails')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid View
  return (
    <TouchableOpacity style={styles.gridCard} onPress={handlePress}>
      <View style={styles.gridImageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.gridImage}
            resizeMode="cover"
            onError={(e) => {
              console.log('Grid image load error:', imageUrl);
            }}
          />
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <BookOpen size={32} color="#64748b" />
          </View>
        )}
        {isUniversityBook && (
          <View
            style={[
              styles.availabilityIndicator,
              isAvailable ? styles.available : styles.unavailable,
            ]}
          >
            <Text style={styles.availabilityIndicatorText}>
              {isAvailable ? t('library.available') : t('library.unavailable')}
            </Text>
          </View>
        )}
        {isExternalBook && (
          <View style={styles.externalIndicator}>
            <ExternalLink size={12} color="#ffffff" />
          </View>
        )}
      </View>

      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.gridAuthor} numberOfLines={1}>
          {book.author}
        </Text>

        <View style={styles.gridCategory}>
          <Text style={styles.gridCategoryText}>{book.category}</Text>
        </View>

        <View style={styles.gridActions}>
          {isUniversityBook && isAvailable && onBorrow && (
            <TouchableOpacity style={styles.gridBorrowButton} onPress={handleBorrowPress}>
              <Text style={styles.gridBorrowText}>{t('library.borrow')}</Text>
            </TouchableOpacity>
          )}
          {isUniversityBook && book.digital_version_url && onDigitalRead && (
            <TouchableOpacity style={styles.gridDigitalButton} onPress={handleDigitalPress}>
              <FileText size={16} color="#7c3aed" />
            </TouchableOpacity>
          )}
          {isExternalBook && (
            <TouchableOpacity
              style={styles.gridViewButton}
              onPress={(e) => {
                e.stopPropagation();
                handlePress();
              }}
            >
              <ExternalLink size={14} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid Styles
  gridCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  gridImageContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  gridImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
    backgroundColor: '#f8fafc',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  availabilityIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  available: {
    backgroundColor: '#10b981',
  },
  unavailable: {
    backgroundColor: '#ef4444',
  },
  availabilityIndicatorText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  externalIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    minHeight: 40,
  },
  gridAuthor: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  gridCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  gridCategoryText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  gridActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  gridBorrowButton: {
    flex: 1,
    backgroundColor: '#1e40af',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  gridBorrowText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  gridDigitalButton: {
    width: 36,
    height: 36,
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridViewButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // List Styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  listImageContainer: {
    marginLeft: 12,
  },
  listImage: {
    width: 80,
    height: 120,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#f8fafc',
  },
  listImagePlaceholder: {
    width: 80,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
  listHeader: {
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  listAvailability: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  listAvailabilityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  externalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
  },
  externalBadgeText: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: '600',
  },
  listAuthor: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  listMeta: {
    marginBottom: 8,
  },
  listCategory: {
    fontSize: 12,
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  listBorrowButton: {
    flex: 1,
    backgroundColor: '#1e40af',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  listBorrowText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  listDigitalButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listExternalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    justifyContent: 'center',
  },
  listExternalText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

