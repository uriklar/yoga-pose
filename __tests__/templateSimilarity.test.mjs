import test from 'node:test';
import assert from 'node:assert/strict';
import { compareToPoseTemplate, applyTemplateSanityGate } from '../src/core/templateSimilarity.mjs';
import { targetTemplateForPose } from '../src/core/poseTemplates.mjs';

test('compareToPoseTemplate accepts matching target-like pose', () => {
  const match = compareToPoseTemplate({ pose: 'warrior2', landmarks: targetTemplateForPose('warrior2') });
  assert.ok(match.distance < 0.1, `distance ${match.distance}`);
  assert.equal(match.cap, null);
});

test('applyTemplateSanityGate caps score for completely different selected pose', () => {
  const wrongPose = targetTemplateForPose('plank');
  const match = compareToPoseTemplate({ pose: 'warrior2', landmarks: wrongPose });
  const result = applyTemplateSanityGate({ pose: 'warrior2', score: 82, feedback: [] }, match);
  assert.ok(match.distance > 0.48, `distance ${match.distance}`);
  assert.ok(result.score <= 50, `score ${result.score}`);
  assert.equal(result.feedback[0].id, 'pose-template-mismatch');
});
