import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { analyzeDraftSession } from '../src/mobile/analysisService';
import { loadDraftSession, saveLastResult } from '../src/mobile/sessionStore';

const POSES = [
  { id: 'plank', label: 'Plank' },
  { id: 'warrior2', label: 'Warrior II' },
  { id: 'downwardDog', label: 'Downward Dog' },
  { id: 'tree', label: 'Tree Pose' },
];

export default function AnalyzeScreen() {
  const [pose, setPose] = useState('plank');
  const [hasReference, setHasReference] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    loadDraftSession().then((session) => {
      setHasReference(Boolean(session?.referenceUrl || session?.referenceVideoUri));
      setHasVideo(Boolean(session?.userVideoUri));
    });
  }, []);

  async function runAnalysis(mode: 'rules' | 'reference') {
    setBusy(true);
    setStatus(mode === 'reference' ? 'Preparing reference comparison…' : 'Preparing pose analysis…');
    try {
      setStatus(Platform.OS === 'web' ? 'Sampling video frames and running pose detection…' : 'Checking native analysis support…');
      const result = await analyzeDraftSession({ pose, mode });
      setStatus('Saving result…');
      await saveLastResult(result);
      router.push('/result');
    } finally {
      setBusy(false);
      setStatus('Ready');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Choose what to analyze</Text>
      <Text style={styles.subtitle}>
        {Platform.OS === 'web'
          ? 'Web build: real frame sampling + MediaPipe pose detection runs for imported/recorded browser-readable video files.'
          : 'Native build: recording/import works; real native pose detection still needs the iOS detector adapter, so results will tell you if analysis cannot run yet.'}
      </Text>
      {!hasVideo && <Text style={styles.warning}>No user video found yet. Go back and import or record a yoga clip.</Text>}

      <View style={styles.poseGrid}>
        {POSES.map((item) => (
          <Pressable key={item.id} style={[styles.pose, pose === item.id && styles.poseSelected]} onPress={() => setPose(item.id)}>
            <Text style={[styles.poseText, pose === item.id && styles.poseSelectedText]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.status}>{status}</Text>
      <Pressable disabled={busy || !hasVideo} style={[styles.primary, (!hasVideo || busy) && styles.disabled]} onPress={() => runAnalysis('rules')}>
        <Text style={styles.primaryText}>{busy ? 'Analyzing…' : 'Run pose-rule analysis'}</Text>
      </Pressable>
      <Pressable disabled={busy || !hasReference || !hasVideo} style={[styles.secondary, (!hasReference || !hasVideo || busy) && styles.disabled]} onPress={() => runAnalysis('reference')}>
        <Text style={styles.secondaryText}>Compare with reference video</Text>
      </Pressable>
      {!hasReference && <Text style={styles.note}>Add a reference link or upload a reference clip on the home screen to enable comparison.</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#020617', gap: 16 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '800', marginTop: 24 },
  subtitle: { color: '#cbd5e1', fontSize: 15, lineHeight: 22 },
  warning: { color: '#fed7aa', backgroundColor: '#7c2d12', padding: 12, borderRadius: 12, lineHeight: 20 },
  poseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pose: { borderColor: '#334155', borderWidth: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14 },
  poseSelected: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  poseText: { color: '#cbd5e1', fontWeight: '700' },
  poseSelectedText: { color: '#082f49' },
  status: { color: '#93c5fd', fontSize: 13, fontWeight: '700' },
  primary: { backgroundColor: '#38bdf8', borderRadius: 14, padding: 16, alignItems: 'center' },
  primaryText: { color: '#082f49', fontWeight: '800', fontSize: 16 },
  secondary: { borderColor: '#38bdf8', borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  secondaryText: { color: '#bae6fd', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.4 },
  note: { color: '#94a3b8', fontSize: 13 },
});
