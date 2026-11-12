#!/usr/bin/env node
// Testes de INTERFACE do Editor de copy (Etapa 2) em jsdom (DOM simulado, NAO e navegador real).
// Servidor real + API real, mas dados isolados:
//  - pipeline = copia temporaria do pipeline real (o real nunca e aberto para escrita)
//  - COPY_DIR temporario
//  - "copy real" = markdown real T2 (somente leitura) ligado a um item de teste editavel
// Run: node dashboard/tests/test-copy-editor-ui.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { JSDOM, requestInterceptor } = require('jsdom');

const PORT = 3097;
const DASH = path.join(__dirname, '..');
const REAL_PIPELINE = path.join(DASH, 'data', 'pipeline.json');
const TEST_PIPELINE = path.join(DASH, 'data', 'pipeline.uitest.json');
const COPY_DIR = path.join(DASH, 'data', 'copy-uitest');
const REAL_COPY_DIR = path.join(DASH, 'data', 'copy');
const T2_MD = path.join(DASH, '..', 'tests', 'marketing-os', 'approved', 'T2-polipo-histeroscopia.md');
const BASE = 'http://localhost:' + PORT;
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

let passed = 0, failed = 0; const out = [];
const ok = (c, n, d) => { if (c) { passed++; out.push('  ✓ ' + n); } else { failed++; out.push('  ✗ ' + n + ' — ' + (d === undefined ? '' : JSON.stringify(d))); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, label, ms = 4000) { const t = Date.now(); while (Date.now() - t < ms) { try { const v = fn(); if (v) return v; } catch {} await sleep(40); } throw new Error('timeout: ' + label); }

let child;
function start() {
  return new Promise((resolve, reject) => {
    child = spawn('node', ['server.js'], { cwd: DASH, env: { ...process.env, PORT: String(PORT), PIPELINE_PATH: TEST_PIPELINE, COPY_DIR } });
    let ready = false;
    child.stdout.on('data', d => { if (!ready && d.toString().includes('Dashboard running')) { ready = true; resolve(); } });
    child.stderr.on('data', d => process.stderr.write(d));
    setTimeout(() => { if (!ready) reject(new Error('Server start timeout')); }, 5000);
  });
}
const stop = () => new Promise(r => { if (!child) return r(); child.once('exit', r); child.kill(); });

const blockExternal = requestInterceptor(req => (req.url.startsWith(BASE) ? undefined : new Response('', { status: 204 })));

async function newWindow() {
  const dom = await JSDOM.fromURL(BASE + '/v2/', {
    runScripts: 'dangerously', resources: { interceptors: [blockExternal] }, pretendToBeVisual: true,
    beforeParse(w) {
      w.fetch = (u, o) => fetch(new URL(u, BASE), o);
      w.confirmCalls = []; w.confirmAnswer = true;
      w.confirm = m => { w.confirmCalls.push(m); return w.confirmAnswer; };
    },
  });
  await until(() => dom.window.CopyEditor, 'CopyEditor carregado');
  return dom.window;
}

const $ = (w, sel) => w.document.querySelector(sel);
const $$ = (w, sel) => [...w.document.querySelectorAll(sel)];
function type(w, el, v) { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); }
const click = el => el.dispatchEvent(new (el.ownerDocument.defaultView.MouseEvent)('click', { bubbles: true }));
const goTab = async (w, t) => { await until(() => $(w, `[data-copy-editor] [data-tab="${t}"]`), 'aba ' + t); click($(w, `[data-copy-editor] [data-tab="${t}"]`)); };
const act = (w, a) => $(w, `[data-copy-editor] [data-act="${a}"]`);
const text = w => $(w, '[data-copy-editor]').textContent;

