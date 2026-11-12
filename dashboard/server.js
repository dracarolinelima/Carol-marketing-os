const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const DATA_PATH = process.env.PIPELINE_PATH
  ? path.resolve(process.env.PIPELINE_PATH)
  : path.join(__dirname, 'data', 'pipeline.json');
const BACKUP_PATH = DATA_PATH.replace(/\.json$/, '.backup.json');
const PRE_HANDOFF_PATH = DATA_PATH.replace(/\.json$/, '.pre-handoff.json');
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SNAPSHOT_PATH = path.join(__dirname, 'data', 'dashboard-snapshot.json');
const STRATEGY_PATH = path.join(__dirname, 'data', 'strategy.json');
const V2_DIR = path.join(__dirname, 'v2');
const COPY_DIR = process.env.COPY_DIR ? path.resolve(process.env.COPY_DIR) : path.join(__dirname, 'data', 'copy');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const VALID_STATUSES = ['backlog', 'selecionado', 'em-desenvolvimento', 'em-producao', 'revisao', 'pronto', 'publicado', 'arquivado'];
const AGENTS = ['Orchestrator', 'Scientific Research', 'Strategist', 'Creator', 'Editor', 'Art Director'];
const SERVICES = ['Audience Intelligence', 'Market Research', 'Performance Analyst'];
const ALL_AGENTS = [...AGENTS, ...SERVICES, 'Caroline'];
const VALID_OWNERS = [...AGENTS, 'Caroline'];
const VALID_PENDING = ['decisao', 'aprovacao', 'execucao', 'bloqueio', 'nenhuma'];
const AGENT_ORDER = ['Scientific Research', 'Strategist', 'Creator', 'Editor', 'Art Director'];

// Coherence rules
function checkCoherence(item) {
  // C1: currentOwner null requires pendingType nenhuma
  if (item.currentOwner === null && item.pendingType !== 'nenhuma') {
    return { code: 'COERENCIA_C1', message: 'Quando currentOwner e null, pendingType deve ser nenhuma.' };
  }
  // C2: decisao or aprovacao requires Caroline
  if ((item.pendingType === 'decisao' || item.pendingType === 'aprovacao') && item.currentOwner !== 'Caroline') {
    return { code: 'COERENCIA_C2', message: 'pendingType decisao ou aprovacao exige currentOwner Caroline.' };
  }
  // C3: Caroline requires pendingType != nenhuma
  if (item.currentOwner === 'Caroline' && item.pendingType === 'nenhuma') {
    return { code: 'COERENCIA_C3', message: 'currentOwner Caroline exige pendingType diferente de nenhuma.' };
  }
  // C5: bloqueio requires blockerReason
  if (item.pendingType === 'bloqueio' && !item.blockerReason) {
    return { code: 'COERENCIA_C5', message: 'pendingType bloqueio exige blockerReason preenchido.' };
  }
  if (item.pendingType !== 'bloqueio' && item.blockerReason !== null) {
    return { code: 'COERENCIA_C5', message: 'blockerReason deve ser null quando pendingType nao e bloqueio.' };
  }
  // C6: execucao requires nextAction
  if (item.pendingType === 'execucao' && !item.nextAction) {
    return { code: 'COERENCIA_C6', message: 'pendingType execucao exige nextAction preenchido.' };
  }
  // C7: services cannot be currentOwner
  if (SERVICES.includes(item.currentOwner)) {
    return { code: 'COERENCIA_C7', message: 'Servicos (Audience Intelligence, Market Research, Performance Analyst) nunca podem ser currentOwner.' };
  }
  // C8: backlog, pronto, publicado require null owner and nenhuma
  if (['backlog', 'pronto', 'publicado', 'arquivado'].includes(item.status)) {
    if (item.currentOwner !== null || item.pendingType !== 'nenhuma') {
      return { code: 'COERENCIA_C8', message: 'Status backlog, pronto e publicado exigem currentOwner null e pendingType nenhuma.' };
    }
  }
  return null;
}

function isDevolution(fromOwner, toOwner) {
  const fromIdx = AGENT_ORDER.indexOf(fromOwner);
  const toIdx = AGENT_ORDER.indexOf(toOwner);
  if (fromIdx < 0 || toIdx < 0) return false;
  return toIdx < fromIdx;
}

function readPipeline() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

function writePipelineAtomic(data) {
  if (fs.existsSync(DATA_PATH)) {
    fs.copyFileSync(DATA_PATH, BACKUP_PATH);
  }
  data.lastUpdated = new Date().toISOString();
  const tmpPath = DATA_PATH + '.tmp.' + process.pid;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DATA_PATH);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

function validateArtifact(artifact) {
  if (!artifact) return null;
  if (typeof artifact !== 'string') return 'artifact deve ser string.';
  const resolved = path.resolve(PROJECT_ROOT, artifact);
  if (!resolved.startsWith(PROJECT_ROOT + path.sep) && resolved !== PROJECT_ROOT) {
    return 'artifact com path traversal detectado.';
  }
  if (!fs.existsSync(resolved)) {
    return 'artifact nao encontrado: ' + artifact;
  }
  return null;
}

