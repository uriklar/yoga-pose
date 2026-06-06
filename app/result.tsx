import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadLastResult } from '../src/mobile/sessionStore';
import { PoseOverlay } from '../src/mobile/PoseOverlay';
import { ModelDebugPanel } from '../src/mobile/ModelDebugPanel';

type Feedback = { id: string; severity: string; message: string; metric?: string; value?: number; target?: string };
type Result = {
  pose?: string;
  score?: number;
  confidence?: number;
  analysisMode?: string;
  averageDistance?: number;
  sampledFrames?: { user?: number; reference?: number };
  feedback?: Feedback[];
  bodyAreaScores?: { area: string; distance: number; severity: string }[];
  referenceRecord?: { id?: string; sourceKind?: string; metadata?: { frameCount?: number } };
  visualComparison?: any;
  modelDebug?: any;
  scoringMode?: string;
  frameScoreSummary?: { frameCount?: number; min?: number; median?: number; max?: number };
};

export default function ResultScreen() {
  const [result, setResult] = useState<Result | null>(null);
  useEffect(() => { loadLastResult().then(setResult); }, []);

  const feedback = result?.feedback ?? [];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{result?.pose ?? 'Analysis'}</Text>
        <Text style={styles.score}>{result?.score ?? 0}</Text>
        <Text style={styles.subtitle}>Confidence: {Math.round((result?.confidence ?? 0) * 100)}%</Text>

        <View style={styles.metaCard}>
          <Text style={styles.metaText}>Mode: {result?.analysisMode ?? (result?.bodyAreaScores ? 'reference comparison' : 'pose rules')}</Text>
          {result?.sampledFrames && <Text style={styles.metaText}>Sampled frames: user {result.sampledFrames.user ?? 0}, reference {result.sampledFrames.reference ?? 0}</Text>}
          {typeof result?.averageDistance === 'number' && <Text style={styles.metaText}>Average skeleton distance: {result.averageDistance}</Text>}
          {result?.referenceRecord?.id && <Text style={styles.metaText}>Reference cache id: {result.referenceRecord.id}</Text>}
        </View>

        <PoseOverlay visual={result?.visualComparison} />
        <ModelDebugPanel debug={result?.modelDebug} frameSummary={result?.frameScoreSummary} scoringMode={result?.scoringMode} />

        <Text style={styles.section}>Top tips</Text>
        {feedback.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.severity}>{item.severity.toUpperCase()}</Text>
            <Text style={styles.tip}>{item.message}</Text>
            {item.metric && <Text style={styles.metric}>{item.metric}: {item.value} target {item.target}</Text>}
          </View>
        ))}

        {Boolean(result?.bodyAreaScores?.length) && <Text style={styles.section}>Reference difference by body area</Text>}
        {result?.bodyAreaScores?.map((area) => (
          <View key={area.area} style={styles.row}>
            <Text style={styles.rowText}>{area.area}</Text>
            <Text style={styles.rowText}>{area.distance}</Text>
          </View>
        ))}

        <Text style={styles.safety}>Safety: this is coaching feedback, not medical advice. Stop if anything hurts.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 20, gap: 14 },
  eyebrow: { color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase', marginTop: 12 },
  score: { color: '#f8fafc', fontSize: 72, fontWeight: '900' },
  subtitle: { color: '#cbd5e1', fontSize: 16 },
  section: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginTop: 16 },
  metaCard: { backgroundColor: '#082f49', borderColor: '#075985', borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  metaText: { color: '#bae6fd', fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  severity: { color: '#93c5fd', fontWeight: '900', fontSize: 12 },
  tip: { color: '#f8fafc', fontSize: 16, lineHeight: 23 },
  metric: { color: '#94a3b8', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: 12, borderRadius: 10 },
  rowText: { color: '#e2e8f0', fontWeight: '700' },
  safety: { color: '#fbbf24', fontSize: 13, lineHeight: 19, marginTop: 18 },
});
