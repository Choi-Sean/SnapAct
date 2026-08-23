// ============================================================================
// LAYER 0 — on-device OCR (mobile/src/layer0/)
// ============================================================================
// Thin wrapper around @react-native-ml-kit/text-recognition, which runs
// Google ML Kit's on-device text recognizer on both iOS and Android (see the
// AskUserQuestion decision in this session: iOS uses ML Kit's iOS SDK here,
// not Apple's own Vision framework — same on-device/free/no-network
// guarantee, just not Apple's own code). Native module only — requires a
// real EAS build, not Expo Go and not an OTA update.
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';

import { Locale } from '../i18n/dictionaries';

// Latin-script locales (en/es/fr/de) all use the default Latin recognizer —
// only CJK scripts need their own dedicated ML Kit model.
const SCRIPT_BY_LOCALE: Record<Locale, TextRecognitionScript> = {
  en: TextRecognitionScript.LATIN,
  es: TextRecognitionScript.LATIN,
  fr: TextRecognitionScript.LATIN,
  de: TextRecognitionScript.LATIN,
  ko: TextRecognitionScript.KOREAN,
  ja: TextRecognitionScript.JAPANESE,
  zh: TextRecognitionScript.CHINESE,
};

export function isTextRecognitionLinked(): boolean {
  // The package throws lazily (via a Proxy) on first property access when
  // the native module isn't linked — e.g. running in Expo Go, or an old
  // build from before this feature shipped. Reading `.recognize` itself
  // triggers the throw, so wrap the read, not just the call.
  try {
    return typeof TextRecognition.recognize === 'function';
  } catch {
    return false;
  }
}

export async function recognizeText(uri: string, locale: Locale): Promise<string> {
  const result = await TextRecognition.recognize(uri, SCRIPT_BY_LOCALE[locale]);
  return result.text;
}
