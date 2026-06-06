import test from 'node:test';
import assert from 'node:assert/strict';
import { angleDegrees, lineDeviationDegrees } from '../src/core/geometry.mjs';

test('angleDegrees returns right angle', () => {
  const angle = angleDegrees({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 });
  assert.equal(Math.round(angle), 90);
});

test('lineDeviationDegrees returns zero for straight line', () => {
  const deviation = lineDeviationDegrees({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 });
  assert.equal(Math.round(deviation), 0);
});
