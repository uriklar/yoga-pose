import { aggregateLandmarkFrames } from '../core/landmarkAdapters.mjs';
import { analyzePose } from '../core/poseAnalyzer.mjs';
import { compareToReference } from '../core/referenceComparison.mjs';
import { createVisualComparison } from '../core/visualComparison.mjs';

export function analyzeSession({ pose, userLandmarkFrames = [], referenceLandmarkFrames = null }) {
  if (referenceLandmarkFrames?.length) {
    const result = compareToReference({ pose, referenceFrames: referenceLandmarkFrames, userFrames: userLandmarkFrames });
    return {
      ...result,
      visualComparison: createVisualComparison({ pose, userLandmarkFrames, referenceLandmarkFrames, feedback: result.feedback, bodyAreaScores: result.bodyAreaScores }),
    };
  }
  const aggregate = aggregateLandmarkFrames(userLandmarkFrames);
  const result = analyzePose({ pose, landmarks: aggregate });
  return {
    ...result,
    visualComparison: createVisualComparison({ pose, userLandmarkFrames, feedback: result.feedback }),
  };
}

export function chooseAnalysisMode(session = {}) {
  if (session.referenceUrl || session.referenceVideoUri || session.referenceLandmarkFrames?.length) return 'reference';
  return 'rules';
}
