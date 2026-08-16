import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Emoji, EmojiName } from './Emoji';
import { requestAllPermissions } from './permissions';

const PERMISSIONS: { icon: EmojiName; label: string; hint: string }[] = [
  { icon: 'camera', label: '카메라', hint: '사진 촬영' },
  { icon: 'photos', label: '사진 보관함', hint: '갤러리에서 선택' },
  { icon: 'contacts', label: '연락처', hint: '명함 정보 저장' },
  { icon: 'calendar', label: '캘린더', hint: '일정 자동 등록' },
  { icon: 'reminders', label: '미리 알림', hint: '할 일 자동 등록' },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
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
      <Text style={styles.subtitle}>사진 한 장이면 충분해요.{'\n'}알맞은 앱에 자동으로 저장해드릴게요.</Text>

      <View style={styles.list}>
        {PERMISSIONS.map((p) => (
          <View key={p.label} style={styles.row}>
            <Emoji name={p.icon} size={30} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{p.label}</Text>
              <Text style={styles.rowHint}>{p.hint}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.note}>다음 화면에서 권한 팝업이 여러 번 뜹니다. 모두 허용해주셔야 기능이 정상 동작해요.</Text>

      <TouchableOpacity style={styles.button} onPress={handleStart} disabled={requesting}>
        {requesting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>권한 허용하고 시작하기</Text>}
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
