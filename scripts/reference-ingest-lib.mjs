import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export function referenceId(input) {
  return createHash('sha256').update(input.trim()).digest('hex').slice(0, 16);
}

export async function ingestReference(input, { root = process.cwd() } = {}) {
  if (!input) throw new Error('Reference input is required.');
  const cacheDir = join(root, 'reference-cache');
  const id = referenceId(input);
  await mkdir(cacheDir, { recursive: true });

  const directVideo = isDirectVideoUrl(input);
  const ytDlp = spawnSync('bash', ['-lc', 'command -v yt-dlp'], { encoding: 'utf8' }).stdout.trim();
  const record = {
    id,
    source: input,
    createdAt: new Date().toISOString(),
    status: 'pending-landmarks',
    kind: directVideo ? 'direct-video-url' : 'platform-or-webpage-url',
    videoPath: null,
    note: '',
  };

  if (directVideo) {
    record.videoPath = input;
    record.note = 'Direct video URL can be sampled by the web app when CORS allows it. Backend download is optional.';
  } else if (ytDlp) {
    const outputTemplate = join(cacheDir, `${id}.%(ext)s`);
    const download = spawnSync(ytDlp, ['--no-playlist', '--format', 'mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '--output', outputTemplate, input], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (download.status !== 0) {
      record.status = 'download-failed';
      record.note = download.stderr.trim() || download.stdout.trim() || 'yt-dlp failed without output.';
    } else {
      record.status = 'downloaded-needs-landmarks';
      record.videoPath = `${cacheDir}/${id}.mp4`;
      record.note = 'Downloaded by yt-dlp. Next step: run frame sampling + pose detection and store derived landmarks.';
    }
  } else {
    record.status = 'blocked-missing-ytdlp';
    record.note = 'yt-dlp is not installed on this machine. Install yt-dlp to ingest YouTube/Vimeo/webpage reference links, or use a direct MP4/MOV/WebM URL/uploaded clip.';
  }

  const recordPath = join(cacheDir, `${id}.json`);
  await writeFile(recordPath, JSON.stringify(record, null, 2));
  return { recordPath, record };
}

export async function readReferenceRecord(id, { root = process.cwd() } = {}) {
  const recordPath = join(root, 'reference-cache', `${id}.json`);
  return JSON.parse(await readFile(recordPath, 'utf8'));
}

export function isDirectVideoUrl(value) {
  try {
    const url = new URL(value);
    return ['.mp4', '.mov', '.m4v', '.webm'].some((ext) => url.pathname.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
}
