export function distance(a, b) {
  return Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0), (a.z ?? 0) - (b.z ?? 0));
}

export function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z ?? 0) + (b.z ?? 0)) / 2 };
}

export function angleDegrees(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (b.z ?? 0) };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const mag = Math.hypot(ab.x, ab.y, ab.z) * Math.hypot(cb.x, cb.y, cb.z);
  if (!mag) return NaN;
  const cos = Math.max(-1, Math.min(1, dot / mag));
  return radiansToDegrees(Math.acos(cos));
}

export function lineDeviationDegrees(a, b, c) {
  const angle = angleDegrees(a, b, c);
  return Number.isFinite(angle) ? Math.abs(180 - angle) : NaN;
}

export function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

export function average(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, v) => sum + v, 0) / valid.length : NaN;
}
