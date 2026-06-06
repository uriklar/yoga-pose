import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSession, chooseAnalysisMode } from '../src/pipeline/sessionAnalyzer.mjs';
import { targetTemplateForPose } from '../src/core/poseTemplates.mjs';

const plank = targetTemplateForPose('plank');

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
    leftHip: { x: 0.50, y: 0.08, score: 1 },
    rightHip: { x: 0.54, y: 0.09, score: 1 },
  };
  const goodOnly = analyzeSession({ pose: 'plank', userLandmarkFrames: [good, good, good] });
  const mixed = analyzeSession({ pose: 'plank', userLandmarkFrames: [good, horrible, good] });

  assert.ok(mixed.score < goodOnly.score, `expected mixed score ${mixed.score} to be below good score ${goodOnly.score}`);
  assert.equal(mixed.modelDebug.worstFrameIndex, 1);
  assert.ok(mixed.modelDebug.worstFrame.metrics.bodyLineDeviation > 34);
  assert.equal(mixed.scoringMode, 'per-frame-worst-biased');
});

test('analyzeSession caps Warrior II when skeleton shape is a different pose', () => {
  const fakeWarriorTwoButActuallyPlank = {
    leftShoulder: { x: 0.18, y: 0.36, score: 1 }, rightShoulder: { x: 0.22, y: 0.38, score: 1 },
    leftElbow: { x: 0.18, y: 0.52, score: 1 }, rightElbow: { x: 0.22, y: 0.54, score: 1 },
    leftWrist: { x: 0.18, y: 0.68, score: 1 }, rightWrist: { x: 0.22, y: 0.70, score: 1 },
    leftHip: { x: 0.50, y: 0.44, score: 1 }, rightHip: { x: 0.54, y: 0.46, score: 1 },
    leftKnee: { x: 0.72, y: 0.50, score: 1 }, rightKnee: { x: 0.76, y: 0.52, score: 1 },
    leftAnkle: { x: 0.92, y: 0.56, score: 1 }, rightAnkle: { x: 0.96, y: 0.58, score: 1 },
  };
  const result = analyzeSession({ pose: 'warrior2', userLandmarkFrames: [fakeWarriorTwoButActuallyPlank, fakeWarriorTwoButActuallyPlank] });
  assert.ok(result.score <= 50, `score ${result.score}`);
  assert.ok(result.feedback.some((item) => item.id === 'pose-template-mismatch'));
  assert.ok(result.modelDebug.templateDistanceSummary.max > 0.48);
});
