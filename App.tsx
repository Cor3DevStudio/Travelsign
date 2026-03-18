import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Toast, ToastContainer } from './src/components/Toast';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Feather } from '@expo/vector-icons';
import { theme } from './src/theme';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PermissionsScreen } from './src/screens/PermissionsScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { ScanPreviewScreen } from './src/screens/ScanPreviewScreen';
import { TranslationResultScreen } from './src/screens/TranslationResultScreen';
import { POIListScreen } from './src/screens/POIListScreen';
import { POIDetailsScreen } from './src/screens/POIDetailsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';

function PlaceholderScreen({ title, onNavigate }) {
  return (
    <View style={placeholderStyles.container}>
      <TouchableOpacity 
        style={placeholderStyles.backButton}
        onPress={() => onNavigate('/dashboard')}
      >
        <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      <Text style={placeholderStyles.title}>{title}</Text>
      <Text style={placeholderStyles.description}>
        {title} screen coming soon
      </Text>
    </View>
  );
}

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 32,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});

function AppContent() {
  const { theme: appTheme } = useTheme();
  const [route, setRoute] = useState('/onboarding');
  const [routeParams, setRouteParams] = useState({});

  const handleNavigate = (newRoute, params = {}) => {
    setRoute(newRoute);
    setRouteParams(params);
  };

  const renderScreen = () => {
    switch (route) {
      case '/dashboard':
        return <DashboardScreen onNavigate={handleNavigate} />;
      case '/scan':
        return <ScanScreen onNavigate={handleNavigate} />;
      case '/scan-preview':
        return (
          <ScanPreviewScreen
            onNavigate={handleNavigate}
            previewImageUri={routeParams.previewImageUri}
            previewImageBase64={routeParams.previewImageBase64}
            reviewOnly={!!routeParams.reviewOnly}
          />
        );
      case '/translation-result':
        return (
          <TranslationResultScreen
            onNavigate={handleNavigate}
            originalText={routeParams.originalText}
            translatedText={routeParams.translatedText}
            initialLanguage={routeParams.initialLanguage}
            captureLocation={routeParams.location}
            capturedImageUri={routeParams.capturedImageUri}
            capturedImageBase64={routeParams.capturedImageBase64}
            translationEntry={routeParams.translationEntry ?? 'scan'}
            cropRect={routeParams.cropRect}
          />
        );
      case '/poi-list':
        return (
          <POIListScreen
            onNavigate={handleNavigate}
            pois={routeParams.pois || []}
            searchQuery={routeParams.searchQuery || ''}
            captureLocation={routeParams.location}
            returnToTranslationParams={routeParams.returnToTranslationParams}
            listReturnRoute={routeParams.listReturnRoute}
            browseSuggested={!!routeParams.browseSuggested}
          />
        );
      case '/poi-details':
        return (
          <POIDetailsScreen
            onNavigate={handleNavigate}
            poi={routeParams.poi}
            detailsReturnRoute={routeParams.detailsReturnRoute}
            detailsReturnParams={routeParams.detailsReturnParams}
          />
        );
      case '/history':
        return <HistoryScreen onNavigate={handleNavigate} initialTab="history" />;
      case '/saved':
        return <HistoryScreen onNavigate={handleNavigate} initialTab="saved" />;
      case '/settings':
        return <SettingsScreen onNavigate={handleNavigate} />;
      case '/privacy-policy':
        return <PrivacyPolicyScreen onNavigate={handleNavigate} />;
      case '/permissions':
        return <PermissionsScreen onNavigate={handleNavigate} />;
      case '/onboarding':
      default:
        return <OnboardingScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: appTheme.colors.background }]}>
      <StatusBar style={appTheme.colors.textPrimary === '#F8FAFC' ? 'light' : 'dark'} />
      {renderScreen()}
      <ToastContainer />
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <SafeAreaView style={styles.loading}>
              <ActivityIndicator color={theme.colors.primary} />
            </SafeAreaView>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
