import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { saveDraftSession } from '../src/mobile/sessionStore';

export default function RecordScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = cameraPermission?.granted && micPermission?.granted;

  async function requestPermissions() {
    await requestCameraPermission();
    await requestMicPermission();
  }

  async function toggleRecording() {
    if (!cameraRef.current) return;
    setError(null);
    if (recording) {
      cameraRef.current.stopRecording();
      return;
    }
    setRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 90 });
      if (video?.uri) {
        await saveDraftSession({ userVideoUri: video.uri });
        router.replace('/analyze');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRecording(false);
    }
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.title}>Camera permission</Text>
        <Text style={styles.text}>Allow camera and microphone access to record a yoga clip for local analysis.</Text>
        <Pressable style={styles.primary} onPress={requestPermissions}>
          <Text style={styles.primaryText}>Allow camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front" mode="video" mute mirror videoQuality="720p" />
      </View>
      <Text style={styles.text}>Tip: put the phone far enough away to keep your full body in frame.</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.record, recording && styles.stop]} onPress={toggleRecording}>
        <Text style={styles.recordText}>{recording ? 'Stop recording' : 'Record yoga clip'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617', padding: 20, gap: 16 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '800', marginTop: 24 },
  text: { color: '#cbd5e1', fontSize: 15, lineHeight: 22 },
  cameraWrap: { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0f172a', marginTop: 12 },
  camera: { flex: 1 },
  primary: { backgroundColor: '#38bdf8', borderRadius: 14, padding: 16, alignItems: 'center' },
  primaryText: { color: '#082f49', fontWeight: '800', fontSize: 16 },
  record: { backgroundColor: '#38bdf8', borderRadius: 999, padding: 18, alignItems: 'center' },
  stop: { backgroundColor: '#fb7185' },
  recordText: { color: '#082f49', fontWeight: '900', fontSize: 17 },
  error: { color: '#fecaca', backgroundColor: '#7f1d1d', padding: 12, borderRadius: 12 },
});
