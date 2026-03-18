import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import {
  getHistory,
  getSaved,
  clearHistory,
  clearSaved,
  removeFromHistory,
  removeFromSaved,
  formatHistoryItemTimestamp,
  type HistoryItem,
} from '../services/historyStorage';

type Tab = 'history' | 'saved';

type HistoryScreenProps = {
  onNavigate: (route: string, params?: Record<string, any>) => void;
  initialTab?: Tab;
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onNavigate,
  initialTab = 'history',
}) => {
  const { theme: activeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [savedData, setSavedData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const data = activeTab === 'history' ? historyData : savedData;

  const uniqueById = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, []);

  const loadData = useCallback(async () => {
    const [h, s] = await Promise.all([getHistory(), getSaved()]);
    setHistoryData(uniqueById(h));
    setSavedData(uniqueById(s));
  }, [uniqueById]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadData();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadData]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleClear = () => {
    const label = activeTab === 'history' ? 'history' : 'saved items';
    Alert.alert(
      `Clear ${activeTab === 'history' ? 'History' : 'Saved'}`,
      `Remove all ${label}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            if (activeTab === 'history') {
              await clearHistory();
              setHistoryData([]);
            } else {
              await clearSaved();
              setSavedData([]);
            }
          },
        },
      ]
    );
  };

  const handleRemoveItem = (item: HistoryItem) => {
    Alert.alert('Remove item', 'Remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (activeTab === 'history') {
            await removeFromHistory(item.id);
            setHistoryData((prev) => prev.filter((i) => i.id !== item.id));
          } else {
            await removeFromSaved(item.id);
            setSavedData((prev) => prev.filter((i) => i.id !== item.id));
          }
        },
      },
    ]);
  };

  const emptyIcon = activeTab === 'history' ? 'clock' : 'bookmark';
  const emptyTitle = activeTab === 'history' ? 'No history yet' : 'Nothing saved yet';
  const emptyText =
    activeTab === 'history'
      ? 'Scan a sign to translate it. Your translations will appear here.'
      : 'Tap the bookmark button on a translation to save it here.';

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: activeTheme.colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: activeTheme.colors.backgroundLight }]}
          onPress={() => onNavigate('/dashboard')}
        >
          <Feather name="arrow-left" size={24} color={activeTheme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTheme.colors.textPrimary }]}>
          {activeTab === 'history' ? 'History' : 'Saved'}
        </Text>
        {data.length > 0 ? (
          <TouchableOpacity style={[styles.clearButton, { backgroundColor: activeTheme.colors.cardLight }]} onPress={handleClear}>
            <Text style={[styles.clearButtonText, { color: activeTheme.colors.danger }]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: activeTheme.colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: activeTheme.colors.backgroundLight },
            activeTab === 'history' && { backgroundColor: activeTheme.colors.cardLight, borderWidth: 1, borderColor: activeTheme.colors.primary + '40' },
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Feather
            name="clock"
            size={15}
            color={activeTab === 'history' ? activeTheme.colors.primary : activeTheme.colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTheme.colors.textSecondary },
              activeTab === 'history' && { color: activeTheme.colors.primary },
            ]}
          >
            History
          </Text>
          {historyData.length > 0 && (
            <View style={[styles.badge, { backgroundColor: activeTab === 'history' ? activeTheme.colors.primary : activeTheme.colors.muted }]}>
              <Text style={[styles.badgeText, styles.badgeTextActive]}>{historyData.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: activeTheme.colors.backgroundLight },
            activeTab === 'saved' && { backgroundColor: activeTheme.colors.cardLight, borderWidth: 1, borderColor: activeTheme.colors.primary + '40' },
          ]}
          onPress={() => setActiveTab('saved')}
        >
          <Feather
            name="bookmark"
            size={15}
            color={activeTab === 'saved' ? activeTheme.colors.primary : activeTheme.colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTheme.colors.textSecondary },
              activeTab === 'saved' && { color: activeTheme.colors.primary },
            ]}
          >
            Saved
          </Text>
          {savedData.length > 0 && (
            <View style={[styles.badge, { backgroundColor: activeTab === 'saved' ? activeTheme.colors.primary : activeTheme.colors.muted }]}>
              <Text style={[styles.badgeText, styles.badgeTextActive]}>{savedData.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activeTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: activeTheme.colors.textSecondary }]}>Loading…</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { backgroundColor: activeTheme.colors.backgroundLight, borderColor: activeTheme.colors.border }]}>
            <Feather name={emptyIcon} size={32} color={activeTheme.colors.muted} />
          </View>
          <Text style={[styles.emptyTitle, { color: activeTheme.colors.textPrimary }]}>{emptyTitle}</Text>
          <Text style={[styles.emptyText, { color: activeTheme.colors.textSecondary }]}>{emptyText}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: activeTheme.colors.border }]} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[activeTheme.colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                onNavigate('/translation-result', {
                  originalText: item.originalText,
                  translatedText: item.translatedText,
                  capturedImageUri: item.capturedImageStorageUri,
                  translationEntry: 'library',
                  initialLanguage: 'en',
                })
              }
              onLongPress={() => handleRemoveItem(item)}
              activeOpacity={0.7}
            >
              {item.capturedImageStorageUri ? (
                <Image
                  source={{ uri: item.capturedImageStorageUri }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.iconContainer, { backgroundColor: activeTheme.colors.cardLight }]}>
                  <Feather
                    name={activeTab === 'history' ? 'clock' : 'bookmark'}
                    size={17}
                    color={activeTheme.colors.primary}
                  />
                </View>
              )}
              <View style={styles.textContainer}>
                <Text style={[styles.primaryText, { color: activeTheme.colors.textPrimary }]} numberOfLines={1}>
                  {item.translatedText || '—'}
                </Text>
                <Text style={[styles.secondaryText, { color: activeTheme.colors.textSecondary }]} numberOfLines={1}>
                  {item.originalText || '—'}
                </Text>
              </View>
              <Text style={[styles.timeText, { color: activeTheme.colors.muted }]}>
                {formatHistoryItemTimestamp(item)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {data.length > 0 && (
        <Text style={[styles.hintText, { color: activeTheme.colors.muted }]}>Long press an item to remove it</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  clearButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  clearButtonText: {
    fontFamily: theme.typography.semibold,
    fontSize: 14,
    color: theme.colors.danger,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.backgroundLight,
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  tabLabel: {
    fontFamily: theme.typography.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    fontFamily: theme.typography.semibold,
    color: theme.colors.primary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeActive: {
    backgroundColor: theme.colors.primary,
  },
  badgeText: {
    fontFamily: theme.typography.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontFamily: theme.typography.semibold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  primaryText: {
    fontFamily: theme.typography.semibold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  secondaryText: {
    marginTop: 2,
    fontFamily: theme.typography.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  timeText: {
    marginLeft: theme.spacing.sm,
    fontFamily: theme.typography.regular,
    fontSize: 12,
    color: theme.colors.muted,
  },
  hintText: {
    fontFamily: theme.typography.regular,
    fontSize: 11,
    color: theme.colors.muted,
    textAlign: 'center',
    paddingVertical: theme.spacing.sm,
  },
});
