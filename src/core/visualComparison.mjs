import { aggregateLandmarkFrames } from './landmarkAdapters.mjs';
import { compareFrames, normalizeLandmarks } from './referenceComparison.mjs';
import { highlightedAreasFromFeedback, targetTemplateForPose } from './poseTemplates.mjs';

export function createVisualComparison({ pose, userLandmarkFrames = [], referenceLandmarkFrames = null, feedback = [], bodyAreaScores = [], includeTarget = true }) {
  const userPose = filterLowConfidenceLandmarks(aggregateLandmarkFrames(userLandmarkFrames));
  const referencePose = includeTarget ? (referenceLandmarkFrames?.length ? aggregateLandmarkFrames(referenceLandmarkFrames) : targetTemplateForPose(pose)) : null;
  const normalizedUser = normalizeLandmarks(userPose);
  const normalizedTarget = referencePose ? normalizeLandmarks(referencePose) : null;
  const frame = normalizedTarget ? compareFrames(normalizedTarget, normalizedUser) : { landmarkDistances: {} };
  const highlightedAreas = highlightedAreasFromFeedback(feedback, bodyAreaScores);

  return {
    kind: referenceLandmarkFrames?.length ? 'reference-overlay' : 'template-overlay',
    pose,
    userPose,
    targetPose: referencePose,
    normalizedUser,
    normalizedTarget,
    landmarkDistances: frame.landmarkDistances,
    highlightedAreas,
    legend: {
      user: 'Your pose',
      target: referenceLandmarkFrames?.length ? 'Reference pose' : 'Target shape',
    },
  };
}


function filterLowConfidenceLandmarks(landmarks = {}, minScore = 0.5) {
  return Object.fromEntries(Object.entries(landmarks).filter(([, point]) => point && Number.isFinite(point.x) && Number.isFinite(point.y) && (point.score ?? 1) >= minScore));
}
