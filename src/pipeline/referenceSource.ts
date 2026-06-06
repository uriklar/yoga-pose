export type ReferenceSource =
  | { kind: 'none' }
  | { kind: 'local-file'; uri: string }
  | { kind: 'direct-video-url'; url: string }
  | { kind: 'webpage-url'; url: string; reason: string };

const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.webm'];

export function classifyReferenceSource(input?: string | null): ReferenceSource {
  const value = String(input ?? '').trim();
  if (!value) return { kind: 'none' };
  if (value.startsWith('file://') || value.startsWith('blob:')) return { kind: 'local-file', uri: value };

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { kind: 'webpage-url', url: value, reason: 'Only http/https video links or local files are supported.' };
    }
    const pathname = url.pathname.toLowerCase();
    if (DIRECT_VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return { kind: 'direct-video-url', url: url.toString() };
    }
    return {
      kind: 'webpage-url',
      url: url.toString(),
      reason: 'This looks like a webpage/video-platform link, not a direct video file. It needs backend ingestion before frame sampling.',
    };
  } catch {
    return { kind: 'webpage-url', url: value, reason: 'Reference source is not a valid URL or local file URI.' };
  }
}

export function getFrameReadableReferenceUri(source: ReferenceSource): string | null {
  if (source.kind === 'local-file') return source.uri;
  if (source.kind === 'direct-video-url') return source.url;
  return null;
}
