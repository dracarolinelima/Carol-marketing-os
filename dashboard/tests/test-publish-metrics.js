#!/usr/bin/env node
// Tests for /publish, /metrics, /metrics GET, /evidence-upload endpoints
// Run: node dashboard/tests/test-publish-metrics.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3099;
const DATA_DIR = path.join(__dirname, '..', 'data');
const TEST_PIPELINE = path.join(DATA_DIR, 'pipeline.test.json');
const EVIDENCE_DIR = path.join(__dirname, '..', '..', 'tests', 'marketing-os', 'evidence');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

let server;
let passed = 0;
let failed = 0;
const results = [];

function log(ok, name, detail) {
  if (ok) { passed++; results.push(`  ✓ ${name}`); }
  else { failed++; results.push(`  ✗ ${name} — ${detail}`); }
}

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: PORT, path: urlPath, method, headers: {} };
    if (body && typeof body !== 'string' && !(body instanceof Buffer)) {
      opts.headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }
    const r = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

function reqRaw(method, urlPath, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: PORT, path: urlPath, method, headers: { 'Content-Type': contentType } };
    const r = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', reject);
    r.write(buffer);
    r.end();
  });
}

function seedPipeline() {
  const data = {
    version: 2,
    lastUpdated: new Date().toISOString(),
    contents: [
      {
        id: 'T-PUB-01',
        title: 'Perimenopausa: o que muda antes da menopausa',
        slug: null, territory: 'B', territoryLabel: 'Climatério',
        type: 'bloco', editorialFunction: 'COMPREENSÃO',
        journeyStage: 'REC → ENT', format: 'Carrossel 6 cards',
        status: 'pronto', substatus: null, nextAction: null, block: 'B1',
        publishDate: null, scientificPackage: 'T2', scientificPackageStatus: 'frozen',
        approvedCopy: null, visualBrief: null, caption: null, assets: [],
        postUrl: null, metrics: {}, leads: [], learnings: [],
        blocker: null, note: null,
        currentOwner: null, pendingType: 'nenhuma', blockerReason: null,
        lastUpdate: new Date().toISOString(), lastAgent: 'Editor', revision: 5,
        createdAt: '2026-09-15T10:00:00Z',
        history: [{ type: 'status', from: 'revisao', to: 'pronto', timestamp: new Date().toISOString(), agent: 'Caroline', note: null, revision: 5 }]
      },
      {
        id: 'T-PUB-02',
        title: 'Pólipo uterino: conduta',
        slug: null, territory: 'A', territoryLabel: 'Pólipos',
        type: 'always-on', editorialFunction: 'AUTORIDADE/RESOLUTIVIDADE',
        journeyStage: 'ENT → CON', format: null,
        status: 'em-producao', substatus: null, nextAction: 'Copy final',
        block: null, publishDate: null,
        scientificPackage: null, scientificPackageStatus: null,
        approvedCopy: null, visualBrief: null, caption: null, assets: [],
        postUrl: null, metrics: {}, leads: [], learnings: [],
        blocker: null, note: null,
        currentOwner: 'Creator', pendingType: 'nenhuma', blockerReason: null,
        lastUpdate: new Date().toISOString(), lastAgent: 'Strategist', revision: 3,
        createdAt: '2026-09-20T10:00:00Z',
        history: []
      },
      {
        id: 'T-PUB-03',
        title: 'Conteúdo já publicado',
        slug: null, territory: 'C', territoryLabel: 'Endometriose',
        type: 'bloco', editorialFunction: 'DESCOBERTA',
        journeyStage: 'REC', format: 'Reel',
        status: 'publicado', substatus: null, nextAction: null, block: null,
        publishDate: '2026-10-01', scientificPackage: null, scientificPackageStatus: null,
        approvedCopy: null, visualBrief: null, caption: null, assets: [],
        postUrl: 'https://www.instagram.com/p/EXISTING/', metrics: {snapshots:[], evidence:[]},
        leads: [], learnings: [],
        blocker: null, note: null,
        currentOwner: null, pendingType: 'nenhuma', blockerReason: null,
        lastUpdate: new Date().toISOString(), lastAgent: 'Caroline', revision: 8,
        createdAt: '2026-09-10T10:00:00Z',
        history: []
      }
    ]
  };
  fs.writeFileSync(TEST_PIPELINE, JSON.stringify(data, null, 2));
}

