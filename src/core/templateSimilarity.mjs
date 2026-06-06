import { compareFrames, normalizeLandmarks } from './referenceComparison.mjs';
import { targetTemplateForPose } from './poseTemplates.mjs';

const CAPS = [
  { distance: 0.62, cap: 35, severity: 'high', label: 'very different' },
  { distance: 0.48, cap: 50, severity: 'high', label: 'different' },
  { distance: 0.36, cap: 68, severity: 'medium', label: 'somewhat different' },
];

export function compareToPoseTemplate({ pose, landmarks }) {
  const target = targetTemplateForPose(pose);
  const user = normalizeLandmarks(landmarks);
  const normalTarget = normalizeLandmarks(target);
  const flippedTarget = normalizeLandmarks(flipLandmarks(target));
  const normal = compareFrames(normalTarget, user);
  const flipped = compareFrames(flippedTarget, user);
  const best = normal.distance <= flipped.distance ? normal : flipped;
  const matchedOrientation = normal.distance <= flipped.distance ? 'normal' : 'mirrored';
  const cap = CAPS.find((entry) => best.distance > entry.distance) ?? null;

  return {
    pose,
    distance: round(best.distance),
    confidence: round(best.confidence),
    matchedOrientation,
    cap: cap?.cap ?? null,
    severity: cap?.severity ?? null,
    label: cap?.label ?? 'similar',
    landmarkDistances: best.landmarkDistances,
  };
}

export function applyTemplateSanityGate(result, templateMatch) {
  if (!templateMatch?.cap || result.score <= templateMatch.cap) return result;
  const feedback = [
    {
      id: 'pose-template-mismatch',
      severity: templateMatch.severity,
      message: `This does not look like the selected pose overall. The detected skeleton is ${templateMatch.label} from the ${result.pose} target shape, so I capped the score.`,
      metric: 'templateDistance',
      value: templateMatch.distance,
      target: '<0.36 normalized',
    },
    ...(result.feedback ?? []).filter((item) => item.id !== 'pose-template-mismatch'),
  ];
  return { ...result, score: Math.min(result.score, templateMatch.cap), feedback, templateMatch };
}

function flipLandmarks(landmarks = {}) {
  const xs = Object.values(landmarks).map((p) => p?.x).filter(Number.isFinite);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return Object.fromEntries(Object.entries(landmarks).map(([name, point]) => {
    if (!point || !Number.isFinite(point.x)) return [name, point];
    return [swapSide(name), { ...point, x: minX + maxX - point.x }];
  }));
}

function swapSide(name) {
  if (name.startsWith('left')) return `right${name.slice(4)}`;
  if (name.startsWith('right')) return `left${name.slice(5)}`;
  return name;
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : undefined;
}
