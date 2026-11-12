#!/usr/bin/env node
// Tests for Copy Store (/api/content/:id/copy/...).
// Dados isolados: pipeline de teste, COPY_DIR temporario e fonte .md de fixture.
// NAO toca pipeline.json real nem tests/marketing-os/.
// Run: node dashboard/tests/test-copy-store.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PORT = 3098;
const DASH = path.join(__dirname, '..');
const DATA_DIR = path.join(DASH, 'data');
const TEST_PIPELINE = path.join(DATA_DIR, 'pipeline.copytest.json');
const REAL_PIPELINE = path.join(DATA_DIR, 'pipeline.json');
const REAL_COPY_DIR = path.join(DATA_DIR, 'copy');
const FIXT_DIR = path.join(__dirname, '.tmp-copy-fixtures');
const COPY_DIR = path.join(FIXT_DIR, 'copy-store');
const SRC_REL = 'dashboard/tests/.tmp-copy-fixtures/T-fixture.md';
const SRC_ABS = path.join(__dirname, '..', '..', SRC_REL);

const FIXTURE_MD = `# T-X — TESTE

**Formato:** Carrossel 3 cards + legenda

## CARDS

**CARD 1 — CAPA**

Você não sente calores, mas sabe que algo mudou.

---

**CARD 2**

Você acorda no meio da noite.

Pela manhã, continua cansada.

---

**CARD 3**

Vale investigar o que está acontecendo.

---

## LEGENDA

Primeira linha da legenda.

Segunda linha da legenda.

## CTA

Agende sua consulta.
`;

let passed = 0, failed = 0;
const results = [];
function ok(cond, name, detail) {
  if (cond) { passed++; results.push('  ✓ ' + name); }
  else { failed++; results.push('  ✗ ' + name + ' — ' + (detail === undefined ? '' : JSON.stringify(detail))); }
}
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: PORT, path: urlPath, method, headers: {} };
    let data = body;
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; data = typeof body === 'string' ? body : JSON.stringify(body); }
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    r.on('error', reject);
    if (data !== undefined) r.write(data);
    r.end();
  });
}

function item(id, over) {
  return Object.assign({
    id, title: 'Teste ' + id, slug: null, territory: 'B', territoryLabel: 'T', type: 'bloco',
    editorialFunction: 'COMPREENSÃO', journeyStage: 'REC → ENT', format: 'Carrossel', status: 'em-producao',
    substatus: null, nextAction: null, block: null, publishDate: null,
    scientificPackage: 'T1', scientificPackageStatus: 'frozen',
    approvedCopy: null, visualBrief: null, caption: null, assets: [], postUrl: null, metrics: {},
    leads: [], learnings: [], blocker: null, note: null,
    currentOwner: 'Creator', pendingType: 'nenhuma', blockerReason: null,
    lastUpdate: new Date().toISOString(), lastAgent: 'Strategist', revision: 3,
    createdAt: '2026-09-20T10:00:00Z', history: [],
  }, over);
}

function seed() {
  const data = {
    version: 2, lastUpdated: new Date().toISOString(),
    contents: [
      item('C-SRC', { approvedCopy: SRC_REL, currentOwner: 'Editor' }),           // com fonte md
      item('C-NEW', {}),                                                          // sem fonte (rascunho do zero)
      item('C-PUB', { status: 'publicado', currentOwner: null, approvedCopy: SRC_REL, publishDate: '2026-10-01', postUrl: 'https://www.instagram.com/p/X/' }),
      item('C-REV', { approvedCopy: SRC_REL, currentOwner: 'Creator', history: [{ type: 'handoff', agent: 'Creator', timestamp: '2026-10-05T12:00:00.000Z', artifact: SRC_REL, toOwner: 'Editor', revision: 3 }] }),
      item('C-REV2', { approvedCopy: SRC_REL, currentOwner: 'Creator' }),
      item('C-EMPTY', {}),
      item('C-P2', { scientificPackage: 'P2', scientificPackageStatus: 'pending', currentOwner: 'Creator' }),
    ],
  };
  fs.writeFileSync(TEST_PIPELINE, JSON.stringify(data, null, 2));
}

