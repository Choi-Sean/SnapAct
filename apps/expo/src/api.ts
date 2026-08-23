import { File, UploadType } from 'expo-file-system';

import { loadSession } from './auth';
import { API_BASE_URL, API_KEY } from './config';
import { AnalyzeResponse, Category } from './types';

interface PickedPhoto {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

// ---- LAYER 1 (server) call ----------------------------------------------
// Sends the photo to backend/app/main.py's /analyze — Google Vision +
// Claude, token-gated for non-free categories. Callers should try
// mobile/src/layer0/analyzeOnDevice.ts first (see AnalyzeScreen.tsx's
// resolveAnalysis) and only fall through to this when Layer 0 can't handle
// the photo itself.
// Uses expo-file-system's native multipart uploader rather than raw
// fetch()+FormData: on the New Architecture, appending a plain
// {uri, name, type} object to FormData throws "Unsupported FormDataPart
// implementation" — RN's Networking module no longer recognizes that shape.
export async function analyzePhoto(photo: PickedPhoto, mockCategory?: Category): Promise<AnalyzeResponse> {
  const query = mockCategory ? `?mock_category=${mockCategory}` : '';
  const file = new File(photo.uri);

  // Without this, the backend never learns who's calling — every request
  // looks like a guest, Layer 1 categories always come back locked even for
  // a logged-in user with a token balance, and nothing gets saved to the
  // account's server-side history either.
  const session = await loadSession();
  const headers: Record<string, string> = { 'X-API-Key': API_KEY };
  if (session) headers.Authorization = `Bearer ${session.token}`;

  const result = await file.upload(`${API_BASE_URL}/analyze${query}`, {
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: photo.mimeType ?? 'image/jpeg',
    headers,
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Analyze failed (${result.status}): ${result.body}`);
  }

  return JSON.parse(result.body);
}
