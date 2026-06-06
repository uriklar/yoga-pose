# Implementation Plan

## Build order

1. Keep the analysis core model-agnostic and fully testable.
2. Build Expo video import/record UI.
3. Add frame extraction/sampling.
4. Add pose detector adapter.
5. Aggregate landmarks across frames.
6. Feed aggregate landmarks into `analyzePose`.
7. Render score, top tips, and confidence/setup feedback.

## Engineering decisions

### Why deterministic rules first
For yoga feedback, we need traceability. A deterministic rule can say: “front knee angle measured 128°, target 80-110°.” That is safer and easier to improve than asking an LLM to judge a video directly.

### Why model-agnostic landmarks
MediaPipe gives 33 landmarks and MoveNet gives 17. The app should not care. Each detector gets an adapter into the shared landmark names used by the rules.

### Privacy default
Video should stay on-device. If cloud analysis is ever added, the UI needs an explicit opt-in per session.

## Milestones

### M1: Clickable prototype
- Home screen
- Import video
- Pose picker
- Fake/sample analysis result

### M2: Real landmarks from one frame
- Extract one frame or use a still image
- Run detector
- Show skeleton overlay

### M3: Real video analysis
- Sample frames every 0.5-1.0 sec
- Smooth/aggregate landmarks
- Generate tips

### M4: Usable personal beta
- 4-5 poses
- Session history
- Timeline markers
- Camera setup guide
