import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  addToWalletDemo,
  composeMailDemo,
  openMapsDemo,
  saveContact,
  saveEventToCalendar,
  savePhotoDemo,
  saveReminder,
  scheduleNotificationDemo,
  sendSmsDemo,
  shareFileDemo,
} from './nativeActions';
import { DemoKey } from './types';

function formatReceiptTable(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
  const items: [string, string][] = [
    ['아메리카노', '4,500원'],
    ['크루아상', '3,800원'],
  ];
  const total = '8,300원';

  const lines = [
    `🧾 영수증 내역 (${dateStr})`,
    '',
    ...items.map(([name, price]) => `${name.padEnd(10, ' ')} ${price}`),
    '------------------------',
    `합계          ${total}`,
  ];
  return lines.join('\n');
}

const TITLES: Record<DemoKey, string> = {
  business_card: '명함 → 연락처',
  event: '이벤트 → 캘린더',
  receipt: '영수증 → 메모',
  reminder: '리마인더 → 미리 알림',
  photo: '사진 → 갤러리',
  mail: '메일 초안',
  sms: '문자 초안',
  maps: '위치 → 지도',
  files: '문서 → 파일',
  wallet: '패스 → Apple Wallet',
  notification: '알림 예약',
};

const EXECUTE_LABEL: Partial<Record<DemoKey, string>> = {
  receipt: '공유하기',
};

interface Row {
  label: string;
  value: string;
  input?: { value: string; onChangeText: (v: string) => void; keyboardType?: 'phone-pad' | 'email-address' };
}

interface Props {
  demoKey: DemoKey | null;
  onClose: () => void;
  onSaved: (info: {
    title: string;
    detail: string;
    savedTo: string;
    fields?: { label: string; value: string }[];
    replay?: { kind: DemoKey; payload: unknown };
  }) => void;
}

