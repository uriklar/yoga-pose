import test from 'node:test';
import assert from 'node:assert/strict';
import { assessMinimumVideoQuality } from '../src/core/videoQualityGate.mjs';
import { analyzeSession } from '../src/pipeline/sessionAnalyzer.mjs';
import { targetTemplateForPose } from '../src/core/poseTemplates.mjs';

test('assessMinimumVideoQuality rejects face-only videos', () => {
  const faceOnly = {
    nose: { x: 0.5, y: 0.2, score: 0.99 },
    leftEye: { x: 0.48, y: 0.18, score: 0.98 },
    rightEye: { x: 0.52, y: 0.18, score: 0.98 },
    leftEar: { x: 0.44, y: 0.22, score: 0.95 },
    rightEar: { x: 0.56, y: 0.22, score: 0.95 },
  };
  const gate = assessMinimumVideoQuality({ pose: 'warrior2', frames: [faceOnly, faceOnly, faceOnly] });
  assert.equal(gate.ok, false);
  assert.ok(gate.missingRequired.includes('leftHip'));
  assert.ok(gate.reasons.some((reason) => reason.includes('Lower body')));
});

test('analyzeSession fails setup and does not show target overlay for face-only videos', () => {
  const faceOnly = { nose: { x: 0.5, y: 0.2, score: 0.99 }, leftEye: { x: 0.48, y: 0.18, score: 0.98 }, rightEye: { x: 0.52, y: 0.18, score: 0.98 } };
  const result = analyzeSession({ pose: 'warrior2', userLandmarkFrames: [faceOnly, faceOnly] });
  assert.equal(result.score, 0);
  assert.equal(result.scoringMode, 'quality-gate-failed');
  assert.equal(result.feedback[0].id, 'setup-full-body-required');
  assert.equal(result.visualComparison.normalizedTarget, null);
});

test('assessMinimumVideoQuality accepts full target-like videos', () => {
  const frame = targetTemplateForPose('warrior2');
  const gate = assessMinimumVideoQuality({ pose: 'warrior2', frames: [frame, frame] });
  assert.equal(gate.ok, true);
});
