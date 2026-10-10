/* === STATE === */
let pipeline = { contents: [] };
let draggedId = null;
let activeTouchClone = null;
let activeTouchDragging = false;

const COLUMNS = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'selecionado', label: 'Selecionado' },
  { key: 'em-desenvolvimento', label: 'Em Desenvolvimento' },
  { key: 'em-producao', label: 'Em Produ\u00e7\u00e3o' },
  { key: 'revisao', label: 'Revis\u00e3o / Aprova\u00e7\u00e3o' },
  { key: 'pronto', label: 'Pronto' },
  { key: 'publicado', label: 'Publicado' },
];

const TERRITORY_LABELS = {
  A: 'Dor/endo',
  B: 'Perimeno',
  C: 'Histeroscopia',
  D: 'Fertilidade',
  E: 'Contracep\u00e7\u00e3o',
  F: 'SOP',
  TRANS: 'Transversal',
};

const PENDING_LABELS = {
  decisao: 'Decis\u00e3o',
  aprovacao: 'Aprova\u00e7\u00e3o',
  execucao: 'Execu\u00e7\u00e3o',
  bloqueio: 'Bloqueio',
  nenhuma: null,
};

const OWNER_SHORT = {
  'Orchestrator': 'Orch',
  'Scientific Research': 'Sci',
  'Strategist': 'Strat',
  'Creator': 'Creator',
  'Editor': 'Editor',
  'Art Director': 'Art Dir',
  'Caroline': 'Caroline',
};

const VALID_AGENT_OWNERS = ['Orchestrator', 'Scientific Research', 'Strategist', 'Creator', 'Editor', 'Art Director'];
const ACTIVE_STATUSES = ['em-desenvolvimento', 'em-producao', 'revisao'];

/* === API === */
async function fetchPipeline() {
  const res = await fetch('/api/pipeline');
  pipeline = await res.json();
  render();
}

async function patchContent(id, updates) {
  const item = pipeline.contents.find(c => c.id === id);
  updates.expectedRevision = item ? item.revision : 0;
  updates.agent = 'Caroline';

  const res = await fetch(`/api/content/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (res.status === 409) {
    alert('Conflito: outro agente alterou este conte\u00fado. Recarregando...');
    await fetchPipeline();
    return null;
  }
  if (res.status === 422) {
    const err = await res.json();
    if (err.code === 'PENDENCIA_ABERTA') {
      return { _pendenciaAberta: true, ...err };
    }
    alert('Erro: ' + (err.message || 'desconhecido'));
    return null;
  }
  if (!res.ok) {
    const err = await res.json();
    alert('Erro: ' + (err.message || err.error || 'desconhecido'));
    return null;
  }
  return res.json();
}

async function handoffContent(id, handoffData) {
  const item = pipeline.contents.find(c => c.id === id);
  handoffData.expectedRevision = item ? item.revision : 0;
  handoffData.agent = 'Caroline';

  const res = await fetch(`/api/content/${encodeURIComponent(id)}/handoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(handoffData),
  });
  if (res.status === 409) {
    alert('Conflito: outro agente alterou este conte\u00fado. Recarregando...');
    await fetchPipeline();
    return null;
  }
  if (!res.ok) {
    const err = await res.json();
    alert('Erro: ' + (err.message || err.error || 'desconhecido'));
    return null;
  }
  return res.json();
}

async function createContent(data) {
  const res = await fetch('/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    alert('Erro: ' + (err.message || err.error || 'desconhecido'));
    return null;
  }
  return res.json();
}

/* === DRAG HANDLER (shared by mouse and touch) === */
async function handleDrop(cardId, newStatus) {
  const item = pipeline.contents.find(c => c.id === cardId);
  if (!item || item.status === newStatus) return;

  const oldStatus = item.status;
  item.status = newStatus;
  render();

  const updates = { status: newStatus };
  const result = await patchContent(cardId, updates);

  if (!result) {
    item.status = oldStatus;
    render();
    return;
  }

  if (result._pendenciaAberta) {
    const ownerLabel = result.currentOwner || 'nenhum';
    const pendLabel = PENDING_LABELS[result.pendingType] || result.pendingType;
    const colLabel = COLUMNS.find(c => c.key === newStatus)?.label || newStatus;
    const ok = confirm(
      `Este conte\u00fado tem pend\u00eancia aberta com ${ownerLabel} (${pendLabel}). ` +
      `Mover para ${colLabel} vai encerr\u00e1-la. Continuar?`
    );
    if (!ok) {
      item.status = oldStatus;
      render();
      return;
    }
    const retryUpdates = { status: newStatus, confirmClosePending: true };
    const retryResult = await patchContent(cardId, retryUpdates);
    if (!retryResult) {
      item.status = oldStatus;
      render();
      return;
    }
    Object.assign(item, retryResult);
    render();
    return;
  }

  Object.assign(item, result);
  render();
}

