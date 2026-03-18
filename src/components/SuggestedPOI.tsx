import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

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

/** Sample places — images match category (plaza, church, capitol, etc.), not generic resort photos */
const SAMPLE_PLACES: POI[] = [
  {
    id: '1',
    name: 'Balanga City Plaza',
    category: 'Landmark',
    description:
      'The heart of Balanga City with a fountain, gardens, and events. A great starting point for exploring the capital of Bataan.',
    rating: '4.6',
    distance: '—',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80',
    lat: 14.6764,
    lng: 120.5361,
  },
  {
    id: '2',
    name: 'Balanga Cathedral',
    category: 'Religious Site',
    description:
      'Diocesan Shrine of the Divine Mercy. A notable church and pilgrimage site in Bataan.',
    rating: '4.7',
    distance: '—',
    image: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=600&q=80',
    lat: 14.6759,
    lng: 120.5354,
  },
  {
    id: '3',
    name: 'Bataan Capitol Complex',
    category: 'Government',
    description:
      'Provincial capitol and park in Balanga. Green spaces and government buildings in the capital.',
    rating: '4.4',
    distance: '—',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
    lat: 14.6772,
    lng: 120.537,
  },
  {
    id: '4',
    name: 'Pilar-Balanga Road Scenic Stretch',
    category: 'Viewpoint',
    description:
      'Scenic road between Pilar and Balanga with views of the countryside and Mount Samat in the distance.',
    rating: '4.5',
    distance: '—',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80',
    lat: 14.65,
    lng: 120.52,
  },
  {
    id: '5',
    name: 'Balanga Public Market',
    category: 'Market',
    description:
      'Local market for fresh produce, snacks, and souvenirs. Experience everyday Balanga and Bataan flavors.',
    rating: '4.3',
    distance: '—',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
    lat: 14.6778,
    lng: 120.5345,
  },
];

type SuggestedPOIProps = {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  pois?: POI[];
};

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function SuggestedPOI({ onNavigate, pois }: SuggestedPOIProps) {
  const { t } = useLanguage();
  const { theme: activeTheme } = useTheme();
  const raw = pois && pois.length > 0 ? pois : SAMPLE_PLACES;
  const displayPois = uniqueById(raw);

  const handlePOIClick = (poi: POI) => {
    onNavigate?.('/poi-details', {
      poi: { ...poi, image: poi.image },
      detailsReturnRoute: '/dashboard',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: activeTheme.colors.textPrimary }]}>{t.suggestedPlaces}</Text>
        <TouchableOpacity
          onPress={() =>
            onNavigate?.('/poi-list', {
              pois: displayPois,
              listReturnRoute: '/dashboard',
              browseSuggested: true,
            })
          }
        >
          <Text style={[styles.seeAll, { color: activeTheme.colors.primary }]}>{t.seeAll}</Text>
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
            style={[
              styles.poiCard,
              { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border },
            ]}
            onPress={() => handlePOIClick(poi)}
            activeOpacity={0.85}
          >
            <View style={styles.imageContainer}>
              <Image source={{ uri: poi.image }} style={styles.image} resizeMode="cover" />
              <View style={styles.imageOverlay} />
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{poi.category}</Text>
              </View>
            </View>

            <View style={styles.content}>
              <Text style={[styles.poiName, { color: activeTheme.colors.textPrimary }]} numberOfLines={1}>
                {poi.name}
              </Text>
              <Text
                style={[styles.poiDescription, { color: activeTheme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {poi.description}
              </Text>
              <View style={styles.footer}>
                <View style={[styles.ratingContainer, { backgroundColor: activeTheme.colors.cardLight }]}>
                  <Feather name="star" size={13} color={activeTheme.colors.accent} />
                  <Text style={[styles.rating, { color: activeTheme.colors.textPrimary }]}>{poi.rating}</Text>
                </View>
                <View style={styles.distanceContainer}>
                  <Feather name="map-pin" size={12} color={activeTheme.colors.textSecondary} />
                  <Text style={[styles.distance, { color: activeTheme.colors.textSecondary }]}>{poi.distance}</Text>
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
    backgroundColor: 'transparent',
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
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rating: {
    fontFamily: theme.typography.bold,
    fontSize: 12,
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
