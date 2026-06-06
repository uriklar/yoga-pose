# Product Requirements

## Goal
Let Uri record himself doing yoga on his phone and get clear, safe, actionable posture tips.

## Users
- Primary: Uri, doing solo yoga practice at home
- Secondary later: anyone who wants private, lightweight form feedback

## MVP user flow
1. Open app
2. Record a short video or import one from camera roll
3. Pick target pose, or let app infer from a small list later
4. App extracts pose landmarks from sampled frames
5. App shows:
   - overall score / confidence
   - 3 most important tips
   - timeline markers where issues appear
   - safety disclaimer: not medical advice

## MVP poses
Start small and do them well:
1. Downward Dog
2. Warrior II
3. Tree Pose
4. Plank
5. Child's Pose (low-risk baseline)

## Non-goals for MVP
- No medical diagnosis
- No automatic treatment advice
- No full yoga class generation
- No social/community features
- No cloud video storage

## Success criteria
- User can analyze a 10-60 second phone video
- App returns readable tips in under ~30 seconds on a modern iPhone
- Tips are explainable: every tip maps to a measured joint/angle rule
- Video stays local unless user explicitly opts into cloud analysis
