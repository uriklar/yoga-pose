# Architecture

## Recommended architecture

```text
Phone video
  -> frame sampler
  -> pose landmark detector
  -> landmark normalization
  -> pose classifier / selected target pose
  -> rule engine
  -> feedback prioritizer
  -> UI timeline + tips
```

## Components

### 1. Mobile shell
Expo / React Native app for:
- permissions
- recording/importing video
- selecting pose
- displaying annotated result

Expo ImagePicker supports selecting images/videos and taking camera input; its returned asset includes local URI, duration, dimensions, mime type, and size. Source checked: Expo ImagePicker docs, bundled version ~56.0.15 as of lookup.

### 2. Pose detection
Preferred options:
- MediaPipe Pose Landmarker: 33 landmarks, widely used for full-body pose. Google docs list Tasks APIs across web, Python, Android, iOS.
- MoveNet: fast 17-keypoint pose model; good fallback/prototype. TensorFlow Hub documents Lightning/Thunder variants and TFLite options.

Recommendation:
- Prototype analysis rules against a model-agnostic landmark interface.
- First shippable app can use whichever detector integrates fastest on Expo/iOS.
- If Expo native limitations slow MediaPipe, use a web/PWA prototype or custom dev client.

### 3. Coaching engine
Deterministic rules first:
- compute angles and symmetry
- identify biggest deviations
- generate plain-language tips
- never overclaim certainty

### 4. Optional LLM layer later
Use LLM only to rewrite deterministic findings into friendlier wording. Do not send raw video unless explicitly opted in.

## Data/privacy
Default: local-only.
- Store video URI locally for active session
- Store derived landmarks and feedback locally
- Add explicit export/share button later
- Cloud processing must be opt-in and delete-after-analysis

## Safety constraints
- Avoid medical claims
- Use language like “try”, “consider”, “looks like”
- Include “stop if pain” guidance
- Encourage qualified instructor/physio for recurring pain
