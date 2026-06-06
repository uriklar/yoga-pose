#!/usr/bin/env node
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingestReference } from './reference-ingest-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const input = process.argv[2];

if (!input) {
  console.error('Usage: npm run ingest:reference -- <video-url-or-direct-file-url>');
  process.exit(2);
}

console.log(JSON.stringify(await ingestReference(input, { root }), null, 2));
