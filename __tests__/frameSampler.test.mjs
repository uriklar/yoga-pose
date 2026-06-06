import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimestamps } from '../src/pipeline/frameSampler.web.ts';

test('buildTimestamps samples start and end within max frames', () => {
  const timestamps = buildTimestamps(10_000, 1_000, 5);
  assert.deepEqual(timestamps, [0, 2500, 5000, 7500, 10000]);
});

test('buildTimestamps handles unknown duration', () => {
  assert.deepEqual(buildTimestamps(NaN), [0]);
});
