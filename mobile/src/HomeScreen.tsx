import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { analyzePhoto } from './api';
import BatchReviewModal from './BatchReviewModal';
import { Emoji, EmojiName } from './Emoji';
import { useLanguage } from './i18n/LanguageProvider';
import { t as fmt } from './i18n/dictionaries';
import { saveContact, saveEventToCalendar } from './nativeActions';
import { AnalyzeResponse, BatchSubEntry, Category, DemoKey } from './types';

const BATCH_MOCK_CYCLE: Category[] = ['business_card', 'event_flyer', 'receipt', 'document'];

const DEMO_ICONS: Record<DemoKey, EmojiName> = {
  business_card: 'contacts',
  event: 'calendar',
  receipt: 'notes',
  reminder: 'reminders',
  photo: 'photos',
  mail: 'mail',
  sms: 'sms',
  maps: 'maps',
  files: 'files',
  wallet: 'wallet',
  notification: 'notification',
};

const DEMO_ORDER: DemoKey[] = [
  'business_card',
  'event',
  'receipt',
  'reminder',
  'photo',
  'mail',
  'sms',
  'maps',
  'files',
  'wallet',
  'notification',
];

interface Photo {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

interface Props {
  onDemoPress: (key: DemoKey) => void;
  onBatchSaved: (batch: { title: string; detail: string; savedTo: string; batchItems: BatchSubEntry[] }) => void;
}

export default function HomeScreen({ onDemoPress, onBatchSaved }: Props) {
  const { t } = useLanguage();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [batchProcessing, setBatchProcessing] = useState<{ done: number; total: number } | null>(null);
  const [batchReview, setBatchReview] = useState<{ uri: string; result: AnalyzeResponse }[] | null>(null);

  async function pick(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert(t.home.permissionNeededTitle, t.home.permissionNeededBody);
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setPhoto({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
    setResult(null);
    setError(null);
  }

  async function pickMultiple() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t.home.permissionNeededTitle, t.home.permissionNeededBody);
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (picked.canceled || !picked.assets?.length) return;

    setBatchProcessing({ done: 0, total: picked.assets.length });
    const results: { uri: string; result: AnalyzeResponse }[] = [];

    for (let i = 0; i < picked.assets.length; i++) {
      const asset = picked.assets[i];
      const mockCategory = BATCH_MOCK_CYCLE[i % BATCH_MOCK_CYCLE.length];
      try {
        const response = await analyzePhoto(
          { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType },
          mockCategory
        );
        results.push({ uri: asset.uri, result: response });
      } catch (e) {
        results.push({
          uri: asset.uri,
          result: {
            mock: true,
            category: 'other',
            confidence: 0,
            suggested_action: 'none',
            summary: e instanceof Error ? e.message : String(e),
          },
        });
      }
      setBatchProcessing({ done: i + 1, total: picked.assets.length });
    }

    setBatchProcessing(null);
    setBatchReview(results);
  }

  function handleBatchSaved(batchItems: BatchSubEntry[]) {
    setBatchReview(null);
    const counts: Record<string, number> = {};
    for (const item of batchItems) counts[item.savedTo] = (counts[item.savedTo] ?? 0) + 1;
    const detail = Object.entries(counts)
      .map(([to, n]) => `${to} ${n}`)
      .join(' · ');

    onBatchSaved({
      title: fmt(t.home.batchTitleTemplate, { n: batchItems.length }),
      detail,
      savedTo: t.home.batchSavedTo,
      batchItems,
    });
  }

  async function handleAnalyze() {
    if (!photo) return;
    setAnalyzing(true);
    setError(null);
    try {
      const response = await analyzePhoto(photo);
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      if (result.suggested_action === 'contact' && result.contact) {
        await saveContact(result.contact);
        Alert.alert(t.home.saveDoneTitle, t.home.saveContactDoneBody);
      } else if (result.suggested_action === 'calendar' && result.calendar) {
        await saveEventToCalendar(result.calendar);
        Alert.alert(t.home.saveDoneTitle, t.home.saveCalendarDoneBody);
      }
    } catch (e) {
      Alert.alert(t.home.saveFailTitle, e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Snapsist</Text>
      <Text style={styles.subtitle}>{t.home.subtitle}</Text>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionEmoji}>⚡️</Text>
        <View>
          <Text style={styles.sectionHeader}>{t.home.quickDemoHeader}</Text>
          <Text style={styles.sectionLabel}>{t.home.quickDemoSub}</Text>
        </View>
      </View>
      <View style={styles.demoGrid}>
        {DEMO_ORDER.map((key) => (
          <TouchableOpacity key={key} style={styles.demoCard} onPress={() => onDemoPress(key)} activeOpacity={0.7}>
            <View style={styles.demoIconWrap}>
              <Emoji name={DEMO_ICONS[key]} size={30} />
            </View>
            <Text style={styles.demoLabel}>{t.home.demoButtons[key].label}</Text>
            <Text style={styles.demoHint}>{t.home.demoButtons[key].hint}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionEmoji}>🔬</Text>
        <View>
          <Text style={styles.sectionHeader}>{t.home.realAnalysisHeader}</Text>
          <Text style={styles.sectionLabel}>{t.home.realAnalysisSub}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={() => pick('camera')} activeOpacity={0.7}>
          <Text style={styles.buttonText}>{t.home.cameraButton}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => pick('library')} activeOpacity={0.7}>
          <Text style={styles.buttonText}>{t.home.galleryButton}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.multiButton}
        onPress={pickMultiple}
        activeOpacity={0.7}
        disabled={!!batchProcessing}
      >
        {batchProcessing ? (
          <View style={styles.multiProgressRow}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.multiButtonText}>
              {fmt(t.home.multiSelectProgress, { done: batchProcessing.done, total: batchProcessing.total })}
            </Text>
          </View>
        ) : (
          <Text style={styles.multiButtonText}>{t.home.multiSelectButton}</Text>
        )}
      </TouchableOpacity>

      {photo && <Image source={{ uri: photo.uri }} style={styles.preview} />}

      {photo && (
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleAnalyze}
          disabled={analyzing}
          activeOpacity={0.85}
        >
          {analyzing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{t.home.analyzeButton}</Text>
          )}
        </TouchableOpacity>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {result && (
        <View style={styles.card}>
          {result.mock && <Text style={styles.badge}>{t.home.demoModeLabel}</Text>}
          <Text style={styles.cardTitle}>
            {fmt(t.home.classifyLabel, { category: result.category, confidence: Math.round(result.confidence * 100) })}
          </Text>
          {result.summary && <Text style={styles.cardBody}>{result.summary}</Text>}

          {result.contact && (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{t.home.contactName}: {result.contact.name}</Text>
              <Text style={styles.fieldLabel}>{t.home.contactPhone}: {result.contact.phone}</Text>
              <Text style={styles.fieldLabel}>{t.home.contactEmail}: {result.contact.email}</Text>
              <Text style={styles.fieldLabel}>{t.home.contactCompany}: {result.contact.company}</Text>
            </View>
          )}

          {result.calendar && (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{t.home.calendarTitle}: {result.calendar.title}</Text>
              <Text style={styles.fieldLabel}>{t.home.calendarLocation}: {result.calendar.location}</Text>
              <Text style={styles.fieldLabel}>{t.home.calendarStart}: {result.calendar.start_date}</Text>
            </View>
          )}

          {(result.suggested_action === 'contact' || result.suggested_action === 'calendar') && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {result.suggested_action === 'contact' ? t.home.saveToContacts : t.home.saveToCalendar}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <BatchReviewModal items={batchReview} onClose={() => setBatchReview(null)} onSaved={handleBatchSaved} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 14,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#2563eb', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 4 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  sectionEmoji: { fontSize: 20 },
  sectionHeader: { fontSize: 17, fontWeight: '800', color: '#111' },
  sectionLabel: { fontSize: 12, color: '#888', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#eef0f4', marginVertical: 4 },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  demoCard: {
    width: '47%',
    aspectRatio: 1.1,
    backgroundColor: '#f7f8fb',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#eef0f4',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  demoIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoLabel: { fontSize: 15, fontWeight: '700', color: '#111' },
  demoHint: { fontSize: 11.5, color: '#888' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  button: {
    backgroundColor: '#f2f3f6',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
  },
  primaryButton: { backgroundColor: '#2563eb', flex: undefined },
  buttonText: { fontWeight: '700', color: '#222', fontSize: 13.5 },
  multiButton: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe3ff',
    borderStyle: 'dashed',
  },
  multiButtonText: { fontWeight: '700', color: '#2563eb', fontSize: 13.5 },
  multiProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButtonText: { fontWeight: '700', color: '#fff', fontSize: 15 },
  preview: { width: '100%', height: 240, borderRadius: 16, marginTop: 4 },
  error: { color: '#dc2626', marginTop: 8, fontSize: 13 },
  card: {
    marginTop: 4,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#f7f8fb',
    gap: 8,
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fde68a',
    color: '#78350f',
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  cardBody: { fontSize: 14, color: '#444' },
  fieldBlock: { gap: 2 },
  fieldLabel: { fontSize: 13, color: '#444' },
});