export default function ReviewModal({ demoKey, onClose, onSaved }: Props) {
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Smith');
  const [phone, setPhone] = useState('+1 123-456-7894');
  const [email, setEmail] = useState('john.smith@example.com');

  const [eventTitle, setEventTitle] = useState('Snapsist 데모 이벤트');
  const [eventLocation, setEventLocation] = useState('Snapsist HQ');

  const [reminderTitle, setReminderTitle] = useState('우유 사기');
  const [reminderNotes, setReminderNotes] = useState('Snapsist에서 사진으로 자동 등록된 할 일입니다.');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (demoKey === 'business_card') {
      setFirstName('John');
      setLastName('Smith');
      setPhone('+1 123-456-7894');
      setEmail('john.smith@example.com');
    } else if (demoKey === 'event') {
      setEventTitle('Snapsist 데모 이벤트');
      setEventLocation('Snapsist HQ');
    } else if (demoKey === 'reminder') {
      setReminderTitle('우유 사기');
      setReminderNotes('Snapsist에서 사진으로 자동 등록된 할 일입니다.');
    }
  }, [demoKey]);

  if (!demoKey) return null;

  function getRows(): Row[] {
    switch (demoKey) {
      case 'business_card':
        return [
          { label: 'First Name', value: firstName, input: { value: firstName, onChangeText: setFirstName } },
          { label: 'Last Name', value: lastName, input: { value: lastName, onChangeText: setLastName } },
          { label: 'Middle Name', value: 'Andrew' },
          { label: 'Prefix / Suffix', value: 'Mr. / Jr.' },
          {
            label: 'Mobile',
            value: phone,
            input: { value: phone, onChangeText: setPhone, keyboardType: 'phone-pad' },
          },
          { label: 'Work Email', value: email, input: { value: email, onChangeText: setEmail, keyboardType: 'email-address' } },
          { label: 'Company / Dept', value: 'Snapsist Inc. / Engineering' },
          { label: 'Job Title', value: 'Product Manager' },
          { label: 'Birthday', value: '1990-05-12' },
          { label: 'Work Address', value: '123 Main St, San Francisco, CA 94105, USA' },
          { label: 'Homepage', value: 'https://example.com' },
          { label: 'Relation', value: 'Colleague — Jane Doe' },
          { label: 'Social', value: 'Twitter — @johnsmith' },
          { label: 'Note', value: 'Snapsist 데모로 생성된 연락처입니다.' },
        ];
      case 'event':
        return [
          { label: 'Title', value: eventTitle, input: { value: eventTitle, onChangeText: setEventTitle } },
          { label: 'Location', value: eventLocation, input: { value: eventLocation, onChangeText: setEventLocation } },
          { label: 'Start / End', value: '지금 ~ +1시간' },
          { label: 'All Day', value: 'false' },
          { label: 'Notes', value: '사진에서 자동으로 추출된 일정입니다.' },
          { label: 'URL', value: 'https://example.com/snapsist-event' },
          { label: 'Time Zone', value: '기기 설정값' },
          { label: 'Availability', value: 'Busy' },
          { label: 'Alarm', value: '시작 15분 전' },
          { label: 'Recurrence', value: '매주 반복, 4회' },
        ];
      case 'receipt':
        return [{ label: '내역', value: formatReceiptTable() }];
      case 'reminder':
        return [
          { label: 'Title', value: reminderTitle, input: { value: reminderTitle, onChangeText: setReminderTitle } },
          { label: 'Notes', value: reminderNotes, input: { value: reminderNotes, onChangeText: setReminderNotes } },
          { label: 'Location', value: 'Snapsist HQ' },
          { label: 'URL', value: 'https://example.com/snapsist-reminder' },
          { label: 'Start / Due', value: '지금 / 지금' },
          { label: 'Completed', value: 'false' },
          { label: 'Alarm', value: '마감 10분 전' },
        ];
      case 'photo':
        return [
          { label: '저장 앨범', value: 'Snapsist' },
          { label: '원본 파일', value: '데모 PNG (1×1)' },
          { label: '사용 API', value: 'Asset.create() · Album.get/create() · album.add()' },
        ];
      case 'mail':
        return [
          { label: '받는사람', value: 'demo@example.com' },
          { label: '참조(CC)', value: 'cc@example.com' },
          { label: '숨은참조(BCC)', value: 'bcc@example.com' },
          { label: '제목', value: 'Snapsist 데모 메일' },
          { label: '본문', value: 'HTML 형식 (isHtml: true)' },
          { label: '첨부파일', value: 'snapsist-summary.txt' },
        ];
      case 'sms':
        return [
          { label: '받는사람', value: '+1 123-456-7894, +1 987-654-3210' },
          { label: '메시지', value: 'Snapsist 데모 문자입니다.' },
          { label: '첨부파일', value: 'snapsist.png (image/png)' },
        ];
      case 'maps':
        return [
          { label: '장소명', value: 'Snapsist HQ' },
          { label: '좌표', value: '37.5665, 126.978' },
          { label: '경로', value: 'iOS → Apple Maps / Android → Google Maps(geo:)' },
        ];
      case 'files':
        return [
          { label: '파일명', value: 'snapsist-note.txt' },
          { label: '저장 위치', value: '문서 디렉토리 (Paths.document)' },
          { label: '공유 옵션', value: 'mimeType=text/plain, UTI=public.plain-text' },
        ];
      case 'wallet':
        return [
          { label: 'Pass Type', value: 'Generic' },
          { label: 'Organization', value: 'Snapsist' },
          { label: 'Description', value: 'Snapsist 데모 패스' },
          { label: 'Primary Field', value: 'Name — John Smith' },
          { label: 'Secondary Field', value: 'Title — Product Manager' },
          { label: 'Barcode', value: 'QR — snapsist-demo-pass' },
          { label: '색상', value: 'bg #2563eb / fg #ffffff' },
        ];
      case 'notification':
        return [
          { label: 'Title / Subtitle', value: 'Snapsist / 데모 알림' },
          { label: 'Badge / Sound', value: '1 / default' },
          { label: '색상', value: '#2563eb' },
          { label: '중요도', value: 'active (interruptionLevel)' },
          { label: '트리거', value: '5초 뒤 (TIME_INTERVAL)' },
        ];
      default:
        return [];
    }
  }

  async function handleConfirm() {
    setSaving(true);
    const fields = getRows().map((r) => ({ label: r.label, value: r.value }));
    try {
      if (demoKey === 'business_card') {
        const payload = { name: `${firstName} ${lastName}`.trim(), phone, email };
        await saveContact(payload);
        onSaved({ title: payload.name, detail: phone, savedTo: '연락처', fields, replay: { kind: demoKey, payload } });
      } else if (demoKey === 'event') {
        const start = new Date();
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const payload = {
          title: eventTitle,
          location: eventLocation,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          notes: '사진에서 자동으로 추출된 일정입니다.',
        };
        await saveEventToCalendar(payload);
        onSaved({ title: eventTitle, detail: eventLocation || '오늘', savedTo: '캘린더', fields, replay: { kind: demoKey, payload } });
      } else if (demoKey === 'receipt') {
        const payload = { message: formatReceiptTable(), title: '영수증 내역' };
        await Share.share(payload);
        onSaved({ title: '영수증 내역', detail: '8,300원', savedTo: '공유(메모 등)', fields, replay: { kind: demoKey, payload } });
      } else if (demoKey === 'reminder') {
        const payload = { title: reminderTitle, notes: reminderNotes, dueDate: new Date() };
        await saveReminder(payload);
        onSaved({ title: reminderTitle, detail: reminderNotes, savedTo: '미리 알림', fields, replay: { kind: demoKey, payload } });
      } else if (demoKey === 'photo') {
        const { album } = await savePhotoDemo();
        onSaved({ title: '데모 사진', detail: `앨범: ${album}`, savedTo: '사진', fields, replay: { kind: demoKey, payload: null } });
      } else if (demoKey === 'mail') {
        const status = await composeMailDemo();
        onSaved({ title: 'Snapsist 데모 메일', detail: `상태: ${status}`, savedTo: '메일', fields, replay: { kind: demoKey, payload: null } });
      } else if (demoKey === 'sms') {
        const result = await sendSmsDemo();
        onSaved({ title: 'Snapsist 데모 문자', detail: `상태: ${result}`, savedTo: '문자', fields, replay: { kind: demoKey, payload: null } });
      } else if (demoKey === 'maps') {
        await openMapsDemo();
        onSaved({ title: 'Snapsist HQ', detail: '37.5665, 126.978', savedTo: '지도', fields, replay: { kind: demoKey, payload: null } });
      } else if (demoKey === 'files') {
        await shareFileDemo();
        onSaved({ title: 'snapsist-note.txt', detail: '문서 디렉토리에 저장됨', savedTo: '파일', fields, replay: { kind: demoKey, payload: null } });
      } else if (demoKey === 'wallet') {
        await addToWalletDemo();
        onSaved({ title: 'Snapsist 데모 패스', detail: 'Apple Wallet 공유 시트 열림', savedTo: 'Wallet', fields, replay: { kind: demoKey, payload: null } });
      } else if (demoKey === 'notification') {
        await scheduleNotificationDemo();
        onSaved({ title: 'Snapsist', detail: '5초 뒤 도착 예정', savedTo: '알림', fields, replay: { kind: demoKey, payload: null } });
      }
    } catch (e) {
      onSaved({ title: '실패', detail: e instanceof Error ? e.message : String(e), savedTo: '오류' });
    } finally {
      setSaving(false);
    }
  }

  const rows = getRows();

  return (
    <Modal visible={!!demoKey} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{TITLES[demoKey]}</Text>
          <Text style={styles.subtitle}>아래 파라미터로 실행됩니다 — 확인 후 눌러주세요</Text>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {demoKey === 'receipt' ? (
              <Text style={styles.preview}>{formatReceiptTable()}</Text>
            ) : (
              <View style={styles.fields}>
                {rows.map((row) =>
                  row.input ? (
                    <View key={row.label}>
                      <Text style={styles.label}>{row.label}</Text>
                      <TextInput
                        style={styles.input}
                        value={row.input.value}
                        onChangeText={row.input.onChangeText}
                        keyboardType={row.input.keyboardType}
                      />
                    </View>
                  ) : (
                    <View key={row.label} style={styles.previewRow}>
                      <Text style={styles.previewLabel}>{row.label}</Text>
                      <Text style={styles.previewValue}>{row.value}</Text>
                    </View>
                  )
                )}
              </View>
            )}
            {demoKey === 'receipt' && (
              <Text style={styles.note}>Notes 앱은 공식 저장 API가 없어서, 확인 후 공유 시트에서 "메모"를 선택해주세요.</Text>
            )}
            {demoKey === 'wallet' && (
              <Text style={styles.note}>백엔드에서 서명된 .pkpass를 받아 공유 시트로 Wallet에 추가합니다. 인증서가 아직 설정 전이면 오류가 뜰 수 있어요.</Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>{EXECUTE_LABEL[demoKey] ?? '실행'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,17,21,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 28,
    gap: 10,
  },
  title: { fontSize: 19, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 13, color: '#777' },
  fields: { gap: 4, marginTop: 8 },
  label: { fontSize: 12, color: '#888', marginTop: 8, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f7f8fb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 4,
  },
  preview: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: '#f7f8fb',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  note: { fontSize: 12, color: '#999', marginTop: 10, lineHeight: 17 },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f3f6',
  },
  previewLabel: { fontSize: 12.5, color: '#888', fontWeight: '600', width: 110 },
  previewValue: { fontSize: 12.5, color: '#222', flex: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionButton: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f2f3f6' },
  cancelText: { fontWeight: '700', color: '#333' },
  confirmButton: { backgroundColor: '#2563eb' },
  confirmText: { fontWeight: '700', color: '#fff' },
});
