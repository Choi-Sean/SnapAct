import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
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
import { useLanguage } from './i18n/LanguageProvider';
import { t as fmt } from './i18n/dictionaries';
import { resizeForUpload } from './imageResize';
import { persistImage } from './imageStorage';
import { analyzeOnDevice } from './layer0/analyzeOnDevice';
import { runVisionGate } from './layer0/visionGate';
import { getLayer0Support } from './layer0/capability';
import { LAYER1_TOKEN_COST } from './layer0/categories';
import { getLayer1FallbackConsent, setLayer1FallbackConsent } from './layer0/consent';
import { MedicationReminderSlot, saveContact, saveEventToCalendar, saveMedicationReminders } from './nativeActions';
import PricingScreen from './PricingScreen';
import TimeConfirmModal, { TimeSelection } from './TimeConfirmModal';
import { AnalyzeResponse, BatchSubEntry, CalendarPayload, Category, DemoKey, HistoryEntry, MealRelation, MedicationPayload } from './types';

const BATCH_MOCK_CYCLE: Category[] = ['business_card', 'event_flyer', 'receipt', 'document'];

interface Photo {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

// Shape shared with the OS "Share" sheet handoff (see mobile/App.tsx's
// useShareIntent() call) — width/height let resizeForUpload skip a decode step.
export interface SharedAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
}

interface Props {
  history: HistoryEntry[];
  onBatchSaved: (batch: { title: string; detail: string; savedTo: string; batchItems: BatchSubEntry[] }) => void;
  onSaved: (info: { type: DemoKey; title: string; detail: string; savedTo: string; imageUri?: string }) => void;
  // Set by App.tsx when the user shared photo(s) into Snapsist from the OS
  // share sheet. AnalyzeScreen consumes it immediately (auto-analyze, no
  // extra taps) and calls onSharedPhotosHandled() to clear it upstream.
  sharedPhotos?: SharedAsset[] | null;
  onSharedPhotosHandled?: () => void;
}

