import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { analyzePhoto } from './api';
import { loadSession, Session } from './auth';
import AuthScreen from './AuthScreen';
import BatchReviewModal from './BatchReviewModal';
import { useLanguage } from './i18n/LanguageProvider';
import { t as fmt } from './i18n/dictionaries';
import { resizeForUpload } from './imageResize';
import { persistImage } from './imageStorage';
import { analyzeOnDevice } from './layer0/analyzeOnDevice';
import { getLayer0Support } from './layer0/capability';
import { getLayer1FallbackConsent, setLayer1FallbackConsent } from './layer0/consent';
import { extractPhotoMetadata, PhotoMetadata } from './layer0/metadata';
import { runVisionGate } from './layer0/visionGate';
import { MedicationReminderSlot, saveContact, saveEventToCalendar, saveMedicationReminders, saveReminder } from './nativeActions';
import PricingScreen from './PricingScreen';
import { formatReceiptTable } from './receiptFormat';
import TimeConfirmModal, { TimeSelection } from './TimeConfirmModal';
import { AnalyzeResponse, BatchSubEntry, CalendarPayload, Category, HistoryCategory, HistoryEntry, MealRelation, MedicationPayload, ReplaySpec } from './types';

// Maps a real analysis Category onto the (smaller, UI-facing) HistoryCategory
// used to file a History entry — event_flyer -> 'event', medication ->
// 'reminder' to match existing wording, everything else passes through.
function toHistoryCategory(category: Category): HistoryCategory {
  if (category === 'event_flyer') return 'event';
  if (category === 'medication') return 'reminder';
  return category;
}

interface Photo {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  metadata?: PhotoMetadata;
}

