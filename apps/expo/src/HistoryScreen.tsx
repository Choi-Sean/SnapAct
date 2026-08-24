import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Emoji, EmojiName } from './Emoji';
import ImageZoomModal from './ImageZoomModal';
import { useLanguage } from './i18n/LanguageProvider';
import { Dictionary, t as fmt } from './i18n/dictionaries';
import { replayAction } from './replay';
import SwipeableRow from './SwipeableRow';
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

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

function parseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return null;
  const d = new Date(s.trim() + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

const LAYER_COLORS: Record<string, string> = {
  L0: '#6b7280',
  L1: '#7c3aed',
  L2: '#2563eb',
  L3: '#0d9488',
  L5c: '#ea580c',
};

function LayerBadge({ layer, h }: { layer?: string | null; h: Dictionary['history'] }) {
  if (!layer) return null;
  const color = LAYER_COLORS[layer] ?? '#6b7280';
  return (
    <View style={[badgeStyles.badge, { backgroundColor: `${color}1a`, borderColor: `${color}44` }]}>
      <Text style={[badgeStyles.text, { color }]}>{layer}</Text>
    </View>
  );
}

function TokensBadge({ tokensSpent, h }: { tokensSpent?: number; h: Dictionary['history'] }) {
  if (tokensSpent === undefined) return null;
  const color = tokensSpent > 0 ? '#ea580c' : '#16a34a';
  const label = tokensSpent > 0 ? fmt(h.tokensSpentTemplate, { n: tokensSpent }) : h.tokensFreeLabel;
  return (
    <View style={[badgeStyles.badge, { backgroundColor: `${color}1a`, borderColor: `${color}44` }]}>
      <Text style={[badgeStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

function FailedBadge({ failed, h }: { failed?: boolean; h: Dictionary['history'] }) {
  if (!failed) return null;
  return (
    <View style={[badgeStyles.badge, { backgroundColor: '#dc26261a', borderColor: '#dc262644' }]}>
      <Text style={[badgeStyles.text, { color: '#dc2626' }]}>{h.failedBadge}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1.5, alignSelf: 'flex-end', marginTop: 3 },
  text: { fontSize: 10, fontWeight: '800' },
});

interface Props {
  entries: HistoryEntry[];
  onClear: () => void;
  onDelete: (id: string) => void;
}

export default function HistoryScreen({ entries, onClear, onDelete }: Props) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [page, setPage] = useState(0);
  const [zoomUri, setZoomUri] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeDateFilter, setActiveDateFilter] = useState<{ from: Date; to: Date } | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const nowKey = monthKey(new Date().toISOString());
  const prevKey = monthKey(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

  const monthBuckets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      const k = monthKey(e.createdAt);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (activeDateFilter) {
      const end = new Date(activeDateFilter.to);
      end.setHours(23, 59, 59, 999);
      return entries.filter((e) => {
        const ts = new Date(e.createdAt).getTime();
        return ts >= activeDateFilter.from.getTime() && ts <= end.getTime();
      });
    }
    if (selectedMonth) {
      return entries.filter((e) => monthKey(e.createdAt) === selectedMonth);
    }
    return entries;
  }, [entries, selectedMonth, activeDateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));

  useEffect(() => {
    setPage(0);
  }, [selectedMonth, activeDateFilter]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [totalPages, page]);

  const pageEntries = filteredEntries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function periodLabel(): string {
    if (activeDateFilter) return `${dateFrom} → ${dateTo}`;
    if (!selectedMonth) return `${t.history.allTime} (${entries.length})`;
    const count = monthBuckets.find(([k]) => k === selectedMonth)?.[1] ?? 0;
    const base =
      selectedMonth === nowKey ? t.history.currentPeriod : selectedMonth === prevKey ? t.history.previousPeriod : monthLabel(selectedMonth);
    return `${base} (${count})`;
  }

  function applyDateFilter() {
    const from = parseDate(dateFrom);
    const to = parseDate(dateTo);
    if (!from || !to || from > to) {
      setDateError(t.history.dateFilterError);
      return;
    }
    setDateError(null);
    setSelectedMonth(null);
    setActiveDateFilter({ from, to });
    setPeriodPickerOpen(false);
  }

  function clearDateFilter() {
    setDateFrom('');
    setDateTo('');
    setDateError(null);
    setActiveDateFilter(null);
  }

  async function handleReplay(entry: HistoryEntry) {
    if (!entry.replay) return;
    setReplaying(true);
    try {
      await replayAction(entry.replay, t);
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
          <TouchableOpacity style={styles.periodButton} onPress={() => setPeriodPickerOpen(true)} activeOpacity={0.7}>
            <Text style={styles.periodButtonText}>{periodLabel()}</Text>
            <Text style={styles.periodButtonChevron}>▾</Text>
          </TouchableOpacity>

          {filteredEntries.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t.history.noResultsForFilter}</Text>
            </View>
          ) : (
            <FlatList
              data={pageEntries}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <SwipeableRow onDelete={() => onDelete(item.id)}>
                  <TouchableOpacity style={styles.row} onPress={() => setSelected(item)} activeOpacity={0.7}>
                    <Emoji name={ICONS[item.type]} size={26} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowDetail}>{item.detail}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.savedTo}>{item.savedTo}</Text>
                      <Text style={styles.time}>{timeAgo(item.createdAt, t.history)}</Text>
                      <View style={styles.badgeRow}>
                        <FailedBadge failed={item.analysisFailed} h={t.history} />
                        <TokensBadge tokensSpent={item.tokensSpent} h={t.history} />
                        <LayerBadge layer={item.resolvedLayer} h={t.history} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </SwipeableRow>
              )}
            />
          )}

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
                    {selected.resolvedLayer && (
                      <Text style={styles.sheetLayerNote}>
                        {fmt(t.history.layerNoteTemplate, {
                          layer: t.history.layerLabels[selected.resolvedLayer] ?? selected.resolvedLayer,
                        })}
                      </Text>
                    )}
                    <View style={[styles.badgeRow, { marginTop: 4 }]}>
                      <FailedBadge failed={selected.analysisFailed} h={t.history} />
                      <TokensBadge tokensSpent={selected.tokensSpent} h={t.history} />
                    </View>
                  </View>
                </View>

                {selected.imageUri && (
                  <TouchableOpacity onPress={() => setZoomUri(selected.imageUri ?? null)} activeOpacity={0.85}>
                    <Image source={{ uri: selected.imageUri }} style={styles.detailImage} />
                  </TouchableOpacity>
                )}

                {selected.type === 'batch' && selected.batchItems ? (
                  <FlatList
                    style={{ maxHeight: 340 }}
                    data={selected.batchItems}
                    keyExtractor={(_, i) => String(i)}
                    contentContainerStyle={{ gap: 8 }}
                    renderItem={({ item }) => (
                      <View style={styles.batchRow}>
                        <TouchableOpacity onPress={() => setZoomUri(item.photoUri)}>
                          <Image source={{ uri: item.photoUri }} style={styles.batchThumb} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.batchTitle}>{item.title}</Text>
                          <Text style={styles.batchDetail}>{item.detail}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <Text style={styles.savedTo}>{item.savedTo}</Text>
                          <View style={styles.badgeRow}>
                            <FailedBadge failed={item.analysisFailed} h={t.history} />
                            <TokensBadge tokensSpent={item.tokensSpent} h={t.history} />
                            <LayerBadge layer={item.resolvedLayer} h={t.history} />
                          </View>
                          {item.replay && (
                            <TouchableOpacity
                              style={styles.miniReplayButton}
                              onPress={() =>
                                item.replay &&
                                replayAction(item.replay, t)
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

      <Modal
        visible={periodPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setPeriodPickerOpen(false)}
      >
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.periodSheet}>
            <Text style={styles.periodSheetTitle}>{t.history.title}</Text>

            <TouchableOpacity
              style={[styles.periodOption, !selectedMonth && !activeDateFilter && styles.periodOptionActive]}
              onPress={() => {
                setSelectedMonth(null);
                clearDateFilter();
                setPeriodPickerOpen(false);
              }}
            >
              <Text style={styles.periodOptionText}>{`${t.history.allTime} (${entries.length})`}</Text>
            </TouchableOpacity>

            {monthBuckets.map(([key, count]) => {
              const label =
                key === nowKey
                  ? `${t.history.currentPeriod} (${monthLabel(key)})`
                  : key === prevKey
                    ? `${t.history.previousPeriod} (${monthLabel(key)})`
                    : monthLabel(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.periodOption, selectedMonth === key && !activeDateFilter && styles.periodOptionActive]}
                  onPress={() => {
                    setSelectedMonth(key);
                    clearDateFilter();
                    setPeriodPickerOpen(false);
                  }}
                >
                  <Text style={styles.periodOptionText}>{`${label} · ${count}`}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.dateFilterBlock}>
              <Text style={styles.dateFilterLabel}>{t.history.dateFilterLabel}</Text>
              <View style={styles.dateFilterRow}>
                <TextInput
                  style={styles.dateInput}
                  placeholder={t.history.datePlaceholder}
                  placeholderTextColor="#aaa"
                  value={dateFrom}
                  onChangeText={setDateFrom}
                />
                <Text style={styles.dateFilterArrow}>→</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder={t.history.datePlaceholder}
                  placeholderTextColor="#aaa"
                  value={dateTo}
                  onChangeText={setDateTo}
                />
              </View>
              {dateError && <Text style={styles.dateFilterError}>{dateError}</Text>}
              <View style={styles.dateFilterActions}>
                <TouchableOpacity style={styles.dateFilterApply} onPress={applyDateFilter}>
                  <Text style={styles.dateFilterApplyText}>{t.history.applyFilter}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearDateFilter}>
                  <Text style={styles.dateFilterClearText}>{t.history.clearFilter}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.periodCloseButton} onPress={() => setPeriodPickerOpen(false)}>
              <Text style={styles.periodCloseText}>{t.history.closeButton}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ImageZoomModal uri={zoomUri} onClose={() => setZoomUri(null)} />
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
  badgeRow: { flexDirection: 'row', gap: 4 },
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
  sheetLayerNote: { fontSize: 11, color: '#aaa', marginTop: 3, fontWeight: '600' },
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
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f3f6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  periodButtonText: { fontSize: 13, fontWeight: '700', color: '#333' },
  periodButtonChevron: { fontSize: 12, color: '#888' },
  detailImage: { width: '100%', height: 200, borderRadius: 14, backgroundColor: '#eef0f4' },
  periodSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 32,
    gap: 8,
    maxHeight: '85%',
  },
  periodSheetTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 4 },
  periodOption: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  periodOptionActive: { backgroundColor: '#eef2ff' },
  periodOptionText: { fontSize: 14, fontWeight: '600', color: '#222' },
  dateFilterBlock: { marginTop: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f2f3f6', gap: 8 },
  dateFilterLabel: { fontSize: 12.5, fontWeight: '700', color: '#888' },
  dateFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f7f8fb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  dateFilterArrow: { color: '#aaa', fontSize: 13 },
  dateFilterError: { color: '#dc2626', fontSize: 12 },
  dateFilterActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 2 },
  dateFilterApply: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16 },
  dateFilterApplyText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  dateFilterClearText: { color: '#888', fontWeight: '600', fontSize: 12.5 },
  periodCloseButton: { marginTop: 10, alignItems: 'center', paddingVertical: 10 },
  periodCloseText: { color: '#999', fontWeight: '600', fontSize: 13 },
});
