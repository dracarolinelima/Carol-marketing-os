// Marketing OS Dashboard v2 — Editor de copy (Etapa 2)
// Usa a API /api/content/:id/copy* (copy-store.js). Nao grava no pipeline,
// nao dispara handoff, nao aprova nada. Salvar = novo rascunho versionado.

(function () {
  'use strict';

  const AUTHOR = 'Caroline';
  const KIND_LABEL = { comentario: 'Observação', 'solicitacao-ajuste': 'Solicitação de ajustes', 'parecer-editor': 'Parecer do agente (Editor)' };
  const VERDICT_LABEL = { 'sem-ressalvas': 'sem ressalvas editoriais', 'ajustes-necessarios': 'ajustes necessários', devolver: 'recomenda devolver' };

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'style' && typeof v === 'object') { Object.assign(el.style, v); continue; }
        if (k.startsWith('on')) { el.addEventListener(k.slice(2).toLowerCase(), v); continue; }
        if (k === 'className') { el.className = v; continue; }
        if (k === 'value') { el.value = v; continue; }
        el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      if (Array.isArray(c)) { c.forEach(x => x && el.appendChild(x)); continue; }
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    return el;
  }
  const div = (s, ...ch) => h('div', { style: s }, ...ch);
  const span = (s, ...ch) => h('span', { style: s }, ...ch);
  const btn = (cls, s, attrs, ...ch) => h('button', Object.assign({ className: cls, style: s, type: 'button' }, attrs), ...ch);

  const LABEL = { fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: '700', color: '#CDBDF8' };
  const TA = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', background: '#1D1620', color: '#F2EDF0', fontSize: '14.5px', lineHeight: '1.7', fontFamily: 'inherit', resize: 'vertical', minHeight: '90px' };
  const INP = { height: '36px', boxSizing: 'border-box', padding: '0 10px', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', background: '#1D1620', color: '#F2EDF0', fontSize: '12.5px', width: '100%', fontFamily: 'inherit' };
  const B_PRIMARY = { minHeight: '40px', padding: '0 18px', border: '0', borderRadius: '8px', background: '#6F52D1', color: '#FFFFFF', fontSize: '13px', fontWeight: '600' };
  const B_SECOND = { minHeight: '40px', padding: '0 16px', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', background: 'rgba(255,255,255,.06)', color: '#F2EDF0', fontSize: '13px', fontWeight: '500' };
  const B_SMALL = { minHeight: '30px', padding: '0 10px', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', background: 'rgba(255,255,255,.04)', color: '#CFC6D1', fontSize: '12px' };

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  }

  async function api(method, url, body) {
    const opts = { method, headers: {} };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const res = await fetch(url, opts);
    let data = null;
    try { data = await res.json(); } catch { /* corpo vazio */ }
    return { ok: res.ok, status: res.status, data: data || {} };
  }
  const errText = r => {
    const d = r.data || {};
    const list = Array.isArray(d.errors) && d.errors.length ? ' ' + d.errors.join(' ') : '';
    return (d.message || ('Erro ' + r.status)) + list + ' [' + (d.code || r.status) + ']';
  };

  function open(opts) {
    const id = opts.id;
    const base = '/api/content/' + encodeURIComponent(id) + '/copy';
    const S = {
      tab: 'copy',
      loading: true, loadError: null,
      view: null,          // GET /copy
      draft: null,         // {cards:[{label,text}], caption, cta, note}
      msg: null,           // {type:'ok'|'err'|'info', text}
      versions: [], versionView: null, diff: null, diffFrom: null, diffTo: null,
      comments: [], busy: false,
      review: null,        // GET /review (servidor)
      rev: {},             // feedback local: {'card:1': {suggestion, note}, legenda, cta}
      requests: [],        // solicitacoes enviadas (pendentes)
      returned: null,      // diff opcional proposta anterior x nova
    };
    const STATUS = { backlog: 'Backlog', selecionado: 'Selecionado', 'em-desenvolvimento': 'Em desenvolvimento', 'em-producao': 'Em produção', revisao: 'Revisão', pronto: 'Pronto', publicado: 'Publicado', arquivado: 'Arquivado' };

    const root = h('div', { 'data-copy-editor': id, style: { position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', zIndex: '100', background: '#110C13', display: 'flex', flexDirection: 'column', overflow: 'hidden' } });
    document.body.appendChild(root);

    const beforeUnload = e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload);

    // ---------- estado derivado ----------
    function toDraft(content) {
      return {
        cards: (content.cards || []).map(c => ({ label: c.label || null, text: c.text })),
        caption: content.caption || '',
        cta: content.cta == null ? null : content.cta,
        note: '',
      };
    }
    function snapshot(d) {
      return JSON.stringify({ c: d.cards.map(c => c.text.trim()), l: d.caption.trim(), t: d.cta == null ? null : (d.cta.trim() || null) });
    }
    let baseline = null, revBaseline = '{}';
    function draftDirty() { return !!(S.draft && baseline !== null && snapshot(S.draft) !== baseline); }
    function normRev(items) {
      const o = {};
      Object.keys(items).sort().forEach(k => {
        const sug = (items[k].suggestion || '').trim(), note = (items[k].note || '').trim();
        if (sug || note) o[k] = { suggestion: sug || null, note: note || null };
      });
      return o;
    }
    function reviewDirty() { return JSON.stringify(normRev(S.rev)) !== revBaseline; }
    function isDirty() { return draftDirty() || reviewDirty(); }
    function tabDirty() { return S.tab === 'revisao' ? reviewDirty() : draftDirty(); }
    function proposal() { return S.view && S.view.proposal; }
    function editable() { return !!(S.view && S.view.editable); }

    function close() {
      if (isDirty() && !window.confirm('Há alterações não salvas. Descartar e fechar o editor?')) return;
      window.removeEventListener('beforeunload', beforeUnload);
      root.remove();
    }

    // ---------- carregamento ----------
    async function load(keepTab) {
      S.loading = true; S.loadError = null; render();
      try {
        const [v, vs, cm, rv, rq] = await Promise.all([api('GET', base), api('GET', base + '/versions'), api('GET', base + '/comments'), api('GET', base + '/review'), api('GET', base + '/requests')]);
        if (!v.ok) { S.loadError = errText(v); S.loading = false; render(); return; }
        S.view = v.data;
        S.versions = vs.ok ? vs.data.versions : [];
        S.comments = cm.ok ? cm.data.comments : [];
        S.review = rv.ok ? rv.data : null;
        S.requests = rq.ok ? rq.data.requests : [];
        S.draft = toDraft(v.data.content);
        baseline = snapshot(S.draft);
        loadReviewFields();
        S.versionView = null; S.diff = null; S.returned = null;
        if (!keepTab) S.tab = v.data.proposal ? 'revisao' : 'copy';
      } catch (e) { S.loadError = 'Erro de rede: ' + e.message; }
      S.loading = false; render();
    }

    // Campos de feedback: so carrega o que Caroline ja salvou sobre ESTA proposta.
    // Nunca pre-preenche com o texto original; feedback de proposta antiga (stale) nao entra nos campos.
    function loadReviewFields() {
      S.rev = {};
      const r = S.review;
      if (r && r.proposalAvailable && !r.stale) {
        Object.keys(r.items).forEach(k => { S.rev[k] = { suggestion: r.items[k].suggestion || '', note: r.items[k].note || '' }; });
      }
      revBaseline = JSON.stringify(normRev(S.rev));
    }

    async function reloadMeta() {
      const [vs, cm, rq, rv, vw] = await Promise.all([api('GET', base + '/versions'), api('GET', base + '/comments'), api('GET', base + '/requests'), api('GET', base + '/review'), api('GET', base)]);
      if (vs.ok) S.versions = vs.data.versions;
      if (cm.ok) S.comments = cm.data.comments;
      if (rq.ok) S.requests = rq.data.requests;
      if (rv.ok) S.review = rv.data;
      if (vw.ok) S.view = Object.assign({}, S.view, { proposal: vw.data.proposal, editorial: vw.data.editorial, clinical: vw.data.clinical });
    }

    // ---------- Revisao por card ----------
    async function saveReview(quiet) {
      if (S.busy) return false;
      const items = normRev(S.rev);
      if (S.review.stale && Object.keys(S.review.items).length && !quiet &&
          !window.confirm('Seu feedback anterior (sobre a versão ' + S.review.basedOnVersion + ') ainda não foi enviado e será substituído. Solicitações já enviadas são preservadas. Continuar?')) return false;
      S.busy = true; render();
      let r;
      try { r = await api('PUT', base + '/review', { agent: AUTHOR, expectedRevision: S.review.revision, basedOnVersion: proposal().version, items }); }
      catch (e) { r = { ok: false, status: 0, data: { message: 'Erro de rede: ' + e.message } }; }
      S.busy = false;
      if (!r.ok) {
        S.msg = { type: 'err', text: 'Não salvou sua revisão: ' + errText(r) + (r.status === 409 ? ' Recarregue para ver o estado mais recente (o que você digitou continua na tela).' : '') };
        S.conflict = r.status === 409; render(); return false;
      }
      S.conflict = false;
      S.review = r.data;
      revBaseline = JSON.stringify(items);
      S.msg = r.data.unchanged
        ? { type: 'info', text: 'Nenhuma alteração na sua revisão desde o último salvamento.' }
        : { type: 'ok', text: 'Sua revisão foi salva (revisão ' + r.data.revision + '). A proposta dos agentes não foi alterada, nada foi aprovado e nenhum agente foi acionado.' };
      render(); return true;
    }

    async function sendReview() {
      const n = Object.keys(normRev(S.rev)).length;
      if (!n) { S.msg = { type: 'err', text: 'Preencha ao menos uma sugestão ou orientação antes de enviar ajustes.' }; render(); return; }
      if (!window.confirm('Enviar ' + n + ' ajuste(s) aos agentes?\n\nIsso registra uma solicitação PENDENTE, organizada por card e legenda. Nenhum agente é executado automaticamente e a proposta não muda.' + (reviewDirty() ? '\n\nSua revisão será salva antes do envio.' : ''))) return;
      if (reviewDirty() || S.review.revision === 0) { const saved = await saveReview(true); if (!saved) return; }
      S.busy = true; render();
      let r;
      try { r = await api('POST', base + '/review/submit', { agent: AUTHOR, expectedRevision: S.review.revision, basedOnVersion: proposal().version }); }
      catch (e) { r = { ok: false, status: 0, data: { message: 'Erro de rede: ' + e.message } }; }
      S.busy = false;
      if (!r.ok) { S.msg = { type: 'err', text: 'Não enviou: ' + errText(r) }; render(); return; }
      await reloadMeta();
      S.msg = { type: 'ok', text: 'Solicitação ' + r.data.request.id + ' registrada como PENDENTE com ' + r.data.request.items.length + ' item(ns). Ainda NÃO foi executada: nenhum agente foi acionado, não há handoff e a proposta continua a mesma.' };
      render();
    }

    async function compareReturned() {
      const reqs = S.requests; const last = reqs[reqs.length - 1];
      const r = await api('GET', base + '/diff?from=' + last.basedOnVersion + '&to=' + proposal().version);
      if (!r.ok) { S.msg = { type: 'err', text: errText(r) }; render(); return; }
      S.returned = r.data; render();
    }

    // ---------- ações ----------
    function payloadFromDraft(d, note) {
      return {
        agent: AUTHOR,
        expectedRevision: S.view.revision,
        cards: d.cards.map(c => ({ text: c.text, label: c.label || undefined })),
        caption: d.caption,
        cta: d.cta && d.cta.trim() ? d.cta : null,
        note: note || undefined,
      };
    }

    async function saveDraft(draft, note, okText) {
      if (S.busy) return;
      S.busy = true; render();
      let r;
      try { r = await api('POST', base + '/draft', payloadFromDraft(draft, note)); }
      catch (e) { r = { ok: false, status: 0, data: { message: 'Erro de rede: ' + e.message } }; }
      S.busy = false;
      if (!r.ok) {
        S.msg = { type: 'err', text: 'Não salvou: ' + errText(r) + (r.status === 409 ? ' Recarregue para ver a versão mais recente (suas alterações no formulário continuam abertas).' : '') };
        S.conflict = r.status === 409;
        render(); return;
      }
      S.conflict = false;
      if (r.data.unchanged) {
        S.msg = { type: 'info', text: 'Nenhuma alteração em relação à versão atual. Nada foi salvo.' };
        render(); return;
      }
      S.view = r.data;
      S.draft = toDraft(r.data.content);
      baseline = snapshot(S.draft);
      await reloadMeta();
      S.msg = { type: 'ok', text: (okText || 'Rascunho salvo') + ' como versão ' + r.data.version + '. Status editorial mantido (' + r.data.gates.pipelineStatus + '). Não foi aprovado nem enviado a nenhum agente.' + (r.data.warnings && r.data.warnings.length ? ' Avisos: ' + r.data.warnings.join(' ') : '') };
      render();
    }

    async function showVersion(v) {
      const r = await api('GET', base + '/versions/' + v);
      if (!r.ok) { S.msg = { type: 'err', text: errText(r) }; render(); return; }
      S.versionView = r.data; S.diff = null; render();
    }

    async function compare(from, to) {
      const r = await api('GET', base + '/diff?from=' + from + '&to=' + to);
      if (!r.ok) { S.msg = { type: 'err', text: errText(r) }; render(); return; }
      S.diff = r.data; S.versionView = null; render();
    }

    async function restore(v) {
      if (!editable()) return;
      if (isDirty() && !window.confirm('Há alterações não salvas no formulário. Restaurar vai substituí-las. Continuar?')) return;
      if (!window.confirm('Restaurar a versão ' + v + ' como NOVO rascunho? O histórico é preservado.')) return;
      const r = await api('GET', base + '/versions/' + v);
      if (!r.ok) { S.msg = { type: 'err', text: errText(r) }; render(); return; }
      const d = toDraft(r.data.content);
      if (!d.cards.length) { S.msg = { type: 'err', text: 'A versão ' + v + ' não tem cards; não é possível restaurar.' }; render(); return; }
      await saveDraft(d, 'Restaurada da versão ' + v, 'Versão ' + v + ' restaurada');
    }

    async function postComment(kind, text, target) {
      if (!text.trim()) { S.msg = { type: 'err', text: kind === 'solicitacao-ajuste' ? 'Escreva as orientações: a solicitação exige comentário.' : 'Escreva a observação.' }; render(); return false; }
      const body = { agent: AUTHOR, kind, text, target: target || { type: 'geral' } };
      if (S.view.version != null && S.view.version !== undefined) body.version = S.view.version;
      const r = await api('POST', base + '/comments', body);
      if (!r.ok) { S.msg = { type: 'err', text: 'Não registrou: ' + errText(r) }; render(); return false; }
      await reloadMeta();
      S.msg = kind === 'solicitacao-ajuste'
        ? { type: 'ok', text: 'Solicitação registrada como PENDENTE. Ainda NÃO foi executada: nenhum agente foi acionado e a copy não mudou.' }
        : { type: 'ok', text: 'Observação registrada.' };
      render(); return true;
    }

    // ---------- render ----------
    function banner(m) {
      const colors = { ok: ['rgba(95,191,143,.10)', 'rgba(95,191,143,.35)', '#78D0A5'], err: ['rgba(229,99,107,.10)', 'rgba(229,99,107,.4)', '#F29A9F'], info: ['rgba(166,140,240,.10)', 'rgba(166,140,240,.3)', '#CDBDF8'] }[m.type];
      return h('div', { 'data-msg': m.type, role: 'status', style: { padding: '10px 14px', borderRadius: '8px', background: colors[0], border: '1px solid ' + colors[1], color: colors[2], fontSize: '12.5px', lineHeight: '1.5' } }, m.text);
    }

    function resizeTA(ta) { ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight + 2, 90) + 'px'; }

    function textarea(value, onInput, ro, label) {
      const ta = h('textarea', { style: TA, 'aria-label': label, readonly: ro ? true : null }, '');
      ta.value = value;
      ta.addEventListener('input', () => { onInput(ta.value); resizeTA(ta); updateDirtyUI(); });
      setTimeout(() => resizeTA(ta), 0);
      return ta;
    }

    let dirtyEl = null, saveBtnEl = null, revSaveEl = null, revCountEl = null;
    function updateDirtyUI() {
      if (!dirtyEl) return;
      const d = tabDirty();
      dirtyEl.textContent = d ? '● Alterações não salvas' : 'Sem alterações pendentes';
      dirtyEl.style.color = d ? '#E5B543' : '#8A808C';
      dirtyEl.setAttribute('data-dirty', d ? '1' : '0');
      if (saveBtnEl) saveBtnEl.disabled = !d || S.busy;
      if (saveBtnEl) saveBtnEl.style.opacity = (!d || S.busy) ? '.5' : '1';
      if (revSaveEl) { revSaveEl.disabled = !d || S.busy; revSaveEl.style.opacity = (!d || S.busy) ? '.5' : '1'; }
      if (revCountEl) revCountEl.textContent = Object.keys(normRev(S.rev)).length + ' item(ns) com feedback';
    }

    function renderCopyTab() {
      const col = div({ display: 'flex', flexDirection: 'column', gap: '16px' });
      const v = S.view, ro = !editable();

      if (ro) col.appendChild(banner({ type: 'info', text: 'Conteúdo publicado: leitura apenas. A copy publicada não pode ser sobrescrita.' }));
      col.appendChild(div({ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', fontSize: '12px', lineHeight: '1.55', color: '#A59BA6' },
        'Edição direta: cria um rascunho humano, que não substitui a proposta dos agentes. Salvar cria um rascunho versionado. Não aprova, não altera o status (' + v.gates.pipelineStatus + '), não aciona agentes e não substitui a aprovação editorial nem a clínica.'));
      if (v.gates.scientificGateOpen) col.appendChild(banner({ type: 'info', text: 'Gate científico aberto: pacote ' + v.gates.scientificPackage + ' ainda não está congelado. Este rascunho não autoriza afirmações médicas não verificadas.' }));
      if (v.sourceChanged) col.appendChild(banner({ type: 'info', text: 'O arquivo-fonte do agente mudou depois do primeiro rascunho. Seus rascunhos continuam intactos.' }));

      if (!S.draft.cards.length) {
        col.appendChild(div({ padding: '18px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,.14)', color: '#A59BA6', fontSize: '13px', lineHeight: '1.6' },
          'Este conteúdo ainda não tem copy associada. Nada foi gerado automaticamente.' + (ro ? '' : ' Você pode começar um rascunho adicionando um card.')));
      }

      S.draft.cards.forEach((c, i) => {
        const el = div({ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: '8px' });
        el.setAttribute('data-card', String(i + 1));
        el.appendChild(div(LABEL, 'Card ' + (i + 1) + (c.label ? ' · ' + c.label : '')));
        el.appendChild(textarea(c.text, val => { S.draft.cards[i].text = val; }, ro, 'Card ' + (i + 1)));
        col.appendChild(el);
      });

      if (!ro) {
        col.appendChild(div({ display: 'flex', gap: '8px', flexWrap: 'wrap' },
          btn('btn2', B_SMALL, { 'data-act': 'add-card', onClick: () => { S.draft.cards.push({ label: null, text: '' }); render(); } }, '+ Adicionar card'),
          S.draft.cards.length > 1 ? btn('btn2', B_SMALL, { 'data-act': 'remove-card', onClick: () => { if (window.confirm('Remover o último card do rascunho? (a versão salva não é afetada até você salvar)')) { S.draft.cards.pop(); render(); } } }, 'Remover último card') : null
        ));
      }

      const leg = div({ padding: '16px', borderRadius: '10px', background: 'rgba(120,208,165,.05)', border: '1px solid rgba(120,208,165,.18)', display: 'flex', flexDirection: 'column', gap: '8px' });
      leg.setAttribute('data-caption', '1');
      leg.appendChild(div(Object.assign({}, LABEL, { color: '#78D0A5' }), 'Legenda'));
      leg.appendChild(textarea(S.draft.caption, val => { S.draft.caption = val; }, ro, 'Legenda'));
      col.appendChild(leg);

      if (S.draft.cta != null) {
        const cta = div({ padding: '16px', borderRadius: '10px', background: 'rgba(166,140,240,.08)', border: '1px solid rgba(166,140,240,.2)', display: 'flex', flexDirection: 'column', gap: '8px' });
        cta.setAttribute('data-cta', '1');
        cta.appendChild(div(LABEL, 'CTA'));
        cta.appendChild(textarea(S.draft.cta, val => { S.draft.cta = val; }, ro, 'CTA'));
        col.appendChild(cta);
      } else if (!ro) {
        col.appendChild(btn('btn2', Object.assign({ alignSelf: 'flex-start' }, B_SMALL), { 'data-act': 'add-cta', onClick: () => { S.draft.cta = ''; render(); } }, '+ Adicionar CTA'));
      }

      if (!ro) {
        const note = h('input', { type: 'text', style: INP, placeholder: 'Nota desta versão (opcional)', 'aria-label': 'Nota da versão', maxlength: '1000' });
        note.value = S.draft.note;
        note.addEventListener('input', () => { S.draft.note = note.value; });
        col.appendChild(note);
      }
      return col;
    }

    const BLOCK = { padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: '10px' };
    const PROPOSAL_BOX = { padding: '12px 14px', borderRadius: '8px', background: '#110C13', border: '1px solid rgba(255,255,255,.08)', color: '#F2EDF0', fontSize: '14.5px', lineHeight: '1.7', whiteSpace: 'pre-wrap' };
    const SUB = { fontSize: '11.5px', fontWeight: '600', color: '#A59BA6' };

    function originText(pr) {
      if (pr.origin.type === 'arquivo-agente') return 'Arquivo do agente ' + (pr.origin.agent || '(agente não identificado no histórico)');
      return 'Versão salva pelo agente ' + pr.origin.agent;
    }

    function renderProposalSummary(pr) {
      const v = S.view, ed = v.editorial, cl = v.clinical;
      const rows = [
        ['Versão apresentada para revisão', 'Versão ' + pr.version + (pr.kind === 'origem' ? ' (proposta original dos agentes)' : ' (devolvida pelos agentes)')],
        ['Origem da proposta', originText(pr)],
        ['Data', pr.producedAt ? fmtDate(pr.producedAt) + (pr.dateIsHandoff ? ' (registro do handoff)' : '') : 'Data não registrada'],
        ['Status editorial', (STATUS[ed.status] || ed.status) + (ed.currentOwner ? ' · com ' + ed.currentOwner : '') + (ed.pendingType && ed.pendingType !== 'nenhuma' ? ' · pendência: ' + ed.pendingType : '')],
        ['Aprovação clínica', (cl.scientificPackage ? 'Pacote científico ' + cl.scientificPackage + ': ' + (cl.scientificPackageStatus === 'frozen' ? 'congelado' : (cl.scientificPackageStatus || 'sem status')) + ' · ' : 'Sem pacote científico associado · ') + 'aprovação clínica humana: sem registro no Dashboard'],
      ];
      const box = div({ padding: '14px 16px', borderRadius: '10px', background: '#1D1620', border: '1px solid rgba(166,140,240,.3)', display: 'flex', flexDirection: 'column', gap: '8px' });
      box.setAttribute('data-role', 'proposal-summary');
      box.appendChild(div(LABEL, 'Proposta em revisão'));
      rows.forEach(([k, val]) => box.appendChild(div({ display: 'flex', flexDirection: 'column', gap: '1px' }, span({ fontSize: '11px', color: '#8A808C' }, k), span({ fontSize: '12.5px', lineHeight: '1.5', color: '#E4DCE6' }, val))));
      return box;
    }

    function feedbackBlock(key, heading, proposalText, ro, accent) {
      const blk = div(Object.assign({}, BLOCK, accent || {}));
      blk.setAttribute('data-review-block', key);
      blk.appendChild(div(Object.assign({}, LABEL, accent && accent.labelColor ? { color: accent.labelColor } : {}), heading));
      const pbox = div(PROPOSAL_BOX, proposalText);
      pbox.setAttribute('data-proposal-text', key);
      blk.appendChild(pbox);
      const entry = S.rev[key] || { suggestion: '', note: '' };
      const mk = (labelTxt, field, aria, min) => {
        const wrap = div({ display: 'flex', flexDirection: 'column', gap: '4px' });
        wrap.appendChild(span(SUB, labelTxt));
        const ta = h('textarea', { style: Object.assign({}, TA, { minHeight: min }), 'aria-label': aria, 'data-fb': key + ':' + field, readonly: ro ? true : null });
        ta.value = entry[field] || '';
        ta.addEventListener('input', () => { (S.rev[key] = S.rev[key] || { suggestion: '', note: '' })[field] = ta.value; resizeTA(ta); updateDirtyUI(); });
        setTimeout(() => resizeTA(ta), 0);
        wrap.appendChild(ta);
        return wrap;
      };
      if (!ro) {
        blk.appendChild(mk('Minha versão sugerida', 'suggestion', 'Minha versão sugerida — ' + heading, '70px'));
        blk.appendChild(mk('Orientações / motivo da alteração', 'note', 'Orientações / motivo — ' + heading, '56px'));
      }
      return blk;
    }

    function renderReviewTab() {
      const col = div({ display: 'flex', flexDirection: 'column', gap: '16px' });
      const pr = proposal();
      if (!pr) {
        col.appendChild(banner({ type: 'info', text: 'Nenhuma proposta consolidada dos agentes está disponível para este conteúdo. Nada foi inventado. Use "Edição direta" para escrever um rascunho próprio.' }));
        return col;
      }
      const ro = !(S.review && S.review.editable);
      col.appendChild(renderProposalSummary(pr));
      if (ro) col.appendChild(banner({ type: 'info', text: 'Conteúdo publicado: somente leitura. Não é possível registrar revisão nem enviar ajustes.' }));
      col.appendChild(div({ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', fontSize: '12px', lineHeight: '1.55', color: '#A59BA6' },
        'A proposta dos agentes aparece em destaque e não pode ser editada aqui. Suas sugestões e orientações são salvas à parte, não alteram a proposta, não aprovam o conteúdo e não acionam agentes. Os campos são opcionais.'));

      // humanos depois da proposta
      const humanAfter = S.versions.filter(x => x.version > pr.version && x.author === AUTHOR);
      if (humanAfter.length) col.appendChild(div({ fontSize: '12px', color: '#A59BA6' }, humanAfter.length + ' rascunho(s) humano(s) salvo(s) depois desta proposta (aba Versões). Eles não são a proposta dos agentes.'));

      // nova proposta devolvida
      const lastReq = S.requests[S.requests.length - 1];
      if (lastReq && pr.version > lastReq.basedOnVersion) {
        const rb = div({ padding: '12px 14px', borderRadius: '8px', background: 'rgba(95,191,143,.08)', border: '1px solid rgba(95,191,143,.3)', display: 'flex', flexDirection: 'column', gap: '8px' });
        rb.setAttribute('data-role', 'returned');
        rb.appendChild(div({ fontSize: '12.5px', color: '#78D0A5', lineHeight: '1.5' }, 'Há uma nova proposta (versão ' + pr.version + ', ' + (pr.origin.agent || 'agente') + ') depois da sua solicitação ' + lastReq.id + ' (feita sobre a versão ' + lastReq.basedOnVersion + '). Isso não significa aprovação.'));
        rb.appendChild(btn('btn2', Object.assign({ alignSelf: 'flex-start' }, B_SMALL), { 'data-act': 'compare-returned', onClick: compareReturned }, 'Comparar com a proposta anterior (versão ' + lastReq.basedOnVersion + ')'));
        col.appendChild(rb);
        if (S.returned) col.appendChild(renderDiff(S.returned));
      }

      // feedback antigo
      if (S.review.stale) {
        const itemsOld = Object.keys(S.review.items);
        const sb = div({ padding: '12px 14px', borderRadius: '8px', background: 'rgba(229,181,67,.07)', border: '1px solid rgba(229,181,67,.25)', color: '#E5B543', fontSize: '12.5px', lineHeight: '1.55' });
        sb.setAttribute('data-role', 'stale');
        sb.appendChild(document.createTextNode('A proposta mudou desde o seu último feedback (feito sobre a versão ' + S.review.basedOnVersion + '). Os campos abaixo começam vazios para a nova versão.' + (itemsOld.length ? ' Seu feedback anterior não enviado: ' + itemsOld.map(k => k.replace('card:', 'Card ')).join(', ') + '. Ele será substituído ao salvar; solicitações já enviadas ficam preservadas.' : '')));
        col.appendChild(sb);
      }

      const c = pr.content;
      c.cards.forEach(card => col.appendChild(feedbackBlock('card:' + card.num, 'Card ' + card.num + (card.label ? ' · ' + card.label : ''), card.text, ro)));
      col.appendChild(feedbackBlock('legenda', 'Legenda proposta', c.caption || '(a proposta não tem legenda)', ro, { background: 'rgba(120,208,165,.05)', border: '1px solid rgba(120,208,165,.18)', labelColor: '#78D0A5' }));
      if (c.cta) col.appendChild(feedbackBlock('cta', 'CTA proposto', c.cta, ro, { background: 'rgba(166,140,240,.08)', border: '1px solid rgba(166,140,240,.2)' }));

      if (!ro) {
        const lastSub = S.review.lastSubmitted;
        const bar = div({ position: 'sticky', bottom: '0', padding: '12px 14px', borderRadius: '10px', background: '#1D1620', border: '1px solid rgba(166,140,240,.3)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' });
        bar.setAttribute('data-role', 'review-bar');
        revSaveEl = btn('btn1', B_PRIMARY, { 'data-act': 'save-review', onClick: () => saveReview(false) }, 'Salvar minha revisão');
        bar.appendChild(revSaveEl);
        bar.appendChild(btn('btn2', Object.assign({}, B_SECOND, { borderColor: 'rgba(229,181,67,.4)', color: '#E5B543' }), { 'data-act': 'send-review', onClick: sendReview }, 'Enviar ajustes aos agentes'));
        revCountEl = span({ fontSize: '12px', color: '#A59BA6' }, '');
        bar.appendChild(revCountEl);
        if (lastSub && !reviewDirty() && S.review.revision === lastSub.reviewRevision) bar.appendChild(span({ fontSize: '12px', color: '#E5B543' }, 'Já enviado na solicitação ' + lastSub.requestId + ' (pendente, não executada).'));
        col.appendChild(bar);
      }
      return col;
    }

    function renderDiff(d) {
      const wrap = div({ display: 'flex', flexDirection: 'column', gap: '10px' });
      wrap.setAttribute('data-diff', '1');
      wrap.appendChild(div({ fontSize: '12.5px', color: '#CFC6D1' }, 'Comparando versão ' + d.from.version + ' (' + d.from.author + ') com versão ' + d.to.version + ' (' + d.to.author + '). ' + (d.summary.changedUnits ? d.summary.changedUnits + ' parte(s) alterada(s): ' + d.summary.units.join(', ') + '.' : 'Sem diferenças.')));
      d.units.filter(u => u.change !== 'inalterado').forEach(u => {
        const box = div({ padding: '12px', borderRadius: '8px', background: '#1D1620', display: 'flex', flexDirection: 'column', gap: '4px' });
        box.appendChild(div(LABEL, u.unit.replace('card:', 'Card ').replace('legenda', 'Legenda').replace('cta', 'CTA') + ' · ' + u.change));
        u.lines.forEach(l => {
          if (l.op === 'igual' && !l.text.trim()) return;
          const sty = { fontSize: '13px', lineHeight: '1.6', padding: '1px 8px', borderRadius: '4px', color: '#E4DCE6' };
          if (l.op === 'removido') Object.assign(sty, { background: 'rgba(229,99,107,.14)', color: '#F29A9F', textDecoration: 'line-through' });
          if (l.op === 'adicionado') Object.assign(sty, { background: 'rgba(95,191,143,.14)', color: '#78D0A5' });
          if (l.op === 'igual') sty.color = '#8A808C';
          box.appendChild(div(sty, (l.op === 'removido' ? '− ' : l.op === 'adicionado' ? '+ ' : '  ') + l.text));
        });
        wrap.appendChild(box);
      });
      return wrap;
    }

    function renderVersionsTab() {
      const col = div({ display: 'flex', flexDirection: 'column', gap: '14px' });
      col.appendChild(div({ fontSize: '12px', color: '#A59BA6', lineHeight: '1.55' }, 'Histórico preservado: restaurar cria um novo rascunho e nunca apaga versões.'));
      const list = S.versions.slice().reverse();
      if (!list.length) col.appendChild(div({ color: '#8A808C', fontSize: '13px' }, 'Sem versões ainda. A primeira aparece quando você salvar um rascunho.'));
      list.forEach(v => {
        const isCur = S.view.version === v.version || (S.view.version == null && v.version === 0);
        const row = div({ padding: '12px 14px', borderRadius: '8px', background: '#1D1620', display: 'flex', flexDirection: 'column', gap: '6px' });
        row.setAttribute('data-version', String(v.version));
        row.appendChild(div({ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center', fontSize: '12.5px' },
          span({ fontWeight: '600', color: '#F2EDF0' }, (v.kind === 'origem' ? 'Versão ' + v.version + ' · Origem, proposta do arquivo do agente' : v.author === AUTHOR ? 'Versão ' + v.version + ' · Rascunho humano' : 'Versão ' + v.version + ' · Proposta de agente (' + v.author + ')')),
          (proposal() && proposal().version === v.version) ? span({ fontSize: '11px', color: '#CDBDF8', fontWeight: '700' }, 'PROPOSTA EM REVISÃO') : null,
          isCur ? span({ fontSize: '11px', color: '#78D0A5', fontWeight: '600' }, 'ÚLTIMA SALVA') : null,
          span({ color: '#A59BA6' }, v.author + ' · ' + fmtDate(v.savedAt)),
          v.note ? span({ color: '#8A808C' }, '“' + v.note + '”') : null));
        row.appendChild(div({ display: 'flex', gap: '6px', flexWrap: 'wrap' },
          btn('btn2', B_SMALL, { 'data-act': 'view', onClick: () => showVersion(v.version) }, 'Ver'),
          !isCur ? btn('btn2', B_SMALL, { 'data-act': 'compare-current', onClick: () => compare(v.version, S.view.version == null ? 0 : S.view.version) }, 'Comparar com a atual') : null,
          (!isCur && editable()) ? btn('btn2', Object.assign({}, B_SMALL, { color: '#CDBDF8', borderColor: 'rgba(166,140,240,.3)' }), { 'data-act': 'restore', onClick: () => restore(v.version) }, 'Restaurar como novo rascunho') : null));
        col.appendChild(row);
      });
      if (S.versionView) {
        const vv = S.versionView;
        const box = div({ padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column', gap: '8px' });
        box.setAttribute('data-version-view', String(vv.version));
        box.appendChild(div(LABEL, 'Conteúdo da versão ' + vv.version + ' (somente leitura)'));
        vv.content.cards.forEach(c => box.appendChild(div({ fontSize: '13.5px', lineHeight: '1.65', color: '#E4DCE6', whiteSpace: 'pre-wrap' }, 'Card ' + c.num + ': ' + c.text)));
        if (vv.content.caption) box.appendChild(div({ fontSize: '13.5px', lineHeight: '1.65', color: '#E4DCE6', whiteSpace: 'pre-wrap' }, 'Legenda: ' + vv.content.caption));
        if (vv.content.cta) box.appendChild(div({ fontSize: '13.5px', lineHeight: '1.65', color: '#E4DCE6' }, 'CTA: ' + vv.content.cta));
        col.appendChild(box);
      }
      if (S.versions.length >= 2) {
        const opts = S.versions.map(v => v.version);
        const selFrom = h('select', { style: INP, 'aria-label': 'De' }), selTo = h('select', { style: INP, 'aria-label': 'Para' });
        opts.forEach(n => { selFrom.appendChild(h('option', { value: n }, 'Versão ' + n)); selTo.appendChild(h('option', { value: n }, 'Versão ' + n)); });
        selFrom.value = String(opts[opts.length - 2]); selTo.value = String(opts[opts.length - 1]);
        col.appendChild(div({ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
          span({ fontSize: '12px', color: '#8A808C' }, 'Comparar'), selFrom, span({ fontSize: '12px', color: '#8A808C' }, 'com'), selTo,
          btn('btn2', B_SMALL, { 'data-act': 'compare', onClick: () => compare(selFrom.value, selTo.value) }, 'Comparar')));
      }
      if (S.diff) col.appendChild(renderDiff(S.diff));
      return col;
    }

    function renderCommentsTab() {
      const col = div({ display: 'flex', flexDirection: 'column', gap: '14px' });
      col.appendChild(div({ padding: '10px 14px', borderRadius: '8px', background: 'rgba(229,181,67,.07)', border: '1px solid rgba(229,181,67,.25)', color: '#E5B543', fontSize: '12.5px', lineHeight: '1.55', fontWeight: '600' },
        'PARECER DO AGENTE NÃO É APROVAÇÃO HUMANA. Aprovação editorial e aprovação clínica continuam sendo decisões suas, no fluxo de aprovação.'));
      if (!S.comments.length) col.appendChild(div({ color: '#8A808C', fontSize: '13px' }, 'Nenhum comentário ou parecer registrado.'));
      S.comments.slice().reverse().forEach(c => {
        const isAgent = c.kind === 'parecer-editor';
        const isReq = c.kind === 'solicitacao-ajuste';
        const box = div({ padding: '12px 14px', borderRadius: '8px', background: '#1D1620', border: isReq ? '1px solid rgba(229,181,67,.3)' : '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: '6px' });
        box.setAttribute('data-comment', c.id);
        box.setAttribute('data-kind', c.kind);
        box.appendChild(div({ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', alignItems: 'center', fontSize: '11.5px' },
          span({ fontWeight: '700', color: isAgent ? '#8DB7F4' : isReq ? '#E5B543' : '#CDBDF8', letterSpacing: '.04em', textTransform: 'uppercase' }, KIND_LABEL[c.kind] || c.kind),
          span({ color: '#A59BA6' }, c.author + ' · ' + fmtDate(c.createdAt) + ' · versão ' + c.version + ' · ' + (c.target.type === 'card' ? 'card ' + c.target.num : c.target.type)),
          isAgent ? span({ color: '#E5B543', fontWeight: '600' }, 'não é aprovação humana' + (c.verdict ? ' · ' + (VERDICT_LABEL[c.verdict] || c.verdict) : '')) : null,
          isReq ? span({ color: '#E5B543', fontWeight: '700' }, 'PENDENTE · NÃO EXECUTADA') : null));
        box.appendChild(div({ fontSize: '13.5px', lineHeight: '1.6', color: '#E4DCE6', whiteSpace: 'pre-wrap' }, c.text));
        col.appendChild(box);
      });

      // Observação humana
      const targetOpts = [['geral', 'Geral']].concat(S.view.content.cards.map(c => ['card:' + c.num, 'Card ' + c.num]), [['legenda', 'Legenda']], S.view.content.cta ? [['cta', 'CTA']] : []);
      const parseTarget = v => v.startsWith('card:') ? { type: 'card', num: +v.slice(5) } : { type: v };
      const mkTarget = () => { const s = h('select', { style: INP, 'aria-label': 'Alvo' }); targetOpts.forEach(([v, l]) => s.appendChild(h('option', { value: v }, l))); return s; };

      const obs = div({ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', gap: '8px' });
      obs.appendChild(div(LABEL, 'Registrar observação'));
      const obsT = mkTarget();
      const obsTA = h('textarea', { style: Object.assign({}, TA, { minHeight: '64px' }), 'aria-label': 'Observação', placeholder: 'Observação sua sobre esta copy (não altera o texto).' });
      obs.appendChild(obsT); obs.appendChild(obsTA);
      obs.appendChild(btn('btn2', Object.assign({ alignSelf: 'flex-start' }, B_SECOND), { 'data-act': 'comment', onClick: () => postComment('comentario', obsTA.value, parseTarget(obsT.value)) }, 'Registrar observação'));
      col.appendChild(obs);

      // Solicitações de ajustes enviadas (consolidadas por card e legenda)
      const rq = div({ display: 'flex', flexDirection: 'column', gap: '10px' });
      rq.appendChild(div(Object.assign({}, LABEL, { color: '#E5B543' }), 'Solicitações de ajustes enviadas (' + S.requests.length + ')'));
      rq.appendChild(div({ fontSize: '12px', lineHeight: '1.55', color: '#A59BA6' }, 'Para enviar ajustes, use a aba Revisão. Cada solicitação fica registrada como PENDENTE: ainda não há execução automática dos agentes.'));
      if (!S.requests.length) rq.appendChild(div({ color: '#8A808C', fontSize: '13px' }, 'Nenhuma solicitação enviada.'));
      S.requests.slice().reverse().forEach(r => {
        const box = div({ padding: '12px 14px', borderRadius: '8px', background: '#1D1620', border: '1px solid rgba(229,181,67,.3)', display: 'flex', flexDirection: 'column', gap: '8px' });
        box.setAttribute('data-request', r.id);
        box.appendChild(div({ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', fontSize: '11.5px' },
          span({ fontWeight: '700', color: '#E5B543' }, 'Solicitação ' + r.id),
          span({ color: '#A59BA6' }, r.author + ' · ' + fmtDate(r.createdAt) + ' · sobre a versão ' + r.basedOnVersion),
          span({ color: '#E5B543', fontWeight: '700' }, 'PENDENTE · NÃO EXECUTADA')));
        if (r.generalNote) box.appendChild(div({ fontSize: '13px', color: '#E4DCE6', lineHeight: '1.55' }, 'Observação geral: ' + r.generalNote));
        r.items.forEach(it => {
          const ib = div({ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '10px', borderLeft: '2px solid rgba(255,255,255,.1)' });
          ib.appendChild(div(LABEL, it.label));
          ib.appendChild(div({ fontSize: '12px', color: '#8A808C', whiteSpace: 'pre-wrap' }, 'Proposta: ' + it.proposalText));
          if (it.suggestion) ib.appendChild(div({ fontSize: '13px', color: '#E4DCE6', whiteSpace: 'pre-wrap' }, 'Sugestão: ' + it.suggestion));
          if (it.note) ib.appendChild(div({ fontSize: '13px', color: '#E4DCE6', whiteSpace: 'pre-wrap' }, 'Motivo: ' + it.note));
          box.appendChild(ib);
        });
        rq.appendChild(box);
      });
      col.appendChild(rq);
      return col;
    }

    function render() {
      root.innerHTML = '';
      dirtyEl = null; saveBtnEl = null; revSaveEl = null; revCountEl = null;

      const title = span({ fontSize: '15px', fontWeight: '600', color: '#F2EDF0' }, opts.title || id);
      const verTxt = S.view ? (S.view.version == null ? 'Origem (sem rascunhos salvos)' : 'Versão ' + S.view.version) : '';
      dirtyEl = span({ fontSize: '12px', fontWeight: '600' }, '');
      dirtyEl.setAttribute('data-role', 'dirty');
      const top = div({ flex: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,.08)' },
        div({ display: 'flex', flexDirection: 'column', gap: '2px' },
          span(LABEL, 'Editor de copy'), title),
        div({ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
          span({ fontSize: '12px', color: '#CDBDF8', fontWeight: '600' }, verTxt), dirtyEl));
      const actions = div({ display: 'flex', gap: '8px' });
      if (S.view && editable() && S.tab === 'copy') {
        saveBtnEl = btn('btn1', B_PRIMARY, { 'data-act': 'save', onClick: () => saveDraft(S.draft, S.draft.note) }, 'Salvar rascunho');
        actions.appendChild(saveBtnEl);
      }
      actions.appendChild(btn('btn2', B_SECOND, { 'data-act': 'close', onClick: close }, 'Fechar'));
      top.appendChild(actions);
      root.appendChild(top);

      if (S.loading) { root.appendChild(div({ padding: '28px', color: '#8A808C' }, 'Carregando…')); return; }
      if (S.loadError) {
        root.appendChild(div({ padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }, banner({ type: 'err', text: S.loadError }), btn('btn2', B_SECOND, { onClick: () => load() }, 'Tentar de novo')));
        return;
      }

      const pend = S.requests.length;
      const tabs = div({ flex: 'none', display: 'flex', gap: '4px', padding: '10px 28px 0', borderBottom: '1px solid rgba(255,255,255,.06)' });
      [['revisao', 'Revisão'], ['copy', 'Edição direta'], ['versoes', 'Versões (' + S.versions.length + ')'], ['comentarios', 'Comentários e solicitações (' + S.comments.length + ')' + (pend ? ' · ' + pend + ' pendente(s)' : '')]].forEach(([k, l]) => {
        const on = S.tab === k;
        tabs.appendChild(btn('btn2', { padding: '9px 14px', border: '0', borderBottom: on ? '2px solid #A68CF0' : '2px solid transparent', background: 'transparent', color: on ? '#F2EDF0' : '#A59BA6', fontSize: '12.5px', fontWeight: '600' }, { 'data-tab': k, onClick: () => { S.tab = k; S.msg = null; render(); } }, l));
      });
      root.appendChild(tabs);

      const body = div({ flex: '1', overflowY: 'auto', padding: '24px 28px', display: 'flex', justifyContent: 'center' });
      const content = div({ maxWidth: '720px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' });
      if (S.msg) content.appendChild(banner(S.msg));
      if (S.conflict) content.appendChild(btn('btn2', Object.assign({ alignSelf: 'flex-start' }, B_SECOND), { 'data-act': 'reload', onClick: () => { if (!isDirty() || window.confirm('Recarregar descarta suas alterações não salvas. Continuar?')) { S.msg = null; S.conflict = false; load(true); } } }, 'Recarregar versão mais recente'));
      content.appendChild(S.tab === 'revisao' ? renderReviewTab() : S.tab === 'copy' ? renderCopyTab() : S.tab === 'versoes' ? renderVersionsTab() : renderCommentsTab());
      body.appendChild(content);
      root.appendChild(body);
      updateDirtyUI();
    }

    render();
    load();
    return { root, state: S, close };
  }

  window.CopyEditor = { open };
})();
