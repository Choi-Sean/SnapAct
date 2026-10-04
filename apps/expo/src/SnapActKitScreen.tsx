// On-device pipeline review screen.
//
// A developer surface, not product UI: it exists so the ordering can be
// argued with, which is why every score component is on screen rather than
// just the resulting buttons. Strings are inline instead of going through
// src/i18n/dictionaries.ts for that reason — this is not shipped copy.
//
// The tab only appears when the native module is linked, so Expo Go and OTA
// builds are unaffected.
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AnalysisResult,
  Diagnostics,
  analyzePhoto,
  diagnostics as readDiagnostics,
  exportLog,
  recordChoice,
  resetCounters,
} from '../modules/snapact-kit';

type Phase = 'refined' | 'fast';

export default function SnapActKitScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('refined');
  const [taps, setTaps] = useState(0);
  const [diag, setDiag] = useState<Diagnostics | null>(null);

  useEffect(() => {
    setDiag(readDiagnostics());
  }, []);

  // `fast` carries the pre-OCR ordering. Showing both is the only way to see
  // whether OCR and arbitration actually changed anything.
  const shown = useMemo(() => {
    if (!result) return null;
    return phase === 'fast' ? result.fast ?? result : result;
  }, [result, phase]);

  const run = useCallback(async (photoUri: string) => {
    setBusy(true);
    setError(null);
    try {
      setResult(await analyzePhoto(photoUri));
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setResult(null);
    } finally {
      setBusy(false);
    }
  }, []);

  const pick = useCallback(
    async (source: 'camera' | 'library') => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('사진 접근 권한이 필요합니다.');
        return;
      }
      const picked =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({ quality: 1 });
      const asset = picked.canceled ? null : picked.assets?.[0];
      if (!asset) return;
      // Handed over at full size on purpose: PixelBuffer.downsample does the
      // resizing the model expects, and pre-shrinking in JS would measure a
      // different image than the one the pipeline is tuned on.
      setUri(asset.uri);
      setResult(null);
      setTaps(0);
      await run(asset.uri);
    },
    [run],
  );

  const tap = useCallback(
    async (verb: string) => {
      if (!(await recordChoice(verb))) {
        setError('기록할 직전 분석이 없습니다.');
        return;
      }
      setTaps((n) => n + 1);
      // Re-running the same photo is the point: the counters moved, so the
      // ordering should move with them. Measured at alpha=8, a secondary
      // action overtakes on the third pick.
      if (uri) await run(uri);
    },
    [uri, run],
  );

  const onReset = useCallback(async () => {
    await resetCounters();
    setTaps(0);
    if (uri) await run(uri);
  }, [uri, run]);

  const onExport = useCallback(async () => {
    const jsonl = await exportLog();
    if (!jsonl) {
      Alert.alert('로그가 비어 있습니다');
      return;
    }
    // Written out and shared rather than copied: the log is JSONL and the
    // point of exporting it is handing it to review, not pasting it.
    const file = new File(Paths.cache, 'snapact-interactions.jsonl');
    if (file.exists) file.delete();
    file.create();
    file.write(jsonl);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: 'application/x-ndjson' });
    } else {
      Alert.alert('저장했습니다', `${file.uri}\n${jsonl.trim().split('\n').length}줄`);
    }
  }, []);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {diag && <DiagnosticsCard diag={diag} />}

      <View style={styles.row}>
        <TouchableOpacity style={styles.primary} onPress={() => pick('library')}>
          <Text style={styles.primaryText}>사진 고르기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={() => pick('camera')}>
          <Text style={styles.secondaryText}>촬영</Text>
        </TouchableOpacity>
      </View>

      {uri && <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />}
      {busy && <ActivityIndicator style={styles.spinner} color="#2563eb" />}
      {error && <Text style={styles.error}>{error}</Text>}

      {shown && (
        <>
          <View style={styles.tabs}>
            {(['refined', 'fast'] as Phase[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.tab, phase === p && styles.tabActive]}
                onPress={() => setPhase(p)}>
                <Text style={[styles.tabText, phase === p && styles.tabTextActive]}>
                  {p === 'fast' ? 'OCR 전' : 'OCR 후'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <RoutingCard r={shown} />
          <ActionsCard r={shown} taps={taps} onTap={tap} />
          {shown.ocr && <OCRCard ocr={shown.ocr} />}
          <TimingsCard r={shown} />

          <View style={styles.row}>
            <TouchableOpacity style={styles.secondary} onPress={onReset}>
              <Text style={styles.secondaryText}>카운터 초기화</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondary} onPress={onExport}>
              <Text style={styles.secondaryText}>로그 복사</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

/** What is measured and what is still null. */
function DiagnosticsCard({ diag }: { diag: Diagnostics }) {
  return (
    <View style={[styles.card, diag.configError ? styles.cardAlert : styles.cardMuted]}>
      <Text style={styles.cardTitle}>설정 상태</Text>
      {diag.configError && <Text style={styles.error}>{diag.configError}</Text>}
      <Figure label="임계값" value={fmtThresholds(diag)} />
      <Figure label="Apple Intelligence" value={diag.foundationModels} />
      <Figure
        label="카운터 저장소"
        value={diag.counterStoreShared ? 'App Group 공유' : '앱 단독 (App Group 미선언)'}
      />
      {diag.unconfigured.length > 0 && (
        <Text style={styles.warn}>
          아직 null 인 값 {diag.unconfigured.length}개 — 이 부분은 점수에 영향을 주지 않습니다:{'\n'}
          {diag.unconfigured.join(', ')}
        </Text>
      )}
    </View>
  );
}

function RoutingCard({ r }: { r: AnalysisResult }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {r.category}
        {r.isUnknown ? ' (unknown)' : ''}
      </Text>
      {r.unknownReason && <Text style={styles.warn}>{r.unknownReason}</Text>}
      <Figure label="점수 / 마진" value={`${num(r.score)} / ${num(r.margin)}`} />
      <Figure label="판정 출처" value={r.source} />
      <Figure
        label="게이트"
        value={`${r.gateAllowsLocalProcessing ? '통과' : '차단'} · 모델 ${
          r.gateModelAvailable ? '있음' : '미학습'
        }`}
      />
      {r.correction && (
        <Figure label="중재" value={`${r.correction.outcome} → ${r.correction.added.join(', ')}`} />
      )}
      <Figure
        label="신호"
        value={[
          `비율 ${num(r.signals.aspectRatio)}`,
          r.signals.isScreenshot && '스크린샷',
          r.signals.hasDocumentEdges && '문서 경계',
          r.signals.hasText ? '텍스트 있음' : '텍스트 없음',
        ]
          .filter(Boolean)
          .join(' · ')}
      />
      <Text style={styles.subhead}>상위 클래스</Text>
      {r.topClasses.map((c) => (
        <View key={c.category} style={styles.classRow}>
          <Text style={[styles.classText, c.isNegative && styles.negative]}>
            {c.category}
            {c.isNegative ? ' (negative)' : ''}
          </Text>
          <Text style={styles.classScore}>{num(c.score)}</Text>
        </View>
      ))}
    </View>
  );
}

/** The buttons, each with the arithmetic that put it there. */
function ActionsCard({
  r,
  taps,
  onTap,
}: {
  r: AnalysisResult;
  taps: number;
  onTap: (verb: string) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>액션 {r.actions.length}개</Text>
      <Text style={styles.note}>
        누르면 기록만 하고 실제 실행은 하지 않습니다. 같은 사진을 다시 분석해 순서가 바뀌는지
        보세요{taps > 0 ? ` (이 사진에서 ${taps}번 눌렀습니다)` : ''}.
      </Text>
      {r.explorationApplied && (
        <Text style={styles.warn}>
          탐색이 적용된 순서입니다{r.promoted ? ` — ${r.promoted} 를 끌어올렸습니다` : ''}
        </Text>
      )}
      {r.actions.map((a) => (
        <TouchableOpacity key={a.verb} style={styles.action} onPress={() => onTap(a.verb)}>
          <View style={styles.actionHead}>
            <Text style={styles.actionTitle}>
              {a.position}. {a.display ?? a.verb}
            </Text>
            <Text style={styles.actionScore}>{num(a.score)}</Text>
          </View>
          <Text style={styles.actionMeta}>
            {a.verb} · {a.origin}
            {a.naturalRank !== a.position ? ` · 원래 ${a.naturalRank}위` : ''}
          </Text>
          <Text style={styles.actionMath}>
            prior {num(a.basePrior)}
            {a.slotScore != null ? ` (슬롯 ${num(a.slotScore)})` : ''} · 노출 {a.impressions} / 클릭{' '}
            {a.clicks} → 보정 {num(a.smoothedRate)}
            {a.contextBoost !== 0 ? ` · 맥락 ${num(a.contextBoost)}` : ''}
            {a.profileBoost !== 0 ? ` · 프로필 ${num(a.profileBoost)}` : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function OCRCard({ ocr }: { ocr: NonNullable<AnalysisResult['ocr']> }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>OCR</Text>
      {ocr.skipped ? (
        <Text style={styles.warn}>건너뜀: {ocr.skipped}</Text>
      ) : (
        <Figure
          label="결과"
          value={`${ocr.spanCount}조각 / ${ocr.characterCount}자 · ${ocr.durationMs}ms · ${
            ocr.level ?? '-'
          } · ${(ocr.languages ?? []).join(', ')}`}
        />
      )}
      {!!ocr.droppedLanguages?.length && (
        <Text style={styles.warn}>이 기기가 못 읽는 언어: {ocr.droppedLanguages.join(', ')}</Text>
      )}
      {!!ocr.text && <Text style={styles.ocrText}>{ocr.text}</Text>}
    </View>
  );
}

function TimingsCard({ r }: { r: AnalysisResult }) {
  const t = r.timings;
  return (
    <View style={[styles.card, styles.cardMuted]}>
      <Text style={styles.cardTitle}>시간 {t.totalMs}ms</Text>
      <Text style={styles.note}>
        게이트 {t.gateMs} · 신호 {t.signalsMs} · 라우팅 {t.routingMs} · 랭킹 {t.rankingMs} · OCR{' '}
        {t.ocrMs} · 중재 {t.arbitrationMs}
      </Text>
    </View>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.figure}>
      <Text style={styles.figureLabel}>{label}</Text>
      <Text style={styles.figureValue}>{value}</Text>
    </View>
  );
}

function fmtThresholds(d: Diagnostics): string {
  if (!d.thresholdsConfigured) return '아직 null — 모든 사진이 unknown 으로 나옵니다';
  const prefilter = d.prefilterEnabled
    ? `선별 ${d.prefilterMinConfidence ?? '-'}`
    : '선별 꺼짐';
  return `점수 ${d.minScore ?? '-'} · 마진 ${d.minMargin ?? '-'} · ${prefilter}`;
}

const num = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : '-');

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f7f9' },
  content: { padding: 14, gap: 10, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 10 },
  primary: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondary: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d8dce3',
  },
  secondaryText: { color: '#333', fontWeight: '600', fontSize: 14 },
  thumb: { width: '100%', height: 190, borderRadius: 12, backgroundColor: '#e6e8ec' },
  spinner: { marginVertical: 12 },
  error: { color: '#c0392b', fontSize: 13, lineHeight: 18 },
  warn: { color: '#b26a00', fontSize: 12.5, lineHeight: 18 },
  note: { color: '#777', fontSize: 12, lineHeight: 17 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 6 },
  cardMuted: { backgroundColor: '#eef1f5' },
  cardAlert: { backgroundColor: '#fdecea' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  subhead: { fontSize: 12, fontWeight: '700', color: '#555', marginTop: 6 },
  figure: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  figureLabel: { fontSize: 12.5, color: '#777' },
  figureValue: { fontSize: 12.5, color: '#222', flexShrink: 1, textAlign: 'right' },
  classRow: { flexDirection: 'row', justifyContent: 'space-between' },
  classText: { fontSize: 12.5, color: '#222' },
  classScore: { fontSize: 12.5, color: '#555', fontVariant: ['tabular-nums'] },
  negative: { color: '#999' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#e6e8ec',
  },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 12.5, color: '#555', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  action: {
    borderTopWidth: 1,
    borderTopColor: '#eef0f3',
    paddingTop: 8,
    marginTop: 2,
    gap: 2,
  },
  actionHead: { flexDirection: 'row', justifyContent: 'space-between' },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#111', flexShrink: 1 },
  actionScore: { fontSize: 13, color: '#2563eb', fontVariant: ['tabular-nums'] },
  actionMeta: { fontSize: 11.5, color: '#888' },
  actionMath: { fontSize: 11.5, color: '#666', lineHeight: 16 },
  ocrText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 17,
    backgroundColor: '#f6f7f9',
    borderRadius: 8,
    padding: 10,
  },
});
