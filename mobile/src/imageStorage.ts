import { Directory, File, Paths } from 'expo-file-system';

const HISTORY_DIR = new Directory(Paths.document, 'history-photos');

// ImagePicker's cache URIs are transient and can be cleared by the OS, so
// history entries copy the photo into a permanent app-owned directory
// instead of pointing at the temp file. Data URIs (used by scripted demo
// items, which have no real photo behind them) are returned unchanged.
export async function persistImage(sourceUri: string): Promise<string> {
  if (sourceUri.startsWith('data:')) return sourceUri;

  if (!HISTORY_DIR.exists) HISTORY_DIR.create({ intermediates: true });

  const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = new File(HISTORY_DIR, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);

  const source = new File(sourceUri);
  await source.copy(dest);
  return dest.uri;
}