/* === RENDER === */
function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  for (const col of COLUMNS) {
    const items = pipeline.contents.filter(c => c.status === col.key);
    const colEl = document.createElement('div');
    colEl.className = 'column';
    colEl.innerHTML = `
      <div class="column-header">
        <span>${col.label}</span>
        <span class="column-count">${items.length}</span>
      </div>
    `;

    const cardsEl = document.createElement('div');
    cardsEl.className = 'column-cards';
    cardsEl.dataset.status = col.key;

    cardsEl.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      cardsEl.classList.add('drag-over');
    });
    cardsEl.addEventListener('dragleave', () => {
      cardsEl.classList.remove('drag-over');
    });
    cardsEl.addEventListener('drop', async e => {
      e.preventDefault();
      cardsEl.classList.remove('drag-over');
      if (!draggedId) return;
      const targetStatus = cardsEl.dataset.status;
      const id = draggedId;
      draggedId = null;
      await handleDrop(id, targetStatus);
    });

    for (const item of items) {
      const card = createCard(item);
      cardsEl.appendChild(card);
    }

    colEl.appendChild(cardsEl);
    board.appendChild(colEl);
  }
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.draggable = true;
  card.dataset.id = item.id;
  card.dataset.territory = item.territory || '';

  let badges = '';
  if (item.territory && TERRITORY_LABELS[item.territory]) {
    badges += `<span class="badge badge-territory">${TERRITORY_LABELS[item.territory]}</span>`;
  }
  if (item.type) {
    badges += `<span class="badge badge-type-${item.type}">${item.type}</span>`;
  }
  if (item.format) {
    const shortFormat = item.format.replace('Carrossel 6 cards', 'Carrossel').replace('Carrossel', 'Carr.');
    badges += `<span class="badge badge-format">${shortFormat}</span>`;
  }

  let ownerBadge = '';
  if (item.currentOwner) {
    const short = OWNER_SHORT[item.currentOwner] || item.currentOwner;
    const isCaroline = item.currentOwner === 'Caroline';
    ownerBadge = `<span class="badge badge-owner${isCaroline ? ' badge-owner-caroline' : ''}">${short}</span>`;
  }

  let pendingBadge = '';
  if (item.pendingType && item.pendingType !== 'nenhuma') {
    const label = PENDING_LABELS[item.pendingType] || item.pendingType;
    const isBloqueio = item.pendingType === 'bloqueio';
    pendingBadge = `<span class="badge badge-pending${isBloqueio ? ' badge-pending-bloqueio' : ''}">${isBloqueio ? '\u26a0 ' : ''}${label}</span>`;
  }

  let extras = '';
  if (item.editorialFunction) {
    extras += `<div class="card-function">${item.editorialFunction}${item.journeyStage ? ' \u00b7 ' + item.journeyStage : ''}</div>`;
  }
  if (item.nextAction) {
    extras += `<div class="card-next-action">\u2192 ${item.nextAction}</div>`;
  }
  if (item.pendingType === 'bloqueio' && item.blockerReason) {
    extras += `<div class="card-blocker">\u26a0 ${escapeHtml(item.blockerReason)}</div>`;
  }
  if (item.publishDate) {
    extras += `<div class="card-date">${formatDate(item.publishDate)}</div>`;
  }

  card.innerHTML = `
    <div class="card-id">${item.id}</div>
    <div class="card-title">${escapeHtml(item.title)}</div>
    ${badges || ownerBadge || pendingBadge ? `<div class="card-badges">${badges}${ownerBadge}${pendingBadge}</div>` : ''}
    ${extras}
  `;

  // Desktop drag
  card.addEventListener('dragstart', e => {
    draggedId = item.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    draggedId = null;
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  });

  // Click to open detail
  card.addEventListener('click', () => {
    if (activeTouchDragging) return;
    openDetail(item.id);
  });

  // Touch drag
  let touchStartX, touchStartY;
  let longPressTimer = null;

  card.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    activeTouchDragging = false;

    longPressTimer = setTimeout(() => {
      activeTouchDragging = true;
      draggedId = item.id;
      card.classList.add('dragging');

      activeTouchClone = card.cloneNode(true);
      activeTouchClone.style.position = 'fixed';
      activeTouchClone.style.zIndex = '1000';
      activeTouchClone.style.width = card.offsetWidth + 'px';
      activeTouchClone.style.opacity = '0.85';
      activeTouchClone.style.pointerEvents = 'none';
      activeTouchClone.style.transform = 'rotate(2deg) scale(1.03)';
      activeTouchClone.style.boxShadow = '0 8px 24px rgba(74,28,60,0.2)';
      document.body.appendChild(activeTouchClone);
      positionClone(touch);
    }, 400);
  }, { passive: true });

  card.addEventListener('touchmove', e => {
    if (!activeTouchDragging) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartX);
      const dy = Math.abs(touch.clientY - touchStartY);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer);
      }
      return;
    }
    e.preventDefault();
    const touch = e.touches[0];
    positionClone(touch);

    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elUnder) {
      const colCards = elUnder.closest('.column-cards');
      if (colCards) colCards.classList.add('drag-over');
    }
  }, { passive: false });

  card.addEventListener('touchend', async e => {
    clearTimeout(longPressTimer);
    if (!activeTouchDragging) return;

    const touch = e.changedTouches[0];
    if (activeTouchClone) { activeTouchClone.remove(); activeTouchClone = null; }
    card.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elUnder && draggedId) {
      const colCards = elUnder.closest('.column-cards');
      if (colCards) {
        const targetStatus = colCards.dataset.status;
        const id = draggedId;
        draggedId = null;
        await handleDrop(id, targetStatus);
      }
    }
    draggedId = null;
    setTimeout(() => { activeTouchDragging = false; }, 100);
  });

  return card;
}

