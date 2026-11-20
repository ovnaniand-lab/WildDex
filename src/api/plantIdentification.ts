/**
 * Live plant identification via WildDex's public, rate-limited Cloudflare Worker.
 * No API secrets or shared developer tokens belong in the Expo application.
 */
import type { PlantSuggestion } from '@/components/PlantIdentificationResults';
import { File as ExpoFile } from 'expo-file-system';
import { fetch } from 'expo/fetch';

type ResultBody = {
  suggestions?: unknown;
  error?: unknown;
};

export async function identifyPlant(
  imageUri: string,
  signal?: AbortSignal
): Promise<PlantSuggestion[]> {
  const baseUrl = process.env.EXPO_PUBLIC_WILDDEX_API_URL
    ?.trim()
    .replace(/\/$/, '');

  if (!baseUrl || !/^https:\/\/[^\s/]+/i.test(baseUrl)) {
    throw new Error(
      'WildDex API is not configured. Set EXPO_PUBLIC_WILDDEX_API_URL and restart Expo.'
    );
  }

  const cleanPath = imageUri.split('?')[0].toLowerCase();

  if (/\.(heic|heif|webp|gif|bmp)$/.test(cleanPath)) {
    throw new Error(
      'Please choose a JPEG or PNG photo. Other formats are not supported yet.'
    );
  }

  // Expo File implements Blob, which is supported by expo/fetch FormData.
  const file = new ExpoFile(imageUri);

  if (!file.exists) {
    throw new Error('Could not read the selected photo. Please choose it again.');
  }

  const body = new FormData();
  body.append('image', file);

  const controller = new AbortController();
  const cancel = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener('abort', cancel, { once: true });
  }

  const timeout = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch(`${baseUrl}/identify/plant`, {
      method: 'POST',
      body,
      signal: controller.signal,
      // Do not set Content-Type manually. Fetch adds the multipart boundary.
    });

    let result: ResultBody = {};

    try {
      result = (await response.json()) as ResultBody;
    } catch {
      // The status-specific error below will be shown.
    }

    if (!response.ok) {
      const fallback =
        response.status === 429
          ? 'Too many identifications. Please try again in a minute.'
          : response.status === 413 || response.status === 415
            ? 'The photo format or size is not supported. Try a smaller JPEG or PNG.'
            : `Identification failed (HTTP ${response.status}). Please try again.`;

      throw new Error(
        typeof result.error === 'string' ? result.error : fallback
      );
    }

    if (!Array.isArray(result.suggestions)) {
      throw new Error('Invalid identification response. Please try again.');
    }

    return result.suggestions.filter(
      (entry): entry is PlantSuggestion =>
        Boolean(
          entry &&
            typeof entry === 'object' &&
            typeof entry.scientificName === 'string' &&
            Array.isArray(entry.commonNames) &&
            typeof entry.score === 'number'
        )
    );
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) {
      throw new Error('Identification took too long. Please try again.');
    }

    if (
      error instanceof Error &&
      error.message === 'Network request failed'
    ) {
      throw new Error('Network unavailable. Check your connection and try again.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}