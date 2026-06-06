# Video Analysis Pipeline Stubs

This folder is for the real implementation that replaces `src/mobile/sampleAnalysis.ts`.

Planned modules:
- `frameSampler.ts`: sample frames from imported/recorded video every 0.5-1.0 seconds
- `poseDetector.mediapipe.ts`: run MediaPipe Pose Landmarker and convert with `fromMediaPipeLandmarks`
- `poseDetector.movenet.ts`: fallback adapter for MoveNet keypoints
- `referenceIngest.ts`: fetch/import reference video, cache derived landmarks only
- `sessionAnalyzer.ts`: choose `analyzePose` or `compareToReference`

Important: keep raw reference/user video local unless Uri explicitly enables cloud analysis.