// Migration (idempotent)
function migrate() {
  const pipeline = readPipeline();
  let migrated = 0;
  let legacyBlockers = 0;

  if (!fs.existsSync(PRE_HANDOFF_PATH)) {
    fs.copyFileSync(DATA_PATH, PRE_HANDOFF_PATH);
    console.log('Pre-handoff backup created.');
  }

  for (const item of pipeline.contents) {
    if (typeof item.revision === 'number') continue;

    // Get lastUpdate from last history entry or createdAt
    const lastHistEntry = item.history && item.history.length > 0
      ? item.history[item.history.length - 1]
      : null;
    const lastUpdate = lastHistEntry ? lastHistEntry.timestamp : (item.createdAt || new Date().toISOString());

    item.revision = 1;
    item.lastAgent = null;
    item.lastUpdate = lastUpdate;
    item.blockerReason = null;

    // Specific values per record
    if (item.id === '1.1') {
      item.currentOwner = 'Caroline';
      item.pendingType = 'execucao';
      // nextAction preserved as is
      item.history.push({
        type: 'migration',
        timestamp: new Date().toISOString(),
        agent: 'Dashboard',
        note: 'Migracao para schema v2. T1 atribuido a Caroline/execucao com base na informacao fornecida por Caroline e no nextAction ja registrado.',
        revision: 1,
      });
    } else if (item.id === '1.3') {
      item.currentOwner = null;
      item.pendingType = 'nenhuma';
      item.history.push({
        type: 'migration',
        timestamp: new Date().toISOString(),
        agent: 'Dashboard',
        note: 'Migracao para schema v2. Producao visual pendente, responsavel e ferramenta nao definidos nos arquivos do MOS.',
        revision: 1,
      });
    } else {
      item.currentOwner = null;
      item.pendingType = 'nenhuma';
      item.history.push({
        type: 'migration',
        timestamp: new Date().toISOString(),
        agent: 'Dashboard',
        note: 'Migracao para schema v2.',
        revision: 1,
      });
    }

    if (item.blocker && typeof item.blocker === 'string' && item.blocker.trim() !== '') {
      legacyBlockers++;
    }
    migrated++;
  }

  pipeline.version = 2;
  if (migrated > 0) {
    writePipelineAtomic(pipeline);
    console.log(`Migration complete: ${migrated} records migrated, ${legacyBlockers} with legacy blocker.`);
  } else {
    console.log('Migration: no records to migrate.');
  }
}