let child;
function startServer() {
  return new Promise((resolve, reject) => {
    child = spawn('node', ['server.js'], { cwd: DASH, env: { ...process.env, PORT: String(PORT), PIPELINE_PATH: TEST_PIPELINE, COPY_DIR } });
    let ready = false;
    child.stdout.on('data', d => { if (!ready && d.toString().includes('Dashboard running')) { ready = true; resolve(); } });
    child.stderr.on('data', d => process.stderr.write(d));
    setTimeout(() => { if (!ready) reject(new Error('Server start timeout')); }, 5000);
  });
}
function stopServer() {
  return new Promise(resolve => { if (!child) return resolve(); child.once('exit', resolve); child.kill(); });
}

const cards3 = [{ text: 'Card um editado.' }, { text: 'Card dois.' }, { text: 'Card tres.' }];

async function run() {
  const realHash = sha(REAL_PIPELINE);
  const realCopyExisted = fs.existsSync(REAL_COPY_DIR);
  const srcHash = sha(SRC_ABS);
  const base = id => `/api/content/${id}/copy`;
  let r;

  console.log('\nCopy Store API Tests\n');

  // ---- GET estruturado a partir da fonte
  console.log('--- GET copy (fonte Markdown) ---');
  r = await req('GET', base('C-SRC'));
  ok(r.status === 200, 'GET copy 200', r.body);
  ok(r.body.origin === 'origem' && r.body.revision === 0, 'origem=origem, revision 0', [r.body.origin, r.body.revision]);
  ok(r.body.content.cards.length === 3, '3 cards parseados', r.body.content && r.body.content.cards);
  ok(r.body.content.cards[0].label === 'CAPA' && r.body.content.cards[0].text.startsWith('Você não sente'), 'card 1 com label CAPA e texto limpo (sem ---)');
  ok(!r.body.content.cards[1].text.includes('---') && r.body.content.cards[1].text.includes('\n\n'), 'card 2 multi-paragrafo preservado');
  ok(r.body.content.caption.includes('Segunda linha'), 'legenda parseada');
  ok(r.body.content.cta === 'Agende sua consulta.', 'CTA parseado', r.body.content.cta);
  ok(r.body.gates && r.body.gates.saveIsApproval === false, 'gates expostos: saveIsApproval=false');
  ok(!fs.existsSync(path.join(COPY_DIR, 'C-SRC.json')), 'GET nao grava nada em disco');

  r = await req('GET', base('NAO-EXISTE'));
  ok(r.status === 404, 'GET conteudo inexistente 404');
  r = await req('GET', '/api/content/..%2Fx/copy');
  ok(r.status === 400 || r.status === 404, 'id com traversal rejeitado', r.status);
  r = await req('GET', base('C-NEW'));
  ok(r.status === 200 && r.body.origin === 'vazio' && r.body.content.cards.length === 0, 'sem fonte: copy vazia');

  // ---- Criação de rascunho / salvamento
  console.log('--- POST draft ---');
  r = await req('POST', base('C-SRC') + '/draft', { agent: 'Editor', expectedRevision: 0, cards: cards3, caption: 'Legenda nova.', cta: null, note: 'Ajuste de tom' });
  ok(r.status === 201 && r.body.saved === true, 'salvar rascunho 201', r.body);
  ok(r.body.approved === false, 'resposta declara approved=false');
  ok(r.body.revision === 1 && r.body.version === 1, 'revision/version = 1');
  ok(r.body.content.cards[0].num === 1 && r.body.content.cards[2].num === 3, 'cards renumerados');
  ok(sha(SRC_ABS) === srcHash, 'fonte Markdown NAO foi alterada');
  const stored = JSON.parse(fs.readFileSync(path.join(COPY_DIR, 'C-SRC.json'), 'utf-8'));
  ok(stored.versions.length === 2 && stored.versions[0].version === 0 && stored.versions[0].kind === 'origem', 'v0 = snapshot da origem, v1 = rascunho');
  ok(stored.versions[1].author === 'Editor' && !!stored.versions[1].savedAt, 'autoria e data registradas');

  r = await req('POST', base('C-SRC') + '/draft', { agent: 'Editor', expectedRevision: 1, cards: cards3, caption: 'Legenda nova.', cta: null });
  ok(r.status === 200 && r.body.unchanged === true && r.body.revision === 1, 'salvar igual: sem nova versao');

  r = await req('POST', base('C-SRC') + '/draft', { agent: 'Caroline', expectedRevision: 1, cards: [{ text: 'Card um editado de novo.' }, { text: 'Card dois.' }], caption: 'Legenda nova. Mais uma.', cta: 'Agende.' });
  ok(r.status === 201 && r.body.revision === 2, 'segunda edicao -> revision 2', r.body);

  // Rascunho do zero
  r = await req('POST', base('C-NEW') + '/draft', { agent: 'Creator', expectedRevision: 0, cards: [{ text: 'Do zero — com travessão.' }], caption: '' });
  ok(r.status === 201 && r.body.revision === 1, 'rascunho sem fonte criado, revision 1', r.body);
  ok(r.body.warnings.some(w => /travessao/.test(w)), 'aviso de travessao (regra de marca), nao bloqueia');

  // ---- Persistência após reinício
  console.log('--- Persistencia apos reinicio ---');
  await stopServer();
  await startServer();
  r = await req('GET', base('C-SRC'));
  ok(r.body.revision === 2 && r.body.version === 2 && r.body.content.cards.length === 2, 'estado preservado apos reinicio', [r.body.revision, r.body.version]);
  r = await req('GET', base('C-NEW'));
  ok(r.body.revision === 1 && r.body.content.cards[0].text.startsWith('Do zero'), 'rascunho do zero preservado');

  // ---- Versões
  console.log('--- Versoes ---');
  r = await req('GET', base('C-SRC') + '/versions');
  ok(r.status === 200 && r.body.versions.length === 3 && r.body.versions.map(v => v.version).join() === '0,1,2', 'lista de versoes 0,1,2', r.body.versions && r.body.versions.map(v => v.version));
  r = await req('GET', base('C-SRC') + '/versions/1');
  ok(r.status === 200 && r.body.content.caption === 'Legenda nova.' && r.body.author === 'Editor', 'recupera versao 1 integral');
  r = await req('GET', base('C-SRC') + '/versions/0');
  ok(r.status === 200 && r.body.content.cards.length === 3 && r.body.content.cta === 'Agende sua consulta.', 'recupera versao 0 (origem)');
  r = await req('GET', base('C-SRC') + '/versions/9');
  ok(r.status === 404 && r.body.code === 'VERSAO_NAO_ENCONTRADA', 'versao inexistente 404');
  r = await req('GET', base('C-SRC') + '/versions/abc');
  ok(r.status === 404, 'versao nao numerica 404');

  // ---- Diff
  console.log('--- Comparacao ---');
  r = await req('GET', base('C-SRC') + '/diff?from=1&to=2');
  ok(r.status === 200, 'diff 200', r.body);
  const u = n => r.body.units.find(x => x.unit === n);
  ok(u('card:1').change === 'alterado', 'card 1 alterado');
  ok(u('card:2').change === 'inalterado', 'card 2 inalterado');
  ok(u('card:3').change === 'removido', 'card 3 removido');
  ok(u('legenda').change === 'alterado' && u('cta').change === 'adicionado', 'legenda alterada, cta adicionada');
  ok(r.body.summary.changedUnits === 4, 'resumo: 4 unidades alteradas', r.body.summary);
  ok(u('card:1').lines.some(l => l.op === 'removido') && u('card:1').lines.some(l => l.op === 'adicionado'), 'diff linha a linha');
  r = await req('GET', base('C-SRC') + '/diff?from=0&to=0');
  ok(r.status === 200 && r.body.summary.changedUnits === 0, 'diff identico sem mudancas');
  r = await req('GET', base('C-SRC') + '/diff?from=1');
  ok(r.status === 400, 'diff sem "to" 400');
  r = await req('GET', base('C-SRC') + '/diff?from=1&to=99');
  ok(r.status === 404, 'diff versao inexistente 404');

  // ---- Conflito
  console.log('--- Conflito de revisao ---');
  r = await req('POST', base('C-SRC') + '/draft', { agent: 'Editor', expectedRevision: 1, cards: cards3, caption: 'x' });
  ok(r.status === 409 && r.body.code === 'CONFLITO_REVISAO' && r.body.revision === 2, '409 com revision atual', r.body);
  r = await req('GET', base('C-SRC') + '/versions');
  ok(r.body.versions.length === 3, 'conflito nao criou versao');
  // duas gravacoes concorrentes com a mesma revision: so uma vence
  const [a, b] = await Promise.all([
    req('POST', base('C-SRC') + '/draft', { agent: 'Editor', expectedRevision: 2, cards: [{ text: 'Concorrente A' }], caption: '' }),
    req('POST', base('C-SRC') + '/draft', { agent: 'Caroline', expectedRevision: 2, cards: [{ text: 'Concorrente B' }], caption: '' }),
  ]);
  ok([a.status, b.status].sort().join() === '201,409', 'concorrencia: um 201 e um 409', [a.status, b.status]);

  // ---- Validação / erros explícitos
  console.log('--- Validacao ---');
  const inv = async (body, label) => { const x = await req('POST', base('C-NEW') + '/draft', body); ok(x.status === 400 || x.status === 403, label, [x.status, x.body]); return x; };
  await inv({ expectedRevision: 1, cards: cards3 }, 'sem agent rejeitado');
  await inv({ agent: 'Creator', cards: cards3 }, 'sem expectedRevision rejeitado');
  await inv({ agent: 'Creator', expectedRevision: 1, cards: [] }, 'cards vazio rejeitado');
  await inv({ agent: 'Creator', expectedRevision: 1, cards: [{ text: '  ' }] }, 'card vazio rejeitado');
  await inv({ agent: 'Creator', expectedRevision: 1, cards: [{ text: 'x'.repeat(2001) }] }, 'card longo rejeitado');
  await inv({ agent: 'Creator', expectedRevision: 1, cards: 'texto' }, 'cards nao-array rejeitado');
  await inv({ agent: 'Creator', expectedRevision: 1, cards: cards3, extra: 1 }, 'campo desconhecido rejeitado');
  x = await req('POST', base('C-NEW') + '/draft', '{quebrado');
  ok(x.status === 400 && x.body.code === 'JSON_INVALIDO', 'JSON invalido 400');
  r = await req('POST', base('C-NEW') + '/draft', { agent: 'Robo', expectedRevision: 1, cards: cards3 });
  ok(r.status === 400, 'agente inexistente 400');
  r = await req('POST', base('C-NEW') + '/draft', { agent: 'Market Research', expectedRevision: 1, cards: cards3 });
  ok(r.status === 403, 'servico nao edita copy (403)');
  r = await req('POST', base('C-NEW') + '/draft', { agent: 'Editor', expectedRevision: 1, cards: cards3 });
  ok(r.status === 403 && r.body.code === 'AUTORIZACAO', 'agente que nao e dono nem Orchestrator/Caroline: 403');
  r = await req('POST', base('NAO-EXISTE') + '/draft', { agent: 'Caroline', expectedRevision: 0, cards: cards3 });
  ok(r.status === 404, 'draft em conteudo inexistente 404');

  // ---- Conteúdo publicado
  console.log('--- Conteudo publicado ---');
  r = await req('POST', base('C-PUB') + '/draft', { agent: 'Caroline', expectedRevision: 0, cards: cards3, caption: 'x' });
  ok(r.status === 403 && r.body.code === 'CONTEUDO_PUBLICADO', 'publicado nao aceita rascunho', r.body);
  ok(!fs.existsSync(path.join(COPY_DIR, 'C-PUB.json')), 'nada gravado para publicado');
  r = await req('GET', base('C-PUB'));
  ok(r.status === 200 && r.body.published === true && r.body.editable === false, 'GET de publicado: editable=false (leitura permitida)');

  // ---- Comentários e gates
  console.log('--- Comentarios de revisao e gates ---');
  const pipeBefore = sha(TEST_PIPELINE);
  r = await req('POST', base('C-SRC') + '/comments', { agent: 'Editor', kind: 'parecer-editor', verdict: 'sem-ressalvas', text: 'Sem ressalvas editoriais.', target: { type: 'geral' } });
  ok(r.status === 201 && r.body.comment.isApproval === false && r.body.approved === false, 'parecer do Editor: isApproval=false', r.body);
  r = await req('POST', base('C-SRC') + '/comments', { agent: 'Editor', kind: 'solicitacao-ajuste', text: 'Encurtar.', target: { type: 'card', num: 1 }, version: 3 });
  ok(r.status === 201 && r.body.comment.target.num === 1 && r.body.comment.version === 3, 'comentario em card, versao 3');
  ok(r.body.comment.execution === 'pendente-nao-executada' && r.body.comment.isApproval === false, 'solicitacao-ajuste fica pendente-nao-executada');
  r = await req('POST', base('C-SRC') + '/comments', { agent: 'Editor', text: 'Card inexistente', target: { type: 'card', num: 9 } });
  ok(r.status === 422 && r.body.code === 'ALVO_INVALIDO', 'comentario em card inexistente 422');
  r = await req('POST', base('C-SRC') + '/comments', { agent: 'Creator', kind: 'parecer-editor', text: 'Fingindo ser editor.' });
  ok(r.status === 403, 'so o Editor registra parecer-editor');
  r = await req('POST', base('C-SRC') + '/comments', { agent: 'Editor', text: 'ok', status: 'pronto' });
  ok(r.status === 400, 'comentario com campo status rejeitado');
  r = await req('POST', base('C-SRC') + '/comments', { agent: 'Caroline', kind: 'comentario', verdict: 'sem-ressalvas', text: 'x' });
  ok(r.status === 400, 'verdict fora de parecer-editor rejeitado');
  r = await req('POST', base('C-SRC') + '/comments', { agent: 'Editor', text: '' });
  ok(r.status === 400, 'comentario vazio rejeitado');
  r = await req('GET', base('C-SRC') + '/comments');
  ok(r.status === 200 && r.body.comments.length === 2, 'lista 2 comentarios', r.body.comments && r.body.comments.length);
  r = await req('GET', base('C-SRC') + '/comments?version=3');
  ok(r.body.comments.length === 2, 'filtro por versao 3 (parecer usa a versao mais recente por padrao)');
  r = await req('GET', base('C-SRC') + '/comments?version=1');
  ok(r.body.comments.length === 0, 'filtro por versao 1 sem comentarios');
  r = await req('POST', base('C-PUB') + '/comments', { agent: 'Editor', text: 'Revisao retroativa', target: { type: 'geral' } });
  ok(r.status === 201, 'comentario em publicado permitido (nao sobrescreve copy)');
  r = await req('POST', base('C-SRC') + '/draft', { agent: 'Caroline', expectedRevision: 3, cards: cards3, caption: 'x', status: 'pronto' });
  ok(r.status === 400, 'rascunho com status=pronto rejeitado');
  r = await req('POST', base('C-SRC') + '/draft', { agent: 'Caroline', expectedRevision: 3, cards: cards3, caption: 'x', scientificPackageStatus: 'frozen' });
  ok(r.status === 400, 'rascunho tentando alterar pacote cientifico rejeitado');

  // Gate científico P2 intacto
  r = await req('POST', base('C-P2') + '/draft', { agent: 'Creator', expectedRevision: 0, cards: cards3, caption: 'x' });
  ok(r.status === 201 && r.body.gates.scientificGateOpen === true && r.body.gates.scientificPackageStatus === 'pending', 'P2 pending: salva, mas gate segue aberto');
  ok(r.body.warnings.some(w => /P2/.test(w)), 'aviso explicito sobre pacote P2 nao congelado');

  // Nenhum gate/pipeline alterado
  ok(sha(TEST_PIPELINE) === pipeBefore, 'pipeline de teste byte a byte inalterado por comentarios');
  const pipe = JSON.parse(fs.readFileSync(TEST_PIPELINE, 'utf-8'));
  const c = id => pipe.contents.find(x => x.id === id);
  ok(c('C-SRC').status === 'em-producao' && c('C-SRC').currentOwner === 'Editor' && c('C-SRC').revision === 3, 'status/owner/revision do pipeline intactos');
  ok(c('C-P2').scientificPackageStatus === 'pending', 'P2 continua pending no pipeline');
  ok(sha(SRC_ABS) === srcHash, 'fonte Markdown intacta ao final');

  // ---- Revisao por card
  console.log('--- Revisao por card (proposta x feedback) ---');
  const pipeRevBefore = sha(TEST_PIPELINE);
  r = await req('GET', base('C-REV'));
  ok(r.body.proposal && r.body.proposal.version === 0 && r.body.proposal.content.cards.length === 3, 'proposta identificada (versao 0, 3 cards)', r.body.proposal && r.body.proposal.version);
  ok(r.body.proposal.origin.agent === 'Creator' && r.body.proposal.producedAt === '2026-10-05T12:00:00.000Z', 'origem: agente e data vindos do handoff real');
  ok(r.body.editorial.status === 'em-producao' && r.body.clinical.humanClinicalApproval === 'sem-registro-no-dashboard', 'status editorial e aprovacao clinica sem inventar');
  r = await req('GET', base('C-EMPTY'));
  ok(r.body.proposal === null, 'sem fonte: proposta ausente (nao inventada)');
  r = await req('PUT', base('C-EMPTY') + '/review', { agent: 'Caroline', expectedRevision: 0, basedOnVersion: 0, items: {} });
  ok(r.status === 422 && r.body.code === 'SEM_PROPOSTA', 'revisar sem proposta: 422 SEM_PROPOSTA');

  r = await req('GET', base('C-REV') + '/review');
  ok(r.status === 200 && r.body.revision === 0 && Object.keys(r.body.items).length === 0 && r.body.proposalAvailable, 'feedback inicial vazio (nao pre-preenchido)');
  const rvBody = (rev, items, based = 0) => ({ agent: 'Caroline', expectedRevision: rev, basedOnVersion: based, items });
  r = await req('PUT', base('C-REV') + '/review', rvBody(0, { 'card:2': { suggestion: 'Card dois novo.', note: 'Mais direto.' }, legenda: { note: 'Encurtar.' }, 'card:1': { suggestion: '  ', note: '' } }));
  ok(r.status === 200 && r.body.saved === true && r.body.revision === 1 && r.body.approved === false && r.body.executed === false, 'salvar feedback 200, nao aprova nem executa', r.body);
  ok(Object.keys(r.body.items).join() === 'card:2,legenda', 'itens vazios descartados; card 2 e legenda mantidos', Object.keys(r.body.items));
  r = await req('GET', base('C-REV'));
  ok(r.body.proposal.version === 0 && r.body.versionsCount === 1 && r.body.proposal.content.cards[1].text.startsWith('Você acorda'), 'proposta original intacta; nenhuma versao nova criada');
  ok(sha(SRC_ABS) === srcHash, 'fonte Markdown intacta apos feedback');
  r = await req('PUT', base('C-REV') + '/review', rvBody(0, { 'card:2': { note: 'x' } }));
  ok(r.status === 409 && r.body.scope === 'review', 'conflito de revisao do feedback 409');
  r = await req('PUT', base('C-REV') + '/review', rvBody(1, { 'card:2': { suggestion: 'Card dois novo.', note: 'Mais direto.' }, legenda: { note: 'Encurtar.' } }));
  ok(r.status === 200 && r.body.unchanged === true && r.body.revision === 1, 'salvar feedback identico: unchanged');
  const bad = async (body, label, codes) => { const x = await req('PUT', base('C-REV') + '/review', body); ok(codes.includes(x.status), label, [x.status, x.body]); };
  await bad(rvBody(1, { 'card:9': { note: 'x' } }), 'card inexistente rejeitado', [400]);
  await bad(rvBody(1, { cta: { note: 5 } }), 'nota nao-string rejeitada', [400]);
  await bad(rvBody(1, { foo: { note: 'x' } }), 'alvo invalido rejeitado', [400]);
  await bad(rvBody(1, { 'card:1': { note: 'x'.repeat(2001) } }), 'nota longa rejeitada', [400]);
  await bad(Object.assign(rvBody(1, {}), { status: 'pronto' }), 'campo status rejeitado', [400]);
  await bad(Object.assign(rvBody(1, {}), { agent: 'Editor' }), 'so Caroline registra feedback humano', [403]);

  // persistencia apos reinicio
  await stopServer(); await startServer();
  r = await req('GET', base('C-REV') + '/review');
  ok(r.body.revision === 1 && r.body.items['card:2'].suggestion === 'Card dois novo.' && r.body.items.legenda.note === 'Encurtar.', 'feedback persistido apos reinicio');

  // enviar ajustes
  r = await req('POST', base('C-REV2') + '/review/submit', { agent: 'Caroline', expectedRevision: 0, basedOnVersion: 0 });
  ok(r.status === 422 && r.body.code === 'SEM_FEEDBACK', 'enviar sem feedback salvo: 422');
  r = await req('POST', base('C-REV') + '/review/submit', { agent: 'Caroline', expectedRevision: 0, basedOnVersion: 0 });
  ok(r.status === 409, 'enviar com revisao de feedback desatualizada: 409');
  r = await req('POST', base('C-REV') + '/review/submit', { agent: 'Caroline', expectedRevision: 1, basedOnVersion: 0, generalNote: 'Tom mais acolhedor.' });
  ok(r.status === 201 && r.body.request.status === 'pendente-nao-executada' && r.body.executed === false && r.body.request.handoff === null && r.body.approved === false, 'solicitacao registrada PENDENTE / nao executada / sem handoff', r.body);
  ok(r.body.request && r.body.request.items.map(i => i.label).join() === 'Card 2,Legenda', 'consolidado por card e legenda, na ordem');
  ok(r.body.request && r.body.request.items[0].proposalText.startsWith('Você acorda') && r.body.request.items[0].suggestion === 'Card dois novo.' && r.body.request.items[1].note === 'Encurtar.', 'localizacao preservada (texto proposto + sugestao + motivo)');
  r = await req('POST', base('C-REV') + '/review/submit', { agent: 'Caroline', expectedRevision: 1, basedOnVersion: 0 });
  ok(r.status === 409 && r.body.code === 'JA_ENVIADA', 'reenvio do mesmo feedback bloqueado');
  r = await req('GET', base('C-REV') + '/requests');
  ok(r.status === 200 && r.body.requests.length === 1 && r.body.requests[0].id === 'r1', 'solicitacao rastreavel via GET /requests');
  ok(sha(TEST_PIPELINE) === pipeRevBefore, 'pipeline intacto: sem handoff, sem mudanca de status/gate');

  // rascunho humano nao vira proposta; retorno de agente vira nova proposta
  r = await req('POST', base('C-REV') + '/draft', { agent: 'Caroline', expectedRevision: 0, cards: [{ text: 'Rascunho humano.' }], caption: 'h' });
  ok(r.status === 201, 'rascunho humano salvo (v1)', r.body);
  r = await req('GET', base('C-REV'));
  ok(r.body.proposal.version === 0 && r.body.version === 1, 'rascunho humano NAO vira proposta (proposta segue v0)');
  r = await req('POST', base('C-REV') + '/draft', { agent: 'Creator', expectedRevision: 1, cards: [{ text: 'Card um revisado.' }, { text: 'Card dois novo e direto.' }, { text: 'Card tres.' }], caption: 'Legenda mais curta.', note: 'Ajustes da Caroline aplicados' });
  ok(r.status === 201 && r.body.proposal.version === 2 && r.body.proposal.origin.agent === 'Creator', 'retorno do agente vira nova proposta (v2)', r.body.proposal && r.body.proposal.version);
  r = await req('GET', base('C-REV') + '/review');
  ok(r.body.stale === true && r.body.basedOnVersion === 0 && r.body.proposalVersion === 2, 'feedback antigo marcado como desatualizado (stale)');
  r = await req('PUT', base('C-REV') + '/review', rvBody(1, { 'card:1': { note: 'ok' } }, 0));
  ok(r.status === 409 && r.body.code === 'PROPOSTA_MUDOU', 'salvar feedback sobre proposta antiga: 409 PROPOSTA_MUDOU');
  r = await req('PUT', base('C-REV') + '/review', rvBody(1, { 'card:1': { note: 'Nova rodada.' } }, 2));
  ok(r.status === 200 && r.body.basedOnVersion === 2 && r.body.stale === false && r.body.revision === 2, 'nova rodada de feedback sobre a v2');
  r = await req('GET', base('C-REV') + '/requests');
  ok(r.body.requests.length === 1 && r.body.requests[0].basedOnVersion === 0, 'solicitacao anterior preservada');
  r = await req('GET', base('C-REV') + '/diff?from=0&to=2');
  ok(r.status === 200 && r.body.summary.changedUnits > 0, 'comparacao proposta anterior x nova disponivel');

  // publicado
  r = await req('PUT', base('C-PUB') + '/review', rvBody(0, { 'card:1': { note: 'x' } }));
  ok(r.status === 403 && r.body.code === 'CONTEUDO_PUBLICADO', 'publicado: feedback bloqueado');
  r = await req('POST', base('C-PUB') + '/review/submit', { agent: 'Caroline', expectedRevision: 0, basedOnVersion: 0 });
  ok(r.status === 403 && r.body.code === 'CONTEUDO_PUBLICADO', 'publicado: envio de ajustes bloqueado');
  // gate P2
  r = await req('POST', base('C-P2') + '/draft', { agent: 'Creator', expectedRevision: 1, cards: cards3, caption: 'y' });
  r = await req('PUT', base('C-P2') + '/review', rvBody(0, { 'card:1': { note: 'x' } }, 2));
  ok(r.status === 200, 'P2 pending: feedback salvo sem alterar gate', r.body);
  ok(sha(TEST_PIPELINE) === pipeRevBefore, 'pipeline byte a byte intacto ao fim da revisao (P2 pending preservado)');

  // ---- Dados reais
  console.log('--- Isolamento ---');
  ok(sha(REAL_PIPELINE) === realHash, 'pipeline.json real intacto');
  ok(fs.existsSync(REAL_COPY_DIR) === realCopyExisted, 'diretorio de copy real nao foi criado/alterado');

  console.log(results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed\n`);
  return failed;
}
let x;

async function main() {
  fs.mkdirSync(FIXT_DIR, { recursive: true });
  fs.writeFileSync(SRC_ABS, FIXTURE_MD);
  seed();
  await startServer();
  let code = 1;
  try { code = await run(); }
  finally {
    await stopServer();
    for (const f of [TEST_PIPELINE, TEST_PIPELINE.replace(/\.json$/, '.backup.json'), TEST_PIPELINE.replace(/\.json$/, '.pre-handoff.json')]) { try { fs.unlinkSync(f); } catch {} }
    fs.rmSync(FIXT_DIR, { recursive: true, force: true });
  }
  process.exit(code > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
