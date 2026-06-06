import { fromMediaPipeLandmarks, fromMoveNetKeypoints } from '../core/landmarkAdapters.mjs';

export function convertDetectorResult(result, detectorKind) {
  if (detectorKind === 'mediapipe') {
    const landmarks = result?.landmarks?.[0] ?? result?.worldLandmarks?.[0] ?? result;
    return fromMediaPipeLandmarks(landmarks);
  }
  if (detectorKind === 'movenet') {
    const keypoints = result?.keypoints ?? result?.[0]?.keypoints ?? result;
    return fromMoveNetKeypoints(keypoints);
  }
  throw new Error(`Unsupported detector kind: ${detectorKind}`);
}

export function qualityGateLandmarkFrames(frames = [], minVisiblePoints = 8) {
  return frames.filter((frame) => Object.values(frame).filter((point) => point && (point.score ?? 1) >= 0.35).length >= minVisiblePoints);
}
