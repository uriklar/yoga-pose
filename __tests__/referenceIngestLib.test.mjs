import test from 'node:test';
import assert from 'node:assert/strict';
import { isDirectVideoUrl, referenceId } from '../scripts/reference-ingest-lib.mjs';

test('referenceId is stable and short', () => {
  assert.equal(referenceId('https://example.com/a.mp4'), referenceId('https://example.com/a.mp4'));
  assert.equal(referenceId('https://example.com/a.mp4').length, 16);
});

test('isDirectVideoUrl detects supported direct video extensions', () => {
  assert.equal(isDirectVideoUrl('https://example.com/a.mp4'), true);
  assert.equal(isDirectVideoUrl('https://example.com/a.webm?x=1'), true);
  assert.equal(isDirectVideoUrl('https://youtube.com/watch?v=x'), false);
});
