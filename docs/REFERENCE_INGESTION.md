# Reference Ingestion

The app can compare against:
- uploaded local reference clips
- direct MP4/MOV/M4V/WebM URLs when browser CORS allows frame access

YouTube/Vimeo/webpage links are not direct video files. They need backend ingestion before frame sampling.

## Local scaffold

```bash
npm run ingest:reference -- "https://example.com/reference.mp4"
npm run ingest:reference -- "https://www.youtube.com/watch?v=..."
```

The script writes a JSON record to `reference-cache/`.

If `yt-dlp` is installed, platform links can be downloaded into the local cache. If not, the record is marked `blocked-missing-ytdlp` and the app tells the user to use a direct video URL or uploaded clip.

## Next step

After a platform link is downloaded, run the same frame sampling + pose landmark extraction pipeline and store only derived landmarks for comparison. Avoid retaining copyrighted videos longer than needed.
