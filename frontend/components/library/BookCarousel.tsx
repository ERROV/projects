/**
 * مكون Carousel للكتب المميزة (Featured Books Carousel)
 * يعرض الكتب المميزة في شكل carousel تلقائي
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, NativeScrollEvent, NativeSyntheticEvent, Dimensions } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { Book } from '@/types';
import { getBookImageUrl } from '@/utils/imageUtils';
import { useRouter } from 'expo-router';

interface BookCarouselProps {
  books: Book[];
  title: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - 32;

export default function BookCarousel({ books, title }: BookCarouselProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Carousel تلقائي
   */
  useEffect(() => {
    if (books.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % books.length;
          carouselRef.current?.scrollTo({
            x: next * CAROUSEL_ITEM_WIDTH,
            animated: true,
          });
          return next;
        });
      }, 4000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [books.length]);

  /**
   * معالجة تمرير Carousel
   */
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CAROUSEL_ITEM_WIDTH);
    setCurrentIndex(index);
  };

  if (books.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.carouselWrapper}>
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.carousel}
        >
          {books.map((book) => {
            const imageUrl = getBookImageUrl(book);
            return (
              <TouchableOpacity
                key={book._id}
                style={[styles.carouselItem, { width: CAROUSEL_ITEM_WIDTH }]}
                onPress={() => router.push(`/book/${book._id}` as any)}
                activeOpacity={0.9}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.carouselImage} resizeMode="cover" />
                ) : (
                  <View style={styles.carouselPlaceholder}>
                    <BookOpen size={48} color="#64748b" />
                  </View>
                )}
                <View style={styles.carouselOverlay}>
                  <Text style={styles.carouselTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={styles.carouselAuthor} numberOfLines={1}>
                    {book.author}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* مؤشرات */}
        {books.length > 1 && (
          <View style={styles.indicators}>
            {books.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentIndex === index && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  carouselWrapper: {
    marginHorizontal: 16,
  },
  carousel: {
    marginBottom: 12,
  },
  carouselItem: {
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  carouselImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#f8fafc',
  },
  carouselPlaceholder: {
    width: '100%',
    height: 320,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 20,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  carouselAuthor: {
    fontSize: 16,
    color: '#e5e7eb',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  indicatorActive: {
    backgroundColor: '#1e40af',
    width: 24,
  },
});