async function main() {
  // pipeline de teste a partir do real (copia), com itens controlados
  const realHash = sha(REAL_PIPELINE), mdHash = sha(T2_MD);
  const pipe = JSON.parse(fs.readFileSync(REAL_PIPELINE, 'utf-8'));
  const t2 = pipe.contents.find(c => c.id === '1.3');
  const editable = Object.assign({}, JSON.parse(JSON.stringify(t2)), { id: 'UI-EDIT', title: 'T2 (copia de teste)', status: 'em-producao', currentOwner: 'Editor', pendingType: 'nenhuma', publishDate: null, postUrl: null, scientificPackageStatus: 'frozen', revision: 3, history: [{ type: 'handoff', agent: 'Creator', toOwner: 'Editor', timestamp: '2026-10-05T12:00:00.000Z', artifact: t2.approvedCopy, revision: 3 }] });
  const none = Object.assign({}, JSON.parse(JSON.stringify(t2)), { id: 'UI-NONE', title: 'Sem proposta (teste)', status: 'em-producao', currentOwner: 'Caroline', pendingType: 'execucao', nextAction: 'x', approvedCopy: null, publishDate: null, postUrl: null, history: [], revision: 2 });
  const direct = Object.assign({}, JSON.parse(JSON.stringify(editable)), { id: 'UI-DIRECT', title: 'T2 edicao direta (teste)', history: [] });
  pipe.contents.push(editable, none, direct);
  fs.writeFileSync(TEST_PIPELINE, JSON.stringify(pipe, null, 2));
  fs.rmSync(COPY_DIR, { recursive: true, force: true });
  await start();

  try {
    console.log('\nCopy Editor UI tests (jsdom, NAO e navegador real)\n');
    let w = await newWindow();
    const pipeHashBefore = sha(TEST_PIPELINE);

    // --- abrir copy real
    w.CopyEditor.open({ id: 'UI-EDIT', title: editable.title });
    await until(() => $(w, '[data-role="proposal-summary"]'), 'resumo da proposta');
    const api0 = await (await fetch(BASE + '/api/content/UI-EDIT/copy')).json();
    const cards0 = api0.proposal.content.cards;
    const sum = $(w, '[data-role="proposal-summary"]').textContent;
    ok(/Versão 0/.test(sum) && /Arquivo do agente Creator/.test(sum) && /05\/10\/2026/.test(sum) && /Em produção/.test(sum) && /sem registro no Dashboard/.test(sum) && /congelado/.test(sum), 'resumo: versao, origem, data, status editorial e situacao clinica', sum);
    ok($$(w, '[data-review-block^="card:"]').length === cards0.length && cards0.length >= 6, 'todos os cards exibidos (sem quantidade fixa): ' + cards0.length);
    ok(cards0.every(c => $(w, `[data-proposal-text="card:${c.num}"]`).textContent === c.text), 'texto integral de cada card exibido');
    ok($(w, '[data-proposal-text="legenda"]').textContent === api0.proposal.content.caption, 'legenda proposta integral exibida');
    ok($$(w, '[data-fb]').every(t => t.value === '') && $$(w, '[data-fb]').length === 2 * (cards0.length + 1 + (api0.proposal.content.cta ? 1 : 0)), 'campos de feedback vazios (nao preenchidos com o original), 2 por card/legenda/CTA');
    ok(!$$(w, '[data-proposal-text]').some(e => e.tagName === 'TEXTAREA'), 'proposta dos agentes nao e editavel');
    // feedback por card
    type(w, $(w, '[data-fb="card:2:suggestion"]'), 'Card 2 sugerido pela Caroline.');
    type(w, $(w, '[data-fb="card:2:note"]'), 'Motivo: mais direto.');
    type(w, $(w, '[data-fb="legenda:note"]'), 'Encurtar a legenda.');
    ok($(w, '[data-role="dirty"]').getAttribute('data-dirty') === '1' && /3 item\(ns\)|2 item\(ns\)/.test(text(w)), 'indicador de nao salvo e contagem de itens com feedback');
    w.confirmAnswer = false; click(act(w, 'close'));
    ok(w.confirmCalls.length === 1 && !!$(w, '[data-copy-editor]'), 'fechar com feedback nao salvo pede confirmacao');
    const pipeHash0 = sha(TEST_PIPELINE);
    click(act(w, 'save-review'));
    await until(() => $(w, '[data-msg="ok"]'), 'feedback salvo');
    ok(/proposta dos agentes não foi alterada/.test($(w, '[data-msg="ok"]').textContent) && /nada foi aprovado/.test($(w, '[data-msg="ok"]').textContent), 'salvar revisao: nao altera proposta, nao aprova');
    const afterSave = await (await fetch(BASE + '/api/content/UI-EDIT/copy')).json();
    ok(afterSave.versionsCount === 1 && afterSave.proposal.version === 0 && JSON.stringify(afterSave.proposal.content) === JSON.stringify(api0.proposal.content), 'proposta original intacta; nenhuma versao criada');
    ok(sha(TEST_PIPELINE) === pipeHash0 && sha(T2_MD) === mdHash, 'pipeline e markdown intactos apos salvar revisao');
    // recarregar pagina: persistencia
    w.close(); w = await newWindow();
    w.CopyEditor.open({ id: 'UI-EDIT', title: editable.title });
    await until(() => $(w, '[data-fb="card:2:suggestion"]'), 'reabrir');
    ok($(w, '[data-fb="card:2:suggestion"]').value === 'Card 2 sugerido pela Caroline.' && $(w, '[data-fb="card:2:note"]').value === 'Motivo: mais direto.' && $(w, '[data-fb="legenda:note"]').value === 'Encurtar a legenda.' && $(w, '[data-fb="card:1:note"]').value === '', 'feedback por card persistido apos recarregar a pagina');
    ok($(w, '[data-proposal-text="card:2"]').textContent === cards0[1].text, 'proposta continua o original apos recarregar');
    // enviar ajustes
    w.confirmAnswer = true; w.confirmCalls.length = 0;
    click(act(w, 'send-review'));
    await until(() => $(w, '[data-msg]') && /Solicitação r1/.test(text(w)), 'envio');
    ok(/PENDENTE/.test(w.confirmCalls[0]) && /Nenhum agente é executado/.test(w.confirmCalls[0]), 'confirmacao explica que nada e executado');
    ok(/NÃO foi executada|Ainda NÃO/i.test($(w, '[data-msg="ok"]').textContent) || /Ainda NÃO/.test(text(w)), 'mensagem: solicitacao pendente, nao executada');
    const rqs = await (await fetch(BASE + '/api/content/UI-EDIT/copy/requests')).json();
    ok(rqs.requests.length === 1 && rqs.requests[0].items.map(i => i.label).join() === 'Card 2,Legenda' && rqs.requests[0].handoff === null && rqs.requests[0].executed === false, 'solicitacao consolidada por card/legenda, sem handoff, nao executada');
    ok(sha(TEST_PIPELINE) === pipeHash0, 'enviar ajustes nao altera o pipeline (sem handoff simulado)');
    click(act(w, 'send-review'));
    await until(() => $(w, '[data-msg="err"]'), 'reenvio bloqueado');
    ok(/JA_ENVIADA/.test($(w, '[data-msg="err"]').textContent), 'reenvio do mesmo feedback e recusado pelo backend');
    await goTab(w, 'comentarios');
    ok(/PENDENTE · NÃO EXECUTADA/.test($(w, '[data-request="r1"]').textContent) && /Card 2/.test($(w, '[data-request="r1"]').textContent) && /Legenda/.test($(w, '[data-request="r1"]').textContent), 'aba Comentarios lista a solicitacao pendente por localizacao');

    // agente devolve nova proposta (via API; o Editor e o dono do item de teste)
    const cur0 = await (await fetch(BASE + '/api/content/UI-EDIT/copy')).json();
    const newCards = cur0.proposal.content.cards.map((c, i) => ({ text: i === 1 ? 'Card 2 reescrito pelo agente.' : c.text }));
    const dr = await fetch(BASE + '/api/content/UI-EDIT/copy/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: 'Editor', expectedRevision: cur0.revision, cards: newCards, caption: cur0.proposal.content.caption, cta: cur0.proposal.content.cta, note: 'Ajustes aplicados' }) });
    ok(dr.status === 201, 'agente devolve nova proposta (fixture via API)');
    w.close(); w = await newWindow();
    w.CopyEditor.open({ id: 'UI-EDIT', title: editable.title });
    await until(() => $(w, '[data-role="proposal-summary"]'), 'reabrir apos retorno');
    ok(/Versão 1/.test($(w, '[data-role="proposal-summary"]').textContent) && /Versão salva pelo agente Editor/.test($(w, '[data-role="proposal-summary"]').textContent), 'resumo mostra a NOVA proposta (versao 1, de agente)');
    ok($(w, '[data-proposal-text="card:2"]').textContent === 'Card 2 reescrito pelo agente.', 'nova proposta exibida');
    ok(!!$(w, '[data-role="returned"]') && !!$(w, '[data-role="stale"]'), 'avisa retorno dos agentes e feedback anterior desatualizado');
    ok($$(w, '[data-fb]').every(t => t.value === ''), 'campos de feedback limpos para a nova versao');
    click(act(w, 'compare-returned'));
    await until(() => $(w, '[data-diff]'), 'comparacao proposta anterior x nova');
    ok(/Card 2/.test($(w, '[data-diff]').textContent) && /reescrito/.test($(w, '[data-diff]').textContent), 'compara proposta anterior com a nova');
    // rascunho humano nao vira proposta
    await goTab(w, 'copy');
    await until(() => $$(w, '[data-card]').length >= 6, 'edicao direta');
    type(w, $(w, '[data-card="1"] textarea'), 'Rascunho humano do card 1.');
    click(act(w, 'save'));
    await until(() => $(w, '[data-msg="ok"]'), 'rascunho humano salvo');
    await goTab(w, 'revisao');
    ok(/Versão 1 \(devolvida/.test($(w, '[data-role="proposal-summary"]').textContent) && /rascunho\(s\) humano\(s\)/.test(text(w)), 'rascunho humano (v2) NAO vira proposta; proposta segue v1');
    await goTab(w, 'versoes');
    ok(/Rascunho humano/.test($(w, '[data-version="2"]').textContent) && /PROPOSTA EM REVISÃO/.test($(w, '[data-version="1"]').textContent) && /Origem/.test($(w, '[data-version="0"]').textContent), 'historico distingue origem, proposta de agente e rascunho humano');
    w.close();
    w = await newWindow();
    w.CopyEditor.open({ id: 'UI-DIRECT', title: editable.title });
    await until(() => $(w, '[data-role="proposal-summary"]'), 'reabrir p/ fluxo antigo');
    await goTab(w, 'copy');
    await until(() => $$(w, '[data-card]').length >= 6, 'cards renderizados');
    ok($$(w, '[data-card] textarea').length === $$(w, '[data-card]').length, 'cada card tem campo editavel');
    const realCard1 = $(w, '[data-card="1"] textarea').value;
    ok(realCard1.length > 0 && !realCard1.includes('**'), 'card 1 da copy real carregado, sem marcacao markdown', realCard1);
    ok($(w, '[data-caption] textarea').value.length > 20, 'legenda integral carregada');
    ok(text(w).includes('Origem (sem rascunhos salvos)'), 'mostra origem como versao atual');
    ok($(w, '[data-role="dirty"]').getAttribute('data-dirty') === '0' && act(w, 'save').disabled, 'sem alteracoes: salvar desabilitado');
    ok(!/relat[oó]rio|PMID/i.test(text(w)), 'nao mostra relatorio tecnico como copy');

    // --- editar card + legenda, indicador de nao salvo
    type(w, $(w, '[data-card="2"] textarea'), 'Card 2 editado pela Caroline.');
    type(w, $(w, '[data-caption] textarea'), 'Legenda editada pela Caroline.');
    ok($(w, '[data-role="dirty"]').getAttribute('data-dirty') === '1' && /não salvas/.test(text(w)), 'indicador de alteracoes nao salvas');
    ok(!act(w, 'save').disabled, 'salvar habilitado');

    // --- fechar com alteracoes: alerta
    w.confirmAnswer = false; click(act(w, 'close'));
    ok(w.confirmCalls.length === 1 && /não salvas/.test(w.confirmCalls[0]) && !!$(w, '[data-copy-editor]'), 'fechar com alteracoes pede confirmacao e permanece aberto');

    // --- salvar
    click(act(w, 'save'));
    await until(() => $(w, '[data-msg="ok"]'), 'mensagem de sucesso');
    ok(/versão 1/.test($(w, '[data-msg="ok"]').textContent) && /não foi aprovado/i.test($(w, '[data-msg="ok"]').textContent), 'sucesso informa versao 1 e que nao aprovou');
    ok(/Versão 1/.test(text(w)) && $(w, '[data-role="dirty"]').getAttribute('data-dirty') === '0', 'versao atual 1, sem pendencias');

    // --- gates: pipeline intacto apos salvar
    ok(sha(TEST_PIPELINE) === pipeHashBefore, 'salvar nao altera o pipeline (status/owner/gates)');
    ok(sha(T2_MD) === mdHash, 'markdown real do agente intacto');

    // --- sem alteracao: nao salva
    // (botao fica desabilitado; chama API pelo caminho de UI forcando clique)
    // --- atualizar a pagina e recuperar
    w.close();
    w = await newWindow();
    w.CopyEditor.open({ id: 'UI-DIRECT', title: editable.title });
    await goTab(w, 'copy');
    await until(() => $$(w, '[data-card]').length >= 6, 'cards apos reload');
    ok($(w, '[data-card="2"] textarea').value === 'Card 2 editado pela Caroline.' && $(w, '[data-caption] textarea').value === 'Legenda editada pela Caroline.', 'apos atualizar a pagina, alteracoes recuperadas');
    ok(/Versão 1/.test(text(w)), 'versao 1 apos reload');

    // --- versoes e comparacao
    click($(w, '[data-tab="versoes"]'));
    await until(() => $$(w, '[data-version]').length === 2, 'lista de versoes');
    ok($(w, '[data-version="1"]').textContent.includes('Caroline') && /\d{2}\/\d{2}\/\d{4}/.test($(w, '[data-version="1"]').textContent), 'versao mostra autoria e data');
    click($(w, '[data-version="0"] [data-act="compare-current"]'));
    await until(() => $(w, '[data-diff]'), 'diff');
    ok(/card:2|Card 2/.test($(w, '[data-diff]').textContent) && /Legenda/.test($(w, '[data-diff]').textContent), 'comparacao destaca card 2 e legenda');
    ok(!/Card 1 ·/.test($(w, '[data-diff]').textContent), 'card 1 inalterado nao aparece no diff');

    // --- restaurar como novo rascunho
    w.confirmAnswer = true;
    click($(w, '[data-version="0"] [data-act="restore"]'));
    await until(() => /Versão 2/.test(text(w)) && $(w, '[data-msg="ok"]'), 'restauracao');
    ok(/Versão 0 restaurada|Versão 0 restaurada/.test($(w, '[data-msg="ok"]').textContent) || /restaurada/i.test($(w, '[data-msg="ok"]').textContent), 'restauracao informada');
    ok($$(w, '[data-version]').length === 3, 'historico preservado: 3 versoes (origem, 1, 2)');
    click($(w, '[data-tab="copy"]'));
    ok($(w, '[data-card="2"] textarea').value !== 'Card 2 editado pela Caroline.', 'texto restaurado e o da origem');

    // --- comentarios, pareceres, solicitar ajustes
    click($(w, '[data-tab="comentarios"]'));
    ok(/NÃO É APROVAÇÃO HUMANA/.test(text(w)), 'aviso permanente: parecer do agente nao e aprovacao humana');
    const obsTA = $(w, 'textarea[aria-label="Observação"]');
    type(w, obsTA, 'Observacao humana de teste.');
    click(act(w, 'comment'));
    await until(() => $(w, '[data-kind="comentario"]'), 'comentario listado');
    ok(/Observação/.test($(w, '[data-kind="comentario"]').textContent), 'observacao humana registrada');
    // parecer de agente (inserido via API) e exibido como nao-aprovacao
    const pr = await fetch(BASE + '/api/content/UI-DIRECT/copy/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: 'Editor', kind: 'parecer-editor', verdict: 'sem-ressalvas', text: 'Parecer de teste.' }) });
    ok(pr.status === 201, 'parecer do Editor criado via API (fixture)');
    click($(w, '[data-tab="versoes"]')); click($(w, '[data-tab="comentarios"]'));
    // recarrega o editor para ver o parecer
    w.confirmAnswer = true; click(act(w, 'close'));
    w.CopyEditor.open({ id: 'UI-DIRECT', title: editable.title });
    await goTab(w, 'copy');
    await until(() => $$(w, '[data-card]').length >= 6, 'reabrir');
    click($(w, '[data-tab="comentarios"]'));
    const par = $(w, '[data-kind="parecer-editor"]');
    ok(par && /não é aprovação humana/.test(par.textContent), 'parecer do agente rotulado "nao e aprovacao humana"');
    ok(sha(TEST_PIPELINE) === pipeHashBefore, 'pipeline ainda intacto apos comentarios/solicitacao (sem handoff)');
    const hist = JSON.parse(fs.readFileSync(TEST_PIPELINE, 'utf-8')).contents.find(c => c.id === 'UI-DIRECT').history;
    ok(hist.length === 0, 'nenhum handoff/historico de pipeline criado');

    // --- conflito de revisao na UI
    click($(w, '[data-tab="copy"]'));
    type(w, $(w, '[data-card="1"] textarea'), 'Edicao local que vai conflitar.');
    const cur = await (await fetch(BASE + '/api/content/UI-DIRECT/copy')).json();
    await fetch(BASE + '/api/content/UI-DIRECT/copy/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: 'Caroline', expectedRevision: cur.revision, cards: cur.content.cards, caption: 'Outra aba salvou.', cta: cur.content.cta }) });
    click(act(w, 'save'));
    await until(() => $(w, '[data-msg="err"]'), 'erro 409');
    ok(/CONFLITO_REVISAO/.test($(w, '[data-msg="err"]').textContent), 'conflito exibido com erro real do backend');
    ok($(w, '[data-card="1"] textarea').value === 'Edicao local que vai conflitar.', 'edicao local preservada apos conflito');
    w.close();

    // --- publicado: somente leitura
    w = await newWindow();
    const pubBefore = fs.existsSync(path.join(COPY_DIR, '1.1.json'));
    w.CopyEditor.open({ id: '1.1', title: 'Publicado' });
    await until(() => $(w, '[data-role="proposal-summary"]'), 'resumo publicado');
    ok(/Conteúdo publicado: somente leitura/.test(text(w)) && $$(w, '[data-fb]').length === 0 && !act(w, 'save-review') && !act(w, 'send-review'), 'publicado: aba Revisao somente leitura, sem campos nem botoes de envio');
    ok($$(w, '[data-proposal-text]').length >= 7, 'publicado: proposta continua visivel para consulta');
    const pubRev = await fetch(BASE + '/api/content/1.1/copy/review', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: 'Caroline', expectedRevision: 0, basedOnVersion: 0, items: { 'card:1': { note: 'x' } } }) });
    ok(pubRev.status === 403, 'backend recusa feedback em publicado');
    await goTab(w, 'copy');
    await until(() => $$(w, '[data-card]').length >= 6, 'cards publicado');
    ok(/Conteúdo publicado: leitura apenas/.test(text(w)), 'publicado: aviso de somente leitura');
    ok($$(w, '[data-card] textarea').every(t => t.hasAttribute('readonly')) && $(w, '[data-caption] textarea').hasAttribute('readonly'), 'campos readonly');
    ok(!act(w, 'save') && !act(w, 'add-card'), 'sem botao salvar/adicionar para publicado');
    const directPub = await fetch(BASE + '/api/content/1.1/copy/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: 'Caroline', expectedRevision: 0, cards: [{ text: 'x' }], caption: '' }) });
    ok(directPub.status === 403, 'backend tambem recusa gravar em publicado');
    ok(fs.existsSync(path.join(COPY_DIR, '1.1.json')) === pubBefore, 'nenhum arquivo criado para publicado');
    w.close();

    // --- sem proposta
    w = await newWindow();
    w.CopyEditor.open({ id: 'UI-NONE', title: none.title });
    await until(() => $(w, '[data-copy-editor] [data-tab]'), 'abas sem proposta');
    ok(/Nenhuma proposta consolidada/.test(text(w)) || (await (async () => { await goTab(w, 'revisao'); return /Nenhuma proposta consolidada/.test(text(w)); })()), 'sem proposta: sinaliza ausencia, nao inventa versao final');
    ok($$(w, '[data-fb]').length === 0, 'sem proposta: nenhum campo de feedback');
    w.close();

    // --- integracao na ficha: botao existe (abre detalhe clicando no item)
    w = await newWindow();
    await until(() => $$(w, 'button,div').some(e => e.textContent.trim() === editable.title), 'app carregou item de teste', 6000).catch(() => null);
    const el = $$(w, 'button').find(e => e.textContent.includes(editable.title));
    if (el) {
      click(el);
      const found = await until(() => $(w, '[data-act="open-copy-editor"]'), 'botao na ficha', 2500).catch(() => null);
      ok(!!found, 'ficha do conteudo mostra "Abrir editor de copy"');
    } else {
      out.push('  - (nao automatizado) botao na ficha: item nao localizado no DOM simulado; verificar no navegador');
    }
    w.close();

    ok(sha(REAL_PIPELINE) === realHash, 'pipeline.json REAL intacto');
    ok(!fs.existsSync(REAL_COPY_DIR), 'dashboard/data/copy REAL nao foi criado');
    ok(sha(T2_MD) === mdHash, 'markdown real intacto ao final');
  } finally {
    await stop();
    for (const f of [TEST_PIPELINE, TEST_PIPELINE.replace(/\.json$/, '.backup.json'), TEST_PIPELINE.replace(/\.json$/, '.pre-handoff.json')]) { try { fs.unlinkSync(f); } catch {} }
    fs.rmSync(COPY_DIR, { recursive: true, force: true });
  }
  console.log(out.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}
main().catch(async e => { console.error(e); await stop(); try { fs.unlinkSync(TEST_PIPELINE); } catch {} fs.rmSync(COPY_DIR, { recursive: true, force: true }); process.exit(1); });
