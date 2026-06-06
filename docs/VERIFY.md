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

## pnpm users

`expo-router` needs `@expo/metro-runtime` available as a direct dependency under pnpm’s strict resolver. This repo includes it explicitly and includes `pnpm-lock.yaml`. Verified with a clean pnpm install and `pnpm exec expo export --platform ios`.

## Visual pose feedback

Result feedback includes a stick-figure comparison overlay: target/reference skeleton in blue, user skeleton in pink, and highlighted body areas in yellow. The overlay is generated from stored representative landmarks (`visualComparison`) and supports both reference-video comparison and built-in target templates when no reference clip is provided.

Verified with `npx tsc --noEmit`, `npm test`, and `pnpm exec expo export --platform ios`.

## Model visibility / scoring diagnostics

Rule-based pose scoring now scores each sampled frame and biases toward the worst usable frame instead of hiding bad moments inside one median skeleton. The result screen includes a “What the model actually saw” panel with frame score range, worst frame, plank metrics, and landmark coverage so false positives/landmark failures are visible.

Verified with `npx tsc --noEmit`, `npm test`, and `pnpm exec expo export --platform ios`.

## Selected-pose sanity gate

Rule-based scoring now compares detected landmarks against the selected pose template before allowing a high score. If the skeleton is far from the chosen pose shape (for example, a non-Warrior-II shape while Warrior II is selected), the score is capped and result feedback includes `pose-template-mismatch`. The debug panel shows selected-pose match distance with target `<0.36`.

Verified with `npx tsc --noEmit`, `npm test`, and `pnpm exec expo export --platform ios`.

## Fuller target skeleton overlays

Built-in target templates now include head landmarks (`nose`, eyes, ears) and foot landmarks (`heel`, `footIndex`) in addition to the coaching joints. The overlay renderer draws head/neck and foot segments when landmarks exist, so template overlays look closer to MediaPipe skeletons instead of simplified torso/limb graphs.

Verified with `npx tsc --noEmit`, `npm test`, and `pnpm exec expo export --platform ios`.

## Full-body setup gate

Before rule or reference scoring, the app now checks minimum video quality: required pose landmarks must be visible with confidence >= 0.5 in at least 60% of sampled frames, and the selected pose’s required upper/lower body groups must be visible. Face-only or partial-body clips fail with `setup-full-body-required`, score 0, and no target overlay is drawn. Low-confidence landmarks are filtered out of the visual overlay so hallucinated/inferred body parts are not shown as real detections.

Verified with `npx tsc --noEmit`, `npm test`, and `pnpm exec expo export --platform ios`.