function positionClone(touch) {
  if (!activeTouchClone) return;
  activeTouchClone.style.left = (touch.clientX - 100) + 'px';
  activeTouchClone.style.top = (touch.clientY - 30) + 'px';
}

/* === DETAIL MODAL === */
function getLastHandoffFrom(item) {
  if (!item.history) return null;
  for (let i = item.history.length - 1; i >= 0; i--) {
    const h = item.history[i];
    if (h.type === 'handoff' && h.fromOwner) return h.fromOwner;
  }
  return null;
}

function agentSelectHtml(selectId, preselected) {
  const options = VALID_AGENT_OWNERS.map(a => {
    const sel = a === preselected ? ' selected' : '';
    return `<option value="${a}"${sel}>${a}</option>`;
  });
  return `<select id="${selectId}" class="action-select">
    ${options.join('')}
  </select>`;
}

function openDetail(id) {
  const item = pipeline.contents.find(c => c.id === id);
  if (!item) return;

  document.getElementById('detailTitle').textContent = `${item.id} \u00b7 ${item.title}`;

  const body = document.getElementById('detailBody');
  const lastFrom = getLastHandoffFrom(item);

  // Caroline action panels
  let actions = '';
  if (item.currentOwner === 'Caroline' || item.currentOwner === null) {
    let btns = '';
    if (item.pendingType === 'execucao') {
      btns += `
        <div class="action-panel" id="panelConcluir">
          <button class="btn btn-primary btn-sm" onclick="actionConcluir('${item.id}')">Concluir execu\u00e7\u00e3o</button>
          <div class="action-extra">
            <textarea id="noteConcluir" class="action-note" placeholder="Nota (opcional)"></textarea>
            <details class="action-details">
              <summary>Outro destino</summary>
              ${agentSelectHtml('destConcluir', 'Art Director')}
            </details>
          </div>
        </div>`;
    }
    if (item.pendingType === 'aprovacao') {
      btns += `
        <div class="action-panel">
          <button class="btn btn-primary btn-sm" onclick="actionAprovar('${item.id}')">Aprovar</button>
          <textarea id="noteAprovar" class="action-note" placeholder="Nota de aprova\u00e7\u00e3o"></textarea>
        </div>
        <div class="action-panel">
          <button class="btn btn-secondary btn-sm" onclick="actionDevolver('${item.id}')">Devolver</button>
          <div class="action-extra">
            <label class="action-label">Devolver para:</label>
            ${agentSelectHtml('destDevolver', lastFrom || 'Creator')}
            <textarea id="noteDevolver" class="action-note" placeholder="Motivo da devolu\u00e7\u00e3o"></textarea>
          </div>
        </div>`;
    }
    if (item.pendingType === 'decisao') {
      btns += `
        <div class="action-panel">
          <button class="btn btn-primary btn-sm" onclick="actionDecidir('${item.id}')">Registrar decis\u00e3o</button>
          <div class="action-extra">
            <textarea id="noteDecidir" class="action-note" placeholder="Decis\u00e3o"></textarea>
            <label class="action-label">Encaminhar para:</label>
            ${agentSelectHtml('destDecidir', lastFrom || 'Strategist')}
            <label class="action-label">Pend\u00eancia:</label>
            <select id="pendDecidir" class="action-select">
              <option value="nenhuma">Nenhuma</option>
              <option value="execucao">Execu\u00e7\u00e3o</option>
            </select>
            <input type="text" id="nextActionDecidir" class="action-input" placeholder="Pr\u00f3xima a\u00e7\u00e3o (se execu\u00e7\u00e3o)">
          </div>
        </div>`;
    }
    if (item.pendingType === 'bloqueio') {
      btns += `
        <div class="action-panel">
          <button class="btn btn-primary btn-sm" onclick="actionDesbloquear('${item.id}')">Desbloquear</button>
          <div class="action-extra">
            <textarea id="noteDesbloquear" class="action-note" placeholder="Nota de desbloqueio"></textarea>
            <label class="action-label">Encaminhar para:</label>
            ${agentSelectHtml('destDesbloquear', lastFrom || 'Strategist')}
          </div>
        </div>`;
    }
    if (btns) {
      actions = `<div class="modal-section">
        <div class="modal-section-title">A\u00e7\u00f5es</div>
        <div class="detail-actions">${btns}</div>
      </div>`;
    }
  }

  body.innerHTML = `
    ${actions}

    <div class="modal-section">
      <div class="modal-section-title">Estado do handoff</div>
      ${row('Respons\u00e1vel atual', item.currentOwner || 'Nenhum')}
      ${row('Pend\u00eancia', PENDING_LABELS[item.pendingType] || item.pendingType || 'Nenhuma')}
      ${item.blockerReason ? row('Motivo do bloqueio', item.blockerReason) : ''}
      ${row('\u00daltima atualiza\u00e7\u00e3o', item.lastUpdate ? formatDateTime(item.lastUpdate) : null)}
      ${row('\u00daltimo agente', item.lastAgent)}
      ${row('Revis\u00e3o', item.revision)}
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Informa\u00e7\u00f5es gerais</div>
      ${row('Territ\u00f3rio', item.territoryLabel || item.territory)}
      ${row('Tipo', item.type)}
      ${row('Fun\u00e7\u00e3o editorial', item.editorialFunction)}
      ${row('Jornada', item.journeyStage)}
      ${row('Formato', item.format)}
      ${row('Status', item.status)}
      ${row('Substatus', item.substatus)}
      ${row('Bloco', item.block)}
      ${row('Pr\u00f3xima a\u00e7\u00e3o', item.nextAction)}
      ${item.blocker ? row('Depend\u00eancia (legado)', item.blocker) : ''}
      ${row('Data de publica\u00e7\u00e3o', item.publishDate ? formatDate(item.publishDate) : null)}
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Pacote cient\u00edfico</div>
      ${row('Pacote', item.scientificPackage)}
      ${row('Status', item.scientificPackageStatus)}
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Artefatos</div>
      ${row('Copy aprovada', item.approvedCopy)}
      ${row('Visual brief', item.visualBrief)}
      ${row('Legenda', item.caption === true ? 'Aprovada' : item.caption === false ? 'Pendente' : null)}
      ${row('Assets', item.assets && item.assets.length > 0 ? item.assets.join(', ') : null)}
    </div>

    <div class="modal-section">
      <div class="modal-section-title">P\u00f3s-publica\u00e7\u00e3o</div>
      ${row('Link do post', item.postUrl)}
      ${row('M\u00e9tricas', item.metrics && Object.keys(item.metrics).length > 0 ? JSON.stringify(item.metrics) : null)}
      ${row('Leads', item.leads && item.leads.length > 0 ? item.leads.length + ' registros' : null)}
      ${row('Aprendizados', item.learnings && item.learnings.length > 0 ? item.learnings.join('; ') : null)}
    </div>

    ${item.note ? `
    <div class="modal-section">
      <div class="modal-section-title">Observa\u00e7\u00e3o</div>
      <div style="font-size:12px">${escapeHtml(item.note)}</div>
    </div>` : ''}

    <div class="modal-section">
      <div class="modal-section-title">Hist\u00f3rico</div>
      ${renderHistory(item.history)}
    </div>
  `;

  document.getElementById('detailOverlay').classList.add('open');
}

