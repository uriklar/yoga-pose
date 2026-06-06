# Roadmap

## Phase 0 — Plans + core engine (started)
- [x] Product requirements
- [x] Technical architecture
- [x] Model-agnostic landmark types
- [x] Geometry helpers
- [x] First rule engine
- [x] Reference-video comparison core
- [x] Expo app shell screens
- [x] Unit tests

## Phase 1 — App shell
- [ ] Create Expo app entrypoint
- [ ] Record/import video
- [x] Local result screen with placeholder analysis
- [x] Session state stored locally

## Phase 2 — Pose landmark extraction
- [ ] Spike MediaPipe Tasks Vision integration
- [ ] Spike MoveNet/TFLite integration if needed
- [x] Web frame sampling from video
- [ ] Landmark quality/confidence filtering

## Phase 3 — Yoga feedback MVP
- [ ] Downward Dog rules
- [ ] Warrior II rules
- [ ] Tree Pose rules
- [ ] Plank rules
- [ ] Tip priority + safety copy

## Phase 4 — Reference video mode
- [x] Normalized landmark comparison engine
- [x] Dynamic time warping alignment
- [x] Body-area difference scoring
- [x] Direct reference video URL classification
- [x] Local CLI/API ingest scaffold for YouTube/Vimeo/webpage links
- [ ] Install/ship yt-dlp or hosted extractor for real platform downloads
- [ ] Cache derived reference landmarks
- [ ] Timeline side-by-side comparison UI

## Phase 5 — UX polish
- [ ] Overlay skeleton on frames
- [ ] Timeline of issues
- [ ] Before/after comparison
- [ ] Voice/text summary

## Tomorrow’s recommended continuation
1. Install dependencies and run the Expo app shell on iPhone/simulator.
2. Get one real video through frame sampling + landmark extraction.
3. Wire real landmarks into the rule engine and reference comparison engine.
4. Add local cache/session storage instead of the temporary in-memory store.
