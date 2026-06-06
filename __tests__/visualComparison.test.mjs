import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisualComparison } from '../src/core/visualComparison.mjs';

test('createVisualComparison creates template overlay when no reference frames exist', () => {
  const visual = createVisualComparison({
    pose: 'plank',
    userLandmarkFrames: [{
      leftShoulder: { x: 0.2, y: 0.3, score: 1 }, rightShoulder: { x: 0.3, y: 0.3, score: 1 },
      leftHip: { x: 0.5, y: 0.4, score: 1 }, rightHip: { x: 0.6, y: 0.4, score: 1 },
      leftAnkle: { x: 0.9, y: 0.5, score: 1 }, rightAnkle: { x: 1.0, y: 0.5, score: 1 },
    }],
    feedback: [{ id: 'plank-line', message: 'hips too high' }],
  });
  assert.equal(visual.kind, 'template-overlay');
  assert.ok(visual.userPose.leftShoulder);
  assert.ok(visual.targetPose.leftShoulder);
  assert.ok(visual.highlightedAreas.includes('hips'));
});
