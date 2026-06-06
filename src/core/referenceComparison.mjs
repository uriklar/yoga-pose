import { distance, midpoint } from './geometry.mjs';

const DEFAULT_WEIGHTS = {
  nose: 0.2,
  leftShoulder: 1,
  rightShoulder: 1,
  leftElbow: 0.7,
  rightElbow: 0.7,
  leftWrist: 0.7,
  rightWrist: 0.7,
  leftHip: 1,
  rightHip: 1,
  leftKnee: 0.9,
  rightKnee: 0.9,
  leftAnkle: 0.8,
  rightAnkle: 0.8,
};

const BODY_AREAS = {
  shoulders: ['leftShoulder', 'rightShoulder'],
  arms: ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'],
  hips: ['leftHip', 'rightHip'],
  knees: ['leftKnee', 'rightKnee'],
  feet: ['leftAnkle', 'rightAnkle'],
};

export function compareToReference({ referenceFrames = [], userFrames = [], pose = 'reference', maxWarpRatio = 2 }) {
  const cleanReference = referenceFrames.map(normalizeLandmarks).filter((frame) => Object.keys(frame).length);
  const cleanUser = userFrames.map(normalizeLandmarks).filter((frame) => Object.keys(frame).length);

  if (!cleanReference.length || !cleanUser.length) {
    return {
      pose,
      score: 0,
      confidence: 0,
      alignment: [],
      feedback: [
        { id: 'comparison-missing-data', severity: 'high', message: 'I need pose landmarks from both the reference video and your video before I can compare them.' },
      ],
    };
  }

  const alignment = alignSequences(cleanReference, cleanUser, { maxWarpRatio });
  const frameScores = alignment.map(([rIndex, uIndex]) => compareFrames(cleanReference[rIndex], cleanUser[uIndex]));
  const averageDistance = mean(frameScores.map((frame) => frame.distance));
  const confidence = mean(frameScores.map((frame) => frame.confidence));
  const bodyAreaScores = rankBodyAreas(frameScores);
  const timing = timingFeedback(alignment, cleanReference.length, cleanUser.length);
  const feedback = buildComparisonFeedback(bodyAreaScores, timing, averageDistance);

  return {
    pose,
    score: Math.max(0, Math.round(100 - averageDistance * 135)),
    confidence: round(confidence),
    averageDistance: round(averageDistance),
    alignment,
    bodyAreaScores,
    feedback,
  };
}

export function normalizeLandmarks(landmarks = {}) {
  const leftHip = landmarks.leftHip;
  const rightHip = landmarks.rightHip;
  const leftShoulder = landmarks.leftShoulder;
  const rightShoulder = landmarks.rightShoulder;

  const center = leftHip && rightHip ? midpoint(leftHip, rightHip) : estimateCenter(landmarks);
  const shoulderWidth = leftShoulder && rightShoulder ? distance(leftShoulder, rightShoulder) : NaN;
  const hipWidth = leftHip && rightHip ? distance(leftHip, rightHip) : NaN;
  const scale = firstFinite([shoulderWidth, hipWidth, estimateBodyScale(landmarks), 1]);

  const normalized = {};
  for (const [name, point] of Object.entries(landmarks)) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    normalized[name] = {
      x: (point.x - center.x) / scale,
      y: (point.y - center.y) / scale,
      z: Number.isFinite(point.z) ? (point.z - (center.z ?? 0)) / scale : 0,
      score: point.score ?? 1,
    };
  }
  return normalized;
}

export function compareFrames(reference, user) {
  let weightedDistance = 0;
  let totalWeight = 0;
  const landmarkDistances = {};

  for (const [name, weight] of Object.entries(DEFAULT_WEIGHTS)) {
    if (!reference[name] || !user[name]) continue;
    const confidence = Math.min(reference[name].score ?? 1, user[name].score ?? 1);
    if (confidence < 0.35) continue;
    const d = distance(reference[name], user[name]);
    landmarkDistances[name] = round(d);
    weightedDistance += d * weight * confidence;
    totalWeight += weight * confidence;
  }

  return {
    distance: totalWeight ? weightedDistance / totalWeight : 1,
    confidence: Math.min(1, totalWeight / Object.values(DEFAULT_WEIGHTS).reduce((sum, w) => sum + w, 0)),
    landmarkDistances,
  };
}

