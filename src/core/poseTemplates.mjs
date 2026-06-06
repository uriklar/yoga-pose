export const TARGET_POSE_TEMPLATES = {
  plank: {
    leftShoulder: { x: 0.18, y: 0.36, score: 1 }, rightShoulder: { x: 0.22, y: 0.38, score: 1 },
    leftElbow: { x: 0.18, y: 0.52, score: 1 }, rightElbow: { x: 0.22, y: 0.54, score: 1 },
    leftWrist: { x: 0.18, y: 0.68, score: 1 }, rightWrist: { x: 0.22, y: 0.70, score: 1 },
    leftHip: { x: 0.50, y: 0.44, score: 1 }, rightHip: { x: 0.54, y: 0.46, score: 1 },
    leftKnee: { x: 0.72, y: 0.50, score: 1 }, rightKnee: { x: 0.76, y: 0.52, score: 1 },
    leftAnkle: { x: 0.92, y: 0.56, score: 1 }, rightAnkle: { x: 0.96, y: 0.58, score: 1 },
  },
  warrior2: {
    leftShoulder: { x: 0.44, y: 0.26, score: 1 }, rightShoulder: { x: 0.56, y: 0.26, score: 1 },
    leftElbow: { x: 0.30, y: 0.27, score: 1 }, rightElbow: { x: 0.70, y: 0.27, score: 1 },
    leftWrist: { x: 0.14, y: 0.28, score: 1 }, rightWrist: { x: 0.86, y: 0.28, score: 1 },
    leftHip: { x: 0.44, y: 0.50, score: 1 }, rightHip: { x: 0.56, y: 0.50, score: 1 },
    leftKnee: { x: 0.28, y: 0.66, score: 1 }, rightKnee: { x: 0.72, y: 0.54, score: 1 },
    leftAnkle: { x: 0.16, y: 0.86, score: 1 }, rightAnkle: { x: 0.86, y: 0.86, score: 1 },
  },
  downwardDog: {
    leftShoulder: { x: 0.28, y: 0.55, score: 1 }, rightShoulder: { x: 0.32, y: 0.56, score: 1 },
    leftElbow: { x: 0.20, y: 0.67, score: 1 }, rightElbow: { x: 0.24, y: 0.68, score: 1 },
    leftWrist: { x: 0.12, y: 0.80, score: 1 }, rightWrist: { x: 0.16, y: 0.81, score: 1 },
    leftHip: { x: 0.54, y: 0.26, score: 1 }, rightHip: { x: 0.58, y: 0.27, score: 1 },
    leftKnee: { x: 0.72, y: 0.52, score: 1 }, rightKnee: { x: 0.76, y: 0.53, score: 1 },
    leftAnkle: { x: 0.88, y: 0.82, score: 1 }, rightAnkle: { x: 0.92, y: 0.83, score: 1 },
  },
  tree: {
    leftShoulder: { x: 0.44, y: 0.25, score: 1 }, rightShoulder: { x: 0.56, y: 0.25, score: 1 },
    leftElbow: { x: 0.40, y: 0.14, score: 1 }, rightElbow: { x: 0.60, y: 0.14, score: 1 },
    leftWrist: { x: 0.48, y: 0.06, score: 1 }, rightWrist: { x: 0.52, y: 0.06, score: 1 },
    leftHip: { x: 0.46, y: 0.48, score: 1 }, rightHip: { x: 0.54, y: 0.48, score: 1 },
    leftKnee: { x: 0.50, y: 0.68, score: 1 }, leftAnkle: { x: 0.50, y: 0.90, score: 1 },
    rightKnee: { x: 0.66, y: 0.62, score: 1 }, rightAnkle: { x: 0.54, y: 0.52, score: 1 },
  },
};

export function targetTemplateForPose(pose) {
  return TARGET_POSE_TEMPLATES[pose] ?? TARGET_POSE_TEMPLATES.plank;
}

export function highlightedAreasFromFeedback(feedback = [], bodyAreaScores = []) {
  const direct = new Set();
  for (const item of feedback) {
    const text = `${item.id ?? ''} ${item.metric ?? ''} ${item.message ?? ''}`.toLowerCase();
    if (text.includes('knee')) direct.add('knees');
    if (text.includes('hip')) direct.add('hips');
    if (text.includes('arm') || text.includes('elbow') || text.includes('wrist')) direct.add('arms');
    if (text.includes('shoulder')) direct.add('shoulders');
    if (text.includes('ankle') || text.includes('foot') || text.includes('feet')) direct.add('feet');
  }
  for (const area of bodyAreaScores.slice(0, 2)) {
    if ((area.distance ?? 0) > 0.28) direct.add(area.area);
  }
  return [...direct];
}
