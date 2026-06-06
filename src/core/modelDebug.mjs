import { midpoint, lineDeviationDegrees } from './geometry.mjs';
import { validateLandmarks } from './yogaRules.mjs';

const REQUIRED_BY_POSE = {
  plank: ['leftShoulder','rightShoulder','leftHip','rightHip','leftAnkle','rightAnkle','leftWrist','rightWrist'],
  warrior2: ['leftShoulder','rightShoulder','leftElbow','rightElbow','leftWrist','rightWrist','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'],
  downwardDog: ['leftShoulder','rightShoulder','leftHip','rightHip','leftKnee','rightKnee','leftWrist','rightWrist'],
  tree: ['leftShoulder','rightShoulder','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'],
};

export function createModelDebug({ pose, frames = [], frameResults = [], templateMatches = [] }) {
  const required = REQUIRED_BY_POSE[pose] ?? REQUIRED_BY_POSE.plank;
  const frameDiagnostics = frames.map((frame, index) => {
    const gate = validateLandmarks(frame, required);
    return {
      index,
      confidence: round(gate.confidence),
      missing: gate.missing,
      score: frameResults[index]?.score,
      metrics: { ...metricsForPose(pose, frame), templateDistance: templateMatches[index]?.distance },
      templateMatch: templateMatches[index],
      visibleLandmarks: Object.entries(frame).filter(([, p]) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.score ?? 1) >= 0.35).map(([name]) => name),
    };
  });
  const usable = frameDiagnostics.filter((f) => f.missing.length === 0);
  const worst = usable.length ? [...usable].sort((a, b) => (a.score ?? 999) - (b.score ?? 999))[0] : null;
  const coverage = Object.fromEntries(required.map((name) => {
    const visible = frames.filter((frame) => frame[name] && Number.isFinite(frame[name].x) && Number.isFinite(frame[name].y) && (frame[name].score ?? 1) >= 0.35).length;
    return [name, { visible, total: frames.length, percent: frames.length ? round(visible / frames.length * 100) : 0 }];
  }));

  return {
    pose,
    frameCount: frames.length,
    usableFrameCount: usable.length,
    requiredLandmarks: required,
    landmarkCoverage: coverage,
    worstFrameIndex: worst?.index ?? null,
    worstFrame: worst,
    frameDiagnostics,
    templateDistanceSummary: summarizeTemplateDistances(templateMatches),
    note: 'Scores are based on pose landmarks, not raw video pixels. If landmarks are missing, jumpy, or far from the selected pose template, the score can be misleading.',
  };
}

function metricsForPose(pose, lm) {
  if (pose === 'plank') return plankMetrics(lm);
  return {};
}

export function plankMetrics(lm) {
  const required = REQUIRED_BY_POSE.plank;
  if (!validateLandmarks(lm, required).ok) return {};
  const shoulder = midpoint(lm.leftShoulder, lm.rightShoulder);
  const hip = midpoint(lm.leftHip, lm.rightHip);
  const ankle = midpoint(lm.leftAnkle, lm.rightAnkle);
  const wrist = midpoint(lm.leftWrist, lm.rightWrist);
  return {
    bodyLineDeviation: round(lineDeviationDegrees(shoulder, hip, ankle)),
    shoulderWristOffset: round(Math.abs(shoulder.x - wrist.x)),
    shoulderY: round(shoulder.y),
    hipY: round(hip.y),
    ankleY: round(ankle.y),
    hipVsShoulder: round(hip.y - shoulder.y),
    hipVsAnkle: round(hip.y - ankle.y),
  };
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : undefined;
}


function summarizeTemplateDistances(matches = []) {
  const values = matches.map((match) => match?.distance).filter(Number.isFinite);
  if (!values.length) return null;
  return { min: round(Math.min(...values)), median: round(median(values)), max: round(Math.max(...values)) };
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return NaN;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
