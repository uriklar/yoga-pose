import { aggregateLandmarkFrames } from '../core/landmarkAdapters.mjs';
import { analyzePose } from '../core/poseAnalyzer.mjs';
import { compareToReference } from '../core/referenceComparison.mjs';
import { createVisualComparison } from '../core/visualComparison.mjs';
import { createModelDebug } from '../core/modelDebug.mjs';
import { applyTemplateSanityGate, compareToPoseTemplate } from '../core/templateSimilarity.mjs';

export function analyzeSession({ pose, userLandmarkFrames = [], referenceLandmarkFrames = null }) {
  if (referenceLandmarkFrames?.length) {
    const result = compareToReference({ pose, referenceFrames: referenceLandmarkFrames, userFrames: userLandmarkFrames });
    return {
      ...result,
      visualComparison: createVisualComparison({ pose, userLandmarkFrames, referenceLandmarkFrames, feedback: result.feedback, bodyAreaScores: result.bodyAreaScores }),
    };
  }
  const templateMatches = userLandmarkFrames.map((landmarks) => compareToPoseTemplate({ pose, landmarks }));
  const frameResults = userLandmarkFrames.map((landmarks, index) => applyTemplateSanityGate(analyzePose({ pose, landmarks }), templateMatches[index]));
  const usableFrameResults = frameResults.filter((frame) => frame.confidence > 0.95);
  const aggregate = aggregateLandmarkFrames(userLandmarkFrames);
  const aggregateResult = analyzePose({ pose, landmarks: aggregate });
  const scoredFrames = usableFrameResults.length ? usableFrameResults : frameResults;
  const worstResult = scoredFrames.length ? [...scoredFrames].sort((a, b) => a.score - b.score)[0] : aggregateResult;
  const medianScore = median(scoredFrames.map((frame) => frame.score));
  const aggregateTemplateMatch = compareToPoseTemplate({ pose, landmarks: aggregate });
  const result = applyTemplateSanityGate({
    ...aggregateResult,
    score: Number.isFinite(medianScore) ? Math.round(worstResult.score * 0.7 + medianScore * 0.3) : aggregateResult.score,
    confidence: round(mean(frameResults.map((frame) => frame.confidence))),
    feedback: mergeFeedback(worstResult.feedback, aggregateResult.feedback),
    scoringMode: 'per-frame-worst-biased',
    frameScoreSummary: summarizeFrameScores(frameResults),
  }, aggregateTemplateMatch);
  return {
    ...result,
    modelDebug: createModelDebug({ pose, frames: userLandmarkFrames, frameResults, templateMatches }),
    visualComparison: createVisualComparison({ pose, userLandmarkFrames, feedback: result.feedback }),
  };
}

export function chooseAnalysisMode(session = {}) {
  if (session.referenceUrl || session.referenceVideoUri || session.referenceLandmarkFrames?.length) return 'reference';
  return 'rules';
}


function mergeFeedback(primary = [], secondary = []) {
  const seen = new Set();
  return [...primary, ...secondary].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function summarizeFrameScores(frameResults = []) {
  const scores = frameResults.map((frame) => frame.score).filter(Number.isFinite);
  return {
    frameCount: frameResults.length,
    min: round(Math.min(...scores)),
    median: round(median(scores)),
    max: round(Math.max(...scores)),
  };
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return NaN;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : NaN;
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : undefined;
}
