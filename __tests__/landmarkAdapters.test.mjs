import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateLandmarkFrames, fromMediaPipeLandmarks, fromMoveNetKeypoints } from '../src/core/landmarkAdapters.mjs';

test('fromMediaPipeLandmarks maps 33-landmark indices to names', () => {
  const points = Array.from({ length: 33 }, (_, i) => ({ x: i / 100, y: i / 200, visibility: 0.8 }));
  const mapped = fromMediaPipeLandmarks(points);
  assert.equal(mapped.leftShoulder.x, 0.11);
  assert.equal(mapped.rightAnkle.x, 0.28);
  assert.equal(mapped.leftShoulder.score, 0.8);
});

test('fromMoveNetKeypoints maps array keypoints to names', () => {
  const points = Array.from({ length: 17 }, (_, i) => [i / 100, i / 200, 0.9]);
  const mapped = fromMoveNetKeypoints(points);
  assert.equal(mapped.leftShoulder.y, 0.05);
  assert.equal(mapped.leftShoulder.x, 0.025);
});

test('aggregateLandmarkFrames uses median positions', () => {
  const aggregate = aggregateLandmarkFrames([
    { leftWrist: { x: 0.1, y: 0.2, score: 0.9 } },
    { leftWrist: { x: 0.2, y: 0.3, score: 0.7 } },
    { leftWrist: { x: 0.9, y: 0.9, score: 0.1 } },
  ]);
  assert.equal(aggregate.leftWrist.x, 0.2);
  assert.equal(aggregate.leftWrist.y, 0.3);
  assert.equal(aggregate.leftWrist.score, 0.7);
});
