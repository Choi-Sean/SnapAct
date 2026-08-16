import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Emoji, EmojiName } from './Emoji';
import { useLanguage } from './i18n/LanguageProvider';
import { requestAllPermissions } from './permissions';

const ICONS: EmojiName[] = ['camera', 'photos', 'contacts', 'calendar', 'reminders'];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const { t } = useLanguage();
  const [requesting, setRequesting] = useState(false);

  async function handleStart() {
    setRequesting(true);
    await requestAllPermissions();
    setRequesting(false);
    onDone();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>✨</Text>
      <Text style={styles.title}>Snapsist</Text>
      <Text style={styles.subtitle}>{t.onboarding.subtitle}</Text>

      <View style={styles.list}>
        {t.onboarding.permissions.map((p, i) => (
          <View key={p.label} style={styles.row}>
            <Emoji name={ICONS[i]} size={30} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{p.label}</Text>
              <Text style={styles.rowHint}>{p.hint}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.note}>{t.onboarding.note}</Text>

      <TouchableOpacity style={styles.button} onPress={handleStart} disabled={requesting}>
        {requesting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t.onboarding.startButton}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 80, alignItems: 'center' },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '800', color: '#2563eb' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  list: { width: '100%', marginTop: 32, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: '#111' },
  rowHint: { fontSize: 12, color: '#666' },
  note: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 28 },
  button: {
    marginTop: 'auto',
    marginBottom: 20,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
