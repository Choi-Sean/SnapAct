import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Emoji, EmojiName } from './Emoji';
import { useLanguage } from './i18n/LanguageProvider';
import { DemoKey } from './types';

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

interface Props {
  onDemoPress: (key: DemoKey) => void;
}

export default function DemoScreen({ onDemoPress }: Props) {
  const { t } = useLanguage();

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
});
