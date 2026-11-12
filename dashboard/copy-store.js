// Copy Store — armazenamento versionado da copy editorial (cards, legenda, CTA).
//
// Princípios:
// - NUNCA escreve em arquivos Markdown dos agentes (fonte original preservada).
// - NUNCA escreve em pipeline.json (somente leitura). Não é um segundo pipeline:
//   guarda apenas o texto e seu histórico, indexados pelo id do conteúdo.
// - Salvar rascunho != aprovar. Parecer do Editor != aprovação humana.
//   Nenhum endpoint daqui altera status, owner, pendingType ou pacote científico.
// - Conteúdo com status "publicado" não aceita novo rascunho.
//
// Persistência: um JSON por conteúdo em COPY_DIR (default dashboard/data/copy).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const MAX_CARDS = 20;
const MAX_CARD_LEN = 2000;
const MAX_CAPTION_LEN = 5000;
const MAX_CTA_LEN = 500;
const MAX_NOTE_LEN = 1000;
const MAX_COMMENT_LEN = 3000;
const MAX_REVIEW_NOTE_LEN = 2000;
const HUMAN = 'Caroline';

const COMMENT_KINDS = ['comentario', 'solicitacao-ajuste', 'parecer-editor'];
const COMMENT_TARGETS = ['card', 'legenda', 'cta', 'geral'];
const EDITOR_VERDICTS = ['sem-ressalvas', 'ajustes-necessarios', 'devolver'];
// Campos que sugerem tentativa de aprovar/alterar gates por este canal.
const FORBIDDEN_FIELDS = [
  'status', 'approved', 'approval', 'aprovado', 'aprovacao', 'approvedBy',
  'currentOwner', 'pendingType', 'toOwner', 'scientificPackage',
  'scientificPackageStatus', 'publishDate', 'postUrl', 'revision_pipeline',
];

function sha256(s) { return crypto.createHash('sha256').update(s, 'utf-8').digest('hex'); }

// ---------- Parsing do Markdown dos agentes (somente leitura) ----------

