import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePose, summarizeAnalysis } from '../src/core/poseAnalyzer.mjs';

test('returns setup feedback when required landmarks are missing', () => {
  const result = analyzePose({ pose: 'plank', landmarks: {} });
  assert.equal(result.score, 0);
  assert.equal(result.feedback[0].severity, 'high');
});

test('plank flags bad body line', () => {
  const result = analyzePose({
    pose: 'plank',
    landmarks: {
      leftShoulder: { x: 0.2, y: 0.3, score: 1 },
      rightShoulder: { x: 0.3, y: 0.3, score: 1 },
      leftHip: { x: 0.5, y: 0.1, score: 1 },
      rightHip: { x: 0.6, y: 0.1, score: 1 },
      leftAnkle: { x: 0.9, y: 0.6, score: 1 },
      rightAnkle: { x: 1.0, y: 0.6, score: 1 },
      leftWrist: { x: 0.2, y: 0.6, score: 1 },
      rightWrist: { x: 0.3, y: 0.6, score: 1 },
    },
  });
  assert.ok(result.feedback.some((f) => f.id === 'plank-line'));
  assert.ok(summarizeAnalysis(result)[0].includes('one long line'));
});

test('unknown pose is handled safely', () => {
  const result = analyzePose({ pose: 'headstand', landmarks: {} });
  assert.equal(result.feedback[0].id, 'unknown-pose');
});
