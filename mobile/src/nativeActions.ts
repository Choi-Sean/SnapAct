import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { File, Paths } from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import * as SMS from 'expo-sms';
import { Linking, Platform } from 'react-native';

import { API_BASE_URL, API_KEY } from './config';
import { CalendarPayload, ContactPayload } from './types';

// A tiny 1x1 PNG, embedded so the photo-save demo doesn't need a real captured photo.
const DEMO_PNG_BYTES = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 4, 0, 0,
  0, 181, 28, 12, 2, 0, 0, 0, 11, 73, 68, 65, 84, 120, 218, 99, 100, 248, 15, 0, 1, 5, 1, 1, 39, 24,
  227, 102, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

async function getWritableCalendar(entityType: Calendar.EntityTypes): Promise<Calendar.ExpoCalendar> {
  if (entityType === Calendar.EntityTypes.REMINDER) {
    const { status } = await Calendar.requestRemindersPermissions();
    if (status !== 'granted') throw new Error('Reminders permission denied.');
  } else {
    const { status } = await Calendar.requestCalendarPermissions();
    if (status !== 'granted') throw new Error('Calendar permission denied.');
  }

  if (entityType === Calendar.EntityTypes.EVENT) {
    try {
      const def = Calendar.getDefaultCalendarSync();
      if (def) return def;
    } catch {
      // getDefaultCalendarSync is iOS-only; fall through on other platforms.
    }
  }

  const calendars = await Calendar.getCalendars(entityType);
  const writable = calendars.find((cal) => cal.allowsModifications);
  if (writable) return writable;

  const source =
    calendars.find((cal) => cal.source && cal.source.name === 'Default')?.source ??
    { isLocalAccount: true, name: 'Snapsist', type: Calendar.SourceType.LOCAL };

  return Calendar.createCalendar({
    title: 'Snapsist',
    color: '#2563eb',
    entityType,
    sourceId: (source as { id?: string }).id,
    source,
    name: 'snapsist',
    ownerAccount: 'snapsist',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

// ---- Calendar event: exercises every writable Event field ----
export async function saveEventToCalendar(payload: CalendarPayload): Promise<string> {
  const calendar = await getWritableCalendar(Calendar.EntityTypes.EVENT);

  const startDate = payload.start_date ? new Date(payload.start_date) : new Date();
  const endDate = payload.end_date
    ? new Date(payload.end_date)
    : new Date(startDate.getTime() + 60 * 60 * 1000);

  const event = await calendar.createEvent({
    title: payload.title ?? 'Snapsist event',
    startDate,
    endDate,
    allDay: false,
    location: payload.location ?? undefined,
    notes: payload.notes ?? undefined,
    url: 'https://example.com/snapsist-event',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    availability: Calendar.Availability.BUSY,
    alarms: [{ relativeOffset: -15 }],
    recurrenceRule: { frequency: Calendar.Frequency.WEEKLY, interval: 1, occurrence: 4 },
  });
  return event.id;
}

// ---- Contact: exercises every CreateContactRecord field ----
export async function saveContact(payload: ContactPayload): Promise<string> {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Contacts permission denied.');
  }

  const [firstName, ...rest] = (payload.name ?? 'New Contact').split(' ');

  const contact = await Contacts.Contact.create({
    givenName: firstName,
    middleName: 'Andrew',
    familyName: rest.join(' ') || undefined,
    prefix: 'Mr.',
    suffix: 'Jr.',
    company: payload.company ?? 'Snapsist Inc.',
    department: 'Engineering',
    jobTitle: payload.title ?? 'Product Manager',
    note: 'Snapsist 데모로 생성된 연락처입니다.',
    birthday: { year: 1990, month: 5, day: 12 },
    phones: payload.phone ? [{ label: 'mobile', number: payload.phone }] : undefined,
    emails: payload.email ? [{ label: 'work', address: payload.email }] : [{ label: 'work', address: 'john.smith@example.com' }],
    addresses: [
      { label: 'work', street: '123 Main St', city: 'San Francisco', state: 'CA', postcode: '94105', country: 'USA' },
    ],
    urlAddresses: [{ label: 'homepage', url: 'https://example.com' }],
    relations: [{ label: 'colleague', name: 'Jane Doe' }],
    socialProfiles: [{ label: 'Twitter', service: 'Twitter', username: 'johnsmith' }],
  });

  return contact.id;
}

interface ReminderPayload {
  title: string;
  notes?: string;
  dueDate?: Date;
}

// ---- Reminder: exercises every writable Reminder field (iOS only) ----
export async function saveReminder(payload: ReminderPayload): Promise<string | undefined> {
  if (Platform.OS !== 'ios') {
    throw new Error('미리 알림은 iOS에서만 지원돼요. Android에서는 캘린더를 이용해주세요.');
  }
  const calendar = await getWritableCalendar(Calendar.EntityTypes.REMINDER);

  const dueDate = payload.dueDate ?? new Date();

  const reminder = await calendar.createReminder({
    title: payload.title,
    notes: payload.notes,
    location: 'Snapsist HQ',
    url: 'https://example.com/snapsist-reminder',
    startDate: new Date(),
    dueDate,
    completed: false,
    alarms: [{ relativeOffset: -10 }],
  });
  return reminder.id;
}

// ---- Photos: saves a demo image into a "Snapsist" album ----
export async function savePhotoDemo(): Promise<{ assetId: string; album: string }> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Photo library permission denied.');

  const file = new File(Paths.cache, 'snapsist-demo.png');
  if (file.exists) file.delete();
  file.create();
  file.write(DEMO_PNG_BYTES);

  const asset = await MediaLibrary.Asset.create(file.uri);
  let album = await MediaLibrary.Album.get('Snapsist');
  if (!album) {
    album = await MediaLibrary.Album.create('Snapsist', [asset]);
  } else {
    await album.add(asset);
  }

  return { assetId: asset.id, album: await album.getTitle() };
}

// ---- Mail: opens a prefilled mail compose screen with an attachment ----
export async function composeMailDemo(): Promise<string> {
  const available = await MailComposer.isAvailableAsync();
  if (!available) throw new Error('이 기기에는 사용 가능한 메일 앱이 없어요.');

  const file = new File(Paths.cache, 'snapsist-summary.txt');
  if (file.exists) file.delete();
  file.create();
  file.write('Snapsist 데모 첨부파일입니다.');

  const result = await MailComposer.composeAsync({
    recipients: ['demo@example.com'],
    ccRecipients: ['cc@example.com'],
    bccRecipients: ['bcc@example.com'],
    subject: 'Snapsist 데모 메일',
    body: '<b>Snapsist</b>에서 자동으로 채운 메일 초안입니다.',
    isHtml: true,
    attachments: [file.uri],
  });
  return result.status;
}

// ---- SMS: opens a prefilled SMS compose screen with an attachment ----
export async function sendSmsDemo(): Promise<string> {
  const available = await SMS.isAvailableAsync();
  if (!available) throw new Error('이 기기에서는 문자 보내기를 사용할 수 없어요.');

  const file = new File(Paths.cache, 'snapsist-sms-attachment.png');
  if (file.exists) file.delete();
  file.create();
  file.write(DEMO_PNG_BYTES);

  const { result } = await SMS.sendSMSAsync(['+1 123-456-7894', '+1 987-654-3210'], 'Snapsist 데모 문자입니다.', {
    attachments: { uri: file.uri, mimeType: 'image/png', filename: 'snapsist.png' },
  });
  return result;
}

// ---- Maps: opens the platform map app with a query + coordinates ----
export async function openMapsDemo(): Promise<void> {
  const label = 'Snapsist HQ';
  const lat = 37.5665;
  const lng = 126.978;
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?q=${encodeURIComponent(label)}&ll=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
  await Linking.openURL(url);
}

// ---- Files: writes a text file and opens the share sheet (Save to Files) ----
export async function shareFileDemo(): Promise<string> {
  const file = new File(Paths.document, 'snapsist-note.txt');
  if (file.exists) file.delete();
  file.create();
  file.write('Snapsist 데모 파일\n생성 시각: ' + new Date().toLocaleString());

  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('이 기기에서는 공유 기능을 사용할 수 없어요.');

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain',
    UTI: 'public.plain-text',
    dialogTitle: 'Snapsist 파일 저장',
  });
  return file.uri;
}

