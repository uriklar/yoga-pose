import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSession, chooseAnalysisMode } from '../src/pipeline/sessionAnalyzer.mjs';

const plank = {
  leftShoulder: { x: 0.25, y: 0.30, score: 0.9 },
  rightShoulder: { x: 0.35, y: 0.31, score: 0.9 },
  leftHip: { x: 0.55, y: 0.47, score: 0.9 },
  rightHip: { x: 0.65, y: 0.48, score: 0.9 },
  leftAnkle: { x: 0.88, y: 0.66, score: 0.9 },
  rightAnkle: { x: 0.92, y: 0.67, score: 0.9 },
  leftWrist: { x: 0.24, y: 0.62, score: 0.9 },
  rightWrist: { x: 0.35, y: 0.62, score: 0.9 },
};

test('chooseAnalysisMode picks reference when reference is present', () => {
  assert.equal(chooseAnalysisMode({ referenceUrl: 'https://example.com/yoga' }), 'reference');
  assert.equal(chooseAnalysisMode({}), 'rules');
});

test('analyzeSession uses rule analysis without reference frames', () => {
  const result = analyzeSession({ pose: 'plank', userLandmarkFrames: [plank, plank] });
  assert.equal(result.pose, 'plank');
  assert.ok(result.score > 50);
});

test('analyzeSession uses reference comparison when reference frames exist', () => {
  const result = analyzeSession({ pose: 'plank', userLandmarkFrames: [plank], referenceLandmarkFrames: [plank] });
  assert.equal(result.feedback[0].id, 'reference-good');
});

test('analyzeSession exposes worst plank frame instead of hiding it in the median skeleton', () => {
  const good = plank;
  const horrible = {
    ...plank,
    leftHip: { x: 0.55, y: 0.02, score: 0.9 },
    rightHip: { x: 0.65, y: 0.03, score: 0.9 },
  };
  const goodOnly = analyzeSession({ pose: 'plank', userLandmarkFrames: [good, good, good] });
  const mixed = analyzeSession({ pose: 'plank', userLandmarkFrames: [good, horrible, good] });

  assert.ok(mixed.score < goodOnly.score, `expected mixed score ${mixed.score} to be below good score ${goodOnly.score}`);
  assert.equal(mixed.modelDebug.worstFrameIndex, 1);
  assert.ok(mixed.modelDebug.worstFrame.metrics.bodyLineDeviation > 34);
  assert.equal(mixed.scoringMode, 'per-frame-worst-biased');
});
