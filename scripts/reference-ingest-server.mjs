#!/usr/bin/env node
import http from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingestReference, readReferenceRecord } from './reference-ingest-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const port = Number(process.env.PORT ?? 4731);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/ingest') {
      const body = await readJson(req);
      const input = body?.url ?? body?.source;
      if (!input) return json(res, 400, { error: 'Missing url/source' });
      return json(res, 200, await ingestReference(input, { root }));
    }
    if (req.method === 'GET' && url.pathname.startsWith('/reference/')) {
      const id = url.pathname.split('/').pop();
      return json(res, 200, await readReferenceRecord(id, { root }));
    }
    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, () => console.log(`reference ingest server listening on http://127.0.0.1:${port}`));

function json(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload, null, 2));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}
