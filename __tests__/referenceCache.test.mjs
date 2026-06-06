import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeReference, createReferenceRecord, referenceCacheKey, validateReferenceInput } from '../src/core/referenceCache.mjs';

test('canonicalizeReference removes URL hash', () => {
  assert.equal(canonicalizeReference('https://example.com/yoga#section'), 'https://example.com/yoga');
});

test('referenceCacheKey is stable for canonical-equivalent URLs', () => {
  assert.equal(referenceCacheKey('https://example.com/yoga#x'), referenceCacheKey('https://example.com/yoga'));
});

test('validateReferenceInput accepts https and file URIs', () => {
  assert.equal(validateReferenceInput('https://example.com/video.mp4').ok, true);
  assert.equal(validateReferenceInput('file:///tmp/video.mp4').ok, true);
  assert.equal(validateReferenceInput('ftp://example.com/video.mp4').ok, false);
});

test('createReferenceRecord stores derived landmark metadata', () => {
  const record = createReferenceRecord({ input: 'https://example.com/video.mp4', landmarks: [{ leftWrist: { x: 1, y: 2 } }] });
  assert.equal(record.metadata.frameCount, 1);
  assert.equal(record.sourceKind, 'url');
});
