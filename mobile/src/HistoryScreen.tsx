import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Emoji, EmojiName } from './Emoji';
import { HistoryEntry } from './types';

const ICONS: Record<HistoryEntry['type'], EmojiName> = {
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

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

interface Props {
  entries: HistoryEntry[];
  onClear: () => void;
}

export default function HistoryScreen({ entries, onClear }: Props) {
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>기록</Text>
        {entries.length > 0 && (
          <TouchableOpacity onPress={onClear}>
            <Text style={styles.clear}>전체 삭제</Text>
          </TouchableOpacity>
        )}
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 저장한 게 없어요.{'\n'}홈에서 데모 버튼을 눌러보세요.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => setSelected(item)} activeOpacity={0.7}>
              <Emoji name={ICONS[item.type]} size={26} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDetail}>{item.detail}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.savedTo}>{item.savedTo}</Text>
                <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            {selected && (
              <>
                <View style={styles.sheetHeader}>
                  <Emoji name={ICONS[selected.type]} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>{selected.title}</Text>
                    <Text style={styles.sheetSubtitle}>
                      {selected.savedTo} · {formatFullDate(selected.createdAt)}
                    </Text>
                  </View>
                </View>

                {selected.fields && selected.fields.length > 0 ? (
                  <View style={styles.fieldList}>
                    {selected.fields.map((f) => (
                      <View key={f.label} style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>{f.label}</Text>
                        <Text style={styles.fieldValue}>{f.value}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>{selected.detail}</Text>
                )}

                <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
                  <Text style={styles.closeButtonText}>닫기</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#111' },
  clear: { color: '#dc2626', fontSize: 13, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#888', lineHeight: 20 },
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
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  rowDetail: { fontSize: 13, color: '#777', marginTop: 1 },
  rowRight: { alignItems: 'flex-end' },
  savedTo: { fontSize: 12, color: '#2563eb', fontWeight: '700' },
  time: { fontSize: 11, color: '#aaa', marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,17,21,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 32,
    gap: 14,
    maxHeight: '80%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  sheetSubtitle: { fontSize: 12.5, color: '#888', marginTop: 2 },
  fieldList: { gap: 0 },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f3f6',
  },
  fieldLabel: { fontSize: 12.5, color: '#888', fontWeight: '600', width: 110 },
  fieldValue: { fontSize: 12.5, color: '#222', flex: 1, textAlign: 'right' },
  closeButton: {
    marginTop: 6,
    backgroundColor: '#f2f3f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: { fontWeight: '700', color: '#333' },
});
