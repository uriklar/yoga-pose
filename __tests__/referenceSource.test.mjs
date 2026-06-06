import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyReferenceSource, getFrameReadableReferenceUri } from '../src/pipeline/referenceSource.ts';

test('classifyReferenceSource identifies local files and direct video URLs', () => {
  assert.equal(classifyReferenceSource('file:///tmp/yoga.mov').kind, 'local-file');
  assert.equal(classifyReferenceSource('https://cdn.example.com/yoga.mp4').kind, 'direct-video-url');
});

test('classifyReferenceSource marks YouTube-style URLs as webpage links', () => {
  const source = classifyReferenceSource('https://www.youtube.com/watch?v=abc');
  assert.equal(source.kind, 'webpage-url');
  assert.match(source.reason, /backend ingestion/);
});

test('getFrameReadableReferenceUri returns only directly readable sources', () => {
  assert.equal(getFrameReadableReferenceUri(classifyReferenceSource('https://cdn.example.com/yoga.webm')), 'https://cdn.example.com/yoga.webm');
  assert.equal(getFrameReadableReferenceUri(classifyReferenceSource('https://youtu.be/abc')), null);
});
