# Yoga Pose Coach

A mobile-first yoga video analyzer: record/import a yoga clip, extract body landmarks, compare posture against pose-specific rules or a reference video, and return practical tips.

## Current status

Built so far:
- Product/technical planning docs in `docs/`
- Expo app shell in `app/`
- Testable pose feedback engine in `src/core/`
- Reference-video comparison engine using normalized skeletons + time alignment
- Landmark adapters for MediaPipe and MoveNet
- Unit tests for geometry, adapters, pose rules, and reference comparison

## MVP principle

Start with privacy-preserving on-device analysis. Uploading video should be optional, not required.

## Run current core tests

```bash
npm test
```

No install is needed for the current pure-JS core tests. Expo dependencies are declared for the app build stage.

## Run the app shell later

```bash
npm install
npm start
```

## Proposed stack

- Mobile: Expo / React Native
- Pose landmarks: MediaPipe Pose Landmarker when practical; TensorFlow MoveNet as fallback/prototype path
- Coaching engine: deterministic biomechanics rules + reference skeleton comparison
- Storage: local-only sessions initially

## Key docs

- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/REFERENCE_VIDEO_MODE.md`
- `docs/ROADMAP.md`
- `docs/TASKS.md`

## Verification

See `docs/VERIFY.md`. Current gates pass: Expo Doctor, TypeScript, Node tests, Expo web export, high/critical audit gate, and reference-ingest API smoke test.

## Expo Go compatibility

This project is intentionally pinned to Expo SDK 54 because Uri’s installed Expo Go client reports Supported SDK 54. Do not upgrade to SDK 56 unless Expo Go / a dev build supports it.
