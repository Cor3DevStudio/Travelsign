import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { translateText } from '../services/translate';
import { addToSaved, isSavedItem } from '../services/historyStorage';
import { Toast } from '../components/Toast';

type TranslationResultScreenProps = {
  onNavigate: (route: string, params?: Record<string, any>) => void;
  originalText?: string;
  translatedText?: string;
  initialLanguage?: LangCode;
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
  capturedImageUri?: string;
  capturedImageBase64?: string;
  /** scan = from camera flow; library = history / saved / recent */
  translationEntry?: 'scan' | 'library';
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
  initialLanguage = 'en',
  captureLocation,
  capturedImageUri,
  capturedImageBase64,
  translationEntry = 'scan',
  cropRect,
}) => {
  const { theme: activeTheme } = useTheme();
  const [currentLanguage, setCurrentLanguage] = useState<LangCode>(initialLanguage);
  const [currentTranslation, setCurrentTranslation] = useState<string>(
    translatedText ?? ''
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const translationRestoreParams = () => ({
    originalText,
    translatedText: currentTranslation || translatedText,
    initialLanguage: currentLanguage,
    captureLocation,
    capturedImageUri,
    capturedImageBase64,
    translationEntry,
    cropRect,
  });

  const handleBack = () => {
    const hasImage = !!(capturedImageUri || capturedImageBase64);
    if (translationEntry === 'library') {
      if (hasImage) {
        onNavigate('/scan-preview', {
          previewImageUri: capturedImageUri,
          previewImageBase64: capturedImageBase64,
          reviewOnly: true,
        });
      } else {
        onNavigate('/dashboard');
      }
      return;
    }
    onNavigate('/scan-preview', {
      previewImageUri: capturedImageUri,
      previewImageBase64: capturedImageBase64,
      reviewOnly: false,
    });
  };

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
      (currentTranslation || translatedText) ?? '',
      {
        imageSourceUri: capturedImageUri,
        imageBase64: capturedImageBase64,
      }
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
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: activeTheme.colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: activeTheme.colors.backgroundLight }]}
          onPress={handleBack}
        >
          <Feather name="arrow-left" size={24} color={activeTheme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTheme.colors.textPrimary }]}>Translation</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: activeTheme.colors.backgroundLight, borderColor: activeTheme.colors.border },
            saved && { backgroundColor: activeTheme.colors.primary, borderColor: activeTheme.colors.primary },
          ]}
          onPress={handleSave}
          disabled={isSaving || saved}
        >
          <Feather
            name="bookmark"
            size={20}
            color={saved ? '#FFFFFF' : activeTheme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Captured image */}
        {(capturedImageUri || capturedImageBase64) && (
          <View style={[styles.imageCard, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}>
            <Text style={[styles.label, { color: activeTheme.colors.textSecondary }]}>Captured image</Text>
            <Image
              source={{
                uri: capturedImageUri || (capturedImageBase64 ? `data:image/jpeg;base64,${capturedImageBase64}` : undefined),
              }}
              style={styles.capturedImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Original text card */}
        <View style={[styles.card, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}>
          <Text style={[styles.label, { color: activeTheme.colors.textSecondary }]}>Original</Text>
          <Text style={[styles.originalText, { color: activeTheme.colors.textPrimary }]}>
            {originalText || 'Detected text will appear here'}
          </Text>
        </View>

        {/* Translated text card */}
        <View style={[styles.card, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}>
          <Text style={[styles.label, { color: activeTheme.colors.textSecondary }]}>Translated</Text>

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
                  style={[
                    styles.languageChip,
                    { backgroundColor: activeTheme.colors.backgroundLight, borderColor: activeTheme.colors.border },
                    selected && { backgroundColor: activeTheme.colors.primary + '20', borderColor: activeTheme.colors.primary },
                  ]}
                  onPress={() => handleChangeLanguage(code)}
                  disabled={isTranslating || !originalText}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      { color: activeTheme.colors.textPrimary },
                      selected && { color: activeTheme.colors.primary },
                    ]}
                  >
                    {label}
                  </Text>
                  {selected && (
                    <Text style={[styles.languageChipName, { color: activeTheme.colors.primary }]}> · {name}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.translatedText, { color: activeTheme.colors.textPrimary }]}>
            {isTranslating
              ? 'Translating…'
              : currentTranslation || translatedText || 'Translation will appear here'}
          </Text>
        </View>

        {/* Location row */}
        {captureLocation && (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={activeTheme.colors.muted} />
            <Text style={[styles.locationText, { color: activeTheme.colors.textSecondary }]}>
              Captured at {captureLocation.lat.toFixed(4)}, {captureLocation.lng.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}
            onPress={() => onNavigate('/scan')}
          >
            <Feather name="aperture" size={18} color={activeTheme.colors.textPrimary} />
            <Text style={[styles.secondaryButtonText, { color: activeTheme.colors.textPrimary }]}>Scan again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: activeTheme.colors.primary }]}
            onPress={() =>
              onNavigate('/poi-list', {
                pois: [],
                location: captureLocation,
                returnToTranslationParams: translationRestoreParams(),
              })
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
  imageCard: {
    borderRadius: theme.shapes.cardRadius,
    borderWidth: 1,
    overflow: 'hidden',
    padding: theme.spacing.md,
  },
  capturedImage: {
    width: '100%',
    height: 220,
    borderRadius: theme.shapes.inputRadius,
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
