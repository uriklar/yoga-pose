import { angleDegrees, average, lineDeviationDegrees, midpoint } from './geometry.mjs';

const MIN_SCORE = 0.35;

export const POSE_RULES = {
  warrior2: analyzeWarrior2,
  plank: analyzePlank,
  downwardDog: analyzeDownwardDog,
  tree: analyzeTree,
};

export function validateLandmarks(landmarks, requiredNames) {
  const missing = requiredNames.filter((name) => !landmarks[name] || (landmarks[name].score ?? 1) < MIN_SCORE);
  return {
    ok: missing.length === 0,
    missing,
    confidence: requiredNames.length
      ? (requiredNames.length - missing.length) / requiredNames.length
      : 1,
  };
}

function item(id, severity, message, metric, value, target) {
  return { id, severity, message, metric, value: round(value), target };
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : undefined;
}

function scoreFromFeedback(feedback) {
  const weights = { info: 0, low: 6, medium: 12, high: 22 };
  const penalty = feedback.reduce((sum, f) => sum + weights[f.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function analyzeWarrior2(lm) {
  const required = ['leftShoulder','rightShoulder','leftElbow','rightElbow','leftWrist','rightWrist','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'];
  const gate = validateLandmarks(lm, required);
  if (!gate.ok) return setupResult('warrior2', gate);

  const leftKnee = angleDegrees(lm.leftHip, lm.leftKnee, lm.leftAnkle);
  const rightKnee = angleDegrees(lm.rightHip, lm.rightKnee, lm.rightAnkle);
  const frontKnee = Math.min(leftKnee, rightKnee);
  const leftArmDev = lineDeviationDegrees(lm.leftWrist, lm.leftElbow, lm.leftShoulder);
  const rightArmDev = lineDeviationDegrees(lm.rightWrist, lm.rightElbow, lm.rightShoulder);
  const armDev = average([leftArmDev, rightArmDev]);
  const torsoLean = Math.abs(lm.leftShoulder.y + lm.rightShoulder.y - lm.leftHip.y - lm.rightHip.y);

  const feedback = [];
  if (frontKnee > 120) feedback.push(item('warrior2-front-knee-too-straight', 'medium', 'Bend the front knee a bit more so it feels closer to stacked over the ankle.', 'frontKneeAngle', frontKnee, '80-110°'));
  if (frontKnee < 70) feedback.push(item('warrior2-front-knee-too-deep', 'medium', 'Ease out of the front knee slightly; avoid collapsing past a comfortable lunge.', 'frontKneeAngle', frontKnee, '80-110°'));
  if (armDev > 18) feedback.push(item('warrior2-arms', 'low', 'Reach evenly through both arms; try making one long line from fingertip to fingertip.', 'armLineDeviation', armDev, '<18°'));
  if (torsoLean > 0.18) feedback.push(item('warrior2-torso', 'low', 'Bring the torso more upright instead of leaning into the front leg.', 'torsoLean', torsoLean, '<0.18 normalized'));
  if (!feedback.length) feedback.push(item('warrior2-good', 'info', 'Nice Warrior II shape: knee depth and arm line look solid.'));
  return result('warrior2', gate.confidence, feedback);
}

export function analyzePlank(lm) {
  const required = ['leftShoulder','rightShoulder','leftHip','rightHip','leftAnkle','rightAnkle','leftWrist','rightWrist'];
  const gate = validateLandmarks(lm, required);
  if (!gate.ok) return setupResult('plank', gate);

  const shoulder = midpoint(lm.leftShoulder, lm.rightShoulder);
  const hip = midpoint(lm.leftHip, lm.rightHip);
  const ankle = midpoint(lm.leftAnkle, lm.rightAnkle);
  const bodyLineDeviation = lineDeviationDegrees(shoulder, hip, ankle);
  const wrist = midpoint(lm.leftWrist, lm.rightWrist);
  const shoulderWristOffset = Math.abs(shoulder.x - wrist.x);

  const feedback = [];
  if (bodyLineDeviation > 34) feedback.push(item('plank-line-severe', 'high', 'Your hips are far out of the plank line. First fix the big body shape: shoulders, hips, and ankles should form one long line.', 'bodyLineDeviation', bodyLineDeviation, '<14°'));
  else if (bodyLineDeviation > 22) feedback.push(item('plank-line-major', 'medium', 'Your plank line is noticeably off. Adjust the hips until they sit between shoulders and ankles instead of piking or sagging.', 'bodyLineDeviation', bodyLineDeviation, '<14°'));
  else if (bodyLineDeviation > 14) feedback.push(item('plank-line', 'low', 'Aim for one long line from shoulders through hips to ankles; avoid piking or sagging the hips.', 'bodyLineDeviation', bodyLineDeviation, '<14°'));
  if (shoulderWristOffset > 0.24) feedback.push(item('plank-wrists-severe', 'medium', 'Your shoulders are far from stacked over your wrists; move your base so shoulders sit closer above hands.', 'shoulderWristOffset', shoulderWristOffset, '<0.12 normalized'));
  else if (shoulderWristOffset > 0.12) feedback.push(item('plank-wrists', 'low', 'Stack shoulders closer over wrists to reduce strain.', 'shoulderWristOffset', shoulderWristOffset, '<0.12 normalized'));
  if (!feedback.length) feedback.push(item('plank-good', 'info', 'Strong plank line: shoulders, hips, and ankles look well aligned.'));
  return result('plank', gate.confidence, feedback);
}

export function analyzeDownwardDog(lm) {
  const required = ['leftShoulder','rightShoulder','leftHip','rightHip','leftKnee','rightKnee','leftWrist','rightWrist'];
  const gate = validateLandmarks(lm, required);
  if (!gate.ok) return setupResult('downwardDog', gate);

  const shoulder = midpoint(lm.leftShoulder, lm.rightShoulder);
  const hip = midpoint(lm.leftHip, lm.rightHip);
  const wrist = midpoint(lm.leftWrist, lm.rightWrist);
  const knee = midpoint(lm.leftKnee, lm.rightKnee);
  const shoulderHipWrist = angleDegrees(shoulder, hip, wrist);
  const hipKneeLine = lineDeviationDegrees(shoulder, hip, knee);

  const feedback = [];
  if (shoulderHipWrist < 55 || shoulderHipWrist > 105) feedback.push(item('ddog-hips', 'medium', 'Press the hips back and lengthen through the spine; make an inverted V rather than a plank-like shape.', 'hipAngle', shoulderHipWrist, '55-105°'));
  if (hipKneeLine > 35) feedback.push(item('ddog-spine', 'low', 'Bend the knees as much as needed so the back can feel longer.', 'spineLegDeviation', hipKneeLine, '<35°'));
  if (!feedback.length) feedback.push(item('ddog-good', 'info', 'Good Downward Dog baseline: hips are high and the spine line looks reasonable.'));
  return result('downwardDog', gate.confidence, feedback);
}

export function analyzeTree(lm) {
  const required = ['leftShoulder','rightShoulder','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'];
  const gate = validateLandmarks(lm, required);
  if (!gate.ok) return setupResult('tree', gate);

  const shoulderTilt = Math.abs(lm.leftShoulder.y - lm.rightShoulder.y);
  const hipTilt = Math.abs(lm.leftHip.y - lm.rightHip.y);
  const leftLeg = lineDeviationDegrees(lm.leftHip, lm.leftKnee, lm.leftAnkle);
  const rightLeg = lineDeviationDegrees(lm.rightHip, lm.rightKnee, lm.rightAnkle);
  const standingLegDeviation = Math.min(leftLeg, rightLeg);

  const feedback = [];
  if (standingLegDeviation > 16) feedback.push(item('tree-standing-leg', 'medium', 'Ground through the standing leg and keep it tall without locking the knee hard.', 'standingLegDeviation', standingLegDeviation, '<16°'));
  if (hipTilt > 0.08) feedback.push(item('tree-hips-level', 'low', 'Level the hips gently; imagine both hip points facing forward.', 'hipTilt', hipTilt, '<0.08 normalized'));
  if (shoulderTilt > 0.08) feedback.push(item('tree-shoulders-level', 'low', 'Soften and level the shoulders while keeping the chest relaxed.', 'shoulderTilt', shoulderTilt, '<0.08 normalized'));
  feedback.push(item('tree-safety', 'info', 'Safety cue: place the lifted foot above or below the knee, not pressing directly into the knee joint.'));
  return result('tree', gate.confidence, feedback);
}

function setupResult(pose, gate) {
  return {
    pose,
    confidence: gate.confidence,
    score: 0,
    feedback: [
      item('setup-visibility', 'high', `I need a clearer full-body view. Missing or low-confidence landmarks: ${gate.missing.join(', ')}.`),
      item('setup-camera', 'info', 'Try a stable camera at hip/chest height with your full body in frame and good lighting.'),
    ],
  };
}

function result(pose, confidence, feedback) {
  return { pose, confidence, score: scoreFromFeedback(feedback), feedback };
}
