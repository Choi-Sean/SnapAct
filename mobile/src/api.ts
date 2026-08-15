import { API_BASE_URL, API_KEY } from './config';
import { AnalyzeResponse, Category } from './types';

interface PickedPhoto {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export async function analyzePhoto(photo: PickedPhoto, mockCategory?: Category): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: photo.uri,
    name: photo.fileName ?? 'photo.jpg',
    type: photo.mimeType ?? 'image/jpeg',
  } as unknown as Blob);

  const query = mockCategory ? `?mock_category=${mockCategory}` : '';
  const response = await fetch(`${API_BASE_URL}/analyze${query}`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Analyze failed (${response.status}): ${detail}`);
  }

  return response.json();
}
