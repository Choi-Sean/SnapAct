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
import { saveContact, saveEventToCalendar } from './nativeActions';
import { AnalyzeResponse, DemoKey } from './types';

const DEMO_BUTTONS: { key: DemoKey; icon: string; label: string; hint: string }[] = [
  { key: 'business_card', icon: '🪪', label: '명함 사진', hint: '연락처에 저장' },
  { key: 'event', icon: '📅', label: '이벤트 사진', hint: '캘린더에 저장' },
  { key: 'receipt', icon: '🧾', label: '영수증 사진', hint: '메모로 공유' },
  { key: 'reminder', icon: '✅', label: '리마인더 사진', hint: '미리 알림에 저장' },
  { key: 'photo', icon: '🖼️', label: '사진 저장', hint: '앨범에 자동 저장' },
  { key: 'mail', icon: '✉️', label: '메일 초안', hint: '메일 앱 열기' },
  { key: 'sms', icon: '💬', label: '문자 초안', hint: '문자 앱 열기' },
  { key: 'maps', icon: '📍', label: '위치 사진', hint: '지도 앱 열기' },
  { key: 'files', icon: '📄', label: '문서 저장', hint: '파일로 공유' },
  { key: 'wallet', icon: '🎫', label: '패스 카드', hint: 'Apple Wallet에 추가' },
  { key: 'notification', icon: '🔔', label: '알림 예약', hint: '5초 뒤 알림' },
];

interface Photo {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

interface Props {
  onDemoPress: (key: DemoKey) => void;
}

export default function HomeScreen({ onDemoPress }: Props) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('권한 필요', '사진에 접근하려면 권한이 필요합니다.');
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
        Alert.alert('저장 완료', '연락처 앱에 저장되었습니다.');
      } else if (result.suggested_action === 'calendar' && result.calendar) {
        await saveEventToCalendar(result.calendar);
        Alert.alert('저장 완료', '캘린더 앱에 일정이 추가되었습니다.');
      }
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Snapsist</Text>
      <Text style={styles.subtitle}>사진 한 장 → 알맞은 앱에 자동 저장</Text>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionEmoji}>⚡️</Text>
        <View>
          <Text style={styles.sectionHeader}>빠른 데모</Text>
          <Text style={styles.sectionLabel}>버튼을 누르면 확인 화면이 바로 뜹니다</Text>
        </View>
      </View>
      <View style={styles.demoGrid}>
        {DEMO_BUTTONS.map((d) => (
          <TouchableOpacity key={d.key} style={styles.demoCard} onPress={() => onDemoPress(d.key)} activeOpacity={0.7}>
            <View style={styles.demoIconWrap}>
              <Text style={styles.demoIcon}>{d.icon}</Text>
            </View>
            <Text style={styles.demoLabel}>{d.label}</Text>
            <Text style={styles.demoHint}>{d.hint}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionEmoji}>🔬</Text>
        <View>
          <Text style={styles.sectionHeader}>사진으로 실제 분석</Text>
          <Text style={styles.sectionLabel}>Google Vision이 분류 → Claude가 정보 추출</Text>
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={() => pick('camera')} activeOpacity={0.7}>
          <Text style={styles.buttonText}>📷 카메라로 촬영</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => pick('library')} activeOpacity={0.7}>
          <Text style={styles.buttonText}>🖼️ 갤러리에서 선택</Text>
        </TouchableOpacity>
      </View>

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
            <Text style={styles.primaryButtonText}>분석하기</Text>
          )}
        </TouchableOpacity>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {result && (
        <View style={styles.card}>
          {result.mock && <Text style={styles.badge}>DEMO MODE (실제 API 키 없음)</Text>}
          <Text style={styles.cardTitle}>
            분류: {result.category} ({Math.round(result.confidence * 100)}%)
          </Text>
          {result.summary && <Text style={styles.cardBody}>{result.summary}</Text>}

          {result.contact && (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>이름: {result.contact.name}</Text>
              <Text style={styles.fieldLabel}>전화: {result.contact.phone}</Text>
              <Text style={styles.fieldLabel}>이메일: {result.contact.email}</Text>
              <Text style={styles.fieldLabel}>회사: {result.contact.company}</Text>
            </View>
          )}

          {result.calendar && (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>제목: {result.calendar.title}</Text>
              <Text style={styles.fieldLabel}>장소: {result.calendar.location}</Text>
              <Text style={styles.fieldLabel}>시작: {result.calendar.start_date}</Text>
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
                  {result.suggested_action === 'contact' ? '연락처에 저장' : '캘린더에 저장'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
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
  demoIcon: { fontSize: 26 },
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
