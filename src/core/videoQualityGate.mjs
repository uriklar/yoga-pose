export const REQUIRED_BY_POSE = {
  plank: ['leftShoulder','rightShoulder','leftHip','rightHip','leftAnkle','rightAnkle','leftWrist','rightWrist'],
  warrior2: ['leftShoulder','rightShoulder','leftElbow','rightElbow','leftWrist','rightWrist','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'],
  downwardDog: ['leftShoulder','rightShoulder','leftHip','rightHip','leftKnee','rightKnee','leftWrist','rightWrist'],
  tree: ['leftShoulder','rightShoulder','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'],
};

const IMPORTANT_GROUPS = {
  head: ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar'],
  shoulders: ['leftShoulder', 'rightShoulder'],
  arms: ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'],
  hips: ['leftHip', 'rightHip'],
  knees: ['leftKnee', 'rightKnee'],
  ankles: ['leftAnkle', 'rightAnkle'],
};

export function assessMinimumVideoQuality({ pose, frames = [], minVisibility = 0.5, minRequiredCoverage = 0.6 }) {
  const required = REQUIRED_BY_POSE[pose] ?? REQUIRED_BY_POSE.plank;
  const coverage = Object.fromEntries(required.map((name) => {
    const visible = frames.filter((frame) => isVisible(frame[name], minVisibility)).length;
    return [name, { visible, total: frames.length, percent: frames.length ? round(visible / frames.length * 100) : 0 }];
  }));
  const missingRequired = Object.entries(coverage)
    .filter(([, c]) => (c.percent ?? 0) < minRequiredCoverage * 100)
    .map(([name]) => name);
  const groupCoverage = Object.fromEntries(Object.entries(IMPORTANT_GROUPS).map(([group, names]) => {
    const relevant = names.filter((name) => required.includes(name) || group === 'head');
    if (!relevant.length) return [group, { visible: frames.length, total: frames.length, percent: 100, notRequired: true }];
    const visibleFrames = frames.filter((frame) => relevant.some((name) => isVisible(frame[name], minVisibility))).length;
    return [group, { visible: visibleFrames, total: frames.length, percent: frames.length ? round(visibleFrames / frames.length * 100) : 0 }];
  }));
  const visibleRequiredRatio = required.length ? (required.length - missingRequired.length) / required.length : 0;
  const bodyCompletenessOk = missingRequired.length === 0;
  const hasLowerBody = ['hips', 'knees', 'ankles'].filter((group) => !groupCoverage[group]?.notRequired).every((group) => (groupCoverage[group]?.percent ?? 0) >= minRequiredCoverage * 100);
  const hasUpperBody = ['shoulders', 'arms'].filter((group) => !groupCoverage[group]?.notRequired).every((group) => (groupCoverage[group]?.percent ?? 0) >= minRequiredCoverage * 100);
  const ok = frames.length > 0 && bodyCompletenessOk && hasLowerBody && hasUpperBody;

  return {
    ok,
    pose,
    frameCount: frames.length,
    minVisibility,
    minRequiredCoveragePercent: minRequiredCoverage * 100,
    visibleRequiredRatio: round(visibleRequiredRatio * 100),
    missingRequired,
    coverage,
    groupCoverage,
    reasons: buildReasons({ frames, missingRequired, hasLowerBody, hasUpperBody }),
  };
}

export function setupFailureFromQualityGate(pose, qualityGate) {
  const missing = qualityGate.missingRequired.map(formatName).join(', ');
  const reasons = qualityGate.reasons.join(' ');
  return {
    pose,
    confidence: 0,
    score: 0,
    feedback: [
      {
        id: 'setup-full-body-required',
        severity: 'high',
        message: missing
          ? `I can’t analyze this yet because I don’t have a reliable full-body view. Missing/low-confidence required landmarks: ${missing}.`
          : `I can’t analyze this yet because the video does not satisfy the full-body visibility requirement. ${reasons}`,
        metric: 'visibleRequiredLandmarks',
        value: qualityGate.visibleRequiredRatio,
        target: '100% required body landmarks visible in most frames',
      },
      {
        id: 'setup-camera-full-body',
        severity: 'info',
        message: 'Re-record with your whole body visible: head, shoulders, hips, knees, ankles, and hands/feet. Place the camera far enough back and keep it steady.',
      },
    ],
    scoringMode: 'quality-gate-failed',
    frameScoreSummary: { frameCount: qualityGate.frameCount, min: 0, median: 0, max: 0 },
    qualityGate,
  };
}

function isVisible(point, minVisibility) {
  return Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y) && (point.score ?? 1) >= minVisibility);
}

function buildReasons({ frames, missingRequired, hasLowerBody, hasUpperBody }) {
  const reasons = [];
  if (!frames.length) reasons.push('No pose frames were sampled.');
  if (missingRequired.length) reasons.push('Required landmarks were missing or low-confidence in too many frames.');
  if (!hasUpperBody) reasons.push('Upper body was not reliably visible.');
  if (!hasLowerBody) reasons.push('Lower body was not reliably visible.');
  return reasons;
}

function formatName(name) {
  return name.replace(/([A-Z])/g, ' $1').toLowerCase();
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : undefined;
}
