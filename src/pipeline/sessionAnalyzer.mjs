import { aggregateLandmarkFrames } from '../core/landmarkAdapters.mjs';
import { analyzePose } from '../core/poseAnalyzer.mjs';
import { compareToReference } from '../core/referenceComparison.mjs';

export function analyzeSession({ pose, userLandmarkFrames = [], referenceLandmarkFrames = null }) {
  if (referenceLandmarkFrames?.length) {
    return compareToReference({ pose, referenceFrames: referenceLandmarkFrames, userFrames: userLandmarkFrames });
  }
  const aggregate = aggregateLandmarkFrames(userLandmarkFrames);
  return analyzePose({ pose, landmarks: aggregate });
}

export function chooseAnalysisMode(session = {}) {
  if (session.referenceUrl || session.referenceVideoUri || session.referenceLandmarkFrames?.length) return 'reference';
  return 'rules';
}
