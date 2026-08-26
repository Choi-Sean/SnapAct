import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLanguage } from './i18n/LanguageProvider';
import { Dictionary, t as fmt } from './i18n/dictionaries';
import { saveContact, saveEventToCalendar, saveReminder } from './nativeActions';
import { DemoKey, ReplaySpec } from './types';

function formatReceiptTable(d: Dictionary['review']['demo']): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
  const items: [string, string][] = [
    [d.receiptItem1, d.receiptPrice1],
    [d.receiptItem2, d.receiptPrice2],
  ];

  const lines = [
    fmt(d.receiptHeaderTemplate, { date: dateStr }),
    '',
    ...items.map(([name, price]) => `${name.padEnd(10, ' ')} ${price}`),
    '------------------------',
    `${d.receiptTotalLabel.padEnd(12, ' ')}${d.receiptTotal}`,
  ];
  return lines.join('\n');
}

const SAVE_ERROR = '__error__';

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
    replay?: ReplaySpec;
  }) => void;
}

export default function ReviewModal({ demoKey, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const d = t.review.demo;
  const l = t.review.labels;

  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Smith');
  const [phone, setPhone] = useState('+1 123-456-7894');
  const [email, setEmail] = useState('john.smith@example.com');

  const [eventTitle, setEventTitle] = useState(d.eventTitleDefault);
  const [eventLocation, setEventLocation] = useState('Snapsist HQ');

  const [reminderTitle, setReminderTitle] = useState(d.reminderTitleDefault);
  const [reminderNotes, setReminderNotes] = useState(d.reminderNotesAuto);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (demoKey === 'business_card') {
      setFirstName('John');
      setLastName('Smith');
      setPhone('+1 123-456-7894');
      setEmail('john.smith@example.com');
    } else if (demoKey === 'event') {
      setEventTitle(d.eventTitleDefault);
      setEventLocation('Snapsist HQ');
    } else if (demoKey === 'reminder') {
      setReminderTitle(d.reminderTitleDefault);
      setReminderNotes(d.reminderNotesAuto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoKey]);

  if (!demoKey) return null;

  function getRows(): Row[] {
    switch (demoKey) {
      case 'business_card':
        return [
          { label: l.firstName, value: firstName, input: { value: firstName, onChangeText: setFirstName } },
          { label: l.lastName, value: lastName, input: { value: lastName, onChangeText: setLastName } },
          { label: l.middleName, value: 'Andrew' },
          { label: l.prefixSuffix, value: 'Mr. / Jr.' },
          {
            label: l.mobile,
            value: phone,
            input: { value: phone, onChangeText: setPhone, keyboardType: 'phone-pad' },
          },
          { label: l.workEmail, value: email, input: { value: email, onChangeText: setEmail, keyboardType: 'email-address' } },
          { label: l.companyDept, value: 'Snapsist Inc. / Engineering' },
          { label: l.jobTitle, value: 'Product Manager' },
          { label: l.birthday, value: '1990-05-12' },
          { label: l.workAddress, value: '123 Main St, San Francisco, CA 94105, USA' },
          { label: l.homepage, value: 'https://example.com' },
          { label: l.relation, value: 'Colleague — Jane Doe' },
          { label: l.social, value: 'Twitter — @johnsmith' },
          { label: l.note, value: t.review.titles.business_card },
        ];
      case 'event':
        return [
          { label: l.title, value: eventTitle, input: { value: eventTitle, onChangeText: setEventTitle } },
          { label: l.location, value: eventLocation, input: { value: eventLocation, onChangeText: setEventLocation } },
          { label: l.startEnd, value: d.eventStartEnd },
          { label: l.allDay, value: 'false' },
          { label: l.notes, value: d.eventNotesAuto },
          { label: l.url, value: 'https://example.com/snapsist-event' },
          { label: l.timeZone, value: d.eventTimeZone },
          { label: l.availability, value: 'Busy' },
          { label: l.alarm, value: d.eventAlarm },
          { label: l.recurrence, value: d.eventRecurrence },
        ];
      case 'receipt':
        return [{ label: l.note, value: formatReceiptTable(d) }];
      case 'reminder':
        return [
          { label: l.title, value: reminderTitle, input: { value: reminderTitle, onChangeText: setReminderTitle } },
          { label: l.notes, value: reminderNotes, input: { value: reminderNotes, onChangeText: setReminderNotes } },
          { label: l.location, value: 'Snapsist HQ' },
          { label: l.url, value: 'https://example.com/snapsist-reminder' },
          { label: l.startDue, value: d.reminderStartDue },
          { label: l.completed, value: 'false' },
          { label: l.alarm, value: d.reminderAlarm },
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
        await saveContact(payload, { demo: true, note: d.contactNote });
        onSaved({
          title: payload.name,
          detail: phone,
          savedTo: t.permissions.items[2].label,
          fields,
          replay: { kind: demoKey, payload, demo: true },
        });
      } else if (demoKey === 'event') {
        const start = new Date();
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const payload = {
          title: eventTitle,
          location: eventLocation,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          notes: d.eventNotesAuto,
        };
        await saveEventToCalendar(payload, true);
        onSaved({
          title: eventTitle,
          detail: eventLocation || '',
          savedTo: t.permissions.items[3].label,
          fields,
          replay: { kind: demoKey, payload, demo: true },
        });
      } else if (demoKey === 'receipt') {
        const payload = { message: formatReceiptTable(d), title: d.receiptHeaderTemplate };
        await Share.share(payload);
        onSaved({
          title: d.receiptHeaderTemplate,
          detail: d.receiptTotal,
          savedTo: t.review.shareLabel,
          fields,
          replay: { kind: demoKey, payload, demo: true },
        });
      } else if (demoKey === 'reminder') {
        const payload = { title: reminderTitle, notes: reminderNotes, dueDate: new Date() };
        await saveReminder(payload, true);
        onSaved({
          title: reminderTitle,
          detail: reminderNotes,
          savedTo: t.permissions.items[4].label,
          fields,
          replay: { kind: demoKey, payload, demo: true },
        });
      }
    } catch (e) {
      onSaved({ title: t.review.failTitle, detail: e instanceof Error ? e.message : String(e), savedTo: SAVE_ERROR });
    } finally {
      setSaving(false);
    }
  }

  const rows = getRows();

  return (
    <Modal visible={!!demoKey} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{t.review.titles[demoKey]}</Text>
          <Text style={styles.subtitle}>{t.review.subtitle}</Text>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {demoKey === 'receipt' ? (
              <Text style={styles.preview}>{formatReceiptTable(d)}</Text>
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
            {demoKey === 'receipt' && <Text style={styles.note}>{t.review.receiptNote}</Text>}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>{t.review.cancelButton}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>{demoKey === 'receipt' ? t.review.shareLabel : t.review.executeLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