async function run() {
  console.log('\nPublish & Metrics API Tests\n');

  // ====== PUBLISH ENDPOINT ======
  console.log('--- POST /api/content/:id/publish ---');

  // 1. Successful publish
  let r = await req('POST', '/api/content/T-PUB-01/publish', {
    agent: 'Caroline', expectedRevision: 5,
    publishDate: '2026-10-08', postUrl: 'https://www.instagram.com/p/ABC123/',
    format: 'Carrossel 6 cards', platform: 'instagram'
  });
  log(r.status === 200 && r.body.status === 'publicado' && r.body.postUrl === 'https://www.instagram.com/p/ABC123/',
    'Publish success', `status=${r.status} body.status=${r.body.status}`);

  // Verify persistence
  r = await req('GET', '/api/content/T-PUB-01');
  log(r.body.status === 'publicado' && r.body.publishDate === '2026-10-08' && r.body.postUrl === 'https://www.instagram.com/p/ABC123/',
    'Publish persisted', `status=${r.body.status} publishDate=${r.body.publishDate}`);
  log(r.body.metrics && Array.isArray(r.body.metrics.snapshots) && Array.isArray(r.body.metrics.evidence),
    'Metrics structure initialized', JSON.stringify(r.body.metrics));
  const pubHistEntry = r.body.history.find(h => h.type === 'publication');
  log(!!pubHistEntry && pubHistEntry.postUrl === 'https://www.instagram.com/p/ABC123/',
    'Publication history recorded', JSON.stringify(pubHistEntry));

  // 2. Reject non-Caroline
  r = await req('POST', '/api/content/T-PUB-03/publish', {
    agent: 'Creator', expectedRevision: 8,
    publishDate: '2026-10-09', postUrl: 'https://www.instagram.com/p/X/'
  });
  log(r.status === 403, 'Reject non-Caroline agent', `status=${r.status}`);

  // 3. Reject missing publishDate
  seedPipeline(); // reset
  r = await req('POST', '/api/content/T-PUB-01/publish', {
    agent: 'Caroline', expectedRevision: 5, postUrl: 'https://www.instagram.com/p/X/'
  });
  log(r.status === 400, 'Reject missing publishDate', `status=${r.status}`);

  // 4. Reject missing postUrl
  r = await req('POST', '/api/content/T-PUB-01/publish', {
    agent: 'Caroline', expectedRevision: 5, publishDate: '2026-10-08'
  });
  log(r.status === 400, 'Reject missing postUrl', `status=${r.status}`);

  // 5. Reject invalid URL
  r = await req('POST', '/api/content/T-PUB-01/publish', {
    agent: 'Caroline', expectedRevision: 5, publishDate: '2026-10-08', postUrl: 'not-a-url'
  });
  log(r.status === 400, 'Reject invalid URL', `status=${r.status}`);

  // 6. Reject with pending owner (em-producao with currentOwner)
  r = await req('POST', '/api/content/T-PUB-02/publish', {
    agent: 'Caroline', expectedRevision: 3,
    publishDate: '2026-10-09', postUrl: 'https://www.instagram.com/p/Y/'
  });
  log(r.status === 422 && r.body.code === 'PENDENCIA_ABERTA', 'Reject pending content', `status=${r.status} code=${r.body.code}`);

  // 7. Revision conflict
  r = await req('POST', '/api/content/T-PUB-01/publish', {
    agent: 'Caroline', expectedRevision: 999,
    publishDate: '2026-10-08', postUrl: 'https://www.instagram.com/p/Z/'
  });
  log(r.status === 409, 'Reject revision conflict', `status=${r.status}`);

  // 8. Content not found
  r = await req('POST', '/api/content/NONEXISTENT/publish', {
    agent: 'Caroline', expectedRevision: 1,
    publishDate: '2026-10-08', postUrl: 'https://www.instagram.com/p/Z/'
  });
  log(r.status === 404, 'Reject not found', `status=${r.status}`);

  // ====== METRICS ENDPOINT ======
  console.log('\n--- POST /api/content/:id/metrics ---');

  // First publish T-PUB-01 so we can add metrics
  seedPipeline();
  await req('POST', '/api/content/T-PUB-01/publish', {
    agent: 'Caroline', expectedRevision: 5,
    publishDate: '2026-10-08', postUrl: 'https://www.instagram.com/p/ABC123/',
    format: 'Carrossel 6 cards'
  });

  // 9. Add snapshot
  r = await req('GET', '/api/content/T-PUB-01');
  const rev1 = r.body.revision;
  r = await req('POST', '/api/content/T-PUB-01/metrics', {
    agent: 'Caroline', expectedRevision: rev1,
    snapshot: { date: '2026-10-10', source: 'manual', reach: 4200, views: 5800, likes: 312, comments: 47, shares: 89, saves: 156, profileVisits: null, follows: null }
  });
  log(r.status === 200 && r.body.metrics.snapshots.length === 1, 'Snapshot added', `status=${r.status} snapshots=${r.body.metrics?.snapshots?.length}`);

  // 10. Add second snapshot (append, not overwrite)
  r = await req('POST', '/api/content/T-PUB-01/metrics', {
    agent: 'Caroline', expectedRevision: r.body.revision,
    snapshot: { date: '2026-10-12', source: 'manual', reach: 6100, views: 8200, likes: 445, comments: 62, shares: 120, saves: 210, profileVisits: 35, follows: 8, note: '96h data' }
  });
  log(r.status === 200 && r.body.metrics.snapshots.length === 2, 'Second snapshot appended (not overwritten)', `snapshots=${r.body.metrics?.snapshots?.length}`);

  // 11. Reject metrics on non-published content
  r = await req('POST', '/api/content/T-PUB-02/metrics', {
    agent: 'Caroline', expectedRevision: 3,
    snapshot: { date: '2026-10-10', source: 'manual', reach: 100 }
  });
  log(r.status === 422 && r.body.code === 'STATUS_INVALID', 'Reject metrics on non-published', `status=${r.status}`);

  // 12. Reject invalid source
  r = await req('GET', '/api/content/T-PUB-01');
  r = await req('POST', '/api/content/T-PUB-01/metrics', {
    agent: 'Caroline', expectedRevision: r.body.revision,
    snapshot: { date: '2026-10-10', source: 'magic', reach: 100 }
  });
  log(r.status === 400, 'Reject invalid source', `status=${r.status}`);

  // 13. Reject negative metric
  r = await req('GET', '/api/content/T-PUB-01');
  r = await req('POST', '/api/content/T-PUB-01/metrics', {
    agent: 'Caroline', expectedRevision: r.body.revision,
    snapshot: { date: '2026-10-10', source: 'manual', reach: -5 }
  });
  log(r.status === 400, 'Reject negative metric value', `status=${r.status}`);

  // 14. Reject neither snapshot nor evidence
  r = await req('GET', '/api/content/T-PUB-01');
  r = await req('POST', '/api/content/T-PUB-01/metrics', {
    agent: 'Caroline', expectedRevision: r.body.revision
  });
  log(r.status === 400, 'Reject empty metrics call', `status=${r.status}`);

  // 15. Reject unauthorized agent
  r = await req('GET', '/api/content/T-PUB-01');
  r = await req('POST', '/api/content/T-PUB-01/metrics', {
    agent: 'Creator', expectedRevision: r.body.revision,
    snapshot: { date: '2026-10-10', source: 'manual', reach: 100 }
  });
  log(r.status === 403, 'Reject unauthorized agent for metrics', `status=${r.status}`);

  // ====== EVIDENCE ======
  console.log('\n--- Evidence (file validation) ---');

  // Create a test evidence file
  const testEvidencePath = path.join(EVIDENCE_DIR, 'test-evidence.png');
  if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  fs.writeFileSync(testEvidencePath, Buffer.alloc(100, 0x89)); // fake PNG header bytes

  // 16. Add evidence with valid file
  r = await req('GET', '/api/content/T-PUB-01');
  r = await req('POST', '/api/content/T-PUB-01/metrics', {
    agent: 'Caroline', expectedRevision: r.body.revision,
    evidence: { date: '2026-10-10', type: 'insight-screenshot', path: 'tests/marketing-os/evidence/test-evidence.png', note: 'Test evidence' }
  });
  log(r.status === 200 && r.body.metrics.evidence.length === 1, 'Evidence added with valid file', `status=${r.status} evidence=${r.body.metrics?.evidence?.length}`);

  // 17. Reject evidence with non-existent file
  r = await req('GET', '/api/content/T-PUB-01');
  r = await req('POST', '/api/content/T-PUB-01/metrics', {
    agent: 'Caroline', expectedRevision: r.body.revision,
    evidence: { date: '2026-10-10', type: 'insight-screenshot', path: 'tests/marketing-os/evidence/NONEXISTENT.png' }
  });
  log(r.status === 422 && r.body.code === 'EVIDENCE_INVALID', 'Reject non-existent evidence file', `status=${r.status} code=${r.body.code}`);

  // 18. Reject invalid evidence type
  r = await req('GET', '/api/content/T-PUB-01');
  r = await req('POST', '/api/content/T-PUB-01/metrics', {
    agent: 'Caroline', expectedRevision: r.body.revision,
    evidence: { date: '2026-10-10', type: 'video', path: 'tests/marketing-os/evidence/test-evidence.png' }
  });
  log(r.status === 400, 'Reject invalid evidence type', `status=${r.status}`);

  // ====== GET METRICS ======
  console.log('\n--- GET /api/content/:id/metrics ---');

  // 19. Get metrics for published content
  r = await req('GET', '/api/content/T-PUB-01/metrics');
  log(r.status === 200 && r.body.metrics && r.body.metrics.snapshots.length === 2 && r.body.metrics.evidence.length === 1,
    'GET metrics returns snapshots and evidence', `snapshots=${r.body.metrics?.snapshots?.length} evidence=${r.body.metrics?.evidence?.length}`);
  log(r.body.postUrl === 'https://www.instagram.com/p/ABC123/', 'GET metrics includes postUrl', `postUrl=${r.body.postUrl}`);

  // 20. Get metrics for non-existent content
  r = await req('GET', '/api/content/NONEXISTENT/metrics');
  log(r.status === 404, 'GET metrics 404 for non-existent', `status=${r.status}`);

  // ====== EVIDENCE UPLOAD ======
  console.log('\n--- POST /api/content/:id/evidence-upload ---');

  // 21. Upload a valid PNG (real magic bytes)
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const validPng = Buffer.concat([pngHeader, Buffer.alloc(192, 0x00)]);
  r = await reqRaw('POST', '/api/content/T-PUB-01/evidence-upload', validPng, 'image/png');
  log(r.status === 201 && r.body.path && r.body.path.startsWith('tests/marketing-os/evidence/'),
    'Upload valid PNG success', `path=${r.body.path}`);
  const uploadedFiles = [];
  if (r.body.path) {
    const uploadedPath = path.resolve(PROJECT_ROOT, r.body.path);
    log(fs.existsSync(uploadedPath), 'Uploaded file exists on disk', uploadedPath);
    uploadedFiles.push(uploadedPath);
  }

  // 22. Reject upload for non-published content
  r = await reqRaw('POST', '/api/content/T-PUB-02/evidence-upload', validPng, 'image/png');
  log(r.status === 422, 'Reject upload for non-published', `status=${r.status}`);

  // 23. Reject empty upload
  r = await reqRaw('POST', '/api/content/T-PUB-01/evidence-upload', Buffer.alloc(0), 'image/png');
  log(r.status === 400, 'Reject empty upload', `status=${r.status}`);

  // 24. Reject disallowed content-type
  r = await reqRaw('POST', '/api/content/T-PUB-01/evidence-upload', validPng, 'application/octet-stream');
  log(r.status === 400 && r.body.message.includes('Content-Type'), 'Reject disallowed content-type', `status=${r.status}`);

  // 25. Reject content-type/magic mismatch (PNG bytes declared as JPEG)
  r = await reqRaw('POST', '/api/content/T-PUB-01/evidence-upload', validPng, 'image/jpeg');
  log(r.status === 400 && r.body.message.includes('nao corresponde'), 'Reject magic byte mismatch (PNG as JPEG)', `status=${r.status}`);

  // 26. Reject magic mismatch (random bytes declared as PNG)
  const randomBytes = Buffer.alloc(200, 0xAB);
  r = await reqRaw('POST', '/api/content/T-PUB-01/evidence-upload', randomBytes, 'image/png');
  log(r.status === 400 && r.body.message.includes('nao corresponde'), 'Reject random bytes as PNG', `status=${r.status}`);

  // 27. Valid JPEG upload
  const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
  const validJpeg = Buffer.concat([jpegHeader, Buffer.alloc(196, 0x00)]);
  r = await reqRaw('POST', '/api/content/T-PUB-01/evidence-upload', validJpeg, 'image/jpeg');
  log(r.status === 201 && r.body.filename.endsWith('.jpg'), 'Upload valid JPEG success', `filename=${r.body.filename}`);
  if (r.body.path) uploadedFiles.push(path.resolve(PROJECT_ROOT, r.body.path));

  // 28. Valid PDF upload
  const pdfHeader = Buffer.from('%PDF-1.4\n');
  const validPdf = Buffer.concat([pdfHeader, Buffer.alloc(191, 0x20)]);
  r = await reqRaw('POST', '/api/content/T-PUB-01/evidence-upload', validPdf, 'application/pdf');
  log(r.status === 201 && r.body.filename.endsWith('.pdf'), 'Upload valid PDF success', `filename=${r.body.filename}`);
  if (r.body.path) uploadedFiles.push(path.resolve(PROJECT_ROOT, r.body.path));

  // 29. Duplicate upload does not overwrite (counter appended)
  r = await reqRaw('POST', '/api/content/T-PUB-01/evidence-upload', validPng, 'image/png');
  log(r.status === 201 && r.body.filename !== uploadedFiles[0], 'Duplicate upload gets unique filename', `filename=${r.body.filename}`);
  if (r.body.path) uploadedFiles.push(path.resolve(PROJECT_ROOT, r.body.path));

  // Clean up uploaded test files
  uploadedFiles.forEach(f => { try { fs.unlinkSync(f); } catch {} });

  // ====== SNAPSHOT INTEGRITY (no duplication) ======
  console.log('\n--- Integrity checks ---');

  // 30. Original content count unchanged
  r = await req('GET', '/api/pipeline');
  log(r.body.contents.length === 3, 'Content count unchanged (no duplication)', `count=${r.body.contents.length}`);

  // 31. Other content unmodified
  const t2 = r.body.contents.find(c => c.id === 'T-PUB-02');
  log(t2 && t2.status === 'em-producao' && t2.revision === 3, 'Other content unmodified', `status=${t2?.status} rev=${t2?.revision}`);

  // Clean up test evidence
  try { fs.unlinkSync(testEvidencePath); } catch {}

  // ====== RESULTS ======
  console.log('\n' + results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total\n`);
  return failed;
}

async function main() {
  // Set up
  seedPipeline();

  // Start server with test pipeline
  process.env.PIPELINE_PATH = TEST_PIPELINE;
  process.env.PORT = String(PORT);

  // We need to spawn the server as a child process
  const { spawn } = require('child_process');
  const serverPath = path.join(__dirname, '..', 'server.js');
  server = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(PORT), PIPELINE_PATH: TEST_PIPELINE },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Wait for server to start
  await new Promise((resolve, reject) => {
    let ready = false;
    server.stdout.on('data', d => {
      if (!ready && d.toString().includes('Dashboard running')) { ready = true; resolve(); }
    });
    server.stderr.on('data', d => process.stderr.write(d));
    setTimeout(() => { if (!ready) reject(new Error('Server start timeout')); }, 5000);
  });

  let exitCode;
  try {
    exitCode = await run();
  } finally {
    server.kill();
    // Clean up test pipeline
    try { fs.unlinkSync(TEST_PIPELINE); } catch {}
    try { fs.unlinkSync(TEST_PIPELINE.replace(/\.json$/, '.backup.json')); } catch {}
    try { fs.unlinkSync(TEST_PIPELINE.replace(/\.json$/, '.pre-handoff.json')); } catch {}
  }
  process.exit(exitCode > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
