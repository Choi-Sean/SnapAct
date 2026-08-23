import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { clearSession, deleteAccount, getAccountSummary, loadSession, Session } from './auth';
import AuthScreen from './AuthScreen';
import { WEB_BASE_URL } from './config';
import { Emoji, EmojiName } from './Emoji';
import { useLanguage } from './i18n/LanguageProvider';
import { Locale, LOCALE_LABELS, t as fmt } from './i18n/dictionaries';
import { getLayer0Support, Layer0Support } from './layer0/capability';
import { getLayer1FallbackConsent, setLayer1FallbackConsent } from './layer0/consent';
import PricingScreen from './PricingScreen';

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
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<'signup' | 'login' | null>(null);
  const [pricingVisible, setPricingVisible] = useState(false);
  const [layer0Support, setLayer0Support] = useState<Layer0Support | null>(null);
  const [fallbackConsent, setFallbackConsent] = useState(false);

  useEffect(() => {
    setLayer0Support(getLayer0Support());
    getLayer1FallbackConsent().then(setFallbackConsent);
  }, []);

  async function handleRevokeFallbackConsent() {
    await setLayer1FallbackConsent(false);
    setFallbackConsent(false);
    Alert.alert(t.permissions.layer0RevokedTitle, t.permissions.layer0RevokedBody);
  }

  useEffect(() => {
    loadSession().then((s) => {
      setSession(s);
      if (s) {
        getAccountSummary(s.token)
          .then((summary) => setSession({ ...s, token_balance: summary.token_balance }))
          .catch(() => {});
      }
    });
  }, []);

  async function handleLogout() {
    await clearSession();
    setSession(null);
  }

  function handleDeleteAccount() {
    if (!session) return;
    Alert.alert(t.account.deleteConfirmTitle, t.account.deleteConfirmBody, [
      { text: t.review.cancelButton, style: 'cancel' },
      {
        text: t.account.deleteAccountButton,
        style: 'destructive',
        onPress: async () => {
          await deleteAccount(session.token);
          setSession(null);
        },
      },
    ]);
  }

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

  const LEGAL_LINKS = [
    { label: t.permissions.legalTerms, path: '/terms' },
    { label: t.permissions.legalPrivacy, path: '/privacy' },
    { label: t.permissions.legalRefund, path: '/refund' },
    { label: t.permissions.legalChildSafety, path: '/child-safety' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t.permissions.title}</Text>

      <View style={styles.accountCard}>
        {session ? (
          <>
            <View style={styles.accountRow}>
              <View style={[styles.avatar]}>
                <Text style={styles.avatarText}>{session.email.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountEmail}>{session.email}</Text>
                <Text style={styles.accountPlan}>
                  {fmt(t.account.tokenBalanceTemplate, { n: session.token_balance })}
                </Text>
              </View>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logoutText}>{t.account.logout}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.pricingLink} onPress={() => setPricingVisible(true)}>
              <Text style={styles.pricingLinkText}>{t.account.buyTokens}</Text>
            </TouchableOpacity>
            <View style={styles.accountDangerRow}>
              <TouchableOpacity onPress={handleDeleteAccount}>
                <Text style={styles.accountDangerText}>{t.account.deleteAccountButton}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.accountTitle}>{t.account.signedOutTitle}</Text>
            <Text style={styles.accountSubtitle}>{t.account.signedOutSubtitle}</Text>
            <View style={styles.accountButtons}>
              <TouchableOpacity style={styles.accountButtonPrimary} onPress={() => setAuthMode('signup')}>
                <Text style={styles.accountButtonPrimaryText}>{t.auth.signupButton}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.accountButtonSecondary} onPress={() => setAuthMode('login')}>
                <Text style={styles.accountButtonSecondaryText}>{t.auth.loginButton}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.pricingLink} onPress={() => setPricingVisible(true)}>
              <Text style={styles.pricingLinkText}>{t.account.viewPricing}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

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
                <View style={styles.grantedCol}>
                  <View style={[styles.badge, styles.badgeGranted]}>
                    <Text style={styles.badgeTextGranted}>{STATUS_LABEL[status]}</Text>
                  </View>
                  <TouchableOpacity onPress={() => Linking.openSettings()}>
                    <Text style={styles.manageText}>{t.permissions.manageButton}</Text>
                  </TouchableOpacity>
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

      {((layer0Support && !layer0Support.supported) || fallbackConsent) && (
        <View style={styles.layer0Section}>
          <Text style={styles.layer0Title}>{t.permissions.layer0Title}</Text>
          {layer0Support && !layer0Support.supported && (
            <Text style={styles.layer0Body}>{t.permissions.layer0UnsupportedBody}</Text>
          )}
          {fallbackConsent && (
            <>
              <Text style={styles.layer0Body}>{t.permissions.layer0ConsentedNote}</Text>
              <TouchableOpacity onPress={handleRevokeFallbackConsent}>
                <Text style={styles.layer0RevokeText}>{t.permissions.layer0RevokeButton}</Text>
              </TouchableOpacity>
            </>
          )}
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

      <View style={styles.legalSection}>
        <Text style={styles.legalTitle}>{t.permissions.legalTitle}</Text>
        {LEGAL_LINKS.map((link) => (
          <TouchableOpacity
            key={link.path}
            style={styles.legalRow}
            onPress={() => Linking.openURL(`${WEB_BASE_URL}${link.path}`)}
          >
            <Text style={styles.legalRowText}>{link.label}</Text>
            <Text style={styles.legalRowChevron}>›</Text>
          </TouchableOpacity>
        ))}
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
      <PricingScreen
        visible={pricingVisible}
        onClose={() => setPricingVisible(false)}
        onGetStarted={() => {
          setPricingVisible(false);
          if (!session) setAuthMode('signup');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 14, color: '#666' },
  accountCard: {
    backgroundColor: '#f7f8fb',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  accountEmail: { fontSize: 14.5, fontWeight: '700', color: '#111' },
  accountPlan: { fontSize: 12, color: '#2563eb', fontWeight: '700', marginTop: 1 },
  logoutText: { fontSize: 12.5, color: '#dc2626', fontWeight: '700' },
  accountTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  accountSubtitle: { fontSize: 12.5, color: '#777' },
  accountButtons: { flexDirection: 'row', gap: 8, marginTop: 4 },
  accountButtonPrimary: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  accountButtonPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  accountButtonSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  accountButtonSecondaryText: { color: '#333', fontWeight: '700', fontSize: 13 },
  pricingLink: { alignSelf: 'flex-start', marginTop: 2 },
  pricingLinkText: { color: '#2563eb', fontWeight: '700', fontSize: 12.5 },
  accountDangerRow: { flexDirection: 'row', gap: 18, marginTop: 8 },
  accountDangerText: { color: '#dc2626', fontWeight: '600', fontSize: 11.5 },
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
  grantedCol: { alignItems: 'flex-end', gap: 4 },
  badge: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  badgeGranted: { backgroundColor: '#dcfce7' },
  badgeTextGranted: { color: '#15803d', fontWeight: '700', fontSize: 12 },
  manageText: { color: '#888', fontWeight: '600', fontSize: 11 },
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
  layer0Section: {
    gap: 6,
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde8cd',
  },
  layer0Title: { fontSize: 14, fontWeight: '800', color: '#111' },
  layer0Body: { fontSize: 12.5, color: '#9a5b1f', lineHeight: 18 },
  layer0RevokeText: { fontSize: 12.5, color: '#2563eb', fontWeight: '700', marginTop: 2 },
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
  legalSection: { gap: 2, marginTop: 4 },
  legalTitle: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 8 },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f3f6',
  },
  legalRowText: { fontSize: 13.5, color: '#333', fontWeight: '600' },
  legalRowChevron: { fontSize: 16, color: '#bbb' },
});
