/**
 * صفحة المكتبة الرقمية
 * تعرض الكتب المتاحة مع إمكانية البحث والفلترة
 */

import BookFilterModal, { FilterOptions } from '@/components/library/BookFilterModal';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { Book, BookSource, ViewMode } from '@/types';
import { getBookImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function LibraryScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  
  // State Management
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [externalBooks, setExternalBooks] = useState<Book[]>([]);
  const [externalCategories, setExternalCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExternalCategory, setSelectedExternalCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [bookSource, setBookSource] = useState<BookSource>('university');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    format: 'any',
    genres: [],
    minRating: 0,
  });

  // Categories
  const categories = [
    { id: 'all', name: t('library.all'), icon: '📚' },
    { id: 'علوم الحاسوب', name: language === 'ar' ? 'علوم الحاسوب' : 'Computer Science', icon: '💻' },
    { id: 'الرياضيات', name: language === 'ar' ? 'الرياضيات' : 'Mathematics', icon: '📐' },
    { id: 'الفيزياء', name: language === 'ar' ? 'الفيزياء' : 'Physics', icon: '⚛️' },
    { id: 'الأدب', name: language === 'ar' ? 'الأدب' : 'Literature', icon: '📖' },
    { id: 'التاريخ', name: language === 'ar' ? 'التاريخ' : 'History', icon: '🏛️' },
    { id: 'الهندسة', name: language === 'ar' ? 'الهندسة' : 'Engineering', icon: '⚙️' },
    { id: 'الطب', name: language === 'ar' ? 'الطب' : 'Medicine', icon: '⚕️' },
  ];

  const displayCategories = bookSource === 'university' 
    ? categories 
    : externalCategories.map((cat) => ({
        id: cat.id,
        name: cat.name[language] || cat.name.en || cat.name,
        icon: '📚'
      }));

  /**
   * تحميل الكتب المميزة
   */
  const loadFeaturedBooks = useCallback(async () => {
    try {
      const response = await api.books.getAll({});
      if (response.success && response.data) {
        const featured = response.data.slice(0, 5).map((book: Book) => ({
          ...book,
          source: 'university' as const,
        }));
        setFeaturedBooks(featured);
      }
    } catch (error) {
      console.error('Error loading featured books:', error);
    }
  }, []);

  /**
   * تحميل الكتب من API
   */
  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      
      if (bookSource === 'university') {
        const params: any = {};
        if (selectedCategory !== 'all') params.category = selectedCategory;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const response = await api.books.getAll(params);
        if (response.success && response.data) {
          const booksWithSource = response.data.map((book: Book) => ({
            ...book,
            source: 'university' as const,
          }));
          setBooks(booksWithSource);
          setFilteredBooks(booksWithSource);
        } else {
          setBooks([]);
          setFilteredBooks([]);
        }
      } else {
        setCurrentPage(1);
        setHasMore(true);
        
        let response;
        if (selectedExternalCategory) {
          response = await api.externalBooks.getByCategory(selectedExternalCategory, { page: 1, limit: 20 });
        } else if (searchQuery.trim()) {
          response = await api.externalBooks.search({ q: searchQuery.trim(), page: 1, limit: 20 });
        } else {
          response = await api.externalBooks.getTrending(20);
          if (!response.success || !response.data || response.data.length === 0) {
            response = await api.externalBooks.search({ q: 'fiction', page: 1, limit: 20 });
          }
        }

        if (response.success && response.data && response.data.length > 0) {
          const booksWithSource = response.data.map((book: Book) => ({
            ...book,
            source: (book.source || 'openlibrary') as 'openlibrary' | 'googlebooks',
            category: selectedExternalCategory || book.category,
          }));
          setExternalBooks(booksWithSource);
          setFilteredBooks(booksWithSource);
          setHasMore((response as any).pagination ? 1 < (response as any).pagination.pages : false);
        } else {
          setExternalBooks([]);
          setFilteredBooks([]);
          setHasMore(false);
        }
      }
    } catch (error: any) {
      console.error('Error loading books:', error);
      Alert.alert(t('common.error'), error.message || t('library.loadError'));
      setBooks([]);
      setFilteredBooks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, bookSource, selectedExternalCategory, t]);

  /**
   * تحميل فئات الكتب الخارجية
   */
  const loadExternalCategories = useCallback(async () => {
    try {
      const response = await api.externalBooks.getCategories();
      if (response.success && response.data) {
        setExternalCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading external categories:', error);
    }
  }, []);

  /**
   * إعادة تحميل البيانات
   */
  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    await loadBooks();
    setRefreshing(false);
  };

  /**
   * معالجة تغيير المصدر
   */
  const handleSourceChange = (source: BookSource) => {
    setBookSource(source);
    if (source === 'university') {
      setSelectedExternalCategory('');
    } else {
      setSelectedCategory('all');
    }
  };

  /**
   * معالجة طلب الاستعارة
   */
  const handleBorrow = async (bookId: string) => {
    try {
      Alert.alert(
        t('library.borrowRequest'),
        t('library.borrowConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'default',
            onPress: async () => {
              try {
                const response = await api.borrowings.create(bookId);
                if (response.success) {
                  Alert.alert(t('common.success'), t('library.borrowSuccess'));
                  await loadBooks();
                } else {
                  throw new Error((response as any).message || t('library.borrowError'));
                }
              } catch (error: any) {
                Alert.alert(t('common.error'), error.message || t('library.borrowError'));
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    }
  };

  /**
   * تحميل البيانات الأولية
   */
  useEffect(() => {
    const initializeData = async () => {
      await loadFeaturedBooks();
      await loadExternalCategories();
      await loadBooks();
    };
    initializeData();
  }, []);

  /**
   * فلترة الكتب محلياً (للكتب الجامعية فقط)
   */
  const filterBooks = useCallback((booksList: Book[], query: string, category: string) => {
    if (bookSource === 'external') return;

    let filtered = [...booksList];
    
    // فلترة حسب الفئة
    if (category !== 'all') {
      filtered = filtered.filter(book => book.category === category);
    }
    
    // فلترة حسب البحث
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery) ||
        (book.category && book.category.toLowerCase().includes(lowerQuery))
      );
    }
    
    // تطبيق فلاتر إضافية من Filter Modal
    if (activeFilters.format !== 'any') {
      // يمكن إضافة منطق للفلترة حسب النوع (ورقي/إلكتروني/صوتي)
      // حالياً لا يوجد حقل format في بيانات الكتاب، يمكن إضافته لاحقاً
    }
    
    // فلترة حسب الفئات المختارة من Filter Modal
    if (activeFilters.genres.length > 0) {
      filtered = filtered.filter(book => 
        activeFilters.genres.some(genre => {
          const bookCategory = book.category?.toLowerCase() || '';
          const genreLower = genre.toLowerCase();
          return bookCategory.includes(genreLower) || 
                 (language === 'ar' && genre === 'خيال' && bookCategory.includes('fiction')) ||
                 (language === 'ar' && genre === 'رومانسية' && bookCategory.includes('romance'));
        })
      );
    }
    
    // فلترة حسب التقييم الأدنى (إذا كان متوفراً في بيانات الكتاب)
    if (activeFilters.minRating > 0) {
      // يمكن إضافة منطق للفلترة حسب التقييم إذا كان متوفراً
    }
    
    setFilteredBooks(filtered);
  }, [bookSource, activeFilters, language]);

  /**
   * تطبيق الفلاتر
   */
  const handleApplyFilters = (filters: FilterOptions) => {
    setActiveFilters(filters);
    // للكتب الجامعية، الفلترة تتم محلياً
    if (bookSource === 'university' && books.length > 0) {
      // الفلترة ستحدث تلقائياً في useEffect
    } else {
      // للكتب الخارجية، إعادة تحميل من API
      loadBooks();
    }
  };

  /**
   * إعادة تعيين الفلاتر
   */
  const handleResetFilters = () => {
    setActiveFilters({
      format: 'any',
      genres: [],
      minRating: 0,
    });
    // إعادة تحميل الكتب بدون فلاتر
    loadBooks();
  };

  /**
   * تحميل الكتب عند تغيير الفلاتر
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBooks();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, bookSource, selectedExternalCategory, loadBooks]);

  /**
   * فلترة محلية للكتب الجامعية
   */
  useEffect(() => {
    if (bookSource === 'university') {
      filterBooks(books, searchQuery, selectedCategory);
    }
  }, [searchQuery, selectedCategory, books, filterBooks, bookSource, activeFilters]);

  /**
   * فتح النسخة الرقمية من الكتاب
   */
  const handleDigitalRead = async (book: Book) => {
    if (book.preview_link || book.external_id) {
      router.push({
        pathname: `/book/${book._id}` as any,
        params: {
          source: book.source || 'openlibrary',
          external_id: book.external_id,
        },
      });
    } else {
      Alert.alert(t('common.error'), t('library.noPreview') || 'لا تتوفر معاينة لهذا الكتاب');
    }
  };

  // Render Book Card Component
  const renderBookCard = ({ item }: { item: Book }) => {
    const imageUrl = getBookImageUrl(item);
    
    return (
      <TouchableOpacity 
        style={[
          styles.bookCard,
          viewMode === 'grid' ? styles.bookCardGrid : styles.bookCardList
        ]}
        onPress={() => {
          if (item.source === 'university') {
            router.push(`/book/${item._id}` as any);
          } else {
            router.push({
              pathname: `/book/${item._id}` as any,
              params: {
                source: item.source || 'openlibrary',
                external_id: item.external_id,
              },
            });
          }
        }}
        activeOpacity={0.8}
      >
        <View style={[
          styles.bookImageContainer,
          viewMode === 'list' && styles.bookImageContainerList
        ]}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.bookImage,
                viewMode === 'grid' ? styles.bookImageGrid : styles.bookImageList
              ]}
              resizeMode="cover"
              onError={(error) => {
                console.log('Image load error:', error.nativeEvent.error);
              }}
            />
          ) : (
            <View style={[
              styles.bookImagePlaceholder,
              viewMode === 'grid' ? styles.bookImagePlaceholderGrid : styles.bookImagePlaceholderList
            ]}>
              <Ionicons name="book-outline" size={viewMode === 'grid' ? 32 : 24} color="#64748b" />
            </View>
          )}
          {item.source === 'university' && (
            <View style={styles.universityBadge}>
              <Text style={styles.badgeText}>جامعة</Text>
            </View>
          )}
        </View>
        
        <View style={[
          styles.bookInfo,
          viewMode === 'list' && styles.bookInfoList
        ]}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.author}
          </Text>
          {item.category && (
            <Text style={styles.bookCategory} numberOfLines={1}>
              {item.category}
            </Text>
          )}
          
          <View style={styles.bookActions}>
            {item.source === 'university' ? (
              <TouchableOpacity 
                style={styles.borrowButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleBorrow(item._id);
                }}
              >
                <Text style={styles.borrowButtonText}>
                  {t('library.borrow')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.readButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDigitalRead(item);
                }}
              >
                <Text style={styles.readButtonText}>
                  {t('library.read')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Category Item
  const renderCategoryItem = ({ item }: { item: any }) => {
    const isSelected = bookSource === 'university' 
      ? selectedCategory === item.id 
      : selectedExternalCategory === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isSelected && styles.categoryItemSelected
        ]}
        onPress={() => {
          if (bookSource === 'university') {
            setSelectedCategory(item.id);
          } else {
            setSelectedExternalCategory(item.id);
          }
        }}
      >
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <Text style={[
          styles.categoryName,
          isSelected && styles.categoryNameSelected
        ]} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render Featured Book
  const renderFeaturedBook = ({ item }: { item: Book }) => (
    <TouchableOpacity 
      style={styles.featuredBookCard}
      onPress={() => router.push(`/book/${item._id}`)}
    >
      <View style={styles.featuredBookImage}>
        <Ionicons name="book-outline" size={48} color="#ffffff" />
      </View>
      <View style={styles.featuredBookInfo}>
        <Text style={styles.featuredBookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.featuredBookAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        <TouchableOpacity style={styles.featuredBookButton}>
          <Text style={styles.featuredBookButtonText}>
            {t('library.explore')}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('library.title')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.viewModeButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons 
                name={viewMode === 'grid' ? 'list' : 'grid'} 
                size={24} 
                color="#64748b" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options-outline" size={24} color="#64748b" />
              {Object.values(activeFilters).some(filter => 
                Array.isArray(filter) ? filter.length > 0 : filter !== 'any' && filter !== 0
              ) && <View style={styles.filterBadge} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('library.searchPlaceholder')}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Source Toggle */}
        <View style={styles.sourceToggle}>
          <TouchableOpacity
            style={[
              styles.sourceButton,
              bookSource === 'university' && styles.sourceButtonActive
            ]}
            onPress={() => handleSourceChange('university')}
          >
            <Text style={[
              styles.sourceButtonText,
              bookSource === 'university' && styles.sourceButtonTextActive
            ]}>
              {t('library.universityBooks')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sourceButton,
              bookSource === 'external' && styles.sourceButtonActive
            ]}
            onPress={() => handleSourceChange('external')}
          >
            <Text style={[
              styles.sourceButtonText,
              bookSource === 'external' && styles.sourceButtonTextActive
            ]}>
              {t('library.externalBooks')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Books Section */}
        {featuredBooks.length > 0 && bookSource === 'university' && !searchQuery && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('library.featured')}</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredBooks}
              renderItem={renderFeaturedBook}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredBooksList}
            />
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('library.categories')}</Text>
          <FlatList
            data={displayCategories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Books Section */}
        <View style={styles.section}>
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              {language === 'ar' ? 'عرض' : 'Showing'} {filteredBooks.length}{' '}
              {language === 'ar' ? 'كتاب' : 'books'}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e40af" />
              <Text style={styles.loadingText}>{t('library.loading')}</Text>
            </View>
          ) : filteredBooks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyStateTitle}>
                {t('library.noBooksFound')}
              </Text>
              <Text style={styles.emptyStateDescription}>
                {t('library.tryChangingFilters')}
              </Text>
            </View>
          ) : viewMode === 'grid' ? (
            <View style={styles.gridContainer}>
              {filteredBooks.map((book, index) => (
                <View 
                  key={book._id} 
                  style={[
                    styles.gridItem,
                    index % 2 === 0 && styles.gridItemLeft,
                    index % 2 === 1 && styles.gridItemRight
                  ]}
                >
                  {renderBookCard({ item: book })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredBooks.map((book) => (
                <View key={book._id}>
                  {renderBookCard({ item: book })}
                </View>
              ))}
            </View>
          )}

          {/* Load More */}
          {loadingMore && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#64748b" />
              <Text style={styles.loadingMoreText}>
                {t('library.loadingMore')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <BookFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  viewModeButton: {
    padding: 8,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  sourceToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  sourceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sourceButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sourceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  sourceButtonTextActive: {
    color: '#1e40af',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  featuredBooksList: {
    gap: 16,
  },
  featuredBookCard: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    borderRadius: 16,
    padding: 16,
    width: screenWidth * 0.8,
    marginRight: 12,
  },
  featuredBookImage: {
    width: 80,
    height: 100,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredBookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  featuredBookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  featuredBookAuthor: {
    fontSize: 14,
    color: '#dbeafe',
    marginBottom: 12,
  },
  featuredBookButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  featuredBookButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    minWidth: 80,
  },
  categoryItemSelected: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#ffffff',
  },
  resultsInfo: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
  },
  resultsText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: (screenWidth - 48) / 2,
  },
  gridItemLeft: {
    marginRight: 0,
  },
  gridItemRight: {
    marginLeft: 0,
  },
  listContainer: {
    gap: 12,
  },
  bookCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  bookCardGrid: {
    height: 320,
  },
  bookCardList: {
    flexDirection: 'row',
    height: 140,
  },
  bookImageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  bookImageContainerList: {
    width: 100,
  },
  bookImage: {
    width: '100%',
    backgroundColor: '#f8fafc',
  },
  bookImageGrid: {
    height: 200,
    width: '100%',
  },
  bookImageList: {
    width: 100,
    height: '100%',
  },
  bookImagePlaceholder: {
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bookImagePlaceholderGrid: {
    height: 200,
    width: '100%',
  },
  bookImagePlaceholderList: {
    width: 100,
    height: '100%',
    borderBottomWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  universityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  bookInfo: {
    padding: 12,
    flex: 1,
  },
  bookInfoList: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  bookCategory: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 8,
  },
  bookActions: {
    marginTop: 'auto',
  },
  borrowButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  borrowButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  readButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  readButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#64748b',
  },
});