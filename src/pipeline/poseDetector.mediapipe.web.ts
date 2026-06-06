import { fromMediaPipeLandmarks } from '../core/landmarkAdapters.mjs';
import type { SampledVideoFrame } from './frameSampler.web.ts';

export type MediaPipePoseDetectorOptions = {
  wasmBaseUrl?: string;
  modelAssetPath?: string;
  runningMode?: 'IMAGE' | 'VIDEO';
  tasksVisionUrl?: string;
};

const TASKS_VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs';
const DEFAULT_WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const DEFAULT_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

type MediaPipeTasksVision = {
  FilesetResolver: { forVisionTasks(baseUrl: string): Promise<any> };
  PoseLandmarker: { createFromOptions(wasmFileset: any, options: any): Promise<any> };
};

export async function createMediaPipePoseDetector(options: MediaPipePoseDetectorOptions = {}) {
  const { FilesetResolver, PoseLandmarker } = await loadMediaPipeTasksVision(options.tasksVisionUrl ?? TASKS_VISION_URL);
  const vision = await FilesetResolver.forVisionTasks(options.wasmBaseUrl ?? DEFAULT_WASM_BASE);
  const landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: options.modelAssetPath ?? DEFAULT_MODEL,
      delegate: 'GPU',
    },
    runningMode: options.runningMode ?? 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.4,
    minPosePresenceConfidence: 0.4,
    minTrackingConfidence: 0.4,
  });

  return {
    async detectFrame(frame: SampledVideoFrame) {
      const result = landmarker.detectForVideo(frame.image, frame.timestampMs);
      return fromMediaPipeLandmarks(result.landmarks?.[0] ?? []);
    },
    async detectFrames(frames: SampledVideoFrame[]) {
      const output = [];
      for (const frame of frames) output.push(await this.detectFrame(frame));
      return output;
    },
    close() {
      landmarker.close();
    },
  };
}

async function loadMediaPipeTasksVision(url: string): Promise<MediaPipeTasksVision> {
  if (typeof window === 'undefined') {
    throw new Error('MediaPipe web detector must run in a browser/WebView environment.');
  }
  const dynamicImport = new Function('url', 'return import(url)') as (url: string) => Promise<MediaPipeTasksVision>;
  return dynamicImport(url);
}
