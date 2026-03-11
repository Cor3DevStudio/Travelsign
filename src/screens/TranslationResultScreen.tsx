import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { translateText } from '../services/translate';
import { addToSaved, isSavedItem } from '../services/historyStorage';
import { Toast } from '../components/Toast';

type TranslationResultScreenProps = {
  onNavigate: (route: string, params?: Record<string, any>) => void;
  originalText?: string;
  translatedText?: string;
  captureLocation?: {
    lat: number;
    lng: number;
  };
  cropRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ja', label: 'JA', name: 'Japanese' },
  { code: 'zh', label: 'ZH', name: 'Chinese' },
  { code: 'es', label: 'ES', name: 'Spanish' },
  { code: 'ko', label: 'KO', name: 'Korean' },
] as const;

type LangCode = (typeof LANGUAGES)[number]['code'];

export const TranslationResultScreen: React.FC<TranslationResultScreenProps> = ({
  onNavigate,
  originalText,
  translatedText,
  captureLocation,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<LangCode>('en');
  const [currentTranslation, setCurrentTranslation] = useState<string>(
    translatedText ?? ''
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!originalText && !translatedText) return;
    isSavedItem(originalText ?? '', translatedText ?? '').then(setSaved);
  }, [originalText, translatedText]);

  const handleChangeLanguage = async (lang: LangCode) => {
    if (!originalText || isTranslating) return;
    try {
      setIsTranslating(true);
      setCurrentLanguage(lang);
      const next = await translateText(originalText, lang);
      setCurrentTranslation(next);
    } catch (err) {
      console.warn('Language re-translate failed', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    if (saved || isSaving) return;
    setIsSaving(true);
    const result = await addToSaved(
      originalText ?? '',
      (currentTranslation || translatedText) ?? ''
    );
    setIsSaving(false);
    if (result) {
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Saved',
        text2: 'Translation saved to your bookmarks.',
      });
    } else {
      Toast.show({
        type: 'info',
        text1: 'Already saved',
        text2: 'This translation is already in your saved list.',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate('/scan-preview')}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Translation</Text>
        <TouchableOpacity
          style={[styles.saveButton, saved && styles.saveButtonActive]}
          onPress={handleSave}
          disabled={isSaving || saved}
        >
          <Feather
            name="bookmark"
            size={20}
            color={saved ? '#FFFFFF' : theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Original text card */}
        <View style={styles.card}>
          <Text style={styles.label}>Original</Text>
          <Text style={styles.originalText}>
            {originalText || 'Detected text will appear here'}
          </Text>
        </View>

        {/* Translated text card */}
        <View style={styles.card}>
          <Text style={styles.label}>Translated</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languageRow}
          >
            {LANGUAGES.map(({ code, label, name }) => {
              const selected = currentLanguage === code;
              return (
                <TouchableOpacity
                  key={code}
                  style={[styles.languageChip, selected && styles.languageChipSelected]}
                  onPress={() => handleChangeLanguage(code)}
                  disabled={isTranslating || !originalText}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      selected && styles.languageChipTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                  {selected && (
                    <Text style={styles.languageChipName}> · {name}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.translatedText}>
            {isTranslating
              ? 'Translating…'
              : currentTranslation || translatedText || 'Translation will appear here'}
          </Text>
        </View>

        {/* Location row */}
        {captureLocation && (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={theme.colors.muted} />
            <Text style={styles.locationText}>
              Captured at {captureLocation.lat.toFixed(4)}, {captureLocation.lng.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => onNavigate('/scan')}
          >
            <Feather name="aperture" size={18} color={theme.colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Scan again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              onNavigate('/poi-list', { pois: [], location: captureLocation })
            }
          >
            <Feather name="map" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Nearby places</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  saveButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    borderRadius: theme.shapes.cardRadius,
    backgroundColor: theme.colors.cardLight,
    padding: theme.spacing.md,
  },
  label: {
    fontFamily: theme.typography.medium,
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: theme.spacing.sm,
  },
  originalText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  translatedText: {
    fontFamily: theme.typography.semibold,
    fontSize: 22,
    color: theme.colors.textPrimary,
    lineHeight: 30,
    marginTop: theme.spacing.sm,
  },
  languageRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundLight,
  },
  languageChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  languageChipText: {
    fontFamily: theme.typography.semibold,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  languageChipTextSelected: {
    color: '#FFFFFF',
  },
  languageChipName: {
    fontFamily: theme.typography.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  locationText: {
    fontFamily: theme.typography.regular,
    fontSize: 12,
    color: theme.colors.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.shapes.buttonRadius,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  primaryButtonText: {
    fontFamily: theme.typography.semibold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shapes.buttonRadius,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundLight,
    gap: theme.spacing.xs,
  },
  secondaryButtonText: {
    fontFamily: theme.typography.medium,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
});
