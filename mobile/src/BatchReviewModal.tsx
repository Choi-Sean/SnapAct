import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { saveContact, saveEventToCalendar } from './nativeActions';
import { AnalyzeResponse, BatchSubEntry, Category } from './types';

const CATEGORY_LABEL: Record<Category, string> = {
  business_card: '명함',
  receipt: '영수증',
  event_flyer: '이벤트',
  document: '문서',
  other: '알 수 없음',
};

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

      try {
        if (result.suggested_action === 'contact' && result.contact) {
          await saveContact(result.contact);
          batchItems.push({
            photoUri: uri,
            category: result.category,
            title: result.contact.name ?? '연락처',
            detail: result.contact.phone ?? '',
            savedTo: '연락처',
            replay: { kind: 'business_card', payload: result.contact },
          });
        } else if (result.suggested_action === 'calendar' && result.calendar) {
          await saveEventToCalendar(result.calendar);
          batchItems.push({
            photoUri: uri,
            category: result.category,
            title: result.calendar.title ?? '이벤트',
            detail: result.calendar.location ?? '',
            savedTo: '캘린더',
            replay: { kind: 'event', payload: result.calendar },
          });
        } else if (result.suggested_action === 'note') {
          const message = result.summary ?? result.raw_text ?? '';
          await Share.share({ message, title: 'Snapsist 노트' });
          batchItems.push({
            photoUri: uri,
            category: result.category,
            title: CATEGORY_LABEL[result.category],
            detail: result.summary ?? '',
            savedTo: '공유(메모 등)',
            replay: { kind: 'receipt', payload: { message, title: 'Snapsist 노트' } },
          });
        } else {
          batchItems.push({
            photoUri: uri,
            category: result.category,
            title: CATEGORY_LABEL[result.category],
            detail: '인식된 정보 없음',
            savedTo: '건너뜀',
          });
        }
      } catch (e) {
        batchItems.push({
          photoUri: uri,
          category: result.category,
          title: '실패',
          detail: e instanceof Error ? e.message : String(e),
          savedTo: '오류',
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
          <Text style={styles.title}>{items.length}장 분석 완료</Text>
          <Text style={styles.subtitle}>저장할 항목을 선택하고 일괄 저장하세요 — 체크 해제하면 그 사진은 건너뜁니다</Text>

          <FlatList
            style={{ maxHeight: 380 }}
            data={items}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ gap: 8, marginTop: 10 }}
            renderItem={({ item, index }) => {
              const isExcluded = excluded.has(index);
              const actionLabel =
                item.result.suggested_action === 'contact'
                  ? '→ 연락처'
                  : item.result.suggested_action === 'calendar'
                    ? '→ 캘린더'
                    : item.result.suggested_action === 'note'
                      ? '→ 메모 공유'
                      : '→ 건너뜀';
              return (
                <TouchableOpacity
                  style={[styles.row, isExcluded && styles.rowExcluded]}
                  onPress={() => toggle(index)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.uri }} style={styles.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{CATEGORY_LABEL[item.result.category]}</Text>
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
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleSaveAll}
              disabled={saving || includedCount === 0}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>{includedCount}개 일괄 저장</Text>
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
