import { StyleSheet, Text, View } from 'react-native';

type Coverage = Record<string, { visible: number; total: number; percent?: number }>;
type FrameDiagnostic = {
  index: number;
  score?: number;
  confidence?: number;
  missing?: string[];
  metrics?: Record<string, number | undefined>;
};
type ModelDebug = {
  frameCount?: number;
  usableFrameCount?: number;
  worstFrameIndex?: number | null;
  worstFrame?: FrameDiagnostic | null;
  landmarkCoverage?: Coverage;
  frameDiagnostics?: FrameDiagnostic[];
  note?: string;
};

type FrameSummary = { frameCount?: number; min?: number; median?: number; max?: number };

export function ModelDebugPanel({ debug, frameSummary, scoringMode }: { debug?: ModelDebug; frameSummary?: FrameSummary; scoringMode?: string }) {
  if (!debug) return null;
  const lowCoverage = Object.entries(debug.landmarkCoverage ?? {}).filter(([, c]) => (c.percent ?? 0) < 80);
  const worst = debug.worstFrame;
  const worstMetrics = Object.entries(worst?.metrics ?? {}).filter(([, value]) => Number.isFinite(value));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>What the model actually saw</Text>
      <Text style={styles.explain}>This is based on detected body landmarks, not the raw pixels. If these numbers look wrong, the detector is the problem, not your pose.</Text>

      <View style={styles.grid}>
        <Metric label="Frames sampled" value={`${debug.frameCount ?? 0}`} />
        <Metric label="Usable frames" value={`${debug.usableFrameCount ?? 0}`} />
        <Metric label="Worst frame" value={debug.worstFrameIndex === null || debug.worstFrameIndex === undefined ? 'n/a' : `#${debug.worstFrameIndex + 1}`} />
        <Metric label="Scoring" value={scoringMode?.replaceAll('-', ' ') ?? 'aggregate'} />
      </View>

      {frameSummary && (
        <Text style={styles.line}>Frame scores: worst {frameSummary.min ?? 'n/a'} · median {frameSummary.median ?? 'n/a'} · best {frameSummary.max ?? 'n/a'}</Text>
      )}

      {Boolean(worstMetrics.length) && <Text style={styles.subhead}>Worst-frame plank metrics</Text>}
      {worstMetrics.map(([name, value]) => (
        <View key={name} style={styles.row}>
          <Text style={styles.rowLabel}>{formatLabel(name)}</Text>
          <Text style={styles.rowValue}>{value}</Text>
        </View>
      ))}

      <Text style={styles.subhead}>Landmark coverage</Text>
      {Object.entries(debug.landmarkCoverage ?? {}).map(([name, c]) => (
        <View key={name} style={styles.coverageRow}>
          <Text style={styles.rowLabel}>{formatLabel(name)}</Text>
          <Text style={[styles.rowValue, (c.percent ?? 0) < 80 && styles.warn]}>{c.visible}/{c.total} frames · {c.percent ?? 0}%</Text>
        </View>
      ))}
      {Boolean(lowCoverage.length) && <Text style={styles.warning}>Low landmark coverage can make two different poses score similarly. Re-record with the full body visible and the camera steady.</Text>}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metricBox}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function formatLabel(name: string) {
  return name.replace(/([A-Z])/g, ' $1').toLowerCase();
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#111827', borderColor: '#374151', borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  title: { color: '#f8fafc', fontSize: 20, fontWeight: '900' },
  explain: { color: '#cbd5e1', fontSize: 13, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricBox: { backgroundColor: '#020617', borderColor: '#1f2937', borderWidth: 1, borderRadius: 12, padding: 10, width: '47%' },
  metricValue: { color: '#f8fafc', fontSize: 17, fontWeight: '900' },
  metricLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 3 },
  line: { color: '#bae6fd', fontSize: 13, fontWeight: '800' },
  subhead: { color: '#f8fafc', fontSize: 15, fontWeight: '900', marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#020617', padding: 9, borderRadius: 10 },
  coverageRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: '#d1d5db', fontSize: 13, fontWeight: '700' },
  rowValue: { color: '#e5e7eb', fontSize: 13, fontWeight: '900' },
  warn: { color: '#fbbf24' },
  warning: { color: '#fbbf24', fontSize: 13, lineHeight: 18, marginTop: 4 },
});
