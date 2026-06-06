# Verification Guide

## Confirm latest Expo

```bash
npm view expo version
npm list expo --depth=0
```

Expected for this build: `56.0.9`.

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

For real MediaPipe analysis today, use the web build path with a browser-readable uploaded/local video. Native Expo recording/import is implemented, but native pose detection intentionally returns a clear “native detector missing” result until the iOS detector adapter is built.

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
