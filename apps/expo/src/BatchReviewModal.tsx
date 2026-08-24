import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useLanguage } from './i18n/LanguageProvider';
import { t as fmt } from './i18n/dictionaries';
import { persistImage } from './imageStorage';
import { saveContact, saveEventToCalendar } from './nativeActions';
import { AnalyzeResponse, BatchSubEntry } from './types';

interface Item {
  uri: string;
  result: AnalyzeResponse;
}

interface Props {
  items: Item[] | null;
  onClose: () => void;
  onSaved: (batchItems: BatchSubEntry[]) => void;
}

export default function BatchReviewModal({ items, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  if (!items) return null;

  function toggle(i: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleSaveAll() {
    if (!items) return;
    setSaving(true);
    const batchItems: BatchSubEntry[] = [];

    for (let i = 0; i < items.length; i++) {
      if (excluded.has(i)) continue;
      const { uri, result } = items[i];
      const photoUri = await persistImage(uri);

      try {
        if (result.suggested_action === 'contact' && result.contact) {
          await saveContact(result.contact);
          batchItems.push({
            photoUri,
            category: result.category,
            title: result.contact.name ?? t.permissions.items[2].label,
            detail: result.contact.phone ?? '',
            savedTo: t.permissions.items[2].label,
            replay: { kind: 'business_card', payload: result.contact },
            resolvedLayer: result.resolved_layer,
            tokensSpent: result.tokens_spent,
            analysisFailed: result.analysis_failed,
          });
        } else if (result.suggested_action === 'calendar' && result.calendar) {
          await saveEventToCalendar(result.calendar);
          batchItems.push({
            photoUri,
            category: result.category,
            title: result.calendar.title ?? t.permissions.items[3].label,
            detail: result.calendar.location ?? '',
            savedTo: t.permissions.items[3].label,
            replay: { kind: 'event', payload: result.calendar },
            resolvedLayer: result.resolved_layer,
            tokensSpent: result.tokens_spent,
            analysisFailed: result.analysis_failed,
          });
        } else if (result.suggested_action === 'note') {
          const message = result.summary ?? result.raw_text ?? '';
          await Share.share({ message, title: t.batch.noteShareTitle });
          batchItems.push({
            photoUri,
            category: result.category,
            title: t.batch.categoryLabels[result.category],
            detail: result.summary ?? '',
            savedTo: t.review.shareLabel,
            replay: { kind: 'receipt', payload: { message, title: t.batch.noteShareTitle } },
            resolvedLayer: result.resolved_layer,
            tokensSpent: result.tokens_spent,
            analysisFailed: result.analysis_failed,
          });
        } else {
          batchItems.push({
            photoUri,
            category: result.category,
            title: t.batch.categoryLabels[result.category],
            detail: result.summary ?? t.batch.noInfoDetail,
            savedTo: result.analysis_failed ? t.home.savedToFailed : t.batch.skippedLabel,
            resolvedLayer: result.resolved_layer,
            tokensSpent: result.tokens_spent,
            analysisFailed: result.analysis_failed,
          });
        }
      } catch (e) {
        batchItems.push({
          photoUri,
          category: result.category,
          title: t.batch.errorLabel,
          detail: e instanceof Error ? e.message : String(e),
          savedTo: t.batch.errorLabel,
          tokensSpent: result.tokens_spent,
          analysisFailed: result.analysis_failed,
        });
      }
    }

    setSaving(false);
    onSaved(batchItems);
  }

  const includedCount = items.length - excluded.size;

  return (
    <Modal visible={!!items} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{fmt(t.batch.titleTemplate, { n: items.length })}</Text>
          <Text style={styles.subtitle}>{t.batch.subtitle}</Text>

          <FlatList
            style={{ maxHeight: 380 }}
            data={items}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ gap: 8, marginTop: 10 }}
            renderItem={({ item, index }) => {
              const isExcluded = excluded.has(index);
              const actionLabel =
                item.result.suggested_action === 'contact'
                  ? t.batch.actionContact
                  : item.result.suggested_action === 'calendar'
                    ? t.batch.actionCalendar
                    : item.result.suggested_action === 'note'
                      ? t.batch.actionNote
                      : t.batch.actionSkip;
              return (
                <TouchableOpacity
                  style={[styles.row, isExcluded && styles.rowExcluded]}
                  onPress={() => toggle(index)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.uri }} style={styles.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{t.batch.categoryLabels[item.result.category]}</Text>
                    <Text style={styles.rowDetail} numberOfLines={1}>
                      {item.result.summary ?? actionLabel}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, !isExcluded && styles.checkboxChecked]}>
                    {!isExcluded && <Text style={styles.checkboxMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>{t.batch.cancelButton}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleSaveAll}
              disabled={saving || includedCount === 0}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>{fmt(t.batch.saveButtonTemplate, { n: includedCount })}</Text>
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
    gap: 4,
    maxHeight: '85%',
  },
  title: { fontSize: 19, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 12.5, color: '#777' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f7f8fb',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  rowExcluded: { opacity: 0.4 },
  thumb: { width: 42, height: 42, borderRadius: 8, backgroundColor: '#e5e7eb' },
  rowTitle: { fontSize: 13.5, fontWeight: '700', color: '#111' },
  rowDetail: { fontSize: 12, color: '#888', marginTop: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkboxMark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f2f3f6' },
  cancelText: { fontWeight: '700', color: '#333' },
  confirmButton: { backgroundColor: '#2563eb' },
  confirmText: { fontWeight: '700', color: '#fff' },
});