/* === CAROLINE ACTIONS === */
function syncAndReopen(id, result) {
  if (!result) return;
  const idx = pipeline.contents.findIndex(c => c.id === id);
  if (idx >= 0) pipeline.contents[idx] = result;
  render();
  openDetail(id);
}

async function actionConcluir(id) {
  const note = document.getElementById('noteConcluir')?.value.trim() || null;
  const details = document.getElementById('destConcluir');
  const destOpen = document.querySelector('#panelConcluir details[open]');
  const handoff = { note: note || 'Execu\u00e7\u00e3o conclu\u00edda' };
  if (destOpen && details) {
    handoff.toOwner = details.value;
  }
  syncAndReopen(id, await handoffContent(id, handoff));
}

async function actionAprovar(id) {
  const note = document.getElementById('noteAprovar')?.value.trim() || 'Aprovado';
  syncAndReopen(id, await handoffContent(id, {
    toOwner: null,
    pendingType: 'nenhuma',
    status: 'pronto',
    note,
  }));
}

async function actionDevolver(id) {
  const toOwner = document.getElementById('destDevolver')?.value;
  const note = document.getElementById('noteDevolver')?.value.trim();
  if (!note) { alert('Motivo da devolu\u00e7\u00e3o \u00e9 obrigat\u00f3rio.'); return; }
  if (!toOwner) { alert('Selecione o destino.'); return; }
  const item = pipeline.contents.find(c => c.id === id);
  const handoff = { toOwner, pendingType: 'nenhuma', note };
  if (item && item.status === 'revisao') handoff.status = 'em-producao';
  syncAndReopen(id, await handoffContent(id, handoff));
}

