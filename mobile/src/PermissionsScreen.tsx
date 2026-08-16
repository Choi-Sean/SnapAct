import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Emoji, EmojiName } from './Emoji';
import { useLanguage } from './i18n/LanguageProvider';
import { Locale, LOCALE_LABELS } from './i18n/dictionaries';

type Status = 'granted' | 'denied' | 'undetermined' | 'checking';

interface PermissionItem {
  key: string;
  icon: EmojiName;
  check: () => Promise<{ status: string }>;
  request: () => Promise<{ status: string }>;
}

const ITEMS: PermissionItem[] = [
  {
    key: 'camera',
    icon: 'camera',
    check: ImagePicker.getCameraPermissionsAsync,
    request: ImagePicker.requestCameraPermissionsAsync,
  },
  {
    key: 'library',
    icon: 'photos',
    check: ImagePicker.getMediaLibraryPermissionsAsync,
    request: ImagePicker.requestMediaLibraryPermissionsAsync,
  },
  {
    key: 'contacts',
    icon: 'contacts',
    check: Contacts.getPermissionsAsync,
    request: Contacts.requestPermissionsAsync,
  },
  {
    key: 'calendar',
    icon: 'calendar',
    check: () => Calendar.getCalendarPermissions(),
    request: () => Calendar.requestCalendarPermissions(),
  },
  {
    key: 'reminders',
    icon: 'reminders',
    check: () => Calendar.getRemindersPermissions(),
    request: () => Calendar.requestRemindersPermissions(),
  },
];

const LOCALES: Locale[] = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de'];

export default function PermissionsScreen() {
  const { t, locale, setLocale } = useLanguage();
  const STATUS_LABEL: Record<Status, string> = {
    granted: t.permissions.statusGranted,
    denied: t.permissions.statusDenied,
    undetermined: t.permissions.statusUndetermined,
    checking: t.permissions.statusChecking,
  };
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [requestingKey, setRequestingKey] = useState<string | null>(null);

  async function refresh() {
    const entries = await Promise.all(
      ITEMS.map(async (item) => {
        try {
          const res = await item.check();
          return [item.key, res.status as Status] as const;
        } catch {
          return [item.key, 'undetermined' as Status] as const;
        }
      })
    );
    setStatuses(Object.fromEntries(entries));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleRequest(item: PermissionItem) {
    setRequestingKey(item.key);
    try {
      await item.request();
    } catch {
      // ignore — status refresh below reflects the outcome either way
    }
    await refresh();
    setRequestingKey(null);
  }

  const deniedCount = ITEMS.filter((i) => statuses[i.key] === 'denied').length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.permissions.title}</Text>
      <Text style={styles.subtitle}>{t.permissions.subtitle}</Text>

      <View style={styles.list}>
        {ITEMS.map((item, i) => {
          const status = statuses[item.key] ?? 'checking';
          const granted = status === 'granted';
          const label = t.permissions.items[i];
          return (
            <View key={item.key} style={styles.row}>
              <Emoji name={item.icon} size={28} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{label.label}</Text>
                <Text style={styles.rowHint}>{label.hint}</Text>
              </View>
              {status === 'checking' ? (
                <ActivityIndicator size="small" color="#999" />
              ) : granted ? (
                <View style={[styles.badge, styles.badgeGranted]}>
                  <Text style={styles.badgeTextGranted}>{STATUS_LABEL[status]}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.grantButton}
                  onPress={() => handleRequest(item)}
                  disabled={requestingKey !== null}
                >
                  {requestingKey === item.key ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.grantButtonText}>{t.permissions.grantButton}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {deniedCount > 0 && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{t.permissions.notice}</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>{t.permissions.openSettingsButton}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.langSection}>
        <Text style={styles.langTitle}>{t.permissions.languageTitle}</Text>
        <View style={styles.langGrid}>
          {LOCALES.map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.langChip, locale === l && styles.langChipActive]}
              onPress={() => setLocale(l)}
            >
              <Text style={[styles.langChipText, locale === l && styles.langChipTextActive]}>
                {LOCALE_LABELS[l]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 14, color: '#666' },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f7f8fb',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  rowIcon: { marginRight: 2 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: '#111' },
  rowHint: { fontSize: 12, color: '#777', marginTop: 1 },
  badge: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  badgeGranted: { backgroundColor: '#dcfce7' },
  badgeTextGranted: { color: '#15803d', fontWeight: '700', fontSize: 12 },
  grantButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  grantButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  notice: {
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fde8cd',
  },
  noticeText: { fontSize: 13, color: '#9a5b1f', lineHeight: 18 },
  settingsButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  settingsButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  langSection: { gap: 10, marginTop: 4 },
  langTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: {
    backgroundColor: '#f2f3f6',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  langChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  langChipText: { fontSize: 13, fontWeight: '700', color: '#444' },
  langChipTextActive: { color: '#fff' },
});
