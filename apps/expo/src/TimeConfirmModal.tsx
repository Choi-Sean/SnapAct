import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useLanguage } from './i18n/LanguageProvider';
import { t as fmt } from './i18n/dictionaries';

const HOUR_OPTIONS = [8, 12, 18];

export interface TimeSelection {
  hour: number;
  minute: number;
}

interface Props {
  visible: boolean;
  slotCount: number;
  subtitle: string;
  onCancel: () => void;
  onConfirm: (times: TimeSelection[]) => void;
}

function formatHour(locale: string, hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d);
}

// Generalized "pick a time when the photo didn't state one" step — used both
// for medication doses (one slot per times_per_day) and calendar events
// (a single slot) whenever the backend reports needs_time_selection.
export default function TimeConfirmModal({ visible, slotCount, subtitle, onCancel, onConfirm }: Props) {
  const { t, locale } = useLanguage();
  const [selections, setSelections] = useState<number[]>([]);

  useEffect(() => {
    if (visible) {
      setSelections(Array.from({ length: slotCount }, (_, i) => HOUR_OPTIONS[i % HOUR_OPTIONS.length]));
    }
  }, [visible, slotCount]);

  function setSlot(index: number, hour: number) {
    setSelections((prev) => prev.map((h, i) => (i === index ? hour : h)));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t.home.timeConfirm.title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.slots}>
            {selections.map((selectedHour, index) => (
              <View key={index} style={styles.slotRow}>
                {selections.length > 1 && (
                  <Text style={styles.slotLabel}>{fmt(t.home.timeConfirm.doseLabelTemplate, { n: index + 1 })}</Text>
                )}
                <View style={styles.chips}>
                  {HOUR_OPTIONS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[styles.chip, selectedHour === hour && styles.chipSelected]}
                      onPress={() => setSlot(index, hour)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, selectedHour === hour && styles.chipTextSelected]}>
                        {formatHour(locale, hour)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelText}>{t.home.timeConfirm.cancelButton}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => onConfirm(selections.map((hour) => ({ hour, minute: 0 })))}
            >
              <Text style={styles.confirmText}>{t.home.timeConfirm.confirmButton}</Text>
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
  subtitle: { fontSize: 13, color: '#777', lineHeight: 18 },
  slots: { gap: 14, marginTop: 8 },
  slotRow: { gap: 8 },
  slotLabel: { fontSize: 12.5, fontWeight: '700', color: '#888' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f2f3f6',
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  chipSelected: { backgroundColor: '#eef2ff', borderColor: '#2563eb' },
  chipText: { fontSize: 13.5, fontWeight: '700', color: '#555' },
  chipTextSelected: { color: '#2563eb' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionButton: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f2f3f6' },
  cancelText: { fontWeight: '700', color: '#333' },
  confirmButton: { backgroundColor: '#2563eb' },
  confirmText: { fontWeight: '700', color: '#fff' },
});
