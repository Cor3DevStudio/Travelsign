import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';

type POI = {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: string;
  distance: string;
  image: string;
  lat?: number;
  lng?: number;
};

const SAMPLE_PLACES: POI[] = [
  {
    id: '1',
    name: 'Asakusa Temple',
    category: 'Religious Site',
    description: "One of Tokyo's most famous temples, featuring the iconic Kaminarimon gate and a lively shopping street.",
    rating: '4.8',
    distance: '0.4 km',
    image: 'https://images.unsplash.com/photo-1570521462033-3015e76e7432?w=400&q=80',
  },
  {
    id: '2',
    name: 'Central Market',
    category: 'Market',
    description: 'A bustling local market offering fresh produce, street food, and handcrafted souvenirs.',
    rating: '4.5',
    distance: '0.8 km',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&q=80',
  },
  {
    id: '3',
    name: 'Riverside Walk',
    category: 'Park',
    description: 'A scenic waterfront promenade perfect for a leisurely stroll, with great views of the city skyline.',
    rating: '4.6',
    distance: '1.2 km',
    image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&q=80',
  },
  {
    id: '4',
    name: 'Old Town Square',
    category: 'Historical',
    description: 'A charming historic plaza surrounded by colorful colonial buildings, cafes, and local art galleries.',
    rating: '4.7',
    distance: '1.6 km',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80',
  },
  {
    id: '5',
    name: 'Skyline Viewpoint',
    category: 'Viewpoint',
    description: 'The best panoramic spot in the city offering breathtaking 360° views, especially at sunset.',
    rating: '4.9',
    distance: '2.1 km',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80',
  },
];

type SuggestedPOIProps = {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  pois?: POI[];
};

export function SuggestedPOI({ onNavigate, pois }: SuggestedPOIProps) {
  const displayPois = (pois && pois.length > 0) ? pois : SAMPLE_PLACES;

  const handlePOIClick = (poi: POI) => {
    onNavigate?.('/poi-details', { poi });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suggested Places</Text>
        <TouchableOpacity onPress={() => onNavigate?.('/poi-list', { pois: displayPois })}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayPois.map((poi) => (
          <TouchableOpacity
            key={poi.id}
            style={styles.poiCard}
            onPress={() => handlePOIClick(poi)}
            activeOpacity={0.85}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: poi.image }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{poi.category}</Text>
              </View>
            </View>

            <View style={styles.content}>
              <Text style={styles.poiName} numberOfLines={1}>
                {poi.name}
              </Text>
              <Text style={styles.poiDescription} numberOfLines={2}>
                {poi.description}
              </Text>
              <View style={styles.footer}>
                <View style={styles.ratingContainer}>
                  <Feather name="star" size={13} color={theme.colors.accent} />
                  <Text style={styles.rating}>{poi.rating}</Text>
                </View>
                <View style={styles.distanceContainer}>
                  <Feather name="map-pin" size={12} color={theme.colors.textSecondary} />
                  <Text style={styles.distance}>{poi.distance}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl + theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 22,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  seeAll: {
    fontFamily: theme.typography.semibold,
    fontSize: 15,
    color: theme.colors.primary,
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingRight: theme.spacing.lg,
  },
  poiCard: {
    width: 240,
    backgroundColor: theme.colors.card,
    borderRadius: theme.shapes.cardRadius,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: 'transparent',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontFamily: theme.typography.medium,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  content: {
    padding: theme.spacing.md,
  },
  poiName: {
    fontFamily: theme.typography.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  poiDescription: {
    fontFamily: theme.typography.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
    marginBottom: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rating: {
    fontFamily: theme.typography.bold,
    fontSize: 12,
    color: '#92400E',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distance: {
    fontFamily: theme.typography.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
