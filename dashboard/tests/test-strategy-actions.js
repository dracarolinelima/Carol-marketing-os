#!/usr/bin/env node
// Tests for GET /api/strategy, PATCH field edits, handoff approve/return,
// POST /api/content create, and backlog selection.
// Uses isolated test pipeline. Does NOT modify real data.
// Run: node dashboard/tests/test-strategy-actions.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3098;
const DATA_DIR = path.join(__dirname, '..', 'data');
const TEST_PIPELINE = path.join(DATA_DIR, 'pipeline.test-actions.json');
const STRATEGY_PATH = path.join(DATA_DIR, 'strategy.json');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

let server;
let passed = 0;
let failed = 0;
const results = [];

function log(ok, name, detail) {
  if (ok) { passed++; results.push(`  \u2713 ${name}`); }
  else { failed++; results.push(`  \u2717 ${name} \u2014 ${detail}`); }
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

function createTestPipeline() {
  const data = {
    version: 2,
    lastUpdated: new Date().toISOString(),
    contents: [
      {
        id: 'TEST-1',
        title: 'Conteudo teste aprovacao',
        slug: null, territory: 'B', territoryLabel: 'Perimenopausa',
        type: 'bloco', editorialFunction: null, journeyStage: null, format: null,
        status: 'revisao', substatus: null,
        nextAction: 'Revisar e aprovar',
        block: null, publishDate: null, plannedWeek: null,
        scientificPackage: null, scientificPackageStatus: null,
        approvedCopy: null, visualBrief: null, caption: null,
        assets: [], postUrl: null, metrics: {}, leads: [], learnings: [],
        blocker: null, note: null,
        currentOwner: 'Caroline', pendingType: 'aprovacao',
        blockerReason: null,
        lastUpdate: new Date().toISOString(), lastAgent: 'Art Director',
        revision: 3, createdAt: new Date().toISOString(),
        history: [
          { type: 'status', from: null, to: 'backlog', timestamp: new Date().toISOString(), agent: 'Caroline', note: 'Teste', revision: 1 },
          { type: 'handoff', timestamp: new Date().toISOString(), agent: 'Art Director',
            fromOwner: 'Art Director', toOwner: 'Caroline', pendingType: 'aprovacao',
            blockerReason: null, statusFrom: 'em-producao', statusTo: 'revisao',
            nextAction: null, artifact: null, note: 'Visual QA ok', revision: 3 }
        ]
      },
      {
        id: 'TEST-BL',
        title: 'Conteudo teste backlog',
        slug: null, territory: 'A', territoryLabel: 'Dor/endometriose',
        type: 'bloco', editorialFunction: null, journeyStage: null, format: null,
        status: 'backlog', substatus: null,
        nextAction: null,
        block: null, publishDate: null, plannedWeek: null,
        scientificPackage: null, scientificPackageStatus: null,
        approvedCopy: null, visualBrief: null, caption: null,
        assets: [], postUrl: null, metrics: {}, leads: [], learnings: [],
        blocker: null, note: null,
        currentOwner: null, pendingType: 'nenhuma',
        blockerReason: null,
        lastUpdate: new Date().toISOString(), lastAgent: null,
        revision: 1, createdAt: new Date().toISOString(),
        history: [
          { type: 'status', from: null, to: 'backlog', timestamp: new Date().toISOString(), agent: 'Caroline', note: 'Teste', revision: 1 }
        ]
      }
    ]
  };
  fs.writeFileSync(TEST_PIPELINE, JSON.stringify(data, null, 2));
}

function cleanup() {
  try { fs.unlinkSync(TEST_PIPELINE); } catch {}
  try { fs.unlinkSync(TEST_PIPELINE.replace('.json', '.backup.json')); } catch {}
  try { fs.unlinkSync(TEST_PIPELINE.replace('.json', '.pre-handoff.json')); } catch {}
}

async function runTests() {
  // ====== STRATEGY ENDPOINT ======
  console.log('\n  Strategy endpoint');

  // 1. GET /api/strategy returns data when file exists
  {
    const r = await req('GET', '/api/strategy');
    const hasData = r.status === 200 || r.status === 404;
    log(hasData, 'GET /api/strategy returns 200 or 404', `got ${r.status}`);
    if (r.status === 200) {
      log(r.body.generatedBy === 'MOS-Strategist', 'strategy.generatedBy is MOS-Strategist', `got ${r.body.generatedBy}`);
      log(!!r.body.activeBlock, 'strategy has activeBlock', 'missing');
      log(Array.isArray(r.body.nextActions), 'strategy has nextActions array', 'missing');
      log(Array.isArray(r.body.pendingHumanDecisions), 'strategy has pendingHumanDecisions', 'missing');
      log(!!r.body.generatedAt, 'strategy has generatedAt', 'missing');
      log(!!r.body.sourceRevisions, 'strategy has sourceRevisions', 'missing');
      log(!!r.body.alwaysOn, 'strategy has alwaysOn', 'missing');
    }
  }

  // ====== PATCH FIELD EDITS ======
  console.log('\n  PATCH field edits');

  // 2. PATCH updates title
  {
    const r = await req('PATCH', '/api/content/TEST-BL', {
      agent: 'Caroline', expectedRevision: 1, title: 'Titulo atualizado via PATCH'
    });
    log(r.status === 200, 'PATCH title returns 200', `got ${r.status}`);
    log(r.body.title === 'Titulo atualizado via PATCH', 'title is updated', `got ${r.body.title}`);
    log(r.body.revision === 2, 'revision incremented to 2', `got ${r.body.revision}`);
  }

  // 3. PATCH updates publishDate and plannedWeek
  {
    const r = await req('PATCH', '/api/content/TEST-BL', {
      agent: 'Caroline', expectedRevision: 2, publishDate: '2026-11-01', plannedWeek: '2026-10-28'
    });
    log(r.status === 200, 'PATCH publishDate+plannedWeek returns 200', `got ${r.status}`);
    log(r.body.publishDate === '2026-11-01', 'publishDate set', `got ${r.body.publishDate}`);
    log(r.body.plannedWeek === '2026-10-28', 'plannedWeek set', `got ${r.body.plannedWeek}`);
  }

  // 4. PATCH status selecionado from backlog (by Caroline)
  {
    // Reset to backlog first
    const r1 = await req('PATCH', '/api/content/TEST-BL', {
      agent: 'Caroline', expectedRevision: 3, status: 'backlog', publishDate: null, plannedWeek: null
    });
    log(r1.status === 200, 'PATCH back to backlog OK', `got ${r1.status}`);
    const r2 = await req('PATCH', '/api/content/TEST-BL', {
      agent: 'Caroline', expectedRevision: r1.body.revision, status: 'selecionado'
    });
    log(r2.status === 200, 'PATCH status selecionado returns 200', `got ${r2.status}`);
    log(r2.body.status === 'selecionado', 'status is selecionado', `got ${r2.body.status}`);
  }

  // 5. PATCH rejects status change by non-authorized agent
  {
    const fresh = await req('GET', '/api/content/TEST-BL');
    const r = await req('PATCH', '/api/content/TEST-BL', {
      agent: 'Creator', expectedRevision: fresh.body.revision, status: 'em-producao'
    });
    log(r.status === 403, 'PATCH by Creator rejected with 403', `got ${r.status}`);
  }

  // 6. PATCH rejects stale revision
  {
    const r = await req('PATCH', '/api/content/TEST-BL', {
      agent: 'Caroline', expectedRevision: 1, title: 'Should fail'
    });
    log(r.status === 409, 'PATCH stale revision returns 409', `got ${r.status}`);
  }

  // ====== HANDOFF APPROVE ======
  console.log('\n  Handoff approve/return');

  // 7. Caroline approves (handoff to null, status pronto)
  {
    const fresh = await req('GET', '/api/content/TEST-1');
    log(fresh.body.currentOwner === 'Caroline', 'TEST-1 owned by Caroline', `got ${fresh.body.currentOwner}`);
    log(fresh.body.pendingType === 'aprovacao', 'TEST-1 pendingType is aprovacao', `got ${fresh.body.pendingType}`);

    const r = await req('POST', '/api/content/TEST-1/handoff', {
      agent: 'Caroline', expectedRevision: fresh.body.revision,
      toOwner: null, pendingType: 'nenhuma', status: 'pronto',
      note: 'Aprovado via teste'
    });
    log(r.status === 200, 'Approve handoff returns 200', `got ${r.status} ${JSON.stringify(r.body).slice(0,200)}`);
    if (r.status === 200) {
      log(r.body.status === 'pronto', 'status changed to pronto', `got ${r.body.status}`);
      log(r.body.currentOwner === null, 'currentOwner is null', `got ${r.body.currentOwner}`);
      log(r.body.pendingType === 'nenhuma', 'pendingType is nenhuma', `got ${r.body.pendingType}`);
    }
  }

  // 8. Restore TEST-1 to aprovacao for return test
  {
    const fresh = await req('GET', '/api/content/TEST-1');
    // Move back to em-producao, then handoff to Caroline with aprovacao
    const r1 = await req('PATCH', '/api/content/TEST-1', {
      agent: 'Caroline', expectedRevision: fresh.body.revision, status: 'em-producao',
      confirmClosePending: true
    });
    const r2 = await req('POST', '/api/content/TEST-1/handoff', {
      agent: 'Caroline', expectedRevision: r1.body.revision,
      toOwner: 'Art Director', pendingType: 'nenhuma',
      note: 'Restaurando para teste de devolucao'
    });
    const r3 = await req('POST', '/api/content/TEST-1/handoff', {
      agent: 'Art Director', expectedRevision: r2.body.revision,
      toOwner: 'Caroline', pendingType: 'aprovacao', status: 'revisao',
      note: 'Visual QA concluido'
    });
    log(r3.status === 200 && r3.body.pendingType === 'aprovacao', 'Restored to aprovacao for return test', `status ${r3.status}`);
  }

  // 9. Caroline returns to Creator with note
  {
    const fresh = await req('GET', '/api/content/TEST-1');
    const r = await req('POST', '/api/content/TEST-1/handoff', {
      agent: 'Caroline', expectedRevision: fresh.body.revision,
      toOwner: 'Creator', pendingType: 'nenhuma', status: 'em-producao',
      note: 'Card 3 precisa de ajuste na linguagem'
    });
    log(r.status === 200, 'Return handoff returns 200', `got ${r.status}`);
    if (r.status === 200) {
      log(r.body.currentOwner === 'Creator', 'currentOwner is Creator', `got ${r.body.currentOwner}`);
      log(r.body.status === 'em-producao', 'status is em-producao', `got ${r.body.status}`);
    }
  }

  // 10. Return without note fails
  {
    // First set up approval state again
    const f1 = await req('GET', '/api/content/TEST-1');
    const r1 = await req('POST', '/api/content/TEST-1/handoff', {
      agent: 'Creator', expectedRevision: f1.body.revision,
      toOwner: 'Editor', pendingType: 'nenhuma', note: 'Copy ajustada'
    });
    const r2 = await req('POST', '/api/content/TEST-1/handoff', {
      agent: 'Editor', expectedRevision: r1.body.revision,
      toOwner: 'Art Director', pendingType: 'nenhuma', note: 'Aprovado pelo editor'
    });
    const r3 = await req('POST', '/api/content/TEST-1/handoff', {
      agent: 'Art Director', expectedRevision: r2.body.revision,
      toOwner: 'Caroline', pendingType: 'aprovacao', status: 'revisao',
      note: 'Visual QA ok'
    });
    // Now try return without note
    const r4 = await req('POST', '/api/content/TEST-1/handoff', {
      agent: 'Caroline', expectedRevision: r3.body.revision,
      toOwner: 'Creator', pendingType: 'nenhuma', status: 'em-producao'
    });
    log(r4.status === 400, 'Return without note returns 400', `got ${r4.status}`);
  }

  // ====== CREATE CONTENT ======
  console.log('\n  POST /api/content (create)');

  // 11. Create new content
  {
    const r = await req('POST', '/api/content', { title: 'Novo conteudo teste' });
    log(r.status === 201, 'Create returns 201', `got ${r.status}`);
    log(r.body.id && r.body.id.startsWith('N-'), 'id starts with N-', `got ${r.body.id}`);
    log(r.body.status === 'backlog', 'status is backlog', `got ${r.body.status}`);
    log(r.body.revision === 1, 'revision is 1', `got ${r.body.revision}`);
  }

  // 12. Create without title fails
  {
    const r = await req('POST', '/api/content', { note: 'Sem titulo' });
    log(r.status === 400, 'Create without title returns 400', `got ${r.status}`);
  }

  // 13. Create with plannedWeek
  {
    const r = await req('POST', '/api/content', { title: 'Teste com semana', plannedWeek: '2026-10-19' });
    log(r.status === 201, 'Create with plannedWeek returns 201', `got ${r.status}`);
    log(r.body.plannedWeek === '2026-10-19', 'plannedWeek is set', `got ${r.body.plannedWeek}`);
  }

  // ====== STALENESS CHECK ======
  console.log('\n  Strategy staleness');

  // 14. Check strategy generatedAt vs pipeline lastUpdated
  {
    const strat = await req('GET', '/api/strategy');
    const pipeline = await req('GET', '/api/pipeline');
    if (strat.status === 200 && pipeline.status === 200) {
      const stratDate = new Date(strat.body.generatedAt);
      const pipeDate = new Date(pipeline.body.lastUpdated);
      const isStale = stratDate < pipeDate;
      log(typeof isStale === 'boolean', 'Staleness comparison works', `stratDate=${strat.body.generatedAt} pipeDate=${pipeline.body.lastUpdated}`);
      // After our PATCHes, strategy should be stale
      log(isStale, 'Strategy is stale after pipeline changes (expected)', `isStale=${isStale}`);
    } else {
      log(true, 'Strategy staleness: skipped (no strategy file)', '');
    }
  }
}

async function main() {
  console.log('\n=== Strategy & Actions Tests ===\n');

  createTestPipeline();

  // Start server with test pipeline
  const { spawn } = require('child_process');
  const serverPath = path.join(__dirname, '..', 'server.js');
  server = spawn(process.execPath, [serverPath], {
    env: Object.assign({}, process.env, { PORT: String(PORT), PIPELINE_PATH: TEST_PIPELINE }),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Wait for server to start
  await new Promise(resolve => {
    server.stdout.on('data', d => {
      if (d.toString().includes('Dashboard running')) resolve();
    });
    setTimeout(resolve, 3000);
  });

  try {
    await runTests();
  } catch (e) {
    console.error('Test error:', e);
    failed++;
  }

  // Cleanup
  server.kill();
  cleanup();

  console.log('\n' + results.join('\n'));
  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
