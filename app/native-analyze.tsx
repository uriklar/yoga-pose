import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { fromMediaPipeLandmarks } from '../src/core/landmarkAdapters.mjs';
import { analyzeSession } from '../src/pipeline/sessionAnalyzer.mjs';
import { sampleVideoFramesNative } from '../src/pipeline/frameSampler.native';
import { buildNativeLandmarkWorkerHtml } from '../src/mobile/nativeLandmarkWorkerHtml';
import { loadDraftSession, saveLastResult } from '../src/mobile/sessionStore';

type WorkerMessage =
  | { type: 'ready' }
  | { type: 'status'; message: string }
  | { type: 'error'; requestId?: string; message: string }
  | { type: 'landmarks'; requestId?: string; landmarkFrames: { timestampMs: number; landmarks: any[] }[] };

export default function NativeAnalyzeScreen() {
  const params = useLocalSearchParams<{ pose?: string; mode?: 'rules' | 'reference' }>();
  const pose = params.pose ?? 'plank';
  const mode = params.mode ?? 'rules';
  const webViewRef = useRef<WebView>(null);
  const [status, setStatus] = useState('Starting native video analysis…');
  const [detail, setDetail] = useState('Loading detector bridge.');
  const [busy, setBusy] = useState(false);
  const pendingRun = useRef<{ userFrames?: any[]; referenceFrames?: any[] }>({});

  async function startAnalysis() {
    if (busy) return;
    setBusy(true);
    try {
      const session = await loadDraftSession();
      if (!session?.userVideoUri) throw new Error('No user video found. Import or record a yoga clip first.');

      setStatus('Sampling your phone video…');
      const userFrames = await sampleVideoFramesNative(session.userVideoUri, { durationMs: session.userVideoDurationMs, everyMs: 900, maxFrames: 24 });
      let referenceFrames: any[] | undefined;

      if (mode === 'reference') {
        const referenceUri = session.referenceVideoUri;
        if (!referenceUri) throw new Error('Native reference comparison needs an uploaded reference clip. Direct/platform links still use the web/backend path.');
        setStatus('Sampling reference clip…');
        referenceFrames = await sampleVideoFramesNative(referenceUri, { durationMs: session.referenceVideoDurationMs, everyMs: 900, maxFrames: 24 });
      }

      pendingRun.current = { userFrames, referenceFrames };
      setStatus('Sending sampled frames to MediaPipe…');
      setDetail(`${userFrames.length} user frames${referenceFrames ? `, ${referenceFrames.length} reference frames` : ''}.`);
      postToWorker({ type: 'analyze', requestId: 'user', frames: userFrames });
    } catch (error) {
      await saveErrorResult(error);
    }
  }

  async function handleWorkerMessage(event: WebViewMessageEvent) {
    let message: WorkerMessage;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (message.type === 'ready') {
      setDetail('Detector bridge ready.');
      startAnalysis();
      return;
    }
    if (message.type === 'status') {
      setDetail(message.message);
      return;
    }
    if (message.type === 'error') {
      await saveErrorResult(new Error(message.message));
      return;
    }
    if (message.type === 'landmarks') {
      await handleLandmarks(message);
    }
  }

  async function handleLandmarks(message: Extract<WorkerMessage, { type: 'landmarks' }>) {
    if (message.requestId === 'user') {
      const userLandmarkFrames = message.landmarkFrames.map((frame) => fromMediaPipeLandmarks(frame.landmarks));
      pendingRun.current.userFrames = userLandmarkFrames;
      if (mode === 'reference' && pendingRun.current.referenceFrames?.[0]?.dataUri) {
        setStatus('Analyzing reference landmarks…');
        postToWorker({ type: 'analyze', requestId: 'reference', frames: pendingRun.current.referenceFrames });
        return;
      }
      await finishWithResult(userLandmarkFrames, undefined);
      return;
    }

    if (message.requestId === 'reference') {
      const referenceLandmarkFrames = message.landmarkFrames.map((frame) => fromMediaPipeLandmarks(frame.landmarks));
      await finishWithResult(pendingRun.current.userFrames ?? [], referenceLandmarkFrames);
    }
  }

  async function finishWithResult(userLandmarkFrames: any[], referenceLandmarkFrames?: any[]) {
    setStatus('Running coaching engine…');
    const result = referenceLandmarkFrames?.length
      ? {
          ...analyzeSession({ pose, userLandmarkFrames: userLandmarkFrames as any, referenceLandmarkFrames: referenceLandmarkFrames as any }),
          analysisMode: 'native-webview-reference-mediapipe',
          sampledFrames: { user: userLandmarkFrames.length, reference: referenceLandmarkFrames.length },
        }
      : {
          ...analyzeSession({ pose, userLandmarkFrames: userLandmarkFrames as any }),
          analysisMode: 'native-webview-rule-mediapipe',
          sampledFrames: { user: userLandmarkFrames.length, reference: 0 },
        };
    await saveLastResult(result);
    router.replace('/result');
  }

  async function saveErrorResult(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await saveLastResult({
      pose,
      score: 0,
      confidence: 0,
      analysisMode: 'native-webview-error',
      feedback: [
        { id: 'native-landmark-error', severity: 'high', message: `Could not extract phone-video landmarks: ${message}` },
        { id: 'native-landmark-retry', severity: 'info', message: 'Try a shorter clip with your full body visible, or use the web path with an uploaded video.' },
      ],
    });
    router.replace('/result');
  }

  function postToWorker(payload: unknown) {
    webViewRef.current?.postMessage(JSON.stringify(payload));
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Extracting landmarks</Text>
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: buildNativeLandmarkWorkerHtml() }}
        onMessage={handleWorkerMessage}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        style={styles.webview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#020617', gap: 16 },
  card: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 20, padding: 18, gap: 10, marginTop: 24 },
  title: { color: '#f8fafc', fontSize: 26, fontWeight: '900' },
  status: { color: '#bae6fd', fontSize: 17, fontWeight: '800' },
  detail: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
  webview: { width: 1, height: 1, opacity: 0.02, backgroundColor: '#020617' },
});
