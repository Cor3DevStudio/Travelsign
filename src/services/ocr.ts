import { BACKEND_CONFIG } from '../config/backend';

const { BASE_URL, OCR_TIMEOUT_MS } = BACKEND_CONFIG;

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function extractTextFromImage(
  imageBase64: string,
  cropRect: CropRect
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);

  try {
    // Clean the base64 string - remove data URI prefix if present
    let cleanedBase64 = imageBase64.trim();
    if (cleanedBase64.includes(',')) {
      // Extract base64 part after comma (data:image/...;base64,<actual_base64>)
      cleanedBase64 = cleanedBase64.split(',')[1] || cleanedBase64;
    }
    // Remove any whitespace
    cleanedBase64 = cleanedBase64.replace(/\s/g, '');

    if (!cleanedBase64) {
      throw new Error('Invalid image data: base64 string is empty');
    }

    console.log('OCR: Sending request', {
      base64Length: cleanedBase64.length,
      cropRect,
    });

    const res = await fetch(`${BASE_URL}/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: cleanedBase64,
        cropRect,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const json = await res.json();
    if (!res.ok) {
      console.error('OCR: Server error', {
        status: res.status,
        error: json?.error,
      });
      throw new Error(json?.error || `OCR failed with status ${res.status}`);
    }

    return (json.text || '').trim();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('OCR request timed out. Please check your connection and try again.');
    }
    console.error('OCR: Request failed', err);
    throw err;
  }
}


