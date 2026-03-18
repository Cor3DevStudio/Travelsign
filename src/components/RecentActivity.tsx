import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  getHistory,
  formatHistoryItemTimestamp,
  type HistoryItem,
} from '../services/historyStorage';

type RecentActivityProps = {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
};

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function RecentActivity({ onNavigate }: RecentActivityProps) {
  const { t } = useLanguage();
  const { theme: activeTheme } = useTheme();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    getHistory().then((list) => {
      const deduped = uniqueById(list);
      setItems(deduped.slice(0, 5));
    });
  }, []);

  const handleSeeAll = () => onNavigate?.('/history');

  const handlePress = (item: HistoryItem) => {
    onNavigate?.('/translation-result', {
      originalText: item.originalText,
      translatedText: item.translatedText,
      capturedImageUri: item.capturedImageStorageUri,
      translationEntry: 'library',
      initialLanguage: 'en',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: activeTheme.colors.textPrimary }]}>{t.recentActivity}</Text>
        <TouchableOpacity onPress={handleSeeAll}>
          <Text style={[styles.seeAll, { color: activeTheme.colors.primary }]}>{t.seeAll}</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}>
          <Feather name="clock" size={22} color={activeTheme.colors.muted} />
          <Text style={[styles.emptyText, { color: activeTheme.colors.textPrimary }]}>{t.noRecentActivity}</Text>
          <Text style={[styles.emptySubText, { color: activeTheme.colors.textSecondary }]}>{t.scanToGetStarted}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.activityCard, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}
              activeOpacity={0.8}
              onPress={() => handlePress(item)}
            >
              {item.capturedImageStorageUri ? (
                <Image
                  source={{ uri: item.capturedImageStorageUri }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.iconContainer, { borderColor: activeTheme.colors.primary + '30' }]}>
                  <Feather name="globe" size={18} color={activeTheme.colors.primary} />
                </View>
              )}
              <View style={styles.content}>
                <Text style={[styles.activityTitle, { color: activeTheme.colors.textPrimary }]} numberOfLines={1}>
                  {item.translatedText || '—'}
                </Text>
                <Text style={[styles.activityOriginal, { color: activeTheme.colors.textSecondary }]} numberOfLines={1}>
                  {item.originalText || '—'}
                </Text>
                <Text style={[styles.activityTime, { color: activeTheme.colors.muted }]}>
                  {formatHistoryItemTimestamp(item)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.shapes.cardRadius,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  emptyText: {
    fontFamily: theme.typography.semibold,
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  emptySubText: {
    fontFamily: theme.typography.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    paddingRight: theme.spacing.lg,
  },
  activityCard: {
    width: 260,
    backgroundColor: theme.colors.card,
    borderRadius: theme.shapes.cardRadius,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    ...theme.shadow.card,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  activityOriginal: {
    fontFamily: theme.typography.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  activityTime: {
    fontFamily: theme.typography.medium,
    fontSize: 11,
    color: theme.colors.muted,
    letterSpacing: 0.1,
  },
});