// Route matching helpers
function matchRoute(pathname, pattern) {
  // pattern like /api/content/:id/handoff
  const patParts = pattern.split('/');
  const urlParts = pathname.split('/');
  if (patParts.length !== urlParts.length) return null;
  const params = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(':')) {
      params[patParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
    } else if (patParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}

const copyStore = require('./copy-store').createCopyStore({
  readPipeline, parseBody, sendJSON, PROJECT_ROOT, ALL_AGENTS, SERVICES, COPY_DIR,
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // ============ Copy Store (/api/content/:id/copy/...) ============
  if (pathname.startsWith('/api/content/') && pathname.includes('/copy')) {
    if (await copyStore.handle(req, res, pathname, url, matchRoute)) return;
  }

  // ============ GET /api/pipeline ============
  if (pathname === '/api/pipeline' && req.method === 'GET') {
    try {
      sendJSON(res, 200, readPipeline());
    } catch (e) {
      sendJSON(res, 500, { error: true, message: e.message });
    }
    return;
  }

  // ============ GET /api/content/:id ============
  const getMatch = matchRoute(pathname, '/api/content/:id');
  if (getMatch && req.method === 'GET') {
    try {
      const pipeline = readPipeline();
      const item = pipeline.contents.find(c => c.id === getMatch.id);
      if (!item) { sendJSON(res, 404, { error: true, message: 'Conteudo nao encontrado.' }); return; }
      sendJSON(res, 200, item);
    } catch (e) {
      sendJSON(res, 500, { error: true, message: e.message });
    }
    return;
  }

  // ============ POST /api/content (create) ============
  if (pathname === '/api/content' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.title || !body.title.trim()) {
        sendJSON(res, 400, { error: true, message: 'Titulo e obrigatorio.' });
        return;
      }
      const pipeline = readPipeline();
      const now = new Date();
      const id = 'N-' + now.getFullYear().toString().slice(2) +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '-' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

      const newContent = {
        id,
        title: body.title.trim(),
        slug: null,
        territory: body.territory || null,
        territoryLabel: body.territoryLabel || null,
        type: body.type || null,
        editorialFunction: null,
        journeyStage: null,
        format: null,
        status: 'backlog',
        substatus: null,
        nextAction: null,
        block: null,
        publishDate: null,
        plannedWeek: body.plannedWeek || null,
        scientificPackage: null,
        scientificPackageStatus: null,
        approvedCopy: null,
        visualBrief: null,
        caption: null,
        assets: [],
        postUrl: null,
        metrics: {},
        leads: [],
        learnings: [],
        blocker: null,
        note: body.note || null,
        currentOwner: null,
        pendingType: 'nenhuma',
        blockerReason: null,
        lastUpdate: now.toISOString(),
        lastAgent: 'Caroline',
        revision: 1,
        createdAt: now.toISOString(),
        history: [
          {
            type: 'status',
            from: null,
            to: 'backlog',
            timestamp: now.toISOString(),
            agent: 'Caroline',
            note: body.note || 'Criado via Dashboard',
            revision: 1,
          },
        ],
      };

      pipeline.contents.push(newContent);
      writePipelineAtomic(pipeline);
      sendJSON(res, 201, newContent);
    } catch (e) {
      sendJSON(res, 400, { error: true, message: e.message });
    }
    return;
  }

  // ============ PATCH /api/content/:id ============
  const patchMatch = matchRoute(pathname, '/api/content/:id');
  if (patchMatch && req.method === 'PATCH') {
    try {
      const body = await parseBody(req);
      const pipeline = readPipeline();
      const item = pipeline.contents.find(c => c.id === patchMatch.id);
      if (!item) { sendJSON(res, 404, { error: true, message: 'Conteudo nao encontrado.' }); return; }

      // Require expectedRevision
      if (typeof body.expectedRevision !== 'number') {
        sendJSON(res, 400, { error: true, message: 'expectedRevision e obrigatorio.' }); return;
      }
      if (body.expectedRevision !== item.revision) {
        sendJSON(res, 409, {
          error: true, message: 'Conflito de revision.',
          revision: item.revision, status: item.status,
          currentOwner: item.currentOwner, pendingType: item.pendingType,
          lastHistory: item.history[item.history.length - 1] || null,
        }); return;
      }

      // Require agent
      if (!body.agent) {
        sendJSON(res, 400, { error: true, message: 'agent e obrigatorio.' }); return;
      }
      // Only Caroline and Orchestrator can PATCH
      if (body.agent !== 'Caroline' && body.agent !== 'Orchestrator') {
        sendJSON(res, 403, { error: true, message: 'Somente Caroline e Orchestrator podem usar PATCH.' }); return;
      }

      // Reject handoff fields in PATCH
      const handoffFields = ['currentOwner', 'pendingType', 'blockerReason', 'lastUpdate', 'lastAgent', 'revision'];
      for (const f of handoffFields) {
        if (f in body && f !== 'expectedRevision') {
          sendJSON(res, 422, { error: true, code: 'PATCH_HANDOFF_FIELD', message: `Campo ${f} so pode ser alterado via handoff.` }); return;
        }
      }
      // Also protect id, history, createdAt
      const protectedFields = ['id', 'history', 'createdAt', 'expectedRevision', 'agent', '_historyNote', 'confirmClosePending'];

      // Status change checks
      if (body.status && body.status !== item.status) {
        // pronto and publicado: only Caroline
        if (['pronto', 'publicado', 'arquivado'].includes(body.status) && body.agent !== 'Caroline') {
          sendJSON(res, 403, { error: true, message: 'Somente Caroline pode definir status pronto, publicado ou arquivado.' }); return;
        }

        // Check if moving to backlog/pronto/publicado with pending owner
        if (['backlog', 'pronto', 'publicado', 'arquivado'].includes(body.status)) {
          if (item.currentOwner !== null || item.pendingType !== 'nenhuma') {
            if (!body.confirmClosePending) {
              sendJSON(res, 422, {
                error: true, code: 'PENDENCIA_ABERTA',
                message: 'Conteudo tem pendencia aberta (currentOwner ou pendingType). Confirme com confirmClosePending: true para fechar.',
                currentOwner: item.currentOwner, pendingType: item.pendingType,
              }); return;
            }
            // Close pending
            item.currentOwner = null;
            item.pendingType = 'nenhuma';
            item.blockerReason = null;
          }
        }

        // Record status history
        const oldStatus = item.status;
        item.status = body.status;
        const now = new Date().toISOString();
        const histNote = body.note || body._historyNote || body.confirmClosePending
          ? (body.note || body._historyNote || '') + (body.confirmClosePending ? ' Pendencia fechada automaticamente.' : '')
          : null;
        item.history.push({
          type: 'status',
          from: oldStatus,
          to: body.status,
          timestamp: now,
          agent: body.agent,
          note: histNote ? histNote.trim() : null,
          revision: item.revision + 1,
        });
      }

      // Apply other updates
      for (const [key, value] of Object.entries(body)) {
        if (protectedFields.includes(key)) continue;
        if (handoffFields.includes(key)) continue;
        if (key === 'status') continue; // already handled
        item[key] = value;
      }

      // Coherence check
      const cErr = checkCoherence(item);
      if (cErr) { sendJSON(res, 422, { error: true, ...cErr }); return; }

      item.revision++;
      item.lastUpdate = new Date().toISOString();
      item.lastAgent = body.agent;
      writePipelineAtomic(pipeline);
      sendJSON(res, 200, item);
    } catch (e) {
      sendJSON(res, 400, { error: true, message: e.message });
    }
    return;
  }

  // ============ POST /api/content/:id/handoff ============
  const handoffMatch = matchRoute(pathname, '/api/content/:id/handoff');
  if (handoffMatch && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const pipeline = readPipeline();
      const item = pipeline.contents.find(c => c.id === handoffMatch.id);
      if (!item) { sendJSON(res, 404, { error: true, message: 'Conteudo nao encontrado.' }); return; }

      // Required fields
      if (typeof body.expectedRevision !== 'number') {
        sendJSON(res, 400, { error: true, message: 'expectedRevision e obrigatorio.' }); return;
      }
      if (!body.agent || !ALL_AGENTS.includes(body.agent)) {
        sendJSON(res, 400, { error: true, message: 'agent e obrigatorio e deve ser um agente valido.' }); return;
      }

      // Revision check
      if (body.expectedRevision !== item.revision) {
        sendJSON(res, 409, {
          error: true, message: 'Conflito de revision.',
          revision: item.revision, status: item.status,
          currentOwner: item.currentOwner, pendingType: item.pendingType,
          lastHistory: item.history[item.history.length - 1] || null,
        }); return;
      }

      // Auth: agent must be currentOwner, Orchestrator, or Caroline
      if (item.currentOwner !== null && body.agent !== item.currentOwner && body.agent !== 'Orchestrator' && body.agent !== 'Caroline') {
        sendJSON(res, 403, { error: true, message: `Agente ${body.agent} nao e o dono atual (${item.currentOwner}), Orchestrator ou Caroline.` }); return;
      }
      if (item.currentOwner === null && body.agent !== 'Orchestrator' && body.agent !== 'Caroline') {
        sendJSON(res, 403, { error: true, message: 'Quando currentOwner e null, somente Orchestrator ou Caroline podem fazer handoff.' }); return;
      }

      // Determine toOwner
      let toOwner;
      const toOwnerProvided = 'toOwner' in body;

      // Default: Caroline concluding execucao without specifying toOwner
      if (body.agent === 'Caroline' && item.pendingType === 'execucao' && !toOwnerProvided) {
        toOwner = 'Art Director';
        if (!body.pendingType) body.pendingType = 'nenhuma';
        if (!body.nextAction) body.nextAction = 'Visual QA';
      } else if (!toOwnerProvided) {
        sendJSON(res, 400, { error: true, message: 'toOwner e obrigatorio (exceto quando Caroline conclui execucao, onde o default e Art Director).' }); return;
      } else {
        toOwner = body.toOwner;
      }

      // Validate toOwner
      if (toOwner !== null && !VALID_OWNERS.includes(toOwner)) {
        sendJSON(res, 422, { error: true, code: 'COERENCIA_C7', message: 'toOwner deve ser um agente valido ou Caroline, nunca um servico.' }); return;
      }
      if (SERVICES.includes(toOwner)) {
        sendJSON(res, 422, { error: true, code: 'COERENCIA_C7', message: 'Servicos nunca podem ser currentOwner.' }); return;
      }

      const pendingType = body.pendingType || 'nenhuma';
      if (!VALID_PENDING.includes(pendingType)) {
        sendJSON(res, 400, { error: true, message: 'pendingType invalido.' }); return;
      }
      const blockerReason = body.blockerReason || null;

      // Artifact validation
      if (body.artifact) {
        const artErr = validateArtifact(body.artifact);
        if (artErr) {
          sendJSON(res, 422, { error: true, code: 'ARTIFACT_INVALID', message: artErr }); return;
        }
      }

      // Status transition rules for agents
      const newStatus = body.status || item.status;
      if (body.status && !VALID_STATUSES.includes(body.status)) {
        sendJSON(res, 400, { error: true, message: 'status invalido.' }); return;
      }

      if (body.status && body.status !== item.status && body.agent !== 'Caroline') {
        // Agent status transitions allowed:
        // Orchestrator: selecionado -> em-desenvolvimento
        // Strategist->Creator: em-desenvolvimento -> em-producao
        // Art Director->Caroline: em-producao -> revisao
        const allowed = [
          { agent: 'Orchestrator', from: 'selecionado', to: 'em-desenvolvimento' },
          { agent: 'Strategist', from: 'em-desenvolvimento', to: 'em-producao' },
          { agent: 'Art Director', from: 'em-producao', to: 'revisao' },
        ];
        const isAllowed = allowed.some(a =>
          (a.agent === body.agent || (a.agent === 'Orchestrator' && body.agent === 'Orchestrator'))
          && a.from === item.status && a.to === body.status
        );
        if (!isAllowed) {
          // pronto/publicado: 403 for non-Caroline
          if (['pronto', 'publicado', 'arquivado'].includes(body.status)) {
            sendJSON(res, 403, { error: true, message: 'Somente Caroline pode definir status pronto, publicado ou arquivado.' }); return;
          }
          sendJSON(res, 422, { error: true, code: 'STATUS_TRANSITION', message: `Transicao ${item.status} para ${body.status} nao permitida para ${body.agent}.` }); return;
        }

        // Strategist->Creator requires status em-producao
        if (body.agent === 'Strategist' && toOwner === 'Creator' && body.status !== 'em-producao') {
          sendJSON(res, 422, { error: true, code: 'STATUS_TRANSITION', message: 'Handoff Strategist para Creator deve declarar status em-producao.' }); return;
        }

        // Art Director->Caroline/aprovacao requires status revisao
        if (body.agent === 'Art Director' && toOwner === 'Caroline' && pendingType === 'aprovacao' && body.status !== 'revisao') {
          sendJSON(res, 422, { error: true, code: 'STATUS_TRANSITION', message: 'Art Director para Caroline com aprovacao deve declarar status revisao.' }); return;
        }
      }

      // Check: Strategist->Creator handoff MUST set status em-producao
      if (body.agent === 'Strategist' && toOwner === 'Creator' && item.status === 'em-desenvolvimento' && !body.status) {
        sendJSON(res, 422, { error: true, code: 'STATUS_TRANSITION', message: 'Handoff Strategist para Creator deve declarar status em-producao.' }); return;
      }

      // Check: Art Director->Caroline with execucao requires nextAction
      if (body.agent === 'Art Director' && toOwner === 'Caroline' && pendingType === 'execucao' && !body.nextAction) {
        sendJSON(res, 422, { error: true, code: 'COERENCIA_C6', message: 'pendingType execucao para Caroline exige nextAction concreto.' }); return;
      }

      // Note required checks
      const noteRequired = [];
      if (body.status && body.status !== item.status) noteRequired.push('mudanca de status');
      if (['bloqueio', 'execucao', 'decisao', 'aprovacao'].includes(pendingType)) noteRequired.push('pendingType ' + pendingType);
      if (toOwner && item.currentOwner && isDevolution(item.currentOwner, toOwner)) noteRequired.push('devolucao');
      if (body.agent === 'Caroline' && item.pendingType === 'aprovacao' && toOwner !== null) noteRequired.push('devolucao apos aprovacao');

      if (noteRequired.length > 0 && !body.note) {
        sendJSON(res, 400, { error: true, message: `note e obrigatoria neste handoff (${noteRequired.join(', ')}).` }); return;
      }

      // Handle closing pending when moving to backlog/pronto/publicado
      if (body.status && ['backlog', 'pronto', 'publicado', 'arquivado'].includes(body.status)) {
        if ((toOwner !== null && body.status !== 'pronto') || (item.currentOwner !== null && toOwner === undefined)) {
          // Will be handled by setting toOwner null for these states
        }
        // For pronto/publicado via Caroline approval, toOwner should be null
      }

      // Apply changes
      const fromOwner = item.currentOwner;
      const statusFrom = body.status && body.status !== item.status ? item.status : null;
      const statusTo = body.status && body.status !== item.status ? body.status : null;

      item.currentOwner = toOwner;
      item.pendingType = pendingType;
      item.blockerReason = blockerReason;
      if (body.nextAction !== undefined) item.nextAction = body.nextAction;
      if (body.status) item.status = body.status;

      // Coherence check
      const cErr = checkCoherence(item);
      if (cErr) {
        sendJSON(res, 422, { error: true, ...cErr }); return;
      }

      item.revision++;
      item.lastUpdate = new Date().toISOString();
      item.lastAgent = body.agent;

      item.history.push({
        type: 'handoff',
        timestamp: item.lastUpdate,
        agent: body.agent,
        fromOwner: fromOwner,
        toOwner: toOwner,
        pendingType: pendingType,
        blockerReason: blockerReason,
        statusFrom: statusFrom,
        statusTo: statusTo,
        nextAction: body.nextAction || null,
        artifact: body.artifact || null,
        note: body.note || null,
        revision: item.revision,
      });

      writePipelineAtomic(pipeline);
      sendJSON(res, 200, item);
    } catch (e) {
      sendJSON(res, 400, { error: true, message: e.message });
    }
    return;
  }

  // ============ POST /api/content/:id/service-run ============
  const serviceMatch = matchRoute(pathname, '/api/content/:id/service-run');
  if (serviceMatch && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const pipeline = readPipeline();
      const item = pipeline.contents.find(c => c.id === serviceMatch.id);
      if (!item) { sendJSON(res, 404, { error: true, message: 'Conteudo nao encontrado.' }); return; }

      // Required fields
      if (typeof body.expectedRevision !== 'number') {
        sendJSON(res, 400, { error: true, message: 'expectedRevision e obrigatorio.' }); return;
      }
      if (!body.agent || !SERVICES.includes(body.agent)) {
        sendJSON(res, 400, { error: true, message: 'agent deve ser um servico valido (Audience Intelligence, Market Research, Performance Analyst).' }); return;
      }
      if (!body.requestedBy) {
        sendJSON(res, 400, { error: true, message: 'requestedBy e obrigatorio.' }); return;
      }

      // Revision check
      if (body.expectedRevision !== item.revision) {
        sendJSON(res, 409, {
          error: true, message: 'Conflito de revision.',
          revision: item.revision, status: item.status,
          currentOwner: item.currentOwner, pendingType: item.pendingType,
          lastHistory: item.history[item.history.length - 1] || null,
        }); return;
      }

      // Auth: requestedBy must be currentOwner, Orchestrator, or Caroline
      if (item.currentOwner !== null && body.requestedBy !== item.currentOwner && body.requestedBy !== 'Orchestrator' && body.requestedBy !== 'Caroline') {
        sendJSON(res, 403, { error: true, message: `requestedBy ${body.requestedBy} nao e o dono atual, Orchestrator ou Caroline.` }); return;
      }
      if (item.currentOwner === null && body.requestedBy !== 'Orchestrator' && body.requestedBy !== 'Caroline') {
        sendJSON(res, 403, { error: true, message: 'Quando currentOwner e null, somente Orchestrator ou Caroline podem solicitar service-run.' }); return;
      }

      // Artifact validation
      if (body.artifact) {
        const artErr = validateArtifact(body.artifact);
        if (artErr) { sendJSON(res, 422, { error: true, code: 'ARTIFACT_INVALID', message: artErr }); return; }
      }

      // Does not alter owner, pending, status
      item.revision++;
      item.lastUpdate = new Date().toISOString();
      item.lastAgent = body.agent;

      item.history.push({
        type: 'service-run',
        timestamp: item.lastUpdate,
        agent: body.agent,
        requestedBy: body.requestedBy,
        artifact: body.artifact || null,
        note: body.note || null,
        revision: item.revision,
      });

      writePipelineAtomic(pipeline);
      sendJSON(res, 200, item);
    } catch (e) {
      sendJSON(res, 400, { error: true, message: e.message });
    }
    return;
  }

  // ============ POST /api/content/:id/publish ============
  const publishMatch = matchRoute(pathname, '/api/content/:id/publish');
  if (publishMatch && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const pipeline = readPipeline();
      const item = pipeline.contents.find(c => c.id === publishMatch.id);
      if (!item) { sendJSON(res, 404, { error: true, message: 'Conteudo nao encontrado.' }); return; }

      // Only Caroline
      if (body.agent !== 'Caroline') {
        sendJSON(res, 403, { error: true, message: 'Somente Caroline pode registrar publicacao.' }); return;
      }
      if (typeof body.expectedRevision !== 'number') {
        sendJSON(res, 400, { error: true, message: 'expectedRevision e obrigatorio.' }); return;
      }
      if (body.expectedRevision !== item.revision) {
        sendJSON(res, 409, {
          error: true, message: 'Conflito de revision.',
          revision: item.revision, status: item.status,
          currentOwner: item.currentOwner, pendingType: item.pendingType,
        }); return;
      }
      if (!body.publishDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.publishDate)) {
        sendJSON(res, 400, { error: true, message: 'publishDate e obrigatoria (formato YYYY-MM-DD).' }); return;
      }
      if (!body.postUrl || typeof body.postUrl !== 'string') {
        sendJSON(res, 400, { error: true, message: 'postUrl e obrigatoria.' }); return;
      }
      // Basic URL validation
      if (!/^https?:\/\/.+/.test(body.postUrl)) {
        sendJSON(res, 400, { error: true, message: 'postUrl deve ser uma URL valida (https://...).' }); return;
      }

      // Must be pronto or publicado to publish (or close pending)
      if (item.currentOwner !== null || item.pendingType !== 'nenhuma') {
        sendJSON(res, 422, {
          error: true, code: 'PENDENCIA_ABERTA',
          message: 'Conteudo tem pendencia aberta. Resolva antes de publicar.',
          currentOwner: item.currentOwner, pendingType: item.pendingType,
        }); return;
      }

      const oldStatus = item.status;
      item.status = 'publicado';
      item.publishDate = body.publishDate;
      item.postUrl = body.postUrl;
      if (body.format) item.format = body.format;
      item.platform = body.platform || 'instagram';

      // Initialize metrics structure if needed
      if (!item.metrics || typeof item.metrics !== 'object' || Array.isArray(item.metrics)) {
        item.metrics = {};
      }
      if (!item.metrics.snapshots) item.metrics.snapshots = [];
      if (!item.metrics.evidence) item.metrics.evidence = [];

      // Coherence check (C8: publicado requires null owner + nenhuma)
      const cErr = checkCoherence(item);
      if (cErr) { sendJSON(res, 422, { error: true, ...cErr }); return; }

      item.revision++;
      item.lastUpdate = new Date().toISOString();
      item.lastAgent = 'Caroline';

      item.history.push({
        type: 'publication',
        timestamp: item.lastUpdate,
        agent: 'Caroline',
        statusFrom: oldStatus,
        statusTo: 'publicado',
        publishDate: body.publishDate,
        postUrl: body.postUrl,
        format: body.format || null,
        platform: item.platform,
        note: body.note || null,
        revision: item.revision,
      });

      writePipelineAtomic(pipeline);
      sendJSON(res, 200, item);
    } catch (e) {
      sendJSON(res, 400, { error: true, message: e.message });
    }
    return;
  }

  // ============ POST /api/content/:id/metrics ============
  const metricsPostMatch = matchRoute(pathname, '/api/content/:id/metrics');
  if (metricsPostMatch && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const pipeline = readPipeline();
      const item = pipeline.contents.find(c => c.id === metricsPostMatch.id);
      if (!item) { sendJSON(res, 404, { error: true, message: 'Conteudo nao encontrado.' }); return; }

      if (body.agent !== 'Caroline' && body.agent !== 'Performance Analyst') {
        sendJSON(res, 403, { error: true, message: 'Somente Caroline ou Performance Analyst podem registrar metricas.' }); return;
      }
      if (typeof body.expectedRevision !== 'number') {
        sendJSON(res, 400, { error: true, message: 'expectedRevision e obrigatorio.' }); return;
      }
      if (body.expectedRevision !== item.revision) {
        sendJSON(res, 409, {
          error: true, message: 'Conflito de revision.',
          revision: item.revision,
        }); return;
      }

      // Must be publicado to receive metrics
      if (item.status !== 'publicado') {
        sendJSON(res, 422, { error: true, code: 'STATUS_INVALID', message: 'Metricas so podem ser registradas em conteudo publicado.' }); return;
      }

      // Initialize metrics structure if needed
      if (!item.metrics || typeof item.metrics !== 'object' || Array.isArray(item.metrics)) {
        item.metrics = {};
      }
      if (!item.metrics.snapshots) item.metrics.snapshots = [];
      if (!item.metrics.evidence) item.metrics.evidence = [];

      // Process snapshot
      if (body.snapshot) {
        const s = body.snapshot;
        if (!s.date || !/^\d{4}-\d{2}-\d{2}$/.test(s.date)) {
          sendJSON(res, 400, { error: true, message: 'snapshot.date e obrigatoria (YYYY-MM-DD).' }); return;
        }
        const validSources = ['manual', 'api', 'import'];
        if (!s.source || !validSources.includes(s.source)) {
          sendJSON(res, 400, { error: true, message: 'snapshot.source e obrigatoria (manual, api, import).' }); return;
        }
        const validMetricFields = ['reach', 'views', 'likes', 'comments', 'shares', 'saves', 'profileVisits', 'follows'];
        for (const f of validMetricFields) {
          if (f in s && s[f] !== null && (typeof s[f] !== 'number' || s[f] < 0)) {
            sendJSON(res, 400, { error: true, message: `snapshot.${f} deve ser um numero >= 0 ou null.` }); return;
          }
        }
        const snapshot = {
          date: s.date,
          source: s.source,
          reach: s.reach ?? null,
          views: s.views ?? null,
          likes: s.likes ?? null,
          comments: s.comments ?? null,
          shares: s.shares ?? null,
          saves: s.saves ?? null,
          profileVisits: s.profileVisits ?? null,
          follows: s.follows ?? null,
          note: s.note || null,
          recordedAt: new Date().toISOString(),
        };
        item.metrics.snapshots.push(snapshot);
      }

      // Process evidence
      if (body.evidence) {
        const e = body.evidence;
        if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
          sendJSON(res, 400, { error: true, message: 'evidence.date e obrigatoria (YYYY-MM-DD).' }); return;
        }
        const validTypes = ['insight-screenshot', 'report', 'export'];
        if (!e.type || !validTypes.includes(e.type)) {
          sendJSON(res, 400, { error: true, message: 'evidence.type e obrigatorio (insight-screenshot, report, export).' }); return;
        }
        if (!e.path || typeof e.path !== 'string') {
          sendJSON(res, 400, { error: true, message: 'evidence.path e obrigatorio.' }); return;
        }
        // Validate file exists on disk
        const artErr = validateArtifact(e.path);
        if (artErr) {
          sendJSON(res, 422, { error: true, code: 'EVIDENCE_INVALID', message: artErr }); return;
        }
        item.metrics.evidence.push({
          date: e.date,
          type: e.type,
          path: e.path,
          note: e.note || null,
          recordedAt: new Date().toISOString(),
        });
      }

      // Must have at least one of snapshot or evidence
      if (!body.snapshot && !body.evidence) {
        sendJSON(res, 400, { error: true, message: 'Envie snapshot, evidence ou ambos.' }); return;
      }

      item.revision++;
      item.lastUpdate = new Date().toISOString();
      item.lastAgent = body.agent;

      item.history.push({
        type: 'metrics',
        timestamp: item.lastUpdate,
        agent: body.agent,
        hasSnapshot: !!body.snapshot,
        hasEvidence: !!body.evidence,
        note: body.note || null,
        revision: item.revision,
      });

      writePipelineAtomic(pipeline);
      sendJSON(res, 200, item);
    } catch (e) {
      sendJSON(res, 400, { error: true, message: e.message });
    }
    return;
  }

  // ============ GET /api/content/:id/metrics ============
  const metricsGetMatch = matchRoute(pathname, '/api/content/:id/metrics');
  if (metricsGetMatch && req.method === 'GET') {
    try {
      const pipeline = readPipeline();
      const item = pipeline.contents.find(c => c.id === metricsGetMatch.id);
      if (!item) { sendJSON(res, 404, { error: true, message: 'Conteudo nao encontrado.' }); return; }
      const metrics = item.metrics && typeof item.metrics === 'object' && !Array.isArray(item.metrics)
        ? item.metrics
        : { snapshots: [], evidence: [] };
      sendJSON(res, 200, {
        id: item.id,
        title: item.title,
        status: item.status,
        publishDate: item.publishDate,
        postUrl: item.postUrl,
        platform: item.platform || null,
        metrics,
      });
    } catch (e) {
      sendJSON(res, 500, { error: true, message: e.message });
    }
    return;
  }

  // ============ POST /api/content/:id/evidence-upload ============
  const uploadMatch = matchRoute(pathname, '/api/content/:id/evidence-upload');
  if (uploadMatch && req.method === 'POST') {
    try {
      const pipeline = readPipeline();
      const item = pipeline.contents.find(c => c.id === uploadMatch.id);
      if (!item) { sendJSON(res, 404, { error: true, message: 'Conteudo nao encontrado.' }); return; }
      if (item.status !== 'publicado') {
        sendJSON(res, 422, { error: true, message: 'Evidencia so pode ser anexada a conteudo publicado.' }); return;
      }

      // Whitelist content-type
      const ct = req.headers['content-type'] || '';
      const ALLOWED_TYPES = {
        'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg',
        'image/webp': '.webp', 'application/pdf': '.pdf',
      };
      const ctKey = ct.split(';')[0].trim().toLowerCase();
      if (!ALLOWED_TYPES[ctKey]) {
        sendJSON(res, 400, { error: true, message: 'Content-Type nao permitido. Aceitos: PNG, JPG, WebP, PDF.' }); return;
      }
      const ext = ALLOWED_TYPES[ctKey];

      // Read body with streaming size limit
      const MAX_SIZE = 10 * 1024 * 1024;
      const chunks = [];
      let totalSize = 0;
      let aborted = false;
      for await (const chunk of req) {
        totalSize += chunk.length;
        if (totalSize > MAX_SIZE) { aborted = true; break; }
        chunks.push(chunk);
      }
      if (aborted) {
        sendJSON(res, 400, { error: true, message: 'Arquivo excede 10MB.' }); return;
      }
      const buffer = Buffer.concat(chunks);

      if (buffer.length === 0) {
        sendJSON(res, 400, { error: true, message: 'Arquivo vazio.' }); return;
      }

      // Validate magic bytes match declared type
      const MAGIC = {
        '.png':  [0x89, 0x50, 0x4E, 0x47],
        '.jpg':  [0xFF, 0xD8, 0xFF],
        '.webp': null, // check RIFF....WEBP
        '.pdf':  [0x25, 0x50, 0x44, 0x46],
      };
      let magicOk = false;
      if (ext === '.webp') {
        magicOk = buffer.length >= 12
          && buffer[0]===0x52 && buffer[1]===0x49 && buffer[2]===0x46 && buffer[3]===0x46
          && buffer[8]===0x57 && buffer[9]===0x45 && buffer[10]===0x42 && buffer[11]===0x50;
      } else {
        const expected = MAGIC[ext];
        if (expected) {
          magicOk = buffer.length >= expected.length && expected.every((b, i) => buffer[i] === b);
        }
      }
      if (!magicOk) {
        sendJSON(res, 400, { error: true, message: 'Conteudo do arquivo nao corresponde ao tipo declarado (' + ctKey + ').' }); return;
      }

      // Generate unique filename (prevent overwrite)
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const safeId = uploadMatch.id.replace(/[^a-zA-Z0-9._-]/g, '_');
      const evidenceDir = path.join(PROJECT_ROOT, 'tests', 'marketing-os', 'evidence');
      if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

      let filename = `${safeId}-${ts}${ext}`;
      let filePath = path.join(evidenceDir, filename);
      // If file already exists (rapid successive uploads), append counter
      let counter = 1;
      while (fs.existsSync(filePath)) {
        filename = `${safeId}-${ts}-${counter}${ext}`;
        filePath = path.join(evidenceDir, filename);
        counter++;
      }

      fs.writeFileSync(filePath, buffer);

      const relativePath = 'tests/marketing-os/evidence/' + filename;
      sendJSON(res, 201, { path: relativePath, size: buffer.length, filename });
    } catch (e) {
      sendJSON(res, 400, { error: true, message: e.message });
    }
    return;
  }

  // ============ GET /api/strategy ============
  if (pathname === '/api/strategy' && req.method === 'GET') {
    try {
      if (fs.existsSync(STRATEGY_PATH)) {
        const strategy = JSON.parse(fs.readFileSync(STRATEGY_PATH, 'utf-8'));
        sendJSON(res, 200, strategy);
      } else {
        sendJSON(res, 404, { error: true, message: 'Estrategia nao encontrada. Execute o Strategist primeiro.' });
      }
    } catch (e) {
      sendJSON(res, 500, { error: true, message: e.message });
    }
    return;
  }

  // ============ GET /api/artifact?path=... ============
  if (pathname === '/api/artifact' && req.method === 'GET') {
    try {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const relPath = params.get('path');
      if (!relPath) { sendJSON(res, 400, { error: true, message: 'path query parameter required.' }); return; }
      // Security: resolve relative to project root, reject traversal
      const absPath = path.resolve(PROJECT_ROOT, relPath);
      if (!absPath.startsWith(PROJECT_ROOT)) {
        sendJSON(res, 403, { error: true, message: 'Path outside project.' }); return;
      }
      if (!absPath.endsWith('.md')) {
        sendJSON(res, 400, { error: true, message: 'Only .md files allowed.' }); return;
      }
      if (!fs.existsSync(absPath)) {
        sendJSON(res, 404, { error: true, message: 'File not found: ' + relPath }); return;
      }
      const content = fs.readFileSync(absPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(content);
    } catch (e) {
      sendJSON(res, 500, { error: true, message: e.message });
    }
    return;
  }

  // ============ Snapshot API (read-only, for Dashboard v2) ============
  if (pathname === '/api/snapshot' && req.method === 'GET') {
    try {
      if (fs.existsSync(SNAPSHOT_PATH)) {
        const snap = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
        sendJSON(res, 200, snap);
      } else {
        sendJSON(res, 404, { error: true, message: 'Snapshot not found. Using pipeline fallback.' });
      }
    } catch (e) {
      sendJSON(res, 500, { error: true, message: e.message });
    }
    return;
  }

  // ============ Static files ============
  // Dashboard v2
  if (pathname === '/v2' || pathname === '/v2/') {
    serveStatic(res, path.join(V2_DIR, 'index.html'));
    return;
  }
  if (pathname.startsWith('/v2/')) {
    const v2File = path.join(V2_DIR, pathname.slice(4).replace(/\.\./g, ''));
    serveStatic(res, v2File);
    return;
  }

  // Dashboard v1 (Kanban)
  if (pathname === '/' || pathname === '/index.html') {
    serveStatic(res, path.join(__dirname, 'index.html'));
    return;
  }
  const safePath = path.join(__dirname, pathname.replace(/\.\./g, ''));
  serveStatic(res, safePath);
});

// Run migration and start
migrate();
server.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
