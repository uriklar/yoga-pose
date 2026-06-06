import * as VideoThumbnails from 'expo-video-thumbnails';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import { buildNativeTimestamps } from './nativeTimestamps.mjs';

export type NativeSampledFrame = {
  uri: string;
  dataUri: string;
  timestampMs: number;
  width?: number;
  height?: number;
};

export type NativeFrameSamplingOptions = {
  durationMs?: number;
  everyMs?: number;
  maxFrames?: number;
  quality?: number;
};

export async function sampleVideoFramesNative(videoUri: string, options: NativeFrameSamplingOptions = {}): Promise<NativeSampledFrame[]> {
  const timestamps = buildNativeTimestamps(options.durationMs, options.everyMs ?? 900, options.maxFrames ?? 24);
  const frames: NativeSampledFrame[] = [];

  for (const timestampMs of timestamps) {
    const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: timestampMs,
      quality: options.quality ?? 0.65,
    });
    const base64 = await readAsStringAsync(thumbnail.uri, { encoding: EncodingType.Base64 });
    frames.push({
      uri: thumbnail.uri,
      dataUri: `data:image/jpeg;base64,${base64}`,
      timestampMs,
      width: thumbnail.width,
      height: thumbnail.height,
    });
  }

  return frames;
}
