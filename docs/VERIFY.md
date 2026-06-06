# Verification Guide

## Confirm latest Expo

```bash
npm view expo version
npm list expo --depth=0
```

Expected for Expo Go compatibility in this build: SDK `54`, package `expo@54.0.35`. Uri’s Expo Go client showed Supported SDK 54.

## Local gates

```bash
npx tsc --noEmit
npm test
npm audit --omit=dev --audit-level=high
npx expo export --platform web
```

## Run the app

```bash
npm start
```

For real MediaPipe analysis, use the web build path with a browser-readable uploaded/local video. Native Expo recording/import is implemented, but native pose detection intentionally returns a clear “native detector missing” result until the iOS detector adapter is built.

## Reference comparison

Works now:
- uploaded local reference clip
- direct MP4/MOV/M4V/WebM URL when CORS allows browser frame access

Needs ingest server:
- YouTube/Vimeo/webpage links

Run ingest CLI:

```bash
npm run ingest:reference -- "https://example.com/reference.mp4"
```

Run ingest API:

```bash
npm run ingest:server
curl -s -X POST http://127.0.0.1:4731/ingest \
  -H 'content-type: application/json' \
  -d '{"url":"https://example.com/reference.mp4"}'
```

## Native phone landmark extraction

Implemented basic native path:

1. Record/import a phone video.
2. Tap analyze on native Expo.
3. App routes to `/native-analyze`.
4. `expo-video-thumbnails` samples frames from the actual phone video.
5. A local WebView loads MediaPipe PoseLandmarker and extracts landmarks from sampled frames.
6. Landmarks flow into the existing pose-rule/reference comparison engine.

Known caveats for verification:
- Requires network access to load MediaPipe Tasks Vision/model from CDN.
- Long clips are capped to sampled frames for performance.
- Reference comparison on native currently requires an uploaded reference clip, not a YouTube/page link.

## Expo Go compatibility

This project is intentionally pinned to Expo SDK 54 because Uri’s installed Expo Go client reports Supported SDK 54. Do not upgrade to SDK 56 unless Expo Go / a dev build supports it.
