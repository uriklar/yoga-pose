import { aggregateLandmarkFrames } from './landmarkAdapters.mjs';
import { compareFrames, normalizeLandmarks } from './referenceComparison.mjs';
import { highlightedAreasFromFeedback, targetTemplateForPose } from './poseTemplates.mjs';

export function createVisualComparison({ pose, userLandmarkFrames = [], referenceLandmarkFrames = null, feedback = [], bodyAreaScores = [] }) {
  const userPose = aggregateLandmarkFrames(userLandmarkFrames);
  const referencePose = referenceLandmarkFrames?.length ? aggregateLandmarkFrames(referenceLandmarkFrames) : targetTemplateForPose(pose);
  const normalizedUser = normalizeLandmarks(userPose);
  const normalizedTarget = normalizeLandmarks(referencePose);
  const frame = compareFrames(normalizedTarget, normalizedUser);
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
