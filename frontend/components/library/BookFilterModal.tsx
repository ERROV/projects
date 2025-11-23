/**
 * مكون نافذة فلتر الكتب (Book Filter Modal)
 * يعرض خيارات الفلترة المتقدمة للكتب
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Star } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

interface BookFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  onReset: () => void;
}

export interface FilterOptions {
  format: 'physical' | 'ebook' | 'audio' | 'any';
  genres: string[];
  minRating: number;
}

export default function BookFilterModal({ visible, onClose, onApply, onReset }: BookFilterModalProps) {
  const { t, language } = useLanguage();
  
  const [selectedFormat, setSelectedFormat] = useState<'physical' | 'ebook' | 'audio' | 'any'>('any');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const formats = [
    { id: 'physical', label: language === 'ar' ? 'كتاب ورقي' : 'Physical Book' },
    { id: 'ebook', label: language === 'ar' ? 'كتاب إلكتروني' : 'E-Book' },
    { id: 'audio', label: language === 'ar' ? 'كتاب صوتي' : 'Audio Book' },
  ];

  const genres = language === 'ar' 
    ? ['خيال', 'غموض', 'رومانسية', 'فانتازيا', 'أطفال', 'جريمة', 'شباب', 'غير خيالي', 'مذكرات', 'سيرة ذاتية', 'علوم', 'طبيعة', 'تطوير ذاتي', 'رعب', 'أي']
    : ['Fiction', 'Mystery', 'Romance', 'Fantasy', "Children's Books", 'Crime', 'Young Adult', 'Non-Fiction', 'Memories', 'Biography', 'Science', 'Nature', 'Personal Development', 'Horror', 'Any'];

  const ratings = [1, 2, 3, 4];

  /**
   * معالجة اختيار الفئة
   */
  const handleGenreToggle = (genre: string) => {
    if (genre === 'Any' || genre === 'أي') {
      setSelectedGenres([]);
    } else {
      // إزالة "Any" إذا تم اختيار فئة محددة
      const filtered = selectedGenres.filter(g => g !== 'Any' && g !== 'أي');
      setSelectedGenres(prev => 
        prev.includes(genre) 
          ? filtered.filter(g => g !== genre)
          : [...filtered, genre]
      );
    }
  };

  /**
   * تطبيق الفلاتر
   */
  const handleApply = () => {
    onApply({
      format: selectedFormat,
      genres: selectedGenres,
      minRating: selectedRating,
    });
    onClose();
  };

  /**
   * إعادة تعيين الفلاتر
   */
  const handleReset = () => {
    setSelectedFormat('any');
    setSelectedGenres([]);
    setSelectedRating(0);
    onReset();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.title}>{language === 'ar' ? 'فلتر الكتب' : 'Book Filter'}</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Sort by Format */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{language === 'ar' ? 'الترتيب حسب النوع' : 'Sort by Format'}</Text>
              <View style={styles.optionsContainer}>
                {formats.map((format) => (
                  <TouchableOpacity
                    key={format.id}
                    style={[
                      styles.checkboxOption,
                      selectedFormat === format.id && styles.checkboxOptionSelected,
                    ]}
                    onPress={() => setSelectedFormat(format.id as any)}
                  >
                    <View style={[
                      styles.checkbox,
                      selectedFormat === format.id && styles.checkboxSelected,
                    ]}>
                      {selectedFormat === format.id && (
                        <View style={styles.checkboxInner} />
                      )}
                    </View>
                    <Text style={[
                      styles.optionText,
                      selectedFormat === format.id && styles.optionTextSelected,
                    ]}>
                      {format.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort by Genres */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{language === 'ar' ? 'الترتيب حسب الفئات' : 'Sort by Genres'}</Text>
              <View style={styles.genresGrid}>
                {genres.map((genre) => {
                  const isAny = genre === 'Any' || genre === 'أي';
                  const isSelected = isAny 
                    ? selectedGenres.length === 0 
                    : selectedGenres.includes(genre);
                  return (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.genreChip,
                        isSelected && styles.genreChipSelected,
                      ]}
                      onPress={() => handleGenreToggle(genre)}
                    >
                      <Text style={[
                        styles.genreText,
                        isSelected && styles.genreTextSelected,
                      ]}>
                        {genre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sort by Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{language === 'ar' ? 'الترتيب حسب التقييم' : 'Sort by Rating'}</Text>
              <View style={styles.ratingsContainer}>
                {ratings.map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingChip,
                      selectedRating === rating && styles.ratingChipSelected,
                    ]}
                    onPress={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                  >
                    <Star
                      size={24}
                      color={selectedRating === rating ? '#fbbf24' : '#64748b'}
                      fill={selectedRating === rating ? '#fbbf24' : 'transparent'}
                    />
                    <Text style={[
                      styles.ratingText,
                      selectedRating === rating && styles.ratingTextSelected,
                    ]}>
                      {rating}+
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.ratingChip,
                    selectedRating === 0 && styles.ratingChipSelected,
                  ]}
                  onPress={() => setSelectedRating(0)}
                >
                  <Text style={[
                    styles.ratingText,
                    selectedRating === 0 && styles.ratingTextSelected,
                  ]}>
                    {language === 'ar' ? 'أي' : 'Any'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                {language === 'ar' ? 'تطبيق الفلتر' : 'Apply Filter'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetText}>
                {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    minHeight: '85%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  checkboxOptionSelected: {
    // Additional styles if needed
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed',
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  optionText: {
    fontSize: 18,
    color: '#64748b',
  },
  optionTextSelected: {
    color: '#1e293b',
    fontWeight: '600',
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  genreChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreChipSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  genreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  genreTextSelected: {
    color: '#ffffff',
  },
  ratingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minHeight: 48,
    justifyContent: 'center',
  },
  ratingChipSelected: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  ratingTextSelected: {
    color: '#92400e',
  },
  actions: {
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  resetText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '600',
  },
});

