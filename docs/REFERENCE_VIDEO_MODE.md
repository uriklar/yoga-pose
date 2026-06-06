# Reference Video Comparison Mode

## Goal
Allow Uri to paste/upload a specific yoga video and compare his own recording against it.

## User flow
1. Paste a reference video link or upload a reference clip.
2. App extracts pose landmarks from the reference.
3. Uri records/imports his own video doing the same pose or flow.
4. App extracts Uri's pose landmarks.
5. App aligns both videos over time.
6. App returns:
   - overall similarity score
   - body areas that differ most
   - timing feedback: faster/slower than reference
   - practical form tips

## Technical design

### Do not compare pixels
Pixel comparison is fragile because clothes, lighting, room, camera, and body proportions differ. Compare normalized body landmarks instead.

### Normalize skeletons
`normalizeLandmarks` recenters the body around the hips and scales by shoulder/hip/body size so two videos can be compared even with different framing.

### Align over time
The comparison engine uses dynamic time warping (DTW) through `alignSequences` so a slower/faster version can still be compared pose-by-pose.

### Score body areas
`compareToReference` groups differences by:
- shoulders
- arms
- hips
- knees
- feet

Then it returns prioritized coaching feedback.

## Copyright/privacy rule
For linked reference videos, store only derived landmarks when possible. Do not redistribute or permanently store copyrighted video content.

## Implemented now
- `src/core/referenceComparison.mjs`
- Tests in `__tests__/referenceComparison.test.mjs`
- App UI has reference link field and reference comparison button

## Implemented now
- `src/core/referenceComparison.mjs`
- Tests in `__tests__/referenceComparison.test.mjs`
- App UI has reference link field and reference comparison button
- Direct local/direct-video URL classification in `src/pipeline/referenceSource.ts`
- Web frame sampling in `src/pipeline/frameSampler.web.ts`
- Web MediaPipe runtime detector in `src/pipeline/poseDetector.mediapipe.web.ts`

## Still needed
- Backend ingestion/downloading for YouTube/Vimeo/webpage links where legally/technically allowed
- Native iOS detector adapter for on-device Expo app analysis
- Timeline side-by-side UI polish
