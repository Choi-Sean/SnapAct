import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HistoryEntry } from './types';

const ICONS: Record<HistoryEntry['type'], string> = {
  business_card: '🪪',
  event: '📅',
  receipt: '🧾',
  reminder: '✅',
  photo: '🖼️',
  mail: '✉️',
  sms: '💬',
  maps: '📍',
  files: '📄',
  wallet: '🎫',
  notification: '🔔',
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

interface Props {
  entries: HistoryEntry[];
  onClear: () => void;
}

export default function HistoryScreen({ entries, onClear }: Props) {
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
            <View style={styles.row}>
              <Text style={styles.icon}>{ICONS[item.type]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDetail}>{item.detail}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.savedTo}>{item.savedTo}</Text>
                <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
              </View>
            </View>
          )}
        />
      )}
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
  icon: { fontSize: 22, width: 30, textAlign: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  rowDetail: { fontSize: 13, color: '#777', marginTop: 1 },
  rowRight: { alignItems: 'flex-end' },
  savedTo: { fontSize: 12, color: '#2563eb', fontWeight: '700' },
  time: { fontSize: 11, color: '#aaa', marginTop: 2 },
});
