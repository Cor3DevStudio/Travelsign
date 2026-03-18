import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { getCurrentLocation } from '../services/location';
import { fetchNearbyPlaces } from '../services/nearby';

type POI = {
  id: string;
  name: string;
  category?: string;
  distanceMeters?: number;
  lat?: number;
  lng?: number;
};

type POIListScreenProps = {
  onNavigate: (route: string, params?: Record<string, any>) => void;
  pois: POI[];
  searchQuery?: string;
  captureLocation?: {
    lat: number;
    lng: number;
  };
  returnToTranslationParams?: Record<string, unknown>;
  listReturnRoute?: string;
  /** Dashboard "Suggested places" browse — do not replace list with nearby API */
  browseSuggested?: boolean;
};

export const POIListScreen: React.FC<POIListScreenProps> = ({
  onNavigate,
  pois,
  searchQuery,
  captureLocation,
  returnToTranslationParams,
  listReturnRoute,
  browseSuggested = false,
}) => {
  const { theme: activeTheme } = useTheme();
  const [effectiveLocation, setEffectiveLocation] = useState(captureLocation ?? null);
  const [nearbyPois, setNearbyPois] = useState<POI[]>(pois && pois.length ? pois : []);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Fallback: if no captureLocation was passed (e.g. location was null when scanning),
  // try to get the current location here so we can still show a map.
  useEffect(() => {
    if (captureLocation || effectiveLocation) return;
    (async () => {
      const loc = await getCurrentLocation();
      if (loc) {
        setEffectiveLocation(loc);
      }
    })();
  }, [captureLocation, effectiveLocation]);

  useEffect(() => {
    if (!effectiveLocation || browseSuggested) return;

    (async () => {
      try {
        setLoadingNearby(true);
        const places = await fetchNearbyPlaces(
          effectiveLocation.lat,
          effectiveLocation.lng,
          5000
        );
        const mapped: POI[] = places.map((p, idx) => ({
          id: p.id || String(idx),
          name: p.name,
          category: p.category || 'Market',
          lat: p.lat,
          lng: p.lng,
        }));
        setNearbyPois(mapped);
      } catch (err) {
        console.warn('Failed to load nearby places', err);
      } finally {
        setLoadingNearby(false);
      }
    })();
  }, [effectiveLocation, browseSuggested]);
  const data =
    nearbyPois && nearbyPois.length > 0
      ? nearbyPois
      : [
          {
            id: 'placeholder-1',
            name: 'No nearby places found',
            category: 'Info',
          },
        ];

  const listSnapshotParams = () => ({
    pois: browseSuggested ? pois : nearbyPois.length ? nearbyPois : pois,
    location: effectiveLocation,
    searchQuery,
    returnToTranslationParams,
    listReturnRoute,
    browseSuggested,
  });

  const handlePressPOI = (item: POI) => {
    onNavigate('/poi-details', {
      poi: item,
      detailsReturnRoute: '/poi-list',
      detailsReturnParams: listSnapshotParams(),
    });
  };

  const handleListBack = () => {
    if (returnToTranslationParams) {
      onNavigate('/translation-result', returnToTranslationParams as any);
    } else {
      onNavigate(listReturnRoute || '/dashboard');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: activeTheme.colors.backgroundLight }]}
          onPress={handleListBack}
        >
          <Feather name="arrow-left" size={24} color={activeTheme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTheme.colors.textPrimary }]}>Nearby places</Text>
        <View style={styles.headerRight} />
      </View>

      {effectiveLocation && (
        <>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: effectiveLocation.lat,
                longitude: effectiveLocation.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
              zoomEnabled
              scrollEnabled
              rotateEnabled
              pitchEnabled
            >
              {/* Pin for capture/user location */}
              <Marker
                coordinate={{
                  latitude: effectiveLocation.lat,
                  longitude: effectiveLocation.lng,
                }}
                title="You are here"
                description="Location where you scanned the sign"
              />

              {/* Pins for nearby markets/places */}
              {nearbyPois
                .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
                .map(p => (
                  <Marker
                    key={p.id}
                    coordinate={{ latitude: p.lat!, longitude: p.lng! }}
                    title={p.name}
                    description={p.category || 'Market'}
                    pinColor={activeTheme.colors.primary}
                  />
                ))}
            </MapView>
          </View>
          <Text style={[styles.locationHint, { color: activeTheme.colors.textSecondary }]}>
            Based on where you captured the sign:{" "}
            {effectiveLocation.lat.toFixed(4)}, {effectiveLocation.lng.toFixed(4)}
          </Text>
        </>
      )}

      {searchQuery ? (
        <Text style={[styles.subtitle, { color: activeTheme.colors.textSecondary }]}>
          Results related to "{searchQuery}"
        </Text>
      ) : null}

      {loadingNearby ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={activeTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: activeTheme.colors.textSecondary }]}>Loading nearby places…</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: activeTheme.colors.border }]} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handlePressPOI(item)}
            >
              <View style={styles.itemIcon}>
                <Feather name="map-pin" size={20} color={activeTheme.colors.primary} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={[styles.itemTitle, { color: activeTheme.colors.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.itemSubtitle, { color: activeTheme.colors.textSecondary }]}>
                  {item.category || 'Point of interest'}
                  {item.distanceMeters ? ` • ${(item.distanceMeters / 1000).toFixed(1)} km` : ''}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={activeTheme.colors.muted} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
  },
  headerTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  subtitle: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  mapContainer: {
    height: '50%',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.shapes.cardRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  map: {
    flex: 1,
  },
  locationHint: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    fontFamily: theme.typography.regular,
    fontSize: 12,
    color: theme.colors.muted,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: theme.typography.semibold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  itemSubtitle: {
    marginTop: 2,
    fontFamily: theme.typography.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});


