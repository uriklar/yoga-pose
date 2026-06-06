const MEDIAPIPE_NAMES = [
  'nose','leftEyeInner','leftEye','leftEyeOuter','rightEyeInner','rightEye','rightEyeOuter','leftEar','rightEar','mouthLeft','mouthRight',
  'leftShoulder','rightShoulder','leftElbow','rightElbow','leftWrist','rightWrist','leftPinky','rightPinky','leftIndex','rightIndex','leftThumb','rightThumb',
  'leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle','leftHeel','rightHeel','leftFootIndex','rightFootIndex'
];

const MOVENET_NAMES = [
  'nose','leftEye','rightEye','leftEar','rightEar','leftShoulder','rightShoulder','leftElbow','rightElbow','leftWrist','rightWrist','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'
];

export function fromMediaPipeLandmarks(landmarks = []) {
  return Object.fromEntries(MEDIAPIPE_NAMES.map((name, index) => [name, normalizePoint(landmarks[index])]));
}

export function fromMoveNetKeypoints(keypoints = []) {
  return Object.fromEntries(MOVENET_NAMES.map((name, index) => [name, normalizeMoveNetPoint(keypoints[index])]));
}

export function aggregateLandmarkFrames(frames = []) {
  const names = [...new Set(frames.flatMap((frame) => Object.keys(frame)))];
  const aggregate = {};
  for (const name of names) {
    const points = frames.map((frame) => frame[name]).filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!points.length) continue;
    aggregate[name] = {
      x: median(points.map((p) => p.x)),
      y: median(points.map((p) => p.y)),
      z: median(points.map((p) => p.z ?? 0)),
      score: median(points.map((p) => p.score ?? 1)),
    };
  }
  return aggregate;
}

function normalizePoint(point) {
  if (!point) return undefined;
  return { x: point.x, y: point.y, z: point.z, score: point.visibility ?? point.presence ?? point.score ?? 1 };
}

function normalizeMoveNetPoint(point) {
  if (!point) return undefined;
  // TensorFlow MoveNet examples commonly use [y, x, score]. Some JS APIs use objects.
  if (Array.isArray(point)) return { y: point[0], x: point[1], score: point[2] ?? 1 };
  return { x: point.x, y: point.y, score: point.score ?? point.confidence ?? 1 };
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return NaN;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
