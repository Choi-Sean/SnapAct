import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Emoji, EmojiName } from './Emoji';
import { useLanguage } from './i18n/LanguageProvider';
import { Dictionary, t as fmt } from './i18n/dictionaries';
import { replayAction } from './replay';
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
  batch: 'photos',
};

const PAGE_SIZE = 15;

function timeAgo(iso: string, h: Dictionary['history']): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return h.timeJustNow;
  if (min < 60) return fmt(h.timeMinutesAgo, { n: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return fmt(h.timeHoursAgo, { n: hr });
  return fmt(h.timeDaysAgo, { n: Math.floor(hr / 24) });
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
  const { t } = useLanguage();
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [totalPages, page]);

  const pageEntries = entries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  async function handleReplay(entry: HistoryEntry) {
    if (!entry.replay) return;
    setReplaying(true);
    try {
      await replayAction(entry.replay);
      Alert.alert(t.history.replayDoneTitle, fmt(t.history.replayDoneBodyTemplate, { savedTo: entry.savedTo }));
    } catch (e) {
      Alert.alert(t.history.failTitle, e instanceof Error ? e.message : String(e));
    } finally {
      setReplaying(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.history.title}</Text>
        {entries.length > 0 && (
          <TouchableOpacity onPress={onClear}>
            <Text style={styles.clear}>{t.history.clearAll}</Text>
          </TouchableOpacity>
        )}
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t.history.emptyText}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={pageEntries}
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
                  <Text style={styles.time}>{timeAgo(item.createdAt, t.history)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          {totalPages > 1 && (
            <View style={styles.pager}>
              <TouchableOpacity
                style={[styles.pagerButton, page === 0 && styles.pagerButtonDisabled]}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <Text style={styles.pagerButtonText}>{t.history.prev}</Text>
              </TouchableOpacity>
              <Text style={styles.pagerLabel}>
                {page + 1} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pagerButton, page === totalPages - 1 && styles.pagerButtonDisabled]}
                onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                <Text style={styles.pagerButtonText}>{t.history.next}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
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

                {selected.type === 'batch' && selected.batchItems ? (
                  <FlatList
                    style={{ maxHeight: 340 }}
                    data={selected.batchItems}
                    keyExtractor={(_, i) => String(i)}
                    contentContainerStyle={{ gap: 8 }}
                    renderItem={({ item }) => (
                      <View style={styles.batchRow}>
                        <Image source={{ uri: item.photoUri }} style={styles.batchThumb} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.batchTitle}>{item.title}</Text>
                          <Text style={styles.batchDetail}>{item.detail}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <Text style={styles.savedTo}>{item.savedTo}</Text>
                          {item.replay && (
                            <TouchableOpacity
                              style={styles.miniReplayButton}
                              onPress={() =>
                                item.replay &&
                                replayAction(item.replay)
                                  .then(() =>
                                    Alert.alert(
                                      t.review.saveDoneTitle,
                                      fmt(t.review.saveDoneBodyTemplate, { savedTo: item.savedTo })
                                    )
                                  )
                                  .catch((e) => Alert.alert(t.history.failTitle, e instanceof Error ? e.message : String(e)))
                              }
                            >
                              <Text style={styles.miniReplayText}>{t.history.replayButton}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                  />
                ) : selected.fields && selected.fields.length > 0 ? (
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

                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
                    <Text style={styles.closeButtonText}>{t.history.closeButton}</Text>
                  </TouchableOpacity>
                  {selected.replay && (
                    <TouchableOpacity
                      style={styles.replayButton}
                      onPress={() => handleReplay(selected)}
                      disabled={replaying}
                    >
                      {replaying ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.replayButtonText}>{t.history.replayButton}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                {selected.replay && <Text style={styles.replayNote}>{t.history.replayNote}</Text>}
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
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 4 },
  pagerButton: { backgroundColor: '#f2f3f6', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  pagerButtonDisabled: { opacity: 0.4 },
  pagerButtonText: { fontWeight: '700', color: '#333', fontSize: 13 },
  pagerLabel: { fontSize: 12.5, color: '#888', fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,17,21,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 32,
    gap: 14,
    maxHeight: '85%',
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
  batchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f7f8fb',
    borderRadius: 12,
    padding: 10,
  },
  batchThumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#e5e7eb' },
  batchTitle: { fontSize: 13.5, fontWeight: '700', color: '#111' },
  batchDetail: { fontSize: 12, color: '#888', marginTop: 1 },
  miniReplayButton: { backgroundColor: '#e8edfd', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  miniReplayText: { fontSize: 10.5, fontWeight: '700', color: '#2563eb' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  closeButton: { flex: 1, backgroundColor: '#f2f3f6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  closeButtonText: { fontWeight: '700', color: '#333' },
  replayButton: { flex: 1, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  replayButtonText: { fontWeight: '700', color: '#fff' },
  replayNote: { fontSize: 11.5, color: '#999', textAlign: 'center', lineHeight: 16 },
});
