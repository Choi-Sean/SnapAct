import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// A modern phone camera photo can be 4000px+ on the long edge and several MB.
// Vision's OCR/label detection doesn't need more than this, and downscaling
// client-side cuts upload time dramatically over a mobile connection — this
// was the real bottleneck behind /analyze feeling slow, not server processing.
const MAX_DIMENSION = 1600;

export interface ResizedImage {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
}

// mimeType is the ORIGINAL asset's type — only trustworthy to pass through
// unchanged when this returns early without re-encoding. Once the image is
// actually processed, the output is always JPEG regardless of source format.
export async function resizeForUpload(
  uri: string,
  width: number,
  height: number,
  mimeType?: string | null
): Promise<ResizedImage> {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { uri, width, height, mimeType: mimeType || 'image/jpeg' };
  }

  const resizeOptions = width >= height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION };
  const image = await ImageManipulator.manipulate(uri).resize(resizeOptions).renderAsync();
  const result = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  return { uri: result.uri, width: result.width, height: result.height, mimeType: 'image/jpeg' };
}
