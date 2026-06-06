import test from 'node:test';
import assert from 'node:assert/strict';
import { alignSequences, compareToReference, normalizeLandmarks } from '../src/core/referenceComparison.mjs';

const base = {
  leftShoulder: { x: 0.4, y: 0.2, score: 1 },
  rightShoulder: { x: 0.6, y: 0.2, score: 1 },
  leftHip: { x: 0.42, y: 0.5, score: 1 },
  rightHip: { x: 0.58, y: 0.5, score: 1 },
  leftKnee: { x: 0.42, y: 0.75, score: 1 },
  rightKnee: { x: 0.58, y: 0.75, score: 1 },
  leftAnkle: { x: 0.42, y: 1.0, score: 1 },
  rightAnkle: { x: 0.58, y: 1.0, score: 1 },
  leftElbow: { x: 0.3, y: 0.35, score: 1 },
  rightElbow: { x: 0.7, y: 0.35, score: 1 },
  leftWrist: { x: 0.2, y: 0.5, score: 1 },
  rightWrist: { x: 0.8, y: 0.5, score: 1 },
};

function shifted(frame, dx, dy) {
  return Object.fromEntries(Object.entries(frame).map(([name, point]) => [name, { ...point, x: point.x + dx, y: point.y + dy }]));
}

test('normalizeLandmarks makes translation differences comparable', () => {
  const a = normalizeLandmarks(base);
  const b = normalizeLandmarks(shifted(base, 10, 4));
  assert.equal(Math.round(a.leftShoulder.x * 1000), Math.round(b.leftShoulder.x * 1000));
  assert.equal(Math.round(a.leftAnkle.y * 1000), Math.round(b.leftAnkle.y * 1000));
});

test('compareToReference scores identical translated motion highly', () => {
  const result = compareToReference({ referenceFrames: [base, base], userFrames: [shifted(base, 2, 3), shifted(base, 4, 5)] });
  assert.ok(result.score > 95);
  assert.equal(result.feedback[0].id, 'reference-good');
});

test('compareToReference reports body area differences', () => {
  const user = { ...base, leftKnee: { ...base.leftKnee, x: 0.15 }, rightKnee: { ...base.rightKnee, x: 0.85 } };
  const result = compareToReference({ referenceFrames: [base], userFrames: [user] });
  assert.ok(result.feedback.some((item) => item.id === 'reference-knees'));
});

test('alignSequences returns a monotonic start-to-end path', () => {
  const frames = [base, base, base].map(normalizeLandmarks);
  const path = alignSequences(frames, frames);
  assert.deepEqual(path[0], [0, 0]);
  assert.deepEqual(path.at(-1), [2, 2]);
});
