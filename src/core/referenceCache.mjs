import { createHash } from 'node:crypto';

export function referenceCacheKey(input) {
  const canonical = canonicalizeReference(input);
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

export function canonicalizeReference(input = '') {
  const trimmed = String(input).trim();
  try {
    const url = new URL(trimmed);
    url.hash = '';
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return trimmed.replace(/\s+/g, ' ');
  }
}

export function validateReferenceInput(input) {
  const value = String(input ?? '').trim();
  if (!value) return { ok: false, reason: 'Reference video link/file is empty.' };
  if (value.startsWith('file://')) return { ok: true, kind: 'file' };
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return { ok: false, reason: 'Reference links must be http or https URLs.' };
    return { ok: true, kind: 'url', host: url.hostname };
  } catch {
    return { ok: false, reason: 'Reference must be a valid URL or local file URI.' };
  }
}

export function createReferenceRecord({ input, landmarks, metadata = {} }) {
  const validation = validateReferenceInput(input);
  if (!validation.ok) throw new Error(validation.reason);
  return {
    id: referenceCacheKey(input),
    source: canonicalizeReference(input),
    sourceKind: validation.kind,
    createdAt: new Date().toISOString(),
    landmarks,
    metadata: {
      frameCount: Array.isArray(landmarks) ? landmarks.length : 0,
      ...metadata,
    },
  };
}
