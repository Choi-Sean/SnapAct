import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import HistoryScreen from './src/HistoryScreen';
import HomeScreen from './src/HomeScreen';
import { addHistoryEntry, clearHistory, loadHistory } from './src/history';
import OnboardingScreen from './src/OnboardingScreen';
import PermissionsScreen from './src/PermissionsScreen';
import ReviewModal from './src/ReviewModal';
import { DemoKey, HistoryEntry } from './src/types';

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

type Tab = 'home' | 'history' | 'settings';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'home', icon: '🏠', label: '홈' },
  { key: 'history', icon: '🗂️', label: '기록' },
  { key: 'settings', icon: '⚙️', label: '설정' },
];

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [reviewKey, setReviewKey] = useState<DemoKey | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

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

  async function handleSaved(info: {
    title: string;
    detail: string;
    savedTo: string;
    fields?: { label: string; value: string }[];
  }) {
    const key = reviewKey;
    setReviewKey(null);
    if (!key) return;

    if (info.savedTo === '오류') {
      Alert.alert('실패', info.detail);
      return;
    }

    const updated = await addHistoryEntry({
      type: key,
      title: info.title,
      detail: info.detail,
      savedTo: info.savedTo,
      fields: info.fields,
    });
    setHistory(updated);
    Alert.alert('완료', `${info.savedTo}에 저장했어요.`);
  }

  async function handleClearHistory() {
    await clearHistory();
    setHistory([]);
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="auto" />
      {tab === 'home' && <HomeScreen onDemoPress={setReviewKey} />}
      {tab === 'history' && <HistoryScreen entries={history} onClear={handleClearHistory} />}
      {tab === 'settings' && <PermissionsScreen />}

      <ReviewModal demoKey={reviewKey} onClose={() => setReviewKey(null)} onSaved={handleSaved} />

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={styles.tabItem} onPress={() => setTab(t.key)}>
            <View style={[styles.tabPill, tab === t.key && styles.tabPillActive]}>
              <Text style={styles.tabIcon}>{t.icon}</Text>
            </View>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
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
