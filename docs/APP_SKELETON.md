# App Skeleton

The next code step is a normal Expo Router app with these screens:

- `/` Home: Record video / Import video
- `/analyze` Pose picker + analysis progress
- `/result` Score, 3 top tips, timeline markers, safety note
- `/settings` Privacy/cloud opt-in toggles later

Pseudo-flow:

```ts
const asset = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] });
const frames = await sampleFrames(asset.uri);
const landmarks = await poseDetector.detect(frames);
const result = analyzePose({ pose: selectedPose, landmarks: aggregate(landmarks) });
```

Keep `src/core` dependency-free so it can run in tests, React Native, web, or server.