function cleanBlock(text) {
  return text
    .split('\n')
    .map(l => l.replace(/^>\s?/, ''))
    .filter(l => !/^---\s*$/.test(l.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseCopyMarkdown(md) {
  const cards = [];
  const cardRe = /^\*\*CARD\s*(\d+)(?:\s*[—–-]\s*([^*\n]+))?\*\*[ \t]*$([\s\S]*?)(?=^\*\*CARD\s*\d+|^##\s|(?![\s\S]))/gim;
  let m;
  while ((m = cardRe.exec(md)) !== null) {
    cards.push({ num: cards.length + 1, label: m[2] ? m[2].trim() : null, text: cleanBlock(m[3]) });
  }
  if (!cards.length) {
    const alt = /^##?\s*Card\s*(\d+)[:\s—–-]*$([\s\S]*?)(?=^##?\s*Card\s*\d+|^##\s*(LEGENDA|CTA)|(?![\s\S]))/gim;
    while ((m = alt.exec(md)) !== null) cards.push({ num: cards.length + 1, label: null, text: cleanBlock(m[2]) });
  }
  const leg = md.match(/^##\s*LEGENDA[ \t]*$([\s\S]*?)(?=^##\s|(?![\s\S]))/im);
  const cta = md.match(/^##\s*CTA[ \t]*$([\s\S]*?)(?=^##\s|(?![\s\S]))/im);
  return {
    cards,
    caption: leg ? cleanBlock(leg[1]) : '',
    cta: cta ? cleanBlock(cta[1]) || null : null,
  };
}

// ---------- Validação ----------

function validateContent(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['corpo deve ser um objeto JSON.'] };
  }
  for (const f of FORBIDDEN_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      errors.push(`campo "${f}" nao e aceito aqui: salvar rascunho nao altera status, aprovacao ou gates.`);
    }
  }
  const allowed = ['agent', 'expectedRevision', 'cards', 'caption', 'cta', 'note'];
  for (const k of Object.keys(body)) {
    if (!allowed.includes(k) && !FORBIDDEN_FIELDS.includes(k)) errors.push(`campo desconhecido: "${k}".`);
  }
  const { cards, caption, cta, note } = body;
  if (!Array.isArray(cards)) errors.push('cards deve ser um array.');
  else {
    if (cards.length < 1) errors.push('cards deve ter pelo menos 1 item.');
    if (cards.length > MAX_CARDS) errors.push(`cards excede o maximo de ${MAX_CARDS}.`);
    cards.forEach((c, i) => {
      if (!c || typeof c !== 'object' || typeof c.text !== 'string' || !c.text.trim()) {
        errors.push(`cards[${i}].text deve ser string nao vazia.`);
      } else if (c.text.length > MAX_CARD_LEN) {
        errors.push(`cards[${i}].text excede ${MAX_CARD_LEN} caracteres.`);
      }
      if (c && c.label != null && (typeof c.label !== 'string' || c.label.length > 60)) {
        errors.push(`cards[${i}].label deve ser string de ate 60 caracteres.`);
      }
    });
  }
  if (caption != null && typeof caption !== 'string') errors.push('caption deve ser string.');
  else if (typeof caption === 'string' && caption.length > MAX_CAPTION_LEN) errors.push(`caption excede ${MAX_CAPTION_LEN} caracteres.`);
  if (cta != null && typeof cta !== 'string') errors.push('cta deve ser string ou null.');
  else if (typeof cta === 'string' && cta.length > MAX_CTA_LEN) errors.push(`cta excede ${MAX_CTA_LEN} caracteres.`);
  if (note != null && (typeof note !== 'string' || note.length > MAX_NOTE_LEN)) errors.push(`note deve ser string de ate ${MAX_NOTE_LEN} caracteres.`);
  if (errors.length) return { errors };
  return {
    errors,
    content: normalizeContent({ cards, caption, cta }),
  };
}

function normalizeContent(c) {
  return {
    cards: c.cards.map((x, i) => ({ num: i + 1, label: x.label ? String(x.label).trim() : null, text: x.text.trim() })),
    caption: typeof c.caption === 'string' ? c.caption.trim() : '',
    cta: typeof c.cta === 'string' && c.cta.trim() ? c.cta.trim() : null,
  };
}

function contentHash(c) { return sha256(JSON.stringify(c)); }

// Regra de marca: sem travessao. Aviso (nao bloqueia).
function brandWarnings(c) {
  const w = [];
  const chk = (where, t) => { if (t && /[—–]/.test(t)) w.push(`${where}: contem travessao (regra de marca: nao usar).`); };
  c.cards.forEach(x => chk(`card ${x.num}`, x.text));
  chk('legenda', c.caption);
  chk('cta', c.cta);
  return w;
}

// ---------- Diff ----------

function lineDiff(a, b) {
  const A = a ? a.split('\n') : [];
  const B = b ? b.split('\n') : [];
  const n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ op: 'igual', text: A[i] }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { out.push({ op: 'removido', text: A[i] }); i++; }
    else { out.push({ op: 'adicionado', text: B[j] }); j++; }
  }
  while (i < n) out.push({ op: 'removido', text: A[i++] });
  while (j < m) out.push({ op: 'adicionado', text: B[j++] });
  return out;
}

function diffUnit(unit, before, after) {
  const b = before == null ? null : before, a = after == null ? null : after;
  let change;
  if (b == null && a == null) change = 'inalterado';
  else if (b == null) change = 'adicionado';
  else if (a == null) change = 'removido';
  else change = b === a ? 'inalterado' : 'alterado';
  return { unit, change, before: b, after: a, lines: change === 'inalterado' ? [] : lineDiff(b || '', a || '') };
}

function diffContents(from, to) {
  const units = [];
  const max = Math.max(from.cards.length, to.cards.length);
  for (let i = 0; i < max; i++) {
    units.push(diffUnit(`card:${i + 1}`, from.cards[i] ? from.cards[i].text : null, to.cards[i] ? to.cards[i].text : null));
  }
  units.push(diffUnit('legenda', from.caption || null, to.caption || null));
  units.push(diffUnit('cta', from.cta, to.cta));
  const changed = units.filter(u => u.change !== 'inalterado');
  return { units, summary: { changedUnits: changed.length, units: changed.map(u => u.unit) } };
}

// ---------- Módulo ----------

function createCopyStore(ctx) {
  const { readPipeline, parseBody, sendJSON, PROJECT_ROOT, ALL_AGENTS, SERVICES } = ctx;
  const COPY_DIR = ctx.COPY_DIR;

  const docPath = id => path.join(COPY_DIR, id + '.json');

  function loadDoc(id) {
    const p = docPath(id);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  }

  function saveDoc(doc) {
    fs.mkdirSync(COPY_DIR, { recursive: true });
    const p = docPath(doc.contentId);
    const tmp = p + '.tmp.' + process.pid;
    fs.writeFileSync(tmp, JSON.stringify(doc, null, 2), 'utf-8');
    fs.renameSync(tmp, p);
  }

  // Fonte Markdown do agente: somente leitura.
  function sourceArtifactOf(item) {
    if (item.approvedCopy) return item.approvedCopy;
    const hs = (item.history || []).filter(h => h.artifact && h.type === 'handoff' && (h.agent === 'Editor' || h.agent === 'Creator'));
    return hs.length ? hs[hs.length - 1].artifact : null;
  }

  function readSource(rel) {
    if (!rel || typeof rel !== 'string') return null;
    const abs = path.resolve(PROJECT_ROOT, rel);
    if (!abs.startsWith(PROJECT_ROOT + path.sep) || !abs.endsWith('.md') || !fs.existsSync(abs)) return null;
    const md = fs.readFileSync(abs, 'utf-8');
    return { path: rel, hash: sha256(md), parsed: parseCopyMarkdown(md) };
  }

  // Resolve a melhor fonte de copy: tenta os artefatos mais recentes primeiro,
  // priorizando aqueles que realmente contenham cards parseáveis.
  // Artefatos do Editor podem ser documentos de revisão (sem cards).
  function bestSource(item) {
    if (item.approvedCopy) {
      const src = readSource(item.approvedCopy);
      if (src && src.parsed.cards.length) return src;
    }
    const hs = (item.history || []).filter(h => h.artifact && h.type === 'handoff' && (h.agent === 'Editor' || h.agent === 'Creator'));
    for (let i = hs.length - 1; i >= 0; i--) {
      const src = readSource(hs[i].artifact);
      if (src && src.parsed.cards.length) return src;
    }
    // Fallback: retorna o que sourceArtifactOf retornaria, mesmo sem cards.
    const fallback = sourceArtifactOf(item);
    return fallback ? readSource(fallback) : null;
  }

  function gatesOf(item) {
    return {
      saveIsApproval: false,
      editorOpinionIsHumanApproval: false,
      editorialApprovalReplacesClinicalApproval: false,
      pipelineStatus: item.status,
      currentOwner: item.currentOwner,
      pendingType: item.pendingType,
      scientificPackage: item.scientificPackage || null,
      scientificPackageStatus: item.scientificPackageStatus || null,
      scientificGateOpen: !!item.scientificPackage && item.scientificPackageStatus !== 'frozen',
      note: 'Este modulo nao altera status, owner, pendingType nem pacote cientifico. Aprovacao segue o protocolo de handoff.',
    };
  }

  function warningsFor(item) {
    const w = [];
    if (item.scientificPackage && item.scientificPackageStatus !== 'frozen') {
      w.push(`Pacote cientifico ${item.scientificPackage} nao esta congelado (${item.scientificPackageStatus || 'sem status'}): rascunho salvo nao autoriza afirmacoes medicas ainda nao verificadas.`);
    }
    if (['pronto', 'revisao'].includes(item.status)) {
      w.push(`Conteudo em status "${item.status}": salvar rascunho nao altera nem invalida aprovacoes ja registradas; a revisao do Editor deve ser reaberta via handoff.`);
    }
    return w;
  }

  function view(item, doc, source) {
    const latest = doc && doc.versions.length ? doc.versions[doc.versions.length - 1] : null;
    let content, origin;
    if (latest) { content = latest.content; origin = latest.kind; }
    else if (source) { content = source.parsed; origin = 'origem'; }
    else { content = { cards: [], caption: '', cta: null }; origin = 'vazio'; }
    const sourceChanged = !!(doc && doc.source && source && doc.source.hash !== source.hash);
    return {
      contentId: item.id,
      title: item.title,
      revision: doc ? doc.revision : 0,
      version: latest ? latest.version : null,
      origin,
      content,
      source: source ? { path: source.path, hash: source.hash } : (doc && doc.source ? { path: doc.source.path, hash: doc.source.hash, unavailable: true } : null),
      sourceChanged,
      versionsCount: doc ? doc.versions.length : 0,
      commentsCount: doc ? doc.comments.length : 0,
      published: item.status === 'publicado',
      editable: item.status !== 'publicado',
      gates: gatesOf(item),
      warnings: warningsFor(item),
      proposal: proposalOf(item, doc, source),
      editorial: { status: item.status, currentOwner: item.currentOwner, pendingType: item.pendingType },
      clinical: {
        scientificPackage: item.scientificPackage || null,
        scientificPackageStatus: item.scientificPackageStatus || null,
        // O Dashboard nao tem campo de aprovacao clinica humana: nao inventar.
        humanClinicalApproval: 'sem-registro-no-dashboard',
      },
    };
  }

  // Proposta consolidada = ultima versao de AUTOR NAO HUMANO (agente ou arquivo de origem).
  // Rascunhos de Caroline nunca viram "proposta" e nada aqui e inventado.
  function proposalOf(item, doc, source) {
    let v = null;
    if (doc) {
      for (let i = doc.versions.length - 1; i >= 0; i--) {
        if (doc.versions[i].author !== HUMAN) { v = doc.versions[i]; break; }
      }
    } else if (source) {
      v = { version: 0, kind: 'origem', author: 'Sistema', savedAt: null, content: source.parsed, note: null };
    }
    if (!v || !v.content || !v.content.cards.length) return null;
    const srcPath = (doc && doc.source && doc.source.path) || (source && source.path) || null;
    let agent = v.kind === 'origem' ? null : v.author;
    let producedAt = v.savedAt;
    if (v.kind === 'origem' && srcPath) {
      const hs = (item.history || []).filter(h => h.type === 'handoff' && h.artifact === srcPath);
      if (hs.length) { const h = hs[hs.length - 1]; agent = h.agent || null; producedAt = h.timestamp || producedAt; }
    }
    return {
      version: v.version,
      kind: v.kind,
      origin: v.kind === 'origem' ? { type: 'arquivo-agente', path: srcPath, agent } : { type: 'versao-agente', agent: v.author },
      producedAt: producedAt || null,
      dateIsHandoff: v.kind === 'origem' && !!agent,
      note: v.note || null,
      content: v.content,
    };
  }

  function newDoc(item, source) {
    const doc = {
      contentId: item.id,
      schema: 'copy-store-v1',
      revision: 0,
      source: source ? { path: source.path, hash: source.hash } : null,
      versions: [],
      comments: [],
    };
    if (source) {
      doc.versions.push({
        version: 0, kind: 'origem', author: 'Sistema', savedAt: new Date().toISOString(),
        note: 'Snapshot da fonte Markdown (somente leitura).', content: source.parsed, contentHash: contentHash(source.parsed),
      });
    }
    return doc;
  }

  function authorize(item, agent, forWrite) {
    if (!agent || typeof agent !== 'string') return { code: 400, msg: 'agent e obrigatorio.' };
    if (!ALL_AGENTS.includes(agent)) return { code: 400, msg: 'agent invalido: ' + agent };
    if (SERVICES.includes(agent)) return { code: 403, msg: 'Servicos nao editam copy.' };
    if (forWrite && !(agent === 'Caroline' || agent === 'Orchestrator' || agent === item.currentOwner)) {
      return { code: 403, msg: `${agent} nao e o dono atual (${item.currentOwner || 'nenhum'}), Orchestrator ou Caroline.` };
    }
    return null;
  }

  function findItem(res, id) {
    if (!ID_RE.test(id)) { sendJSON(res, 400, { error: true, code: 'ID_INVALIDO', message: 'id de conteudo invalido.' }); return null; }
    const item = readPipeline().contents.find(c => c.id === id);
    if (!item) { sendJSON(res, 404, { error: true, code: 'NAO_ENCONTRADO', message: 'Conteudo nao encontrado.' }); return null; }
    return item;
  }

  function versionMeta(v) {
    return { version: v.version, kind: v.kind, author: v.author, savedAt: v.savedAt, note: v.note || null, contentHash: v.contentHash };
  }

  async function handle(req, res, pathname, url, matchRoute) {
    let p;

    // GET /api/content/:id/copy
    if ((p = matchRoute(pathname, '/api/content/:id/copy')) && req.method === 'GET') {
      const item = findItem(res, p.id); if (!item) return true;
      try {
        const doc = loadDoc(item.id);
        sendJSON(res, 200, view(item, doc, bestSource(item)));
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    // POST /api/content/:id/copy/draft
    if ((p = matchRoute(pathname, '/api/content/:id/copy/draft')) && req.method === 'POST') {
      let body;
      try { body = await parseBody(req); } catch { sendJSON(res, 400, { error: true, code: 'JSON_INVALIDO', message: 'JSON invalido.' }); return true; }
      const item = findItem(res, p.id); if (!item) return true;
      try {
        if (item.status === 'publicado') {
          sendJSON(res, 403, { error: true, code: 'CONTEUDO_PUBLICADO', message: 'Conteudo publicado nao pode ser sobrescrito.' }); return true;
        }
        const authErr = authorize(item, body && body.agent, true);
        if (authErr) { sendJSON(res, authErr.code, { error: true, code: 'AUTORIZACAO', message: authErr.msg }); return true; }
        if (!Number.isInteger(body.expectedRevision) || body.expectedRevision < 0) {
          sendJSON(res, 400, { error: true, code: 'VALIDACAO', message: 'expectedRevision e obrigatorio (inteiro >= 0).' }); return true;
        }
        const v = validateContent(body);
        if (v.errors.length) { sendJSON(res, 400, { error: true, code: 'VALIDACAO', message: 'Dados invalidos.', errors: v.errors }); return true; }

        const source = bestSource(item);
        let doc = loadDoc(item.id) || newDoc(item, source);
        if (body.expectedRevision !== doc.revision) {
          sendJSON(res, 409, { error: true, code: 'CONFLITO_REVISAO', message: 'Conflito de revisao da copy.', revision: doc.revision, currentVersion: doc.versions.length ? doc.versions[doc.versions.length - 1].version : null }); return true;
        }
        const latest = doc.versions.length ? doc.versions[doc.versions.length - 1] : null;
        const hash = contentHash(v.content);
        if (latest && latest.contentHash === hash) {
          sendJSON(res, 200, { unchanged: true, ...view(item, doc, source) }); return true;
        }
        const version = (latest ? latest.version : 0) + 1;
        doc.versions.push({
          version, kind: 'rascunho', author: body.agent, savedAt: new Date().toISOString(),
          note: body.note ? body.note.trim() : null, content: v.content, contentHash: hash,
        });
        doc.revision = version;
        if (!doc.source && source) doc.source = { path: source.path, hash: source.hash };
        saveDoc(doc);
        const out = view(item, doc, source);
        out.warnings = out.warnings.concat(brandWarnings(v.content));
        sendJSON(res, 201, { unchanged: false, saved: true, approved: false, ...out });
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    // GET /api/content/:id/copy/versions
    if ((p = matchRoute(pathname, '/api/content/:id/copy/versions')) && req.method === 'GET') {
      const item = findItem(res, p.id); if (!item) return true;
      try {
        const doc = loadDoc(item.id);
        sendJSON(res, 200, { contentId: item.id, revision: doc ? doc.revision : 0, versions: doc ? doc.versions.map(versionMeta) : [] });
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    // GET /api/content/:id/copy/diff?from=&to=
    if ((p = matchRoute(pathname, '/api/content/:id/copy/diff')) && req.method === 'GET') {
      const item = findItem(res, p.id); if (!item) return true;
      try {
        const doc = loadDoc(item.id);
        const f = url.searchParams.get('from'), t = url.searchParams.get('to');
        if (!/^\d+$/.test(f || '') || !/^\d+$/.test(t || '')) {
          sendJSON(res, 400, { error: true, code: 'VALIDACAO', message: 'from e to devem ser numeros de versao.' }); return true;
        }
        const vf = doc && doc.versions.find(v => v.version === +f);
        const vt = doc && doc.versions.find(v => v.version === +t);
        if (!vf || !vt) { sendJSON(res, 404, { error: true, code: 'VERSAO_NAO_ENCONTRADA', message: 'Versao nao encontrada.' }); return true; }
        sendJSON(res, 200, { contentId: item.id, from: versionMeta(vf), to: versionMeta(vt), ...diffContents(vf.content, vt.content) });
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    // GET /api/content/:id/copy/versions/:v
    if ((p = matchRoute(pathname, '/api/content/:id/copy/versions/:v')) && req.method === 'GET') {
      const item = findItem(res, p.id); if (!item) return true;
      try {
        const doc = loadDoc(item.id);
        const ver = /^\d+$/.test(p.v) && doc ? doc.versions.find(x => x.version === +p.v) : null;
        if (!ver) { sendJSON(res, 404, { error: true, code: 'VERSAO_NAO_ENCONTRADA', message: 'Versao nao encontrada.' }); return true; }
        sendJSON(res, 200, { contentId: item.id, ...ver });
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    // GET /api/content/:id/copy/comments
    if ((p = matchRoute(pathname, '/api/content/:id/copy/comments')) && req.method === 'GET') {
      const item = findItem(res, p.id); if (!item) return true;
      try {
        const doc = loadDoc(item.id);
        const vq = url.searchParams.get('version');
        let list = doc ? doc.comments : [];
        if (vq != null) list = list.filter(c => c.version === +vq);
        sendJSON(res, 200, { contentId: item.id, comments: list });
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    // POST /api/content/:id/copy/comments
    if ((p = matchRoute(pathname, '/api/content/:id/copy/comments')) && req.method === 'POST') {
      let body;
      try { body = await parseBody(req); } catch { sendJSON(res, 400, { error: true, code: 'JSON_INVALIDO', message: 'JSON invalido.' }); return true; }
      const item = findItem(res, p.id); if (!item) return true;
      try {
        const authErr = authorize(item, body && body.agent, false);
        if (authErr) { sendJSON(res, authErr.code, { error: true, code: 'AUTORIZACAO', message: authErr.msg }); return true; }
        const errors = [];
        for (const f of FORBIDDEN_FIELDS) if (Object.prototype.hasOwnProperty.call(body, f)) errors.push(`campo "${f}" nao e aceito: comentario nao aprova nem altera gates.`);
        const kind = body.kind || 'comentario';
        if (!COMMENT_KINDS.includes(kind)) errors.push('kind invalido. Validos: ' + COMMENT_KINDS.join(', '));
        if (typeof body.text !== 'string' || !body.text.trim()) errors.push('text e obrigatorio.');
        else if (body.text.length > MAX_COMMENT_LEN) errors.push(`text excede ${MAX_COMMENT_LEN} caracteres.`);
        const target = body.target || { type: 'geral' };
        if (!COMMENT_TARGETS.includes(target.type)) errors.push('target.type invalido. Validos: ' + COMMENT_TARGETS.join(', '));
        if (target.type === 'card' && !Number.isInteger(target.num)) errors.push('target.num (inteiro) e obrigatorio para card.');
        if (body.verdict != null && (kind !== 'parecer-editor' || !EDITOR_VERDICTS.includes(body.verdict))) {
          errors.push('verdict so vale para parecer-editor. Validos: ' + EDITOR_VERDICTS.join(', '));
        }
        if (errors.length) { sendJSON(res, 400, { error: true, code: 'VALIDACAO', message: 'Dados invalidos.', errors }); return true; }
        if (kind === 'parecer-editor' && body.agent !== 'Editor') {
          sendJSON(res, 403, { error: true, code: 'AUTORIZACAO', message: 'Somente o Editor registra parecer-editor.' }); return true;
        }

        const source = bestSource(item);
        const doc = loadDoc(item.id) || newDoc(item, source);
        if (!doc.versions.length) {
          sendJSON(res, 422, { error: true, code: 'SEM_VERSAO', message: 'Nao ha copy (fonte ou rascunho) para comentar.' }); return true;
        }
        const latest = doc.versions[doc.versions.length - 1];
        const version = body.version == null ? latest.version : body.version;
        const ver = Number.isInteger(version) && doc.versions.find(v => v.version === version);
        if (!ver) { sendJSON(res, 404, { error: true, code: 'VERSAO_NAO_ENCONTRADA', message: 'Versao nao encontrada.' }); return true; }
        if (target.type === 'card' && !ver.content.cards.some(c => c.num === target.num)) {
          sendJSON(res, 422, { error: true, code: 'ALVO_INVALIDO', message: `Card ${target.num} nao existe na versao ${version}.` }); return true;
        }
        const comment = {
          id: 'c' + (doc.comments.length + 1),
          createdAt: new Date().toISOString(),
          author: body.agent,
          kind,
          verdict: body.verdict || null,
          version,
          target: target.type === 'card' ? { type: 'card', num: target.num } : { type: target.type },
          text: body.text.trim(),
          // Garantias explicitas: comentario/parecer nunca e aprovacao.
          isApproval: false,
          // Solicitacao de ajuste so registra o pedido: nenhum agente e acionado aqui.
          execution: kind === 'solicitacao-ajuste' ? 'pendente-nao-executada' : null,
        };
        doc.comments.push(comment);
        saveDoc(doc);
        sendJSON(res, 201, { saved: true, approved: false, comment, gates: gatesOf(item) });
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    // GET /api/content/:id/copy/review
    if ((p = matchRoute(pathname, '/api/content/:id/copy/review')) && req.method === 'GET') {
      const item = findItem(res, p.id); if (!item) return true;
      try {
        const doc = loadDoc(item.id);
        const prop = proposalOf(item, doc, bestSource(item));
        sendJSON(res, 200, reviewView(item, doc, prop));
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    // PUT /api/content/:id/copy/review  (salva feedback; nao altera a proposta)
    if ((p = matchRoute(pathname, '/api/content/:id/copy/review')) && req.method === 'PUT') {
      let body;
      try { body = await parseBody(req); } catch { sendJSON(res, 400, { error: true, code: 'JSON_INVALIDO', message: 'JSON invalido.' }); return true; }
      const item = findItem(res, p.id); if (!item) return true;
      try {
        const g = reviewGuard(res, item, body); if (!g) return true;
        const { source, prop } = g;
        const errors = [];
        for (const f of FORBIDDEN_FIELDS) if (Object.prototype.hasOwnProperty.call(body, f)) errors.push(`campo "${f}" nao e aceito: revisao nao aprova nem altera gates.`);
        for (const k of Object.keys(body)) if (!['agent', 'expectedRevision', 'basedOnVersion', 'items'].includes(k) && !FORBIDDEN_FIELDS.includes(k)) errors.push(`campo desconhecido: "${k}".`);
        if (!Number.isInteger(body.expectedRevision) || body.expectedRevision < 0) errors.push('expectedRevision e obrigatorio (inteiro >= 0).');
        if (!Number.isInteger(body.basedOnVersion)) errors.push('basedOnVersion e obrigatorio (versao da proposta revisada).');
        const v = validateReviewItems(body.items, prop.content);
        errors.push(...v.errors);
        if (errors.length) { sendJSON(res, 400, { error: true, code: 'VALIDACAO', message: 'Dados invalidos.', errors }); return true; }

        const doc = loadDoc(item.id) || newDoc(item, source);
        const cur = doc.review || { revision: 0, basedOnVersion: prop.version, items: {}, lastSubmitted: null };
        if (body.expectedRevision !== cur.revision) {
          sendJSON(res, 409, { error: true, code: 'CONFLITO_REVISAO', scope: 'review', message: 'Conflito de revisao do feedback.', revision: cur.revision }); return true;
        }
        if (body.basedOnVersion !== prop.version) {
          sendJSON(res, 409, { error: true, code: 'PROPOSTA_MUDOU', message: 'A proposta dos agentes mudou (versao ' + prop.version + '). Recarregue antes de salvar.', proposalVersion: prop.version }); return true;
        }
        if (JSON.stringify(cur.items) === JSON.stringify(v.items) && cur.basedOnVersion === prop.version && cur.revision > 0) {
          sendJSON(res, 200, { unchanged: true, ...reviewView(item, doc, prop) }); return true;
        }
        doc.review = {
          revision: cur.revision + 1, basedOnVersion: prop.version, items: v.items,
          updatedAt: new Date().toISOString(), updatedBy: HUMAN, lastSubmitted: cur.lastSubmitted || null,
        };
        saveDoc(doc);
        sendJSON(res, 200, { unchanged: false, saved: true, approved: false, executed: false, ...reviewView(item, doc, prop) });
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    // POST /api/content/:id/copy/review/submit  (consolida e registra solicitacao PENDENTE)
    if ((p = matchRoute(pathname, '/api/content/:id/copy/review/submit')) && req.method === 'POST') {
      let body;
      try { body = await parseBody(req); } catch { sendJSON(res, 400, { error: true, code: 'JSON_INVALIDO', message: 'JSON invalido.' }); return true; }
      const item = findItem(res, p.id); if (!item) return true;
      try {
        const g = reviewGuard(res, item, body); if (!g) return true;
        const { source, prop } = g;
        const errors = [];
        for (const f of FORBIDDEN_FIELDS) if (Object.prototype.hasOwnProperty.call(body, f)) errors.push(`campo "${f}" nao e aceito: enviar ajustes nao aprova nem altera gates.`);
        for (const k of Object.keys(body)) if (!['agent', 'expectedRevision', 'basedOnVersion', 'generalNote'].includes(k) && !FORBIDDEN_FIELDS.includes(k)) errors.push(`campo desconhecido: "${k}".`);
        if (!Number.isInteger(body.expectedRevision) || body.expectedRevision < 0) errors.push('expectedRevision e obrigatorio (revisao do feedback salvo).');
        if (!Number.isInteger(body.basedOnVersion)) errors.push('basedOnVersion e obrigatorio.');
        if (body.generalNote != null && (typeof body.generalNote !== 'string' || body.generalNote.length > MAX_REVIEW_NOTE_LEN)) errors.push(`generalNote deve ser string de ate ${MAX_REVIEW_NOTE_LEN} caracteres.`);
        if (errors.length) { sendJSON(res, 400, { error: true, code: 'VALIDACAO', message: 'Dados invalidos.', errors }); return true; }

        const doc = loadDoc(item.id) || newDoc(item, source);
        const rv = doc.review;
        if (!rv || rv.revision === 0) { sendJSON(res, 422, { error: true, code: 'SEM_FEEDBACK', message: 'Salve sua revisao antes de enviar.' }); return true; }
        if (body.expectedRevision !== rv.revision) {
          sendJSON(res, 409, { error: true, code: 'CONFLITO_REVISAO', scope: 'review', message: 'O feedback salvo mudou. Salve e envie novamente.', revision: rv.revision }); return true;
        }
        if (rv.basedOnVersion !== prop.version || body.basedOnVersion !== prop.version) {
          sendJSON(res, 409, { error: true, code: 'PROPOSTA_MUDOU', message: 'O feedback foi feito sobre outra versao da proposta.', proposalVersion: prop.version, feedbackBasedOn: rv.basedOnVersion }); return true;
        }
        if (!Object.keys(rv.items).length) { sendJSON(res, 422, { error: true, code: 'SEM_ITENS', message: 'Nenhuma sugestao ou orientacao para enviar.' }); return true; }
        if (rv.lastSubmitted && rv.lastSubmitted.reviewRevision === rv.revision) {
          sendJSON(res, 409, { error: true, code: 'JA_ENVIADA', message: 'Este feedback ja foi enviado na solicitacao ' + rv.lastSubmitted.requestId + '.', requestId: rv.lastSubmitted.requestId }); return true;
        }
        doc.requests = doc.requests || [];
        const request = {
          id: 'r' + (doc.requests.length + 1),
          createdAt: new Date().toISOString(),
          author: HUMAN,
          basedOnVersion: prop.version,
          proposalOrigin: prop.origin,
          reviewRevision: rv.revision,
          generalNote: body.generalNote ? body.generalNote.trim() : null,
          items: itemsForRequest(rv.items, prop.content),
          // Honestidade: nada e executado aqui. Handoff nao utilizado.
          status: 'pendente-nao-executada',
          executed: false,
          handoff: null,
          isApproval: false,
          pipelineSnapshot: { status: item.status, currentOwner: item.currentOwner, pendingType: item.pendingType },
        };
        doc.requests.push(request);
        rv.lastSubmitted = { requestId: request.id, at: request.createdAt, reviewRevision: rv.revision };
        saveDoc(doc);
        sendJSON(res, 201, { saved: true, approved: false, executed: false, request, gates: gatesOf(item) });
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    // GET /api/content/:id/copy/requests
    if ((p = matchRoute(pathname, '/api/content/:id/copy/requests')) && req.method === 'GET') {
      const item = findItem(res, p.id); if (!item) return true;
      try {
        const doc = loadDoc(item.id);
        sendJSON(res, 200, { contentId: item.id, requests: doc && doc.requests ? doc.requests : [] });
      } catch (e) { sendJSON(res, 500, { error: true, message: e.message }); }
      return true;
    }

    return false;
  }

  // ---------- Revisao por card ----------
  function reviewView(item, doc, prop) {
    const rv = doc && doc.review ? doc.review : null;
    return {
      contentId: item.id,
      revision: rv ? rv.revision : 0,
      proposalVersion: prop ? prop.version : null,
      basedOnVersion: rv ? rv.basedOnVersion : (prop ? prop.version : null),
      stale: !!(rv && prop && rv.revision > 0 && rv.basedOnVersion !== prop.version),
      items: rv ? rv.items : {},
      updatedAt: rv ? rv.updatedAt || null : null,
      updatedBy: rv ? rv.updatedBy || null : null,
      lastSubmitted: rv ? rv.lastSubmitted || null : null,
      editable: item.status !== 'publicado' && !!prop,
      proposalAvailable: !!prop,
    };
  }

  // Valida bloqueios comuns do feedback; devolve {source, prop} ou null (resposta ja enviada).
  function reviewGuard(res, item, body) {
    if (item.status === 'publicado') {
      sendJSON(res, 403, { error: true, code: 'CONTEUDO_PUBLICADO', message: 'Conteudo publicado nao pode receber revisao nem ajustes.' }); return null;
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      sendJSON(res, 400, { error: true, code: 'VALIDACAO', message: 'corpo deve ser um objeto JSON.' }); return null;
    }
    if (body.agent !== HUMAN) {
      sendJSON(res, 403, { error: true, code: 'AUTORIZACAO', message: 'Somente Caroline registra a revisao humana.' }); return null;
    }
    const source = bestSource(item);
    const prop = proposalOf(item, loadDoc(item.id), source);
    if (!prop) {
      sendJSON(res, 422, { error: true, code: 'SEM_PROPOSTA', message: 'Nao ha proposta consolidada dos agentes para revisar.' }); return null;
    }
    return { source, prop };
  }

  function validateReviewItems(items, content) {
    const errors = [], out = {};
    if (!items || typeof items !== 'object' || Array.isArray(items)) return { errors: ['items deve ser um objeto.'], items: out };
    for (const [key, val] of Object.entries(items)) {
      const m = /^card:(\d+)$/.exec(key);
      let max = MAX_CARD_LEN;
      if (m) { if (+m[1] < 1 || +m[1] > content.cards.length) { errors.push(`${key}: card inexistente na proposta.`); continue; } }
      else if (key === 'legenda') max = MAX_CAPTION_LEN;
      else if (key === 'cta') { if (content.cta == null) { errors.push('cta: a proposta nao tem CTA.'); continue; } max = MAX_CTA_LEN; }
      else { errors.push(`${key}: alvo invalido (use card:N, legenda ou cta).`); continue; }
      if (!val || typeof val !== 'object' || Array.isArray(val)) { errors.push(`${key}: deve ser objeto {suggestion, note}.`); continue; }
      for (const k of Object.keys(val)) if (!['suggestion', 'note'].includes(k)) errors.push(`${key}: campo desconhecido "${k}".`);
      const sug = val.suggestion, note = val.note;
      if (sug != null && (typeof sug !== 'string' || sug.length > max)) { errors.push(`${key}.suggestion deve ser string de ate ${max} caracteres.`); continue; }
      if (note != null && (typeof note !== 'string' || note.length > MAX_REVIEW_NOTE_LEN)) { errors.push(`${key}.note deve ser string de ate ${MAX_REVIEW_NOTE_LEN} caracteres.`); continue; }
      const s = typeof sug === 'string' && sug.trim() ? sug.trim() : null;
      const n = typeof note === 'string' && note.trim() ? note.trim() : null;
      if (s || n) out[key] = { suggestion: s, note: n };
    }
    return { errors, items: out };
  }

  function itemsForRequest(items, content) {
    const order = content.cards.map(c => 'card:' + c.num).concat(['legenda', 'cta']);
    return order.filter(k => items[k]).map(k => {
      const m = /^card:(\d+)$/.exec(k);
      const label = m ? 'Card ' + m[1] : k === 'legenda' ? 'Legenda' : 'CTA';
      const proposalText = m ? content.cards[+m[1] - 1].text : k === 'legenda' ? content.caption : content.cta;
      return { unit: k, label, proposalText, suggestion: items[k].suggestion, note: items[k].note };
    });
  }

  return { handle, parseCopyMarkdown, diffContents };
}

module.exports = { createCopyStore, parseCopyMarkdown, diffContents };