async function actionDecidir(id) {
  const note = document.getElementById('noteDecidir')?.value.trim();
  if (!note) { alert('Registre a decis\u00e3o.'); return; }
  const toOwner = document.getElementById('destDecidir')?.value || null;
  const pendingType = document.getElementById('pendDecidir')?.value || 'nenhuma';
  const nextAction = document.getElementById('nextActionDecidir')?.value.trim() || undefined;
  const item = pipeline.contents.find(c => c.id === id);
  const handoff = { toOwner, pendingType, note };
  if (pendingType === 'execucao' && nextAction) handoff.nextAction = nextAction;
  if (toOwner === 'Creator' && item && item.status === 'em-desenvolvimento') handoff.status = 'em-producao';
  syncAndReopen(id, await handoffContent(id, handoff));
}

async function actionDesbloquear(id) {
  const note = document.getElementById('noteDesbloquear')?.value.trim();
  if (!note) { alert('Nota de desbloqueio \u00e9 obrigat\u00f3ria.'); return; }
  const item = pipeline.contents.find(c => c.id === id);
  let toOwner = document.getElementById('destDesbloquear')?.value || null;
  // Active statuses require an owner
  if (!toOwner && item && ACTIVE_STATUSES.includes(item.status)) {
    alert('Conte\u00fado em status ativo requer um respons\u00e1vel. Selecione o destino.');
    return;
  }
  syncAndReopen(id, await handoffContent(id, {
    toOwner,
    pendingType: 'nenhuma',
    blockerReason: null,
    note,
  }));
}

function row(label, value) {
  const isNull = value === null || value === undefined;
  return `<div class="modal-row">
    <span class="modal-label">${label}</span>
    <span class="modal-value ${isNull ? 'null-val' : ''}">${isNull ? 'N\u00e3o informado' : escapeHtml(String(value))}</span>
  </div>`;
}