// ---- Apple Wallet: downloads a signed .pkpass from the backend and offers to add it ----
export async function addToWalletDemo(): Promise<void> {
  if (Platform.OS !== 'ios') throw new Error('Apple Wallet은 iOS에서만 지원돼요.');

  const response = await fetch(`${API_BASE_URL}/wallet/demo-pass`, {
    headers: { 'X-API-Key': API_KEY },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`패스 생성 실패 (${response.status}): ${detail}`);
  }

  const base64 = await response.text();
  const file = new File(Paths.cache, 'snapsist-demo.pkpass');
  if (file.exists) file.delete();
  file.create();
  file.write(Uint8Array.from(atobPolyfill(base64), (c) => c.charCodeAt(0)));

  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('이 기기에서는 공유 기능을 사용할 수 없어요.');

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.apple.pkpass',
    UTI: 'com.apple.pkpass',
    dialogTitle: 'Apple Wallet에 추가',
  });
}

// React Native's JS engine doesn't always expose global atob(); this is a minimal
// dependency-free base64 decoder used only for the wallet demo response.
function atobPolyfill(base64: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = base64.replace(/[^A-Za-z0-9+/]/g, '');
  let output = '';
  for (let i = 0; i < str.length; i += 4) {
    const e1 = chars.indexOf(str[i]);
    const e2 = chars.indexOf(str[i + 1]);
    const e3 = chars.indexOf(str[i + 2]);
    const e4 = chars.indexOf(str[i + 3]);
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    output += String.fromCharCode(c1);
    if (e3 !== -1) output += String.fromCharCode(c2);
    if (e4 !== -1) output += String.fromCharCode(c3);
  }
  return output;
}

// ---- Local notification: schedules a notification using most content fields ----
export async function scheduleNotificationDemo(): Promise<string> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('알림 권한이 거부되었어요.');

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Snapsist',
      subtitle: '데모 알림',
      body: '이 알림은 모든 파라미터를 시연하기 위해 5초 후 도착하도록 예약됐어요.',
      data: { source: 'snapsist-demo', screen: 'home' },
      badge: 1,
      sound: 'default',
      color: '#2563eb',
      autoDismiss: true,
      sticky: false,
      interruptionLevel: 'active',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
}
