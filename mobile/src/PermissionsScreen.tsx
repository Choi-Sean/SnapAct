import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Emoji, EmojiName } from './Emoji';

type Status = 'granted' | 'denied' | 'undetermined' | 'checking';

interface PermissionItem {
  key: string;
  icon: EmojiName;
  label: string;
  hint: string;
  check: () => Promise<{ status: string }>;
  request: () => Promise<{ status: string }>;
}

const ITEMS: PermissionItem[] = [
  {
    key: 'camera',
    icon: 'camera',
    label: '카메라',
    hint: '사진 촬영',
    check: ImagePicker.getCameraPermissionsAsync,
    request: ImagePicker.requestCameraPermissionsAsync,
  },
  {
    key: 'library',
    icon: 'photos',
    label: '사진 보관함',
    hint: '갤러리에서 선택',
    check: ImagePicker.getMediaLibraryPermissionsAsync,
    request: ImagePicker.requestMediaLibraryPermissionsAsync,
  },
  {
    key: 'contacts',
    icon: 'contacts',
    label: '연락처',
    hint: '명함 정보 저장',
    check: Contacts.getPermissionsAsync,
    request: Contacts.requestPermissionsAsync,
  },
  {
    key: 'calendar',
    icon: 'calendar',
    label: '캘린더',
    hint: '일정 자동 등록',
    check: () => Calendar.getCalendarPermissions(),
    request: () => Calendar.requestCalendarPermissions(),
  },
  {
    key: 'reminders',
    icon: 'reminders',
    label: '미리 알림',
    hint: '할 일 자동 등록',
    check: () => Calendar.getRemindersPermissions(),
    request: () => Calendar.requestRemindersPermissions(),
  },
];

const STATUS_LABEL: Record<Status, string> = {
  granted: '허용됨',
  denied: '거부됨',
  undetermined: '미확인',
  checking: '확인 중',
};

export default function PermissionsScreen() {
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
      <Text style={styles.title}>설정</Text>
      <Text style={styles.subtitle}>Snapsist가 사용 중인 권한 상태예요</Text>

      <View style={styles.list}>
        {ITEMS.map((item) => {
          const status = statuses[item.key] ?? 'checking';
          const granted = status === 'granted';
          return (
            <View key={item.key} style={styles.row}>
              <Emoji name={item.icon} size={28} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowHint}>{item.hint}</Text>
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
                    <Text style={styles.grantButtonText}>권한 허용하기</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {deniedCount > 0 && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            거부된 권한은 앱에서 다시 요청해도 팝업이 안 뜰 수 있어요. 그럴 땐 아래 버튼으로 설정 앱에서 직접 켜주세요.
          </Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>설정 앱에서 열기</Text>
          </TouchableOpacity>
        </View>
      )}
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
});
