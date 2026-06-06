# Pose Analysis Plan

## Landmark abstraction
The core engine expects named 2D/3D landmarks with confidence scores. It does not care whether they came from MediaPipe, MoveNet, or another detector.

## Metrics
- Joint angles: shoulder, elbow, hip, knee, ankle
- Torso lean
- Arm/leg straightness
- Hip/shoulder alignment
- Symmetry between left and right sides
- Confidence/visibility filtering

## Feedback philosophy
Good feedback should be:
- short
- specific
- measurable
- safe
- prioritized

Example:
Instead of “bad plank”, say “Your hips look high; try bringing shoulders, hips, and ankles closer to one long line.”

## Pose rules to implement first

### Downward Dog
- spine length / hip angle
- arms roughly straight
- shoulders externally rotated cue approximation
- knees may bend; do not penalize heel position too hard

### Warrior II
- front knee stacked near ankle
- front knee angle around 80-110 degrees
- arms roughly horizontal
- torso upright
- hips/shoulders open approximation

### Tree Pose
- standing leg stable/mostly straight
- pelvis level
- torso upright
- avoid foot pressing into knee cue in UI/manual instructions

### Plank
- shoulder-hip-ankle line
- shoulders stacked near wrists
- neck neutral approximation

## Confidence gates
If key landmarks are missing or low-confidence, return setup tips:
- full body visible
- side or front angle depending on pose
- camera stable at hip/chest height
- enough light