function renderHistory(history) {
  if (!history || history.length === 0) return '<div style="font-size:12px;color:var(--aubergine-50)">Sem registros</div>';
  return history.slice().reverse().map(h => {
    if (h.type === 'handoff') {
      return `<div class="history-entry">
        <span class="history-date">${formatDateTime(h.timestamp)}</span>
        <span class="history-type">handoff</span>
        <span class="history-move">${h.fromOwner || 'nenhum'} \u2192 ${h.toOwner || 'nenhum'}</span>
        ${h.pendingType && h.pendingType !== 'nenhuma' ? `<span class="badge badge-pending badge-pending-sm">${h.pendingType}</span>` : ''}
        ${h.statusFrom ? `<span class="history-status">${h.statusFrom} \u2192 ${h.statusTo}</span>` : ''}
        ${h.note ? `<div class="history-note">${escapeHtml(h.note)}</div>` : ''}
        <div class="history-meta">por ${h.agent} | r${h.revision}</div>
      </div>`;
    }
    if (h.type === 'service-run') {
      return `<div class="history-entry">
        <span class="history-date">${formatDateTime(h.timestamp)}</span>
        <span class="history-type">service</span>
        <span class="history-move">${h.agent}</span>
        ${h.note ? `<div class="history-note">${escapeHtml(h.note)}</div>` : ''}
        <div class="history-meta">solicitado por ${h.requestedBy} | r${h.revision}</div>
      </div>`;
    }
    if (h.type === 'migration') {
      return `<div class="history-entry history-migration">
        <span class="history-date">${formatDateTime(h.timestamp)}</span>
        <span class="history-type">migra\u00e7\u00e3o</span>
        ${h.note ? `<div class="history-note">${escapeHtml(h.note)}</div>` : ''}
      </div>`;
    }
    const from = h.from || 'novo';
    const to = h.to;
    return `<div class="history-entry">
      <span class="history-date">${formatDateTime(h.timestamp)}</span>
      ${h.type === 'status' ? '<span class="history-type">status</span>' : ''}
      <span class="history-move">${from} \u2192 ${to}</span>
      ${h.note ? `<div class="history-note">${escapeHtml(h.note)}</div>` : ''}
      ${h.agent ? `<div class="history-meta">por ${h.agent}${h.revision ? ' | r' + h.revision : ''}</div>` : ''}
    </div>`;
  }).join('');
}

/* === NEW CONTENT MODAL === */
document.getElementById('btnNew').addEventListener('click', () => {
  document.getElementById('newForm').reset();
  document.getElementById('newOverlay').classList.add('open');
  document.getElementById('newTitle').focus();
});

document.getElementById('newClose').addEventListener('click', closeNew);
document.getElementById('newCancel').addEventListener('click', closeNew);
document.getElementById('newOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeNew();
});

function closeNew() {
  document.getElementById('newOverlay').classList.remove('open');
}

document.getElementById('newForm').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('newTitle').value.trim();
  const territory = document.getElementById('newTerritory').value || null;
  const type = document.getElementById('newType').value || null;
  const note = document.getElementById('newNote').value.trim() || null;

  const territoryLabels = {
    A: 'Dor/endometriose/adenomiose',
    B: 'Perimenopausa/menopausa',
    C: 'Histeroscopia/p\u00f3lipos',
    D: 'Fertilidade',
    E: 'Contracep\u00e7\u00e3o',
    F: 'SOP/metabolismo/composi\u00e7\u00e3o corporal',
    TRANS: 'Transversal',
  };

  const result = await createContent({
    title,
    territory,
    territoryLabel: territory ? territoryLabels[territory] : null,
    type,
    note,
  });

  if (result) {
    pipeline.contents.push(result);
    render();
    closeNew();
  }
});

/* === DETAIL CLOSE === */
document.getElementById('detailClose').addEventListener('click', closeDetail);
document.getElementById('detailOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeDetail();
});

function closeDetail() {
  document.getElementById('detailOverlay').classList.remove('open');
}

/* === KEYBOARD === */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDetail();
    closeNew();
  }
});

/* === UTILS === */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('pt-BR');
}

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/* === INIT === */
fetchPipeline();
