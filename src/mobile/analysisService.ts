import { Platform } from 'react-native';
import { analyzePose } from '../core/poseAnalyzer.mjs';
import { compareToReference } from '../core/referenceComparison.mjs';
import { classifyReferenceSource, getFrameReadableReferenceUri } from '../pipeline/referenceSource';
import { loadDraftSession } from './sessionStore';

const samplePlank = {
  leftShoulder: { x: 0.25, y: 0.30, score: 0.9 },
  rightShoulder: { x: 0.35, y: 0.31, score: 0.9 },
  leftHip: { x: 0.55, y: 0.47, score: 0.9 },
  rightHip: { x: 0.65, y: 0.48, score: 0.9 },
  leftAnkle: { x: 0.88, y: 0.66, score: 0.9 },
  rightAnkle: { x: 0.92, y: 0.67, score: 0.9 },
  leftWrist: { x: 0.24, y: 0.62, score: 0.9 },
  rightWrist: { x: 0.35, y: 0.62, score: 0.9 },
};

const referenceFrame = {
  leftShoulder: { x: 0.4, y: 0.2, score: 1 },
  rightShoulder: { x: 0.6, y: 0.2, score: 1 },
  leftHip: { x: 0.42, y: 0.5, score: 1 },
  rightHip: { x: 0.58, y: 0.5, score: 1 },
  leftKnee: { x: 0.42, y: 0.75, score: 1 },
  rightKnee: { x: 0.58, y: 0.75, score: 1 },
  leftAnkle: { x: 0.42, y: 1.0, score: 1 },
  rightAnkle: { x: 0.58, y: 1.0, score: 1 },
  leftElbow: { x: 0.3, y: 0.35, score: 1 },
  rightElbow: { x: 0.7, y: 0.35, score: 1 },
  leftWrist: { x: 0.2, y: 0.5, score: 1 },
  rightWrist: { x: 0.8, y: 0.5, score: 1 },
};

export async function analyzeDraftSession({ pose, mode }: { pose: string; mode: 'rules' | 'reference' }) {
  const session = await loadDraftSession();

  if (Platform.OS === 'web' && session?.userVideoUri) {
    try {
      const { analyzeVideoOnWeb } = await import('../pipeline/videoAnalysis.web.ts');
      const referenceSource = mode === 'reference' ? classifyReferenceSource(session.referenceVideoUri ?? session.referenceUrl) : { kind: 'none' as const };
      const frameReadableReference = getFrameReadableReferenceUri(referenceSource);
      if (mode === 'reference' && session.referenceUrl && !frameReadableReference) {
        return unsupportedReferenceResult(pose, referenceSource);
      }
      return await analyzeVideoOnWeb({
        pose,
        userVideoUri: session.userVideoUri,
        referenceUrl: frameReadableReference ?? undefined,
        sampling: { everyMs: 750, maxFrames: 60, targetWidth: 384 },
      });
    } catch (error) {
      return analysisErrorResult(pose, error);
    }
  }

  if (session?.userVideoUri && Platform.OS !== 'web') {
    return nativeUnsupportedResult(pose);
  }

  // Dev fallback when no real video has been selected yet; useful for route smoke tests only.
  if (mode === 'reference') {
    const userFrame = { ...referenceFrame, leftKnee: { ...referenceFrame.leftKnee, x: 0.2 } };
    return {
      ...compareToReference({ pose, referenceFrames: [referenceFrame, referenceFrame] as any, userFrames: [userFrame, userFrame] as any }),
      analysisMode: 'sample-reference-fallback',
    };
  }
  return { ...analyzePose({ pose, landmarks: samplePlank as any }), analysisMode: 'sample-rule-fallback' };
}

function analysisErrorResult(pose: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    pose,
    score: 0,
    confidence: 0,
    feedback: [
      {
        id: 'analysis-runtime-error',
        severity: 'high',
        message: `Could not analyze this video yet: ${message}`,
      },
      {
        id: 'analysis-next-step',
        severity: 'info',
        message: 'Try a local video file or a direct MP4 URL. YouTube-style links need a backend reference-ingest step because browsers block direct frame access.',
      },
    ],
  };
}

function unsupportedReferenceResult(pose: string, source: any) {
  return {
    pose,
    score: 0,
    confidence: 0,
    feedback: [
      { id: 'reference-needs-backend-ingest', severity: 'high', message: source.reason ?? 'This reference link needs backend ingestion before frame sampling.' },
      { id: 'reference-direct-video-tip', severity: 'info', message: 'Use a direct MP4/MOV/WebM URL or upload a local reference clip for the current app pipeline. YouTube/Vimeo links need a backend extractor/cache step.' },
    ],
  };
}

function nativeUnsupportedResult(pose: string) {
  return {
    pose,
    score: 0,
    confidence: 0,
    analysisMode: 'native-detector-missing',
    feedback: [
      { id: 'native-detector-missing', severity: 'high', message: 'Recording/import works on native Expo, but real on-device pose detection is not wired yet. Use the web build for real MediaPipe analysis today.' },
      { id: 'native-next-step', severity: 'info', message: 'Next implementation target: native iOS detector adapter, likely via custom dev client/native module or TensorFlow MoveNet integration.' },
    ],
  };
}
