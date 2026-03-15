import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

type ScanScreenProps = {
  onNavigate: (route: string, params?: Record<string, any>) => void;
};

export const ScanScreen: React.FC<ScanScreenProps> = ({ onNavigate }) => {
  const { theme: activeTheme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // Request permission when screen loads
  useEffect(() => {
    const requestCameraPermission = async () => {
      console.log('ScanScreen: Permission state:', {
        permission: permission ? { 
          granted: permission.granted, 
          status: permission.status,
          canAskAgain: permission.canAskAgain 
        } : null,
        hasRequested,
        isRequesting,
      });

      // Always request permission if we haven't requested yet, even if it appears granted
      // This is important for Expo Go where permissions might appear granted at app level
      // but the project still needs to request them explicitly
      if (!hasRequested && !isRequesting) {
        console.log('ScanScreen: Requesting camera permission...');
        setIsRequesting(true);
        setHasRequested(true);
        try {
          const result = await requestPermission();
          console.log('ScanScreen: Camera permission result:', {
            granted: result.granted,
            status: result.status,
            canAskAgain: result.canAskAgain,
          });
          if (!result.granted) {
            console.warn('ScanScreen: Camera permission denied');
          } else {
            console.log('ScanScreen: Camera permission granted successfully');
            // Small delay to ensure camera can initialize properly
            setTimeout(() => {
              setShowCamera(true);
              console.log('ScanScreen: Showing camera view');
            }, 300);
          }
        } catch (error) {
          console.error('ScanScreen: Error requesting camera permission:', error);
        } finally {
          setIsRequesting(false);
        }
      } else if (permission?.granted) {
        console.log('ScanScreen: Camera permission already granted');
        // If permission was already granted, show camera immediately
        if (!showCamera) {
          setTimeout(() => {
            setShowCamera(true);
            console.log('ScanScreen: Showing camera view (permission already granted)');
          }, 100);
        }
      }
    };

    requestCameraPermission();
  }, [permission, hasRequested, isRequesting, requestPermission]);

  // Show camera when permission is granted
  useEffect(() => {
    if (permission?.granted && !showCamera && !isRequesting) {
      // Show camera immediately on Android to avoid black screen issues
      // The camera will show a loading overlay until ready
      console.log(`ScanScreen: Permission granted, showing camera immediately (${Platform.OS})`);
      setShowCamera(true);
    } else if (!permission?.granted) {
      setShowCamera(false);
      setCameraReady(false);
    }
  }, [permission?.granted, showCamera, isRequesting]);

  // Manual permission request handler
  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await requestPermission();
      console.log('ScanScreen: Manual permission request result:', result);
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is required to scan signs. You can enable it in your device settings.',
          [
            { text: 'OK' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('ScanScreen: Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request camera permission. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCapturePress = async () => {
    console.log('ScanScreen: Capture pressed', {
      cameraRef: !!cameraRef.current,
      isCapturing,
      cameraReady,
      permissionGranted: permission?.granted,
    });

    if (!cameraRef.current) {
      console.error('ScanScreen: Camera ref is null');
      Alert.alert('Camera Error', 'Camera is not ready. Please wait a moment and try again.');
      return;
    }

    if (isCapturing) return;

    try {
      setIsCapturing(true);
      console.log('ScanScreen: Taking picture...');
      // On Android use lower quality and skipProcessing: false so OCR payload stays within API limits
      const photo = await cameraRef.current.takePictureAsync({
        quality: Platform.OS === 'android' ? 0.5 : 0.8,
        base64: true,
        skipProcessing: false,
      } as any);

      console.log('ScanScreen: Picture taken', { hasUri: !!photo?.uri, hasBase64: !!photo?.base64, platform: Platform.OS });

      if (!photo || !photo.uri) {
        throw new Error('No photo captured');
      }

      let base64Data = photo.base64;
      // Android often doesn't return base64 from takePictureAsync; read from file as fallback
      if (!base64Data && photo.uri) {
        try {
          base64Data = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (e) {
          console.error('ScanScreen: Failed to read image as base64', e);
        }
      }

      if (!base64Data) {
        throw new Error('Could not get image data. Try scanning again.');
      }

      onNavigate('/scan-preview', {
        previewImageUri: photo.uri,
        previewImageBase64: base64Data,
      });
    } catch (err) {
      console.error('ScanScreen: Failed to capture image', err);
      Alert.alert('Capture failed', 'Could not take a picture. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: activeTheme.colors.backgroundLight }]}
          onPress={() => onNavigate('/dashboard')}
        >
          <Feather name="arrow-left" size={24} color={activeTheme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTheme.colors.textPrimary }]}>Scan a sign</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {!permission || isRequesting ? (
          <View style={[styles.cameraPlaceholder, { backgroundColor: activeTheme.colors.backgroundLight, borderColor: activeTheme.colors.border }]}>
            <ActivityIndicator size="large" color={activeTheme.colors.primary} />
            <Text style={[styles.cameraText, { color: activeTheme.colors.textSecondary }]}>Requesting camera permission…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={[styles.cameraPlaceholder, { backgroundColor: activeTheme.colors.backgroundLight, borderColor: activeTheme.colors.border }]}>
            <Feather name="camera-off" size={40} color={activeTheme.colors.danger} />
            <Text style={[styles.cameraText, { color: activeTheme.colors.textSecondary }]}>
              Camera access is required to scan signs.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: activeTheme.colors.primary }]}
              onPress={handleRequestPermission}
              disabled={isRequesting}
            >
              <Text style={styles.primaryButtonText}>
                {isRequesting ? 'Requesting...' : 'Allow camera'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => Linking.openSettings()}
            >
              <Text style={[styles.settingsButtonText, { color: activeTheme.colors.primary }]}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View 
              style={styles.cameraContainer}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                console.log('ScanScreen: Camera container layout', { width, height, platform: Platform.OS });
              }}
            >
              {permission.granted && showCamera && (
                <>
                  <CameraView
                    key={Platform.OS === 'android' ? `camera-view-android-${showCamera}` : 'camera-view'}
                    ref={(ref) => {
                      cameraRef.current = ref;
                      if (ref) {
                        console.log('ScanScreen: Camera ref set', { platform: Platform.OS });
                        // Small delay before marking as ready on Android
                        if (Platform.OS === 'android') {
                          setTimeout(() => {
                            setCameraReady(true);
                            console.log('ScanScreen: Camera ready on Android');
                          }, 800);
                        } else {
                          setCameraReady(true);
                        }
                      }
                    }}
                    style={Platform.OS === 'android' ? styles.cameraViewAndroid : StyleSheet.absoluteFill}
                    facing="back"
                  />
                  {!cameraReady && (
                    <View style={styles.cameraLoadingOverlay}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                      <Text style={styles.cameraLoadingText}>Initializing camera...</Text>
                    </View>
                  )}
                  <View style={styles.overlayFrame} pointerEvents="none">
                    <View style={styles.overlayCorner} />
                    <Text style={styles.overlayText}>Align the sign inside the frame</Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: activeTheme.colors.primary }]}
              onPress={handleCapturePress}
              disabled={isCapturing}
            >
              <Feather name="aperture" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {isCapturing ? 'Capturing…' : 'Scan'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: theme.shapes.cardRadius,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    backgroundColor: '#000',
    marginBottom: theme.spacing.lg,
    position: 'relative',
    minHeight: 400,
  },
  cameraViewAndroid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cameraLoadingText: {
    marginTop: theme.spacing.md,
    color: '#FFFFFF',
    fontFamily: theme.typography.regular,
    fontSize: 14,
  },
  cameraPlaceholder: {
    flex: 1,
    borderRadius: theme.shapes.cardRadius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cameraText: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  overlayFrame: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: theme.spacing.lg,
  },
  overlayCorner: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '30%',
    borderWidth: 2,
    borderColor: '#FFFFFFAA',
    borderRadius: theme.shapes.cardRadius,
  },
  overlayText: {
    fontFamily: theme.typography.medium,
    fontSize: 14,
    color: '#FFFFFF',
    textShadowColor: '#00000080',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.shapes.buttonRadius,
    paddingVertical: theme.spacing.md,
  },
  primaryButtonText: {
    marginLeft: theme.spacing.sm,
    fontFamily: theme.typography.semibold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  settingsButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  settingsButtonText: {
    fontFamily: theme.typography.medium,
    fontSize: 14,
    color: theme.colors.primary,
  },
});


