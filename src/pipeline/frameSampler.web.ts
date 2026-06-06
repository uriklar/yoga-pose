export type SampledVideoFrame = {
  image: HTMLCanvasElement;
  timestampMs: number;
  width: number;
  height: number;
};

export type FrameSamplingOptions = {
  everyMs?: number;
  maxFrames?: number;
  targetWidth?: number;
};

export async function sampleVideoFramesWeb(videoUri: string, options: FrameSamplingOptions = {}): Promise<SampledVideoFrame[]> {
  if (typeof document === 'undefined') {
    throw new Error('sampleVideoFramesWeb only runs in a browser/WebView environment.');
  }

  const everyMs = options.everyMs ?? 750;
  const maxFrames = options.maxFrames ?? 80;
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = videoUri;

  await waitForVideoMetadata(video);
  const durationMs = Math.max(0, video.duration * 1000);
  const timestamps = buildTimestamps(durationMs, everyMs, maxFrames);
  const frames: SampledVideoFrame[] = [];

  for (const timestampMs of timestamps) {
    await seekVideo(video, timestampMs / 1000);
    frames.push(copyVideoToCanvas(video, timestampMs, options.targetWidth));
  }

  video.removeAttribute('src');
  video.load();
  return frames;
}

export function buildTimestamps(durationMs: number, everyMs = 750, maxFrames = 80): number[] {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return [0];
  const count = Math.max(1, Math.min(maxFrames, Math.floor(durationMs / everyMs) + 1));
  if (count === 1) return [0];
  const step = durationMs / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.min(durationMs, Math.round(index * step)));
}

function copyVideoToCanvas(video: HTMLVideoElement, timestampMs: number, targetWidth?: number): SampledVideoFrame {
  const sourceWidth = video.videoWidth || 1;
  const sourceHeight = video.videoHeight || 1;
  const scale = targetWidth ? targetWidth / sourceWidth : 1;
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context for video frame sampling.');
  ctx.drawImage(video, 0, 0, width, height);
  return { image: canvas, timestampMs, width, height };
}

function waitForVideoMetadata(video: HTMLVideoElement) {
  if (video.readyState >= 1 && Number.isFinite(video.duration)) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    };
    const onLoaded = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('Could not load video metadata. The link may block cross-origin access.')); };
    video.addEventListener('loadedmetadata', onLoaded, { once: true });
    video.addEventListener('error', onError, { once: true });
  });
}

function seekVideo(video: HTMLVideoElement, seconds: number) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    const onSeeked = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('Could not seek video while sampling frames.')); };
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.currentTime = Math.max(0, Math.min(seconds, Number.isFinite(video.duration) ? video.duration : seconds));
  });
}