export function alignSequences(referenceFrames, userFrames, { maxWarpRatio = 2 } = {}) {
  const n = referenceFrames.length;
  const m = userFrames.length;
  const cost = Array.from({ length: n }, () => Array(m).fill(Infinity));
  const prev = Array.from({ length: n }, () => Array(m).fill(null));

  cost[0][0] = compareFrames(referenceFrames[0], userFrames[0]).distance;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (!Number.isFinite(cost[i][j])) continue;
      for (const [di, dj] of [[1, 0], [0, 1], [1, 1]]) {
        const ni = i + di;
        const nj = j + dj;
        if (ni >= n || nj >= m) continue;
        if (!withinWarpWindow(ni, nj, n, m, maxWarpRatio)) continue;
        const nextCost = cost[i][j] + compareFrames(referenceFrames[ni], userFrames[nj]).distance;
        if (nextCost < cost[ni][nj]) {
          cost[ni][nj] = nextCost;
          prev[ni][nj] = [i, j];
        }
      }
    }
  }

  const path = [];
  let cursor = [n - 1, m - 1];
  while (cursor) {
    path.push(cursor);
    cursor = prev[cursor[0]][cursor[1]];
  }
  return path.reverse();
}

function withinWarpWindow(i, j, n, m, maxWarpRatio) {
  if (n <= 1 || m <= 1) return true;
  const refProgress = i / (n - 1);
  const userProgress = j / (m - 1);
  const maxDelta = 0.5 / Math.max(1, maxWarpRatio);
  return Math.abs(refProgress - userProgress) <= maxDelta || i === n - 1 || j === m - 1;
}

function rankBodyAreas(frameScores) {
  return Object.entries(BODY_AREAS)
    .map(([area, names]) => {
      const values = frameScores.flatMap((frame) => names.map((name) => frame.landmarkDistances[name]).filter(Number.isFinite));
      return { area, distance: round(mean(values)), severity: severityForDistance(mean(values)) };
    })
    .filter((area) => Number.isFinite(area.distance))
    .sort((a, b) => b.distance - a.distance);
}

function buildComparisonFeedback(bodyAreaScores, timing, averageDistance) {
  const feedback = [];
  const worst = bodyAreaScores.filter((area) => area.distance > 0.28).slice(0, 3);

  for (const area of worst) {
    feedback.push({
      id: `reference-${area.area}`,
      severity: area.severity,
      message: comparisonMessage(area.area),
      metric: `${area.area}Distance`,
      value: area.distance,
      target: '<0.28 normalized',
    });
  }

  if (timing) feedback.push(timing);
  if (!feedback.length) {
    feedback.push({ id: 'reference-good', severity: 'info', message: 'Your shape tracks the reference video closely for the sampled frames.' });
  } else if (averageDistance > 0.55) {
    feedback.unshift({ id: 'reference-overall', severity: 'high', message: 'Overall, your movement is meaningfully different from the reference. Start by matching the broad body shape before fine-tuning details.' });
  }

  return feedback;
}

function comparisonMessage(area) {
  const messages = {
    shoulders: 'Your shoulder position differs most from the reference; check whether your chest is rotating or your arms are drifting.',
    arms: 'Your arm line differs from the reference; compare elbow bend and wrist reach at this part of the movement.',
    hips: 'Your hip position differs from the reference; adjust pelvis height/rotation before chasing smaller details.',
    knees: 'Your knee position differs from the reference; check bend depth and knee tracking over the foot.',
    feet: 'Your foot/ankle placement differs from the reference; check stance width and how far forward/back your feet are.',
  };
  return messages[area] ?? `Your ${area} alignment differs from the reference.`;
}

function timingFeedback(alignment, referenceLength, userLength) {
  if (referenceLength < 4 || userLength < 4) return null;
  const ratio = userLength / referenceLength;
  if (ratio > 1.25) return { id: 'reference-timing-slower', severity: 'low', message: 'Your version appears slower than the reference; that may be fine, but the app will align the movement before judging shape.', metric: 'durationRatio', value: round(ratio), target: '0.8-1.25' };
  if (ratio < 0.8) return { id: 'reference-timing-faster', severity: 'low', message: 'Your version appears faster than the reference; slow down if you want a closer form comparison.', metric: 'durationRatio', value: round(ratio), target: '0.8-1.25' };
  return null;
}

function severityForDistance(value) {
  if (value > 0.55) return 'high';
  if (value > 0.38) return 'medium';
  if (value > 0.28) return 'low';
  return 'info';
}

function estimateCenter(landmarks) {
  const values = Object.values(landmarks).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  return { x: mean(values.map((p) => p.x)), y: mean(values.map((p) => p.y)), z: mean(values.map((p) => p.z ?? 0)) };
}

function estimateBodyScale(landmarks) {
  const points = Object.values(landmarks).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  if (points.length < 2) return 1;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 0.01);
}

function firstFinite(values) {
  return values.find((value) => Number.isFinite(value) && value > 0.0001) ?? 1;
}

function mean(values) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : NaN;
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : undefined;
}
