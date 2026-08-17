import { File, UploadType } from 'expo-file-system';

import { API_BASE_URL, API_KEY } from './config';
import { AnalyzeResponse, Category } from './types';

interface PickedPhoto {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

// Uses expo-file-system's native multipart uploader rather than raw
// fetch()+FormData: on the New Architecture, appending a plain
// {uri, name, type} object to FormData throws "Unsupported FormDataPart
// implementation" — RN's Networking module no longer recognizes that shape.
export async function analyzePhoto(photo: PickedPhoto, mockCategory?: Category): Promise<AnalyzeResponse> {
  const query = mockCategory ? `?mock_category=${mockCategory}` : '';
  const file = new File(photo.uri);

  const result = await file.upload(`${API_BASE_URL}/analyze${query}`, {
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: photo.mimeType ?? 'image/jpeg',
    headers: { 'X-API-Key': API_KEY },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Analyze failed (${result.status}): ${result.body}`);
  }

  return JSON.parse(result.body);
}