export default function AnalyzeScreen({ history, onBatchSaved, onSaved, sharedPhotos, onSharedPhotosHandled }: Props) {
  const { t, locale } = useLanguage();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pricingVisible, setPricingVisible] = useState(false);
  const [timeConfirmVisible, setTimeConfirmVisible] = useState(false);

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
    const resized = await resizeForUpload(asset.uri, asset.width, asset.height, asset.mimeType);
    setPhoto({ uri: resized.uri, fileName: asset.fileName, mimeType: resized.mimeType });
    setResult(null);
    setError(null);
  }

  async function processBatchAssets(assets: SharedAsset[]) {
    setBatchProcessing({ done: 0, total: assets.length });
    const results: { uri: string; result: AnalyzeResponse }[] = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const mockCategory = BATCH_MOCK_CYCLE[i % BATCH_MOCK_CYCLE.length];
      try {
        const resized = await resizeForUpload(asset.uri, asset.width ?? 0, asset.height ?? 0, asset.mimeType);
        const response = await analyzePhoto(
          { uri: resized.uri, fileName: asset.fileName, mimeType: resized.mimeType },
          mockCategory
        );
        results.push({ uri: resized.uri, result: response });
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
      setBatchProcessing({ done: i + 1, total: assets.length });
    }

    setBatchProcessing(null);
    setBatchReview(results);
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

    await processBatchAssets(
      picked.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
      }))
    );
  }

  // Auto-triggered when the user shares photo(s) into Snapsist from the OS
  // share sheet (see the sharedPhotos effect below) — no extra taps, per the
  // core "share -> instant analysis" product requirement.
  async function handleSharedPhotos(assets: SharedAsset[]) {
    if (!assets.length) return;
    if (assets.length > 1) {
      await processBatchAssets(assets);
      return;
    }
    const asset = assets[0];
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const resized = await resizeForUpload(asset.uri, asset.width ?? 0, asset.height ?? 0, asset.mimeType);
      const sharedPhoto: Photo = { uri: resized.uri, fileName: asset.fileName, mimeType: resized.mimeType };
      setPhoto(sharedPhoto);
      const response = await resolveAnalysis(sharedPhoto);
      if (!response) return;
      if (response.requires_tokens) {
        setResult(null);
        setPricingVisible(true);
      } else {
        setResult(response);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    if (sharedPhotos && sharedPhotos.length) {
      handleSharedPhotos(sharedPhotos).finally(() => onSharedPhotosHandled?.());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedPhotos]);

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

  // Tries Layer 0 (on-device) first; only reaches Layer 1 (../api.ts's
  // analyzePhoto, the server) when Layer 0 genuinely can't resolve this
  // photo — either the category needs Claude (business_card/receipt/
  // event_flyer, see layer0/categories.ts) or the device/build can't run
  // Layer 0 at all. The latter case is a real capability gap, so it's
  // gated behind the consent prompt below rather than silently falling
  // through. Returns null if the user declined the fallback prompt.
  async function resolveAnalysis(target: Photo): Promise<AnalyzeResponse | null> {
    // Layer 1 vision blocking gate — on-device, BEFORE any OCR or upload.
    // A Tier 0 photo (ID / payment card / passport / ...) must never leave the
    // device, so a block short-circuits here and nothing is sent to the server.
    // `unavailable` (Expo Go, or module not yet built) falls through untouched.
    const gate = await runVisionGate(target.uri);
    if (gate.kind === 'block') {
      Alert.alert(
        'Blocked on device',
        `This photo was classified as sensitive (${gate.top}, ${(gate.p * 100).toFixed(0)}%) ` +
          `and was NOT uploaded.\n\n${gate.reason}`
      );
      return null;
    }
    if (__DEV__ && gate.kind === 'route') {
      // Visibility while testing: show what the on-device model routed to.
      console.log(`[visionGate] route → ${gate.category} (${gate.confidence.toFixed(2)})`, gate.scores);
    }

    const support = getLayer0Support();
    if (support.supported) {
      const onDeviceResult = await analyzeOnDevice(target.uri, locale);
      if (onDeviceResult) return onDeviceResult;
      return analyzePhoto(target);
    }

    if (await getLayer1FallbackConsent()) {
      return analyzePhoto(target);
    }

    const choice = await new Promise<'cancel' | 'once' | 'always'>((resolve) => {
      Alert.alert(
        t.home.layer0Unsupported.title,
        fmt(t.home.layer0Unsupported.bodyTemplate, { n: LAYER1_TOKEN_COST }),
        [
          { text: t.home.layer0Unsupported.cancelButton, style: 'cancel', onPress: () => resolve('cancel') },
          { text: t.home.layer0Unsupported.onceButton, onPress: () => resolve('once') },
          { text: t.home.layer0Unsupported.alwaysButton, onPress: () => resolve('always') },
        ]
      );
    });

    if (choice === 'cancel') return null;
    if (choice === 'always') await setLayer1FallbackConsent(true);
    return analyzePhoto(target);
  }

  async function handleAnalyze() {
    if (!photo) return;
    setAnalyzing(true);
    setError(null);
    try {
      const response = await resolveAnalysis(photo);
      if (!response) return;
      if (response.requires_tokens) {
        setResult(null);
        setPricingVisible(true);
      } else {
        setResult(response);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  function mealRelationLabel(relation: MealRelation | null | undefined): string | null {
    switch (relation) {
      case 'before_meal':
        return t.home.medicationTimingBeforeMeal;
      case 'after_meal':
        return t.home.medicationTimingAfterMeal;
      case 'with_meal':
        return t.home.medicationTimingWithMeal;
      default:
        return null;
    }
  }

  function buildMedicationSlots(medication: MedicationPayload, chosenTimes?: TimeSelection[]): MedicationReminderSlot[] {
    const name = medication.name ?? t.home.medicationName;
    const noteParts: string[] = [];
    if (medication.dosage) noteParts.push(medication.dosage);
    const timingLabel = mealRelationLabel(medication.relation_to_meal);
    if (timingLabel) noteParts.push(timingLabel);
    const notes = noteParts.length ? noteParts.join(' · ') : undefined;

    function slotTitle(index: number, total: number) {
      return total > 1 ? `${name} (${fmt(t.home.timeConfirm.doseLabelTemplate, { n: index + 1 })})` : name;
    }

    if (medication.specific_times?.length) {
      const times = medication.specific_times;
      return times.map((hhmm, i) => {
        const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
        return { hour: h || 0, minute: m || 0, title: slotTitle(i, times.length), notes };
      });
    }

    const times = chosenTimes ?? [];
    return times.map((time, i) => ({ hour: time.hour, minute: time.minute, title: slotTitle(i, times.length), notes }));
  }

  function applyTimeToCalendar(calendar: CalendarPayload, time: TimeSelection): CalendarPayload {
    const base = calendar.start_date ? new Date(calendar.start_date) : new Date();
    base.setHours(time.hour, time.minute, 0, 0);
    const end = new Date(base.getTime() + 60 * 60 * 1000);
    return { ...calendar, start_date: base.toISOString(), end_date: end.toISOString() };
  }

  async function handleSave() {
    if (!result) return;
    if (result.needs_time_selection && (result.suggested_action === 'calendar' || result.suggested_action === 'reminder')) {
      setTimeConfirmVisible(true);
      return;
    }
    await doSave();
  }

  async function handleTimeConfirm(times: TimeSelection[]) {
    setTimeConfirmVisible(false);
    await doSave(times);
  }

  async function doSave(times?: TimeSelection[]) {
    if (!result || !photo) return;
    setSaving(true);
    try {
      if (result.suggested_action === 'contact' && result.contact) {
        await saveContact(result.contact);
        Alert.alert(t.home.saveDoneTitle, t.home.saveContactDoneBody);
        const imageUri = await persistImage(photo.uri);
        onSaved({
          type: 'business_card',
          title: result.contact.name ?? t.permissions.items[2].label,
          detail: result.contact.phone ?? '',
          savedTo: t.permissions.items[2].label,
          imageUri,
        });
      } else if (result.suggested_action === 'calendar' && result.calendar) {
        const calendarPayload = times?.length ? applyTimeToCalendar(result.calendar, times[0]) : result.calendar;
        await saveEventToCalendar(calendarPayload);
        Alert.alert(t.home.saveDoneTitle, t.home.saveCalendarDoneBody);
        const imageUri = await persistImage(photo.uri);
        onSaved({
          type: 'event',
          title: calendarPayload.title ?? t.permissions.items[3].label,
          detail: calendarPayload.location ?? '',
          savedTo: t.permissions.items[3].label,
          imageUri,
        });
      } else if (result.suggested_action === 'reminder' && result.medication) {
        const durationDays = result.medication.duration_days ?? 30;
        const slots = buildMedicationSlots(result.medication, times);
        await saveMedicationReminders(slots, durationDays);
        Alert.alert(t.home.saveDoneTitle, fmt(t.home.saveReminderDoneBodyTemplate, { n: durationDays }));
        const imageUri = await persistImage(photo.uri);
        onSaved({
          type: 'reminder',
          title: result.medication.name ?? t.home.medicationName,
          detail: result.medication.dosage ?? '',
          savedTo: t.permissions.items[4].label,
          imageUri,
        });
      }
    } catch (e) {
      Alert.alert(t.home.saveFailTitle, e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

          {result.medication && (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{t.home.medicationName}: {result.medication.name}</Text>
              <Text style={styles.fieldLabel}>{t.home.medicationDosage}: {result.medication.dosage}</Text>
              {result.medication.times_per_day != null && (
                <Text style={styles.fieldLabel}>
                  {fmt(t.home.medicationFrequencyTemplate, { n: result.medication.times_per_day })}
                </Text>
              )}
              {result.medication.duration_days != null && (
                <Text style={styles.fieldLabel}>
                  {fmt(t.home.medicationDurationTemplate, { n: result.medication.duration_days })}
                </Text>
              )}
              <Text style={styles.fieldLabel}>{mealRelationLabel(result.medication.relation_to_meal) ?? t.home.medicationTimingUnspecified}</Text>
            </View>
          )}

          {(result.suggested_action === 'contact' ||
            result.suggested_action === 'calendar' ||
            result.suggested_action === 'reminder') && (
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
                  {result.suggested_action === 'contact'
                    ? t.home.saveToContacts
                    : result.suggested_action === 'calendar'
                      ? t.home.saveToCalendar
                      : t.home.saveToReminder}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <BatchReviewModal items={batchReview} onClose={() => setBatchReview(null)} onSaved={handleBatchSaved} />
      <PricingScreen visible={pricingVisible} onClose={() => setPricingVisible(false)} onGetStarted={() => setPricingVisible(false)} />
      <TimeConfirmModal
        visible={timeConfirmVisible}
        slotCount={result?.suggested_action === 'reminder' ? result.medication?.times_per_day ?? 1 : 1}
        subtitle={
          result?.suggested_action === 'reminder' ? t.home.timeConfirm.subtitleMedication : t.home.timeConfirm.subtitleEvent
        }
        onCancel={() => setTimeConfirmVisible(false)}
        onConfirm={handleTimeConfirm}
      />
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
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionEmoji: { fontSize: 20 },
  sectionHeader: { fontSize: 17, fontWeight: '800', color: '#111' },
  sectionLabel: { fontSize: 12, color: '#888', marginTop: 1 },
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
