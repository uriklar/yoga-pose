import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNativeTimestamps } from '../src/pipeline/nativeTimestamps.mjs';

test('buildNativeTimestamps samples known duration evenly', () => {
  assert.deepEqual(buildNativeTimestamps(3000, 1000, 10), [0, 1000, 2000, 3000]);
});

test('buildNativeTimestamps samples unknown duration conservatively', () => {
  assert.deepEqual(buildNativeTimestamps(undefined, 500, 4), [0, 500, 1000, 1500]);
});
