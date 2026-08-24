import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useShareIntent } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AnalyzeScreen, { SharedAsset } from './src/AnalyzeScreen';
import DemoScreen from './src/DemoScreen';
import HistoryScreen from './src/HistoryScreen';
import { addHistoryEntry, clearHistory, deleteHistoryEntry, loadHistory } from './src/history';
import { LanguageProvider, useLanguage } from './src/i18n/LanguageProvider';
import OnboardingScreen from './src/OnboardingScreen';
import PermissionsScreen from './src/PermissionsScreen';
import ReviewModal from './src/ReviewModal';
import { BatchSubEntry, DemoKey, HistoryEntry } from './src/types';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ONBOARDED_KEY = 'snapsist_onboarded';
const SAVE_ERROR = '__error__';

type Tab = 'demo' | 'analyze' | 'history' | 'settings';

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

function AppInner() {
  const { t } = useLanguage();
  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: 'demo', icon: '⚡️', label: t.tabs.demo },
    { key: 'analyze', icon: '🔬', label: t.tabs.analyze },
    { key: 'history', icon: '🗂️', label: t.tabs.history },
    { key: 'settings', icon: '⚙️', label: t.tabs.settings },
  ];

  const [appReady, setAppReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState<Tab>('demo');
  const [reviewKey, setReviewKey] = useState<DemoKey | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sharedPhotos, setSharedPhotos] = useState<SharedAsset[] | null>(null);

  // Wires the OS "Share" sheet directly into the Analyze tab: picking
  // Snapsist from Photos' share button lands here with hasShareIntent=true
  // and the shared image(s) already on disk, ready to hand to AnalyzeScreen.
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    if (!hasShareIntent || !shareIntent.files?.length) return;
    const images = shareIntent.files.filter((f) => f.mimeType?.startsWith('image/'));
    if (!images.length) {
      resetShareIntent();
      return;
    }
    setSharedPhotos(
      images.map((f) => ({ uri: f.path, fileName: f.fileName, mimeType: f.mimeType, width: f.width, height: f.height }))
    );
    setTab('analyze');
  }, [hasShareIntent, shareIntent]);

  useEffect(() => {
    Promise.all([loadHistory(), AsyncStorage.getItem(ONBOARDED_KEY), new Promise((r) => setTimeout(r, 700))]).then(
      ([entries, onboardedFlag]) => {
        setHistory(entries as HistoryEntry[]);
        setOnboarded(onboardedFlag === 'true');
        setAppReady(true);
      }
    );
  }, []);

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) return null;

  async function handleOnboardingDone() {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    setOnboarded(true);
  }

  if (!onboarded) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="auto" />
        <OnboardingScreen onDone={handleOnboardingDone} />
      </SafeAreaView>
    );
  }

  // Demo tab saves (ReviewModal's fixed showcase data, and DemoScreen's
  // batch demo below) never touch history — only real, logged-in analysis
  // does (see AnalyzeScreen's auth gate + handleAnalyzeSaved/handleBatchSaved).
  // The native side effect (Contacts/Calendar/Reminders write) already
  // happened before onSaved fires, so this just clears the modal and confirms.
  async function handleSaved(info: {
    title: string;
    detail: string;
    savedTo: string;
    fields?: { label: string; value: string }[];
    replay?: { kind: DemoKey; payload: unknown };
  }) {
    const key = reviewKey;
    setReviewKey(null);
    if (!key) return;

    if (info.savedTo === SAVE_ERROR) {
      Alert.alert(t.review.failTitle, info.detail);
      return;
    }

    Alert.alert(t.review.saveDoneTitle, t.review.saveDoneBodyTemplate.replace('{savedTo}', info.savedTo));
  }

  async function handleClearHistory() {
    await clearHistory();
    setHistory([]);
  }

  async function handleDeleteEntry(id: string) {
    const updated = await deleteHistoryEntry(id);
    setHistory(updated);
  }

  async function handleAnalyzeSaved(info: {
    type: DemoKey;
    title: string;
    detail: string;
    savedTo: string;
    imageUri?: string;
    resolvedLayer?: string | null;
  }) {
    const updated = await addHistoryEntry({
      type: info.type,
      title: info.title,
      detail: info.detail,
      savedTo: info.savedTo,
      imageUri: info.imageUri,
      resolvedLayer: info.resolvedLayer,
    });
    setHistory(updated);
  }

  // Real analyze-tab batch saves — logged-in only (AnalyzeScreen's auth
  // gate), so these do get written to history.
  async function handleBatchSaved(batch: { title: string; detail: string; savedTo: string; batchItems: BatchSubEntry[] }) {
    const updated = await addHistoryEntry({
      type: 'batch',
      title: batch.title,
      detail: batch.detail,
      savedTo: batch.savedTo,
      batchItems: batch.batchItems,
    });
    setHistory(updated);
    Alert.alert(
      t.home.batchDoneTitle,
      t.home.batchDoneBodyTemplate.replace('{n}', String(batch.batchItems.length))
    );
  }

  // Demo tab's batch demo (canned data, DemoScreen's "batch demo" card) —
  // never written to history, same as handleSaved above.
  function handleDemoBatchSaved(batch: { title: string; detail: string; savedTo: string; batchItems: BatchSubEntry[] }) {
    Alert.alert(
      t.home.batchDoneTitle,
      t.home.batchDoneBodyTemplate.replace('{n}', String(batch.batchItems.length))
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="auto" />
      {tab === 'demo' && <DemoScreen onDemoPress={setReviewKey} onBatchSaved={handleDemoBatchSaved} />}
      {tab === 'analyze' && (
        <AnalyzeScreen
          history={history}
          onBatchSaved={handleBatchSaved}
          onSaved={handleAnalyzeSaved}
          sharedPhotos={sharedPhotos}
          onSharedPhotosHandled={() => {
            setSharedPhotos(null);
            resetShareIntent();
          }}
        />
      )}
      {tab === 'history' && (
        <HistoryScreen entries={history} onClear={handleClearHistory} onDelete={handleDeleteEntry} />
      )}
      {tab === 'settings' && <PermissionsScreen />}

      <ReviewModal demoKey={reviewKey} onClose={() => setReviewKey(null)} onSaved={handleSaved} />

      <View style={styles.tabBar}>
        {TABS.map((tabItem) => (
          <TouchableOpacity key={tabItem.key} style={styles.tabItem} onPress={() => setTab(tabItem.key)}>
            <View style={[styles.tabPill, tab === tabItem.key && styles.tabPillActive]}>
              <Text style={styles.tabIcon}>{tabItem.icon}</Text>
            </View>
            <Text style={[styles.tabLabel, tab === tabItem.key && styles.tabLabelActive]}>{tabItem.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eef0f4',
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabPill: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: { backgroundColor: '#e8edfd' },
  tabIcon: { fontSize: 17 },
  tabLabel: { fontSize: 11, color: '#9aa0ab', fontWeight: '600' },
  tabLabelActive: { color: '#2563eb' },
});