// Shape shared with the OS "Share" sheet handoff (see apps/expo/App.tsx's
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
  onSaved: (info: {
    type: HistoryCategory;
    title: string;
    detail: string;
    savedTo: string;
    imageUri?: string;
    resolvedLayer?: string | null;
    tokensSpent?: number;
    analysisFailed?: boolean;
    replay?: ReplaySpec;
  }) => void;
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
  const [savingDueReminder, setSavingDueReminder] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pricingVisible, setPricingVisible] = useState(false);
  const [timeConfirmVisible, setTimeConfirmVisible] = useState(false);

  const [batchProcessing, setBatchProcessing] = useState<{ done: number; total: number } | null>(null);
  const [batchReview, setBatchReview] = useState<{ uri: string; result: AnalyzeResponse }[] | null>(null);

  // Real photo analysis — on-device or server — now requires an account
  // (undefined = still checking SecureStore, null = signed out). Demos on
  // the other tab are unaffected; they never call this screen.
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [authMode, setAuthMode] = useState<'signup' | 'login' | null>(null);

  useEffect(() => {
    loadSession().then(setSession);
  }, []);

  // Returns false (and prompts sign-in) if there's no session — call this
  // before any real analysis entry point, since the sharedPhotos effect
  // below can trigger one even while the auth-gate screen isn't showing.
  function requireSession(): boolean {
    if (session) return true;
    setAuthMode('signup');
    return false;
  }

  async function pick(source: 'camera' | 'library') {
    if (!requireSession()) return;
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
      exif: true,
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const resized = await resizeForUpload(asset.uri, asset.width, asset.height, asset.mimeType);
    setPhoto({
      uri: resized.uri,
      fileName: asset.fileName,
      mimeType: resized.mimeType,
      metadata: extractPhotoMetadata(asset.exif),
    });
    setResult(null);
    setError(null);
  }

  async function processBatchAssets(assets: SharedAsset[]) {
    setBatchProcessing({ done: 0, total: assets.length });
    const results: { uri: string; result: AnalyzeResponse }[] = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      try {
        const resized = await resizeForUpload(asset.uri, asset.width ?? 0, asset.height ?? 0, asset.mimeType);
        const photo: Photo = { uri: resized.uri, fileName: asset.fileName, mimeType: resized.mimeType };
        // Same Layer 0-first routing as the single-photo flow (resolveAnalysis)
        // — batch used to skip straight to Layer 1 for every photo, which
        // meant a batch of medication/document photos would leave the device
        // even though the same photos picked one at a time never would.
        const response = await resolveAnalysis(photo);
        if (!response) {
          // User declined the Layer 1 fallback prompt for this photo — skip
          // it rather than aborting the whole batch.
          results.push({
            uri: resized.uri,
            result: { mock: false, category: 'other', confidence: 0, suggested_action: 'none', summary: t.batch.skippedLabel },
          });
          setBatchProcessing({ done: i + 1, total: assets.length });
          continue;
        }
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
    if (!requireSession()) return;
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
    if (!requireSession()) return;
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
        if (response.suggested_action === 'none') await logNoActionResult(response, sharedPhoto);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    if (session === undefined) return; // still checking SecureStore for a session
    if (sharedPhotos && sharedPhotos.length) {
      handleSharedPhotos(sharedPhotos).finally(() => onSharedPhotosHandled?.());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedPhotos, session]);

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

  // Tries Layer 0 (on-device) first; only reaches Layer 1/L5c (../api.ts's
  // analyzePhoto, the server — backend/app/pricing.py has the full L0-L5
  // map) when Layer 0 genuinely can't resolve this photo — either the
  // category has no on-device rules yet (business_card/receipt/
  // event_flyer, see layer0/categories.ts — these reach Claude server-side
  // and may spend tokens) or the device/build can't run Layer 0 at all.
  // The latter case is a real capability gap, so it's gated behind the
  // consent prompt below rather than silently falling through. Returns
  // null if the user declined the fallback prompt, or if the vision gate
  // blocked the photo outright.
  async function resolveAnalysis(target: Photo): Promise<AnalyzeResponse | null> {
    // Layer 1 vision blocking gate (visionGate.ts) — on-device, BEFORE any
    // OCR or upload. A Tier 0 photo (ID / payment card / passport / ...)
    // must never leave the device, so a block short-circuits here and
    // nothing downstream ever sees it. `unavailable` (Expo Go, module not
    // yet built, or a non-iOS device — this classifier is iOS-only) falls
    // through untouched to the existing Layer 0/1 flow below.
    const gate = await runVisionGate(target.uri);
    if (gate.kind === 'block') {
      Alert.alert(
        t.home.visionGateBlockedTitle,
        fmt(t.home.visionGateBlockedBodyTemplate, { category: gate.top, percent: Math.round(gate.p * 100) })
      );
      return null;
    }
    if (__DEV__ && gate.kind === 'route') {
      // Visibility while testing: what the on-device model actually routed to.
      console.log(`[visionGate] route -> ${gate.category} (${gate.confidence.toFixed(2)})`, gate.scores);
    }

    const support = getLayer0Support();
    if (support.supported) {
      const outcome = await analyzeOnDevice(target.uri, locale, target.metadata);
      if (outcome.kind === 'blocked') {
        Alert.alert(t.home.sensitiveCardBlockedTitle, t.home.sensitiveCardBlockedBody);
        return null;
      }
      if (outcome.kind === 'resolved') return outcome.response;
      return analyzePhoto(target);
    }

    if (await getLayer1FallbackConsent()) {
      return analyzePhoto(target);
    }

    const choice = await new Promise<'cancel' | 'once' | 'always'>((resolve) => {
      Alert.alert(
        t.home.layer0Unsupported.title,
        t.home.layer0Unsupported.body,
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

  // suggested_action "none" (backend/app/main.py) covers two different
  // things that look the same on the wire: a legitimate "nothing
  // recognizable here" result, and a genuine failed attempt (analysis_failed
  // — Claude errored or returned something unusable, see claude_analysis.py).
  // Neither has a native app to save to, so unlike contact/calendar/reminder
  // (which only reach history once the user taps Save) this logs itself
  // immediately — otherwise a failure would just vanish off-screen with no
  // record it ever happened.
  async function logNoActionResult(response: AnalyzeResponse, target: Photo) {
    const imageUri = await persistImage(target.uri);
    onSaved({
      type: toHistoryCategory(response.category),
      title: t.batch.categoryLabels[response.category],
      detail: response.summary ?? '',
      savedTo: response.analysis_failed ? t.home.savedToFailed : t.home.savedToNoAction,
      imageUri,
      resolvedLayer: response.resolved_layer,
      tokensSpent: response.tokens_spent,
      analysisFailed: response.analysis_failed,
    });
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
        if (response.suggested_action === 'none') await logNoActionResult(response, photo);
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

  // A receipt is normally just "log/share this purchase" — but an invoice
  // with a stated payment deadline (receipt.due_date, see
  // claude_analysis.py's prompt) is also an action item, so this is offered
  // as an extra button alongside the regular save/share one, not a
  // replacement for it. iOS gets a real Reminder (EventKit); Android has no
  // reminders API here, so it becomes a Calendar event instead — same
  // fallback saveReminder() itself already uses elsewhere in this app.
  async function handleAddDueDateReminder() {
    if (!result?.receipt?.due_date || !photo) return;
    const due = new Date(result.receipt.due_date);
    if (Number.isNaN(due.getTime())) return;
    const store = result.receipt.store ?? t.batch.categoryLabels.receipt;
    const title = fmt(t.home.receiptDueTitleTemplate, { store });
    const notes = result.receipt.total ? fmt(t.home.receiptDueNotesTemplate, { total: result.receipt.total }) : undefined;

    setSavingDueReminder(true);
    try {
      if (Platform.OS === 'ios') {
        await saveReminder({ title, notes, dueDate: due });
      } else {
        await saveEventToCalendar({ title, notes, start_date: due.toISOString(), end_date: due.toISOString() });
      }
      Alert.alert(t.home.saveDoneTitle, fmt(t.home.receiptDueDoneBodyTemplate, { date: due.toLocaleDateString() }));
      const imageUri = await persistImage(photo.uri);
      onSaved({
        type: Platform.OS === 'ios' ? 'reminder' : 'event',
        title,
        detail: notes ?? '',
        savedTo: Platform.OS === 'ios' ? t.permissions.items[4].label : t.permissions.items[3].label,
        imageUri,
        resolvedLayer: result.resolved_layer,
        replay:
          Platform.OS === 'ios'
            ? { kind: 'reminder', payload: { title, notes, dueDate: due } }
            : { kind: 'event', payload: { title, notes, start_date: due.toISOString(), end_date: due.toISOString() } },
      });
    } catch (e) {
      Alert.alert(t.home.saveFailTitle, e instanceof Error ? e.message : String(e));
    } finally {
      setSavingDueReminder(false);
    }
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
          resolvedLayer: result.resolved_layer,
          tokensSpent: result.tokens_spent,
          analysisFailed: result.analysis_failed,
          replay: { kind: 'business_card', payload: result.contact },
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
          resolvedLayer: result.resolved_layer,
          tokensSpent: result.tokens_spent,
          analysisFailed: result.analysis_failed,
          replay: { kind: 'event', payload: calendarPayload },
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
          resolvedLayer: result.resolved_layer,
          tokensSpent: result.tokens_spent,
          analysisFailed: result.analysis_failed,
          replay: { kind: 'medication', payload: { slots, durationDays } },
        });
      } else if (result.suggested_action === 'note') {
        // Receipts get the same monospace item-table format ReviewModal's
        // demo receipt preview uses — a real analysis should look like what
        // the demo already showed. Other "note" categories (general
        // documents) just share the AI summary, same as before.
        // Checked on result.receipt alone, not category === 'receipt': Vision's
        // first-pass category guess (backend/app/vision.py) can be wrong (the
        // same photo has flipped between "receipt" and "business_card" in
        // testing) but Claude still correctly recognizes and extracts real
        // receipt content regardless of what category it was told — using
        // its actual output instead of the label it was pre-classified with.
        const receiptTable = result.receipt ? formatReceiptTable(result.receipt, t) : null;
        const message = receiptTable ?? result.summary ?? result.raw_text ?? '';
        await Share.share({ message, title: t.batch.noteShareTitle });
        const imageUri = await persistImage(photo.uri);
        onSaved({
          type: 'receipt',
          // HistoryScreen's row already shows the category label ("영수증")
          // as the primary line — this is the secondary line, so it should
          // be something more specific: the store name when we have one.
          title: result.receipt?.store ?? t.batch.categoryLabels[result.category],
          detail: message,
          savedTo: t.review.shareLabel,
          imageUri,
          resolvedLayer: result.resolved_layer,
          tokensSpent: result.tokens_spent,
          analysisFailed: result.analysis_failed,
          replay: { kind: 'receipt', payload: { message, title: t.batch.noteShareTitle } },
        });
      }
    } catch (e) {
      Alert.alert(t.home.saveFailTitle, e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (session === undefined) {
    return (
      <View style={styles.authLoading}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (session === null) {
    return (
      <View style={styles.authGate}>
        <Text style={styles.authGateEmoji}>🔒</Text>
        <Text style={styles.authGateTitle}>{t.home.authGateTitle}</Text>
        <Text style={styles.authGateBody}>{t.home.authGateBody}</Text>
        <View style={styles.authGateButtons}>
          <TouchableOpacity style={styles.authGatePrimary} onPress={() => setAuthMode('signup')} activeOpacity={0.8}>
            <Text style={styles.authGatePrimaryText}>{t.auth.signupButton}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.authGateSecondary} onPress={() => setAuthMode('login')} activeOpacity={0.8}>
            <Text style={styles.authGateSecondaryText}>{t.auth.loginButton}</Text>
          </TouchableOpacity>
        </View>
        <AuthScreen
          visible={authMode !== null}
          initialMode={authMode ?? 'signup'}
          onClose={() => setAuthMode(null)}
          onAuthed={(s) => {
            setSession(s);
            setAuthMode(null);
          }}
        />
      </View>
    );
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

          {result.receipt && <Text style={styles.receiptPreview}>{formatReceiptTable(result.receipt, t)}</Text>}

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
            result.suggested_action === 'reminder' ||
            result.suggested_action === 'note') && (
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
                      : result.suggested_action === 'reminder'
                        ? t.home.saveToReminder
                        : t.review.shareLabel}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {result.receipt?.due_date && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleAddDueDateReminder}
              disabled={savingDueReminder}
              activeOpacity={0.85}
            >
              {savingDueReminder ? (
                <ActivityIndicator color="#2563eb" />
              ) : (
                <Text style={styles.secondaryButtonText}>
                  {fmt(t.home.receiptDueButtonTemplate, { date: new Date(result.receipt.due_date).toLocaleDateString() })}
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
  authLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  authGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 32,
    gap: 8,
  },
  authGateEmoji: { fontSize: 40, marginBottom: 6 },
  authGateTitle: { fontSize: 19, fontWeight: '800', color: '#111', textAlign: 'center' },
  authGateBody: { fontSize: 13.5, color: '#777', textAlign: 'center', lineHeight: 19, marginTop: 2 },
  authGateButtons: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  authGatePrimary: { flex: 1, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  authGatePrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  authGateSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  authGateSecondaryText: { color: '#333', fontWeight: '700', fontSize: 14 },
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
  secondaryButton: {
    backgroundColor: '#fff',
    flex: undefined,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    marginTop: 8,
  },
  secondaryButtonText: { fontWeight: '700', color: '#2563eb', fontSize: 13.5 },
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
  receiptPreview: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: '#f7f8fb',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
});
