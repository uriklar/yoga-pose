import { createReferenceRecord } from '../core/referenceCache.mjs';
import { analyzeSession } from './sessionAnalyzer.mjs';
import { sampleVideoFramesWeb } from './frameSampler.web.ts';
import { createMediaPipePoseDetector } from './poseDetector.mediapipe.web.ts';

export type AnalyzeVideoInput = {
  pose: string;
  userVideoUri: string;
  referenceVideoUri?: string;
  referenceUrl?: string;
  sampling?: {
    everyMs?: number;
    maxFrames?: number;
    targetWidth?: number;
  };
};

export async function analyzeVideoOnWeb(input: AnalyzeVideoInput) {
  const detector = await createMediaPipePoseDetector({ runningMode: 'VIDEO' });
  try {
    const userFrames = await sampleVideoFramesWeb(input.userVideoUri, input.sampling);
    const userLandmarkFrames = await detector.detectFrames(userFrames);

    const referenceSource = input.referenceVideoUri ?? input.referenceUrl;
    if (referenceSource) {
      const referenceFrames = await sampleVideoFramesWeb(referenceSource, input.sampling);
      const referenceLandmarkFrames = await detector.detectFrames(referenceFrames);
      const referenceRecord = createReferenceRecord({ input: referenceSource, landmarks: referenceLandmarkFrames as any });
      return {
        ...analyzeSession({ pose: input.pose, userLandmarkFrames: userLandmarkFrames as any, referenceLandmarkFrames: referenceLandmarkFrames as any }),
        analysisMode: 'web-reference-mediapipe',
        referenceRecord,
        sampledFrames: { user: userFrames.length, reference: referenceFrames.length },
      };
    }

    return {
      ...analyzeSession({ pose: input.pose, userLandmarkFrames: userLandmarkFrames as any }),
      analysisMode: 'web-rule-mediapipe',
      sampledFrames: { user: userFrames.length, reference: 0 },
    };
  } finally {
    detector.close();
  }
}
