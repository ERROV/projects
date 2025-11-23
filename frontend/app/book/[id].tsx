/**
 * صفحة تفاصيل الكتاب
 * تعرض تفاصيل الكتاب مع إمكانية القراءة والمراجعات
 */

import BookActions from '@/components/book/BookActions';
import BookDescription from '@/components/book/BookDescription';
import BookHeader from '@/components/book/BookHeader';
import BookInfoSection from '@/components/book/BookInfoSection';
import ReviewCard, { Review } from '@/components/book/ReviewCard';
import ReviewForm from '@/components/book/ReviewForm';
import WebViewModal from '@/components/book/WebViewModal';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { Book } from '@/types';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { MessageSquare } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BookDetailsScreen() {
  const { id, source, external_id } = useLocalSearchParams<{
    id: string;
    source?: string;
    external_id?: string;
  }>();
  const router = useRouter();
  const { t, language } = useLanguage();

  // State Management
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [extractingPDF, setExtractingPDF] = useState(false);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState<string>('');
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkPage, setBookmarkPage] = useState<number | null>(null);

  const isExternalBook = source === 'openlibrary' || source === 'googlebooks';

  /**
   * تحميل بيانات الكتاب والمراجعات
   */
  const loadBookData = useCallback(async () => {
    try {
      setLoading(true);

      if (isExternalBook) {
        // جلب بيانات من API الخارجي
        if (source === 'openlibrary' && external_id) {
          try {
            const response = await fetch(`https://openlibrary.org${external_id}.json`);
            const data = await response.json();

            setBook({
              _id: id,
              title: data.title || 'Untitled',
              author: data.authors?.[0]?.name || 'Unknown Author',
              category: data.subjects?.[0] || 'General',
              description: data.description?.value || data.description || '',
              publish_year: data.first_publish_year || undefined,
              cover_url: data.covers?.[0]
                ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
                : undefined,
              source: 'openlibrary',
              external_id: external_id,
              subjects: data.subjects || [],
            });
          } catch (error) {
            console.error('Error loading Open Library book:', error);
            Alert.alert(t('common.error'), 'فشل تحميل بيانات الكتاب');
            router.back();
            return;
          }
        } else if (source === 'googlebooks' && external_id) {
          try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${external_id}`);
            const data = await response.json();
            const volumeInfo = data.volumeInfo || {};

            setBook({
              _id: id,
              title: volumeInfo.title || 'Untitled',
              author: volumeInfo.authors?.join(', ') || 'Unknown Author',
              category: volumeInfo.categories?.[0] || 'General',
              description: volumeInfo.description || '',
              isbn: volumeInfo.industryIdentifiers?.[0]?.identifier || undefined,
              publish_year: volumeInfo.publishedDate
                ? new Date(volumeInfo.publishedDate).getFullYear()
                : undefined,
              cover_url:
                volumeInfo.imageLinks?.large ||
                volumeInfo.imageLinks?.thumbnail?.replace('zoom=1', 'zoom=3') ||
                undefined,
              page_count: volumeInfo.pageCount || undefined,
              language: volumeInfo.language || 'en',
              source: 'googlebooks',
              external_id: external_id,
              preview_link: volumeInfo.previewLink || undefined,
              subjects: volumeInfo.categories || [],
            });
          } catch (error) {
            console.error('Error loading Google Books book:', error);
            Alert.alert(t('common.error'), 'فشل تحميل بيانات الكتاب');
            router.back();
            return;
          }
        }
      } else {
        // جلب بيانات الكتاب من API الجامعة
        const bookResponse = await api.books.getById(id);
        if (bookResponse.success && bookResponse.data) {
          setBook(bookResponse.data);
        } else {
          Alert.alert(t('common.error'), 'الكتاب غير موجود');
          router.back();
          return;
        }

        // جلب المراجعات (فقط لكتب الجامعة)
        const reviewsResponse = await api.bookReviews.getByBookId(id);
        if (reviewsResponse.success) {
          setReviews(reviewsResponse.data || []);
          setAverageRating((reviewsResponse as any).averageRating || 0);

          const currentUserReview = reviewsResponse.data?.find((r: Review) => r.user_id?._id);
          if (currentUserReview) {
            setUserReview(currentUserReview);
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading book data:', error);
      Alert.alert(t('common.error'), error.message || 'فشل تحميل بيانات الكتاب');
    } finally {
      setLoading(false);
    }
  }, [id, router, isExternalBook, source, external_id, t]);

  useEffect(() => {
    loadBookData();
  }, [loadBookData]);

  /**
   * تحميل PDF وحفظه محلياً
   */
  const downloadPDF = async (url: string) => {
    try {
      setDownloadingPDF(true);
      const fileName = `${book?._id || 'book'}.pdf`;
      const documentDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
      const fileUri = `${documentDir}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        setPdfUri(downloadResult.uri);
        Alert.alert(t('common.success'), 'تم تحميل الكتاب بنجاح');
        return downloadResult.uri;
      } else {
        throw new Error('فشل تحميل الملف');
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      Alert.alert(t('common.error'), error.message || 'فشل تحميل الكتاب');
      return null;
    } finally {
      setDownloadingPDF(false);
    }
  };

  /**
   * فتح الكتاب للقراءة
   */
  const handleReadBook = async () => {
    if (isExternalBook) {
      if (book?.preview_link) {
        setWebViewUrl(book.preview_link);
        setShowWebView(true);
      } else if (book?.external_id) {
        if (source === 'googlebooks') {
          setWebViewUrl(`https://books.google.com/books?id=${book.external_id}`);
        } else if (source === 'openlibrary') {
          setWebViewUrl(`https://openlibrary.org${book.external_id}`);
        }
        setShowWebView(true);
      } else {
        Alert.alert('عذراً', 'لا تتوفر معاينة لهذا الكتاب');
      }
    } else if (book?.digital_version_url) {
      const pdfPath = await downloadPDF(book.digital_version_url);
      if (pdfPath) {
        setWebViewUrl(pdfPath);
        setShowWebView(true);
      }
    } else {
      Alert.alert('عذراً', 'لا تتوفر نسخة رقمية لهذا الكتاب');
    }
  };

  /**
   * قراءة الصفحة الحالية صوتياً
   */
  const readCurrentPage = async () => {
    if (!pdfText) {
      Alert.alert('عذراً', 'لا يوجد نص للقراءة');
      return;
    }

    const wordsPerPage = 250;
    const words = pdfText.split(' ');
    const startIndex = (currentPage - 1) * wordsPerPage;
    const endIndex = startIndex + wordsPerPage;
    const pageText = words.slice(startIndex, endIndex).join(' ');

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      Speech.speak(pageText, {
        language: 'ar-SA',
        pitch: 1.0,
        rate: 0.85,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          Alert.alert(t('common.error'), 'فشل تشغيل القراءة الصوتية');
        },
      });
      setIsSpeaking(true);
    }
  };

  /**
   * حفظ bookmark للصفحة الحالية
   */
  const saveBookmark = () => {
    setBookmarkPage(currentPage);
    Alert.alert(t('common.success'), `تم حفظ الإشارة المرجعية للصفحة ${currentPage}`);
  };

  /**
   * استخراج النص من PDF
   */
  const extractPDFText = async () => {
    if (!book?.digital_version_url) {
      Alert.alert(t('common.error'), 'لا يوجد ملف PDF متاح');
      return;
    }

    try {
      setExtractingPDF(true);
      const response = await api.pdf.extractText(book.digital_version_url);

      if (response.success && response.data?.text) {
        setPdfText(response.data.text);
        return response.data.text;
      } else {
        throw new Error('فشل استخراج النص من PDF');
      }
    } catch (error: any) {
      console.error('Error extracting PDF text:', error);
      Alert.alert(t('common.error'), error.message || 'فشل استخراج النص من PDF');
      return null;
    } finally {
      setExtractingPDF(false);
    }
  };

  /**
   * بدء/إيقاف القراءة الصوتية
   */
  const toggleSpeech = async () => {
    if (!book) return;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      let textToSpeak = '';

      if (book.digital_version_url) {
        if (!pdfText) {
          const extractedText = await extractPDFText();
          if (extractedText) {
            textToSpeak = extractedText;
          }
        } else {
          textToSpeak = pdfText;
        }
      }

      if (!textToSpeak) {
        textToSpeak = `
          ${book.title}
          للكاتب ${book.author}
          ${book.description || 'لا يوجد وصف متاح'}
          الفئة: ${book.category}
          ${(book.available_copies ?? 0) > 0 ? `متاح ${book.available_copies} نسخة` : 'غير متاح'}
        `.trim();
      }

      if (textToSpeak.length > 5000) {
        textToSpeak = textToSpeak.substring(0, 5000) + '...';
      }

      Speech.speak(textToSpeak, {
        language: 'ar-SA',
        pitch: 1.0,
        rate: 0.85,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          Alert.alert(t('common.error'), 'فشل تشغيل القراءة الصوتية');
        },
      });
      setIsSpeaking(true);
    }
  };

  /**
   * إرسال مراجعة جديدة
   */
  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      Alert.alert(t('common.error'), 'يرجى إدخال تعليق');
      return;
    }

    try {
      setSubmittingReview(true);

      if (userReview) {
        const response = await api.bookReviews.update(
          userReview._id,
          reviewRating,
          reviewComment
        );
        if (response.success) {
          Alert.alert(t('common.success'), 'تم تحديث المراجعة بنجاح');
          setShowReviewForm(false);
          setReviewComment('');
          loadBookData();
        }
      } else {
        const response = await api.bookReviews.create(id, reviewRating, reviewComment);
        if (response.success) {
          Alert.alert(t('common.success'), 'تم إضافة المراجعة بنجاح');
          setShowReviewForm(false);
          setReviewComment('');
          setReviewRating(5);
          loadBookData();
        }
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Alert.alert(t('common.error'), error.message || 'فشل إرسال المراجعة');
    } finally {
      setSubmittingReview(false);
    }
  };

  /**
   * حذف المراجعة
   */
  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert(
      'حذف المراجعة',
      'هل أنت متأكد من حذف هذه المراجعة؟',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.bookReviews.delete(reviewId);
              if (response.success) {
                Alert.alert(t('common.success'), 'تم حذف المراجعة بنجاح');
                loadBookData();
              }
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || 'فشل حذف المراجعة');
            }
          },
        },
      ]
    );
  };

  /**
   * إغلاق WebView
   */
  const handleCloseWebView = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }
    setShowWebView(false);
  };

  if (loading) {
    return <LoadingSpinner fullScreen={true} message="جاري التحميل..." />;
  }

  if (!book) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Book Header */}
        <BookHeader
          book={book}
          averageRating={averageRating}
          reviewsCount={reviews.length}
          isExternalBook={isExternalBook}
          source={source}
        />

        {/* Description */}
        {book.description && <BookDescription description={book.description} />}

        {/* Additional Info */}
        <BookInfoSection book={book} isExternalBook={isExternalBook} />

        {/* Actions */}
        <BookActions
          isExternalBook={isExternalBook}
          downloadingPDF={downloadingPDF}
          isSpeaking={isSpeaking}
          extractingPDF={extractingPDF}
          hasPDF={!!book.digital_version_url}
          pdfText={pdfText}
          onReadBook={handleReadBook}
          onToggleSpeech={toggleSpeech}
        />

        {/* Reviews Section - فقط لكتب الجامعة */}
        {!isExternalBook && (
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.reviewsTitle}>
                {language === 'ar' ? 'المراجعات' : 'Reviews'} ({reviews.length})
              </Text>
              {!userReview && (
                <TouchableOpacity
                  style={styles.addReviewButton}
                  onPress={() => setShowReviewForm(true)}
                >
                  <MessageSquare size={20} color="#1e40af" />
                  <Text style={styles.addReviewText}>
                    {language === 'ar' ? 'إضافة مراجعة' : 'Add Review'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Review Form */}
            {showReviewForm && (
              <ReviewForm
                rating={reviewRating}
                comment={reviewComment}
                isEditing={!!userReview}
                submitting={submittingReview}
                onRatingChange={setReviewRating}
                onCommentChange={setReviewComment}
                onSubmit={handleSubmitReview}
                onCancel={() => {
                  setShowReviewForm(false);
                  setReviewComment('');
                  setReviewRating(5);
                }}
              />
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={language === 'ar' ? 'لا توجد مراجعات بعد' : 'No reviews yet'}
                message={language === 'ar' ? 'كن أول من يضيف مراجعة لهذا الكتاب' : 'Be the first to add a review for this book'}
              />
            ) : (
              reviews.map((review) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  isOwnReview={userReview?._id === review._id}
                  onDelete={handleDeleteReview}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* WebView Modal */}
      <WebViewModal
        visible={showWebView}
        url={webViewUrl}
        title="قراءة الكتاب"
        hasPDF={!!pdfUri}
        isSpeaking={isSpeaking}
        bookmarkPage={bookmarkPage}
        onClose={handleCloseWebView}
        onSaveBookmark={saveBookmark}
        onReadPage={readCurrentPage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  reviewsSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addReviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
});
