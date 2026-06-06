export function buildNativeTimestamps(durationMs, everyMs = 900, maxFrames = 24) {
  if (!Number.isFinite(durationMs) || !durationMs || durationMs <= 0) {
    return Array.from({ length: Math.min(maxFrames, 12) }, (_, index) => index * everyMs);
  }
  const count = Math.max(1, Math.min(maxFrames, Math.floor(durationMs / everyMs) + 1));
  if (count === 1) return [0];
  const step = durationMs / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.min(durationMs, Math.round(index * step)));
}
