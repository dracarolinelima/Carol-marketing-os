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
const V2_DIR = path.join(__dirname, 'v2');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const VALID_STATUSES = ['backlog', 'selecionado', 'em-desenvolvimento', 'em-producao', 'revisao', 'pronto', 'publicado'];
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
  if (['backlog', 'pronto', 'publicado'].includes(item.status)) {
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

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
        if (['pronto', 'publicado'].includes(body.status) && body.agent !== 'Caroline') {
          sendJSON(res, 403, { error: true, message: 'Somente Caroline pode definir status pronto ou publicado.' }); return;
        }

        // Check if moving to backlog/pronto/publicado with pending owner
        if (['backlog', 'pronto', 'publicado'].includes(body.status)) {
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
        const histNote = body._historyNote || body.confirmClosePending
          ? (body._historyNote || '') + (body.confirmClosePending ? ' Pendencia fechada automaticamente.' : '')
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
          if (['pronto', 'publicado'].includes(body.status)) {
            sendJSON(res, 403, { error: true, message: 'Somente Caroline pode definir status pronto ou publicado.' }); return;
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
      if (body.status && ['backlog', 'pronto', 'publicado'].includes(body.status)) {
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
