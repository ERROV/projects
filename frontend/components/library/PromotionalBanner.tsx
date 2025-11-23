/**
 * مكون البانر الترويجي (Promotional Banner)
 * يعرض بانرات ترويجية قابلة للتمرير
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;

interface Banner {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  backgroundColor: string;
  imageUrl?: string;
  onPress?: () => void;
}

interface PromotionalBannerProps {
  banners?: Banner[];
}

const defaultBannersAr: Banner[] = [
  {
    id: '1',
    title: 'المكتبة إلى غرفة المعيشة',
    description: 'الوصول إلى آلاف الكتب من راحة منزلك',
    buttonText: 'اطلب الآن',
    backgroundColor: '#7c3aed',
  },
  {
    id: '2',
    title: 'كتب',
    description: 'استمتع بكتبك المفضلة مباشرة',
    buttonText: 'تتبع',
    backgroundColor: '#1e40af',
  },
];

const defaultBannersEn: Banner[] = [
  {
    id: '1',
    title: 'Library to Your Living Room',
    description: 'Access thousands of books from the comfort of your home',
    buttonText: 'Order Now',
    backgroundColor: '#7c3aed',
  },
  {
    id: '2',
    title: 'Books',
    description: 'Enjoy your favorite books straight',
    buttonText: 'Track',
    backgroundColor: '#1e40af',
  },
];

export default function PromotionalBanner({ banners }: PromotionalBannerProps) {
  const { language } = useLanguage();
  const defaultBanners = language === 'ar' ? defaultBannersAr : defaultBannersEn;
  const displayBanners = banners || defaultBanners;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {displayBanners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            style={[styles.banner, { backgroundColor: banner.backgroundColor }]}
            onPress={banner.onPress}
            activeOpacity={0.9}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerDescription}>{banner.description}</Text>
                <TouchableOpacity style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>{banner.buttonText}</Text>
                </TouchableOpacity>
              </View>
              {banner.imageUrl && (
                <Image source={{ uri: banner.imageUrl }} style={styles.bannerImage} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  scrollView: {
    marginHorizontal: 16,
  },
  content: {
    gap: 16,
  },
  banner: {
    width: BANNER_WIDTH,
    borderRadius: 20,
    padding: 24,
    marginRight: 16,
    minHeight: 180,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    flex: 1,
    gap: 12,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  bannerDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: 16,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#14b8a6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bannerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  bannerImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
});

