import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const HISTORY_KEY = '@linguajourney/history';
const SAVED_KEY = '@linguajourney/saved';

export type HistoryItem = {
  id: string;
  originalText: string;
  translatedText: string;
  timestamp: number;
  /** Local file URI of persisted capture (for list thumbnails & preview) */
  capturedImageStorageUri?: string;
};

async function persistCaptureImage(
  id: string,
  imageSourceUri?: string | null,
  imageBase64?: string | null
): Promise<string | undefined> {
  const dest = `${FileSystem.documentDirectory}capture_${id.replace(/[^a-zA-Z0-9_-]/g, '')}.jpg`;
  try {
    if (imageSourceUri && imageSourceUri.startsWith('file')) {
      const info = await FileSystem.getInfoAsync(imageSourceUri);
      if (info.exists) {
        await FileSystem.copyAsync({ from: imageSourceUri, to: dest });
        return dest;
      }
    }
    if (imageBase64 && imageBase64.length > 100) {
      const clean = imageBase64.includes(',') ? imageBase64.split(',')[1]! : imageBase64;
      await FileSystem.writeAsStringAsync(dest, clean.replace(/\s/g, ''), {
        encoding: FileSystem.EncodingType.Base64,
      });
      return dest;
    }
  } catch (e) {
    console.warn('historyStorage: could not persist capture image', e);
  }
  return undefined;
}

function formatRelativeTime(ms: number): string {
  const now = Date.now();
  const diff = now - ms;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  if (day > 0) return `${day}d ago`;
  if (hour > 0) return `${hour}h ago`;
  if (min > 0) return `${min} min ago`;
  if (sec > 0) return `${sec} sec ago`;
  return 'Just now';
}

export function formatHistoryItemTimestamp(item: HistoryItem): string {
  return formatRelativeTime(item.timestamp);
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list: HistoryItem[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function addToHistory(
  originalText: string,
  translatedText: string,
  opts?: { imageSourceUri?: string | null; imageBase64?: string | null }
): Promise<void> {
  if (!originalText?.trim() && !translatedText?.trim()) return;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  let capturedImageStorageUri: string | undefined;
  if (opts?.imageSourceUri || opts?.imageBase64) {
    capturedImageStorageUri = await persistCaptureImage(
      id,
      opts.imageSourceUri,
      opts.imageBase64
    );
  }
  const list = await getHistory();
  const item: HistoryItem = {
    id,
    originalText: originalText?.trim() || '',
    translatedText: translatedText?.trim() || '',
    timestamp: Date.now(),
    ...(capturedImageStorageUri ? { capturedImageStorageUri } : {}),
  };
  const next = [item, ...list].slice(0, 200);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export async function removeFromHistory(id: string): Promise<void> {
  const list = await getHistory();
  const next = list.filter((i) => i.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
}

// ─── Saved ────────────────────────────────────────────────────────────────────

export async function getSaved(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const list: HistoryItem[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function addToSaved(
  originalText: string,
  translatedText: string,
  opts?: { imageSourceUri?: string | null; imageBase64?: string | null }
): Promise<HistoryItem | null> {
  const list = await getSaved();
  const isDuplicate = list.some(
    (i) =>
      i.originalText === (originalText?.trim() || '') &&
      i.translatedText === (translatedText?.trim() || '')
  );
  if (isDuplicate) return null;

  const id = `saved-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  let capturedImageStorageUri: string | undefined;
  if (opts?.imageSourceUri || opts?.imageBase64) {
    capturedImageStorageUri = await persistCaptureImage(
      id,
      opts.imageSourceUri,
      opts.imageBase64
    );
  }

  const item: HistoryItem = {
    id,
    originalText: originalText?.trim() || '',
    translatedText: translatedText?.trim() || '',
    timestamp: Date.now(),
    ...(capturedImageStorageUri ? { capturedImageStorageUri } : {}),
  };
  const next = [item, ...list].slice(0, 200);
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return item;
}

export async function removeFromSaved(id: string): Promise<void> {
  const list = await getSaved();
  const next = list.filter((i) => i.id !== id);
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
}

export async function isSavedItem(
  originalText: string,
  translatedText: string
): Promise<boolean> {
  const list = await getSaved();
  return list.some(
    (i) =>
      i.originalText === (originalText?.trim() || '') &&
      i.translatedText === (translatedText?.trim() || '')
  );
}

export async function clearSaved(): Promise<void> {
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify([]));
}
