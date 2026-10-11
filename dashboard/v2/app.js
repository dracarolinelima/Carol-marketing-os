// Marketing OS Dashboard v2
// Ported from Claude.ai Artifact (DCLogic) to vanilla JS
// Reads live data from /api/pipeline + /api/snapshot
// All edits are local simulation unless noted

(function () {
  'use strict';

  // =====================================================================
  // ICONS (SVG strings reused from Artifact)
  // =====================================================================
  const ICON = {
    grid: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg>',
    cal: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 10h18M8 3v4M16 3v4"></path></svg>',
    journey: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="2"></circle><circle cx="19" cy="18" r="2"></circle><path d="M7 6h5a4 4 0 0 1 0 8h-2a3 3 0 0 0 0 4h7"></path></svg>',
    prod: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"></path><path d="M3 13l9 5 9-5"></path></svg>',
    list: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"></path></svg>',
    chart: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M7 15l4-4 3 3 5-6"></path></svg>',
    plus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>',
    arrowR: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>',
    chevL: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"></path></svg>',
    chevR: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"></path></svg>',
    chevRSmall: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A808C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M9 6l6 6-6 6"></path></svg>',
  };

  // =====================================================================
  // CONSTANTS
  // =====================================================================
  const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const ABR = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const DOWS = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
  const WD = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  const STAGES = ['RECONHECER','ENTENDER','CONFIAR','PROCURAR'];
  const COLORS = {RECONHECER:'#D2C4FB',ENTENDER:'#B29BF3',CONFIAR:'#9478E6',PROCURAR:'#7B5BD6'};
  const STAGE_DESC = {RECONHECER:'Reconhecer um sintoma ou uma conexão',ENTENDER:'Entender o porquê e quando investigar',CONFIAR:'Confiar no raciocínio e na resolutividade',PROCURAR:'Saber para quem faz sentido e como funciona'};
  const FUNCS = ['DESCOBERTA','COMPREENSÃO','AUTORIDADE/RESOLUTIVIDADE','CONVERSÃO'];
  const STATUS = {backlog:'Backlog',selecionado:'Selecionado','em-desenvolvimento':'Em desenvolvimento','em-producao':'Em produção',revisao:'Revisão',pronto:'Pronto',publicado:'Publicado'};
  const SUBSTATUS = {'visual-production':'Produção visual'};
  const PENDING = {execucao:'Execução',aprovacao:'Aprovação',decisao:'Decisão',bloqueio:'Bloqueio'};
  const INFLIGHT = ['selecionado','em-desenvolvimento','em-producao','revisao','pronto'];
  const GREY = '#5A505C';
  const LOCALNOTE = 'Simulação local: não é gravada no MOS.';
  const JOURNEY = ['RECONHECER','ENTENDER','CONFIAR','PROCURAR'];
  const REFRESH_MS = 30000;

  // =====================================================================
  // DATE HELPERS
  // =====================================================================
  const parse = (iso) => { const p = iso.split('-').map(Number); return new Date(p[0], p[1]-1, p[2], 12, 0, 0); };
  const toISO = (d) => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const addDays = (iso, n) => { const d = parse(iso); d.setDate(d.getDate()+n); return toISO(d); };
  const mondayOf = (iso) => { const d = parse(iso); d.setDate(d.getDate()-((d.getDay()+6)%7)); return toISO(d); };
  const short = (iso) => iso.slice(8,10)+'/'+iso.slice(5,7);
  const weekLabel = (mon) => { const a=parse(mon),b=parse(addDays(mon,6)); return a.getMonth()===b.getMonth() ? a.getDate()+' a '+b.getDate()+' de '+MESES[b.getMonth()] : a.getDate()+' de '+ABR[a.getMonth()]+' a '+b.getDate()+' de '+ABR[b.getMonth()]; };
  const weekShort = (mon) => { const a=parse(mon),b=parse(addDays(mon,6)); return a.getDate()+' a '+b.getDate()+' '+ABR[b.getMonth()]; };
  const cap = (s) => s.charAt(0).toUpperCase()+s.slice(1);
  const parseJourney = (s) => (s ? String(s).split(/→|->/).map(x=>x.trim().toUpperCase()).filter(x=>JOURNEY.indexOf(x)>=0) : []);

  // =====================================================================
  // DOM HELPERS
  // =====================================================================
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'style' && typeof v === 'object') { Object.assign(el.style, v); continue; }
        if (k.startsWith('on')) { el.addEventListener(k.slice(2).toLowerCase(), v); continue; }
        if (k === 'innerHTML') { el.innerHTML = v; continue; }
        if (k === 'className') { el.className = v; continue; }
        el.setAttribute(k, v);
      }
    }
    for (const c of children) {
      if (c == null) continue;
      if (Array.isArray(c)) { c.forEach(x => { if (x) el.appendChild(x); }); continue; }
      if (typeof c === 'string' || typeof c === 'number') { el.appendChild(document.createTextNode(String(c))); continue; }
      el.appendChild(c);
    }
    return el;
  }

  // shorthand for inline-styled divs
  const div = (s, ...ch) => h('div', {style: s}, ...ch);
  const span = (s, ...ch) => h('span', {style: s}, ...ch);
  const btn = (cls, s, attrs, ...ch) => { const b = h('button', Object.assign({className: cls, style: s}, attrs), ...ch); return b; };

  // =====================================================================
  // ADAPTER (from Artifact, adapted for API)
  // =====================================================================
  function normalize(c) {
    const o = c.operational || {};
    const r = c.references || {};
    const rs = c.resolved || {};
    const hp = c.historicalProposal || null;
    const hasBrief = !!r.brief;
    const pkgId = rs.scientificPackageId || null;
    return {
      id: c.id, title: c.title,
      territory: {code: c.territory||null, label: c.territoryLabel||null},
      status: o.status||null, substatus: o.substatus||null,
      currentOwner: o.currentOwner||null, pendingType: o.pendingType||'nenhuma',
      nextAction: o.nextAction||null, revision: o.revision==null?null:o.revision,
      block: o.block||null, publishDate: o.publishDate||null,
      plannedWeek: null, type: c.type||null,
      refs: {brief:hasBrief, copy:!!r.approvedCopy, visual:!!r.visualBrief, pkg:!!r.scientificPackage},
      pkg: pkgId ? {id:pkgId, status:rs.scientificPackageStatus==='frozen'?'frozen':'todo'} : null,
      strategy: hasBrief ? {
        fn:rs.editorialFunction||null, journey:rs.journeyStage||null, stages:parseJourney(rs.journeyStage),
        objective:rs.strategicObjective||null, primaryJob:rs.primaryJob||null, desiredChange:rs.desiredChange||null,
        segment:rs.segment||null, coreMessage:rs.coreMessage||null, format:rs.format||null,
        caption:rs.caption===true?'Sim':(rs.caption===false?'Não':null)
      } : null,
      postUrl: c.postUrl || o.postUrl || null,
      platform: c.platform || null,
      metricsData: c.metrics || {},
      proposal: (!hasBrief && (hp || rs.format || rs.editorialFunction)) ? {
        source: hp?hp.source||null:null,
        journey: hp?hp.journeyStage||null:null,
        fn: (hp&&hp.editorialFunction)||rs.editorialFunction||null,
        objective: hp?hp.strategicObjective||null:null,
        format: rs.format||null,
        note: hp?hp.note||null:null
      } : null
    };
  }

  // Convert pipeline.json format to snapshot-v1 format
  function pipelineToSnapshot(pipeline) {
    return {
      metadata: {
        generatedAt: pipeline.lastUpdated || new Date().toISOString(),
        schemaVersion: 'pipeline-v2-live',
        sourcePipelineVersion: pipeline.version
      },
      contents: pipeline.contents.map(c => ({
        id: c.id, title: c.title, type: c.type || null,
        territory: c.territory, territoryLabel: c.territoryLabel,
        operational: {
          status: c.status, substatus: c.substatus || null,
          currentOwner: c.currentOwner || null, pendingType: c.pendingType || 'nenhuma',
          nextAction: c.nextAction || null, revision: c.revision,
          block: c.block || null, publishDate: c.publishDate || null
        },
        postUrl: c.postUrl || null,
        platform: c.platform || null,
        metrics: c.metrics || {},
        references: {
          approvedCopy: c.approvedCopy || null, visualBrief: c.visualBrief || null,
          scientificPackage: null, brief: null
        },
        resolved: {
          scientificPackageId: c.scientificPackage || null,
          scientificPackageStatus: c.scientificPackageStatus || null,
          format: c.format || null, editorialFunction: c.editorialFunction || null,
          journeyStage: c.journeyStage || null,
          strategicObjective: null, primaryJob: null, desiredChange: null,
          segment: null, coreMessage: null, caption: c.caption
        },
        historicalProposal: null,
        derived: {}
      }))
    };
  }

  // =====================================================================
  // MAIN APP CLASS
  // =====================================================================
  class MarketingOS {
    constructor(root) {
      this.root = root;
      this.state = { screen: 'visao', view: 'semana', cursor: toISO(new Date()), ov: {}, created: [], f: {terr:'',pkg:''}, bf: {terr:'',pkg:''} };
      this._snapshot = null;
      this._snapshotMeta = null;
      this._records = null;
      this._drag = null;
      this._toastTimer = null;
      this._refreshTimer = null;
      this._loading = true;
      this._lastPipelineUpdate = null;

      this.render();
      this.loadData();
    }

    async loadData() {
      try {
        // Try enriched snapshot first, fall back to pipeline
        let snap = null;
        try {
          const snapRes = await fetch('/api/snapshot');
          if (snapRes.ok) snap = await snapRes.json();
        } catch(e) { /* ignore */ }

        if (!snap) {
          const pRes = await fetch('/api/pipeline');
          if (!pRes.ok) throw new Error('Failed to load pipeline');
          const pipeline = await pRes.json();
          snap = pipelineToSnapshot(pipeline);
        }

        this._snapshot = snap;
        this._snapshotMeta = snap.metadata;
        this._records = snap.contents.map(normalize);
        this._loading = false;
        this._lastPipelineUpdate = snap.metadata.generatedAt || snap.metadata.sourcePipelineLastUpdated;
        this.render();

        // Auto-refresh
        this.scheduleRefresh();
      } catch(e) {
        this._loading = false;
        this._loadError = e.message;
        this.render();
      }
    }

    scheduleRefresh() {
      clearInterval(this._refreshTimer);
      this._refreshTimer = setInterval(() => this.refreshData(), REFRESH_MS);
    }

    async refreshData() {
      try {
        let snap = null;
        try {
          const snapRes = await fetch('/api/snapshot');
          if (snapRes.ok) snap = await snapRes.json();
        } catch(e) { /* ignore */ }
        if (!snap) {
          const pRes = await fetch('/api/pipeline');
          if (!pRes.ok) return;
          snap = pipelineToSnapshot(await pRes.json());
        }
        // Preserve local overlay by keeping state.ov and state.created
        this._snapshot = snap;
        this._snapshotMeta = snap.metadata;
        this._records = snap.contents.map(normalize);
        this._lastPipelineUpdate = snap.metadata.generatedAt || snap.metadata.sourcePipelineLastUpdated;
        this.render();
      } catch(e) { /* silent */ }
    }

    setState(patch) {
      Object.assign(this.state, patch);
      this.render();
    }

    // Records with local overlay applied
    records() {
      if (!this._records) return [];
      const ov = this.state.ov || {};
      const out = this._records.map(b => ov[b.id] ? Object.assign({}, b, ov[b.id], {local:true}) : Object.assign({}, b, {local:false}));
      (this.state.created||[]).forEach(c => out.push(Object.assign({}, c, {local:true})));
      return out;
    }

    baseOf(id) { return (this._records||[]).find(r => r.id === id) || null; }

    changeCount() { return Object.keys(this.state.ov||{}).length + (this.state.created||[]).length; }

    // Gateway (local simulation)
    patch(id, p) {
      const base = this.baseOf(id);
      if (base) {
        const ov = Object.assign({}, this.state.ov||{});
        const cur = Object.assign({}, ov[id]||{}, p);
        Object.keys(cur).forEach(k => { if (cur[k] === base[k]) delete cur[k]; });
        if (Object.keys(cur).length) ov[id] = cur; else delete ov[id];
        this.setState({ov});
      } else {
        this.setState({created: (this.state.created||[]).map(c => c.id===id ? Object.assign({},c,p) : c)});
      }
    }

    setPublishDate(id, iso) {
      const promote = () => { const c = this.records().find(r=>r.id===id); return c&&c.status==='backlog'?{status:'selecionado'}:{}; };
      this.patch(id, iso ? Object.assign({publishDate:iso,plannedWeek:null},promote()) : {publishDate:null});
    }
    planForWeek(id, monday) {
      const promote = () => { const c = this.records().find(r=>r.id===id); return c&&c.status==='backlog'?{status:'selecionado'}:{}; };
      this.patch(id, Object.assign({publishDate:null,plannedWeek:monday},promote()));
    }
    unplace(id) {
      const revert = () => { const c=this.records().find(r=>r.id===id),b=this.baseOf(id); return c&&b&&c.status==='selecionado'&&b.status==='backlog'?{status:'backlog'}:{}; };
      this.patch(id, Object.assign({publishDate:null,plannedWeek:null},revert()));
    }
    selectItem(id) { this.patch(id, {status:'selecionado'}); }
    unselectItem(id) { this.patch(id, {status:'backlog',publishDate:null,plannedWeek:null}); }
    discard(id) {
      const ov = Object.assign({}, this.state.ov||{}); delete ov[id];
      this.setState({ov});
    }
    discardAll() { this.setState({ov:{}, created:[]}); }
    createRecord() {
      const n = (this.state.created||[]).length + 1; const id = 'L'+n;
      this.setState({created:(this.state.created||[]).concat([{
        id, title:'Novo conteúdo', territory:{code:null,label:null}, status:'backlog', substatus:null,
        currentOwner:null, pendingType:'nenhuma', nextAction:null, revision:null, block:null,
        publishDate:null, plannedWeek:null, type:null, refs:{brief:false,copy:false,visual:false,pkg:false},
        pkg:null, strategy:null, proposal:null, createdLocal:true
      }])});
      return id;
    }

    // =====================================================================
    // API CALLS (real persistence, not local simulation)
    // =====================================================================
    async apiPublish(id, data) {
      try {
        const res = await fetch(`/api/content/${encodeURIComponent(id)}/publish`, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) { this.toast('Erro: ' + (result.message || res.status)); return null; }
        this.toast('Publicação registrada com sucesso.');
        await this.refreshData();
        return result;
      } catch(e) { this.toast('Erro de rede: ' + e.message); return null; }
    }

    async apiMetrics(id, data) {
      try {
        const res = await fetch(`/api/content/${encodeURIComponent(id)}/metrics`, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) { this.toast('Erro: ' + (result.message || res.status)); return null; }
        this.toast('Métricas registradas.');
        await this.refreshData();
        return result;
      } catch(e) { this.toast('Erro de rede: ' + e.message); return null; }
    }

    async apiUploadEvidence(id, file) {
      try {
        const res = await fetch(`/api/content/${encodeURIComponent(id)}/evidence-upload`, {
          method: 'POST', headers: {'Content-Type': file.type || 'image/png'},
          body: file
        });
        const result = await res.json();
        if (!res.ok) { this.toast('Erro no upload: ' + (result.message || res.status)); return null; }
        return result;
      } catch(e) { this.toast('Erro de rede: ' + e.message); return null; }
    }

    async apiGetMetrics(id) {
      try {
        const res = await fetch(`/api/content/${encodeURIComponent(id)}/metrics`);
        if (!res.ok) return null;
        return await res.json();
      } catch(e) { return null; }
    }

    toast(msg) {
      this.state.toast = msg;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { this.state.toast = ''; this.render(); }, 3200);
      this.render();
    }
    toastLocal(msg) { this.toast(msg + '. ' + LOCALNOTE); }

    // =====================================================================
    // DRAG AND DROP
    // =====================================================================
    dragStart(id) { return (e) => { this._drag = id; try { e.dataTransfer.setData('text/plain',id); e.dataTransfer.effectAllowed='move'; } catch(x){} }; }
    dragEnd() { this._drag = null; }
    allowDrop(key) { return (e) => { e.preventDefault(); }; }
    dropOn(action) { return (e) => {
      e.preventDefault();
      let id = this._drag;
      if (!id) try { id = e.dataTransfer.getData('text/plain'); } catch(x) { id=null; }
      this._drag = null;
      if (id) action(id);
    }; }

    // =====================================================================
    // RENDER HELPERS
    // =====================================================================
    stageColorOf(c) { return c.strategy&&c.strategy.stages[0] ? COLORS[c.strategy.stages[0]] : GREY; }
    journeyText(c) { return c.strategy&&c.strategy.journey ? c.strategy.journey : c.proposal ? 'Proposta histórica' : (c.territory.label||'Registro retroativo'); }
    objectiveOf(c) { return c.strategy ? c.strategy.objective : c.proposal ? c.proposal.objective : null; }
    statusLabel(c) { return (STATUS[c.status]||'Status não informado')+(c.local?' · local':''); }
    subLabel(s) { return s ? (SUBSTATUS[s]||cap(String(s).split('-').join(' '))) : ''; }
    blockLabel(b) { const m=/^B(\d+)$/.exec(b||''); return m?'Bloco '+m[1]:(b||''); }
    pkgLabel(c) { return c.pkg ? c.pkg.id+' · '+(c.pkg.status==='frozen'?'congelado':'a produzir') : 'Sem pacote associado'; }
    needsHuman(c) { return c.currentOwner==='Caroline' && c.pendingType && c.pendingType!=='nenhuma'; }
    catOf(c) { return c.status==='publicado'?'publicado':c.publishDate?'datado':c.plannedWeek?'planejado':'producao'; }

    catStyle(cat) {
      const m = {
        publicado:{label:'Publicado',color:'#78D0A5',bg:'rgba(95,191,143,0.10)',border:'1px solid rgba(95,191,143,0.35)'},
        datado:{label:'Data definida',color:'#8DB7F4',bg:'rgba(111,163,239,0.13)',border:'1px solid rgba(111,163,239,0.45)'},
        planejado:{label:'Planejado nesta simulação',color:'#8DB7F4',bg:'rgba(111,163,239,0.05)',border:'1px dashed rgba(111,163,239,0.55)'},
        producao:{label:null,color:'#CFC6D1',bg:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.14)'}
      };
      return m[cat]||m.producao;
    }

    // Build a content card for calendar
    buildCard(c) {
      const k = this.catStyle(this.catOf(c));
      const obj = this.objectiveOf(c);
      return h('div', {style:{minWidth:'0'}, draggable: c.status!=='publicado'?'true':undefined,
        onDragStart: this.dragStart(c.id), onDragEnd: () => this.dragEnd()},
        btn('row', {boxSizing:'border-box',width:'100%',padding:'10px',borderRadius:'8px',background:k.bg,border:k.border,color:'#F2EDF0',textAlign:'left',display:'flex',flexDirection:'column',gap:'5px'},
          {onClick: () => this.setState({detail:c.id})},
          span({display:'flex',justifyContent:'space-between',gap:'6px',fontSize:'10.5px',fontWeight:'600',letterSpacing:'.06em'},
            span({display:'flex',alignItems:'center',gap:'6px',color:c.strategy&&c.strategy.stages[0]?COLORS[c.strategy.stages[0]]:'#8A808C'},
              span({flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:this.stageColorOf(c)}),
              this.journeyText(c)),
            c.publishDate ? span({color:'#8DB7F4'}, short(c.publishDate)) : null),
          span({fontSize:'12.5px',fontWeight:'500',lineHeight:'1.3'}, c.title),
          span({fontSize:'11.5px',lineHeight:'1.4',color:c.strategy?'#CFC6D1':'#A59BA6'}, obj||(c.territory.label||'')),
          span({display:'flex',flexWrap:'wrap',alignItems:'center',gap:'2px 6px',fontSize:'11px',color:'#A59BA6'},
            span({flex:'none',width:'8px',height:'8px',boxSizing:'border-box',borderRadius:'50%',background:'transparent',border:'1px solid #8A808C'}),
            c.territory.label||'Território não informado',
            span({},' · '),
            span({color:c.status==='publicado'?'#78D0A5':(c.local?'#CDBDF8':'#A59BA6')}, this.statusLabel(c)))
        )
      );
    }

    // =====================================================================
    // RENDER
    // =====================================================================
    render() {
      const root = this.root;
      root.innerHTML = '';

      if (this._loading) {
        root.appendChild(div({display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#8A808C',fontSize:'14px'}, 'Carregando dados do MOS...'));
        return;
      }
      if (this._loadError) {
        root.appendChild(div({display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#E5636B',fontSize:'14px'}, 'Erro ao carregar: ' + this._loadError + '. O servidor está rodando na porta 3000?'));
        return;
      }

      const R = this.records();
      const st = this.state;
      const TODAY = toISO(new Date());
      const confirmed = R.filter(c => c.strategy);
      const screen = st.screen;
      const todayWeek = mondayOf(TODAY);
      const curWeek = mondayOf(st.cursor||TODAY);

      const wrapper = div({display:'flex',flexWrap:'wrap',background:'#110C13',color:'#F2EDF0',fontFamily:"'Montserrat',system-ui,sans-serif",fontSize:'13px',lineHeight:'1.45',minHeight:'100vh'});

      // ===== SIDEBAR =====
      const navItems = [
        {key:'visao',label:'Visão geral',icon:ICON.grid},
        {key:'calendario',label:'Calendário',icon:ICON.cal},
        {key:'jornada',label:'Jornada',icon:ICON.journey},
        {key:'producao',label:'Produção',icon:ICON.prod},
        {key:'backlog',label:'Backlog',icon:ICON.list},
        {key:'analise',label:'Análise',icon:ICON.chart},
      ];

      const sidebar = h('aside', {style:{flex:'1 1 216px',maxWidth:'100%',boxSizing:'border-box',background:'#0B080C',borderRight:'1px solid rgba(255,255,255,.05)',padding:'20px 12px 18px',display:'flex',flexDirection:'column',gap:'22px'}},
        // Logo
        div({display:'flex',alignItems:'center',gap:'10px',padding:'0 6px'},
          div({flex:'none',width:'30px',height:'30px',borderRadius:'8px',background:'#4A1C3C',color:'#B08D57',fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:'16px',fontWeight:'600',display:'flex',alignItems:'center',justifyContent:'center'},'CL'),
          div({},
            div({fontSize:'13px',fontWeight:'600',lineHeight:'1.2'},'Marketing OS'),
            div({fontSize:'11px',color:'#8A808C'},'Dra. Caroline Lima'))
        ),
        // New content button
        btn('btn2', {display:'flex',alignItems:'center',gap:'10px',height:'40px',padding:'0 12px',border:'1px solid rgba(255,255,255,.09)',borderRadius:'8px',background:'rgba(255,255,255,.06)',color:'#F2EDF0',fontSize:'13px',fontWeight:'500',textAlign:'left'},
          {onClick: () => { const id = this.createRecord(); this.setState({detail:id}); this.toastLocal('Novo conteúdo criado só nesta simulação'); }, innerHTML: ICON.plus + ' Novo conteúdo'}),
        // Nav
        h('nav', {style:{display:'flex',flexDirection:'column',gap:'2px'}},
          navItems.map(n => btn('nav', {display:'flex',alignItems:'center',gap:'12px',height:'40px',padding:'0 12px',border:'0',borderRadius:'8px',background:screen===n.key?'rgba(255,255,255,0.07)':'transparent',color:screen===n.key?'#F2EDF0':'#A59BA6',fontSize:'13px',fontWeight:'500',textAlign:'left'},
            {onClick: () => this.setState({screen:n.key}), innerHTML: n.icon + ' ' + n.label}))
        ),
        // Footer
        div({marginTop:'auto',padding:'0 6px',display:'flex',flexDirection:'column',gap:'8px',fontSize:'11px',lineHeight:'1.5',color:'#8A808C'},
          this._snapshotMeta ? div({}, 'Dados ao vivo do MOS. Atualização a cada 30s.') : null,
          this.changeCount() > 0 ? div({display:'flex',flexWrap:'wrap',alignItems:'center',gap:'6px 8px',padding:'8px 10px',borderRadius:'8px',background:'rgba(166,140,240,.12)',color:'#CDBDF8'},
            span({flex:'1 1 120px'}, this.changeCount()===1?'1 alteração local, não gravada no MOS':this.changeCount()+' alterações locais, não gravadas no MOS'),
            btn('btn2', {minHeight:'28px',padding:'0 10px',border:'0',borderRadius:'6px',background:'rgba(255,255,255,.08)',color:'#F2EDF0',fontSize:'11.5px',fontWeight:'600'},
              {onClick: () => { this.discardAll(); this.toast('Alterações locais descartadas'); }}, 'Descartar')
          ) : null
        )
      );
      wrapper.appendChild(sidebar);

      // ===== MAIN CONTENT =====
      let main;
      switch(screen) {
        case 'visao': main = this.renderVisao(R, confirmed, TODAY, todayWeek); break;
        case 'calendario': main = this.renderCalendario(R, TODAY, todayWeek, curWeek); break;
        case 'jornada': main = this.renderJornada(R, confirmed); break;
        case 'producao': main = this.renderProducao(R); break;
        case 'backlog': main = this.renderBacklog(R); break;
        case 'analise': main = this.renderAnalise(R, confirmed); break;
        default: main = this.renderVisao(R, confirmed, TODAY, todayWeek);
      }
      wrapper.appendChild(main);
      root.appendChild(wrapper);

      // Detail modal
      if (st.detail) {
        const sel = R.find(c => c.id === st.detail);
        if (sel) root.appendChild(this.renderDetail(sel, R, TODAY, todayWeek));
      }

      // Toast
      if (st.toast) {
        root.appendChild(div({position:'fixed',left:'50%',bottom:'28px',transform:'translateX(-50%)',zIndex:'60',maxWidth:'90%',padding:'11px 16px',borderRadius:'8px',background:'#2A2130',border:'1px solid rgba(255,255,255,.1)',color:'#F2EDF0',fontSize:'12.5px'}, st.toast));
      }
    }

    // =====================================================================
    // VISÃO GERAL
    // =====================================================================
    renderVisao(R, confirmed, TODAY, todayWeek) {
      const humanList = R.filter(c => this.needsHuman(c));
      const inflightRecs = R.filter(c => INFLIGHT.indexOf(c.status)>=0);
      const backlogRecs = R.filter(c => c.status==='backlog');
      const pubRecs = R.filter(c => c.status==='publicado');
      const td = parse(TODAY);
      const stageFilter = this.state.stage||null;

      const main = h('main', {style:{flex:'999 1 560px',minWidth:'0',boxSizing:'border-box',padding:'24px 28px 32px',display:'flex',flexDirection:'column',gap:'20px'}});

      // Header
      main.appendChild(div({display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'baseline',gap:'6px'},
        h('h1',{style:{margin:'0',fontSize:'20px',fontWeight:'600',letterSpacing:'-.01em'}},'Visão geral'),
        div({fontSize:'12px',color:'#8A808C'}, cap(WD[td.getDay()])+', '+td.getDate()+' de '+MESES[td.getMonth()]+' de '+td.getFullYear())
      ));

      const grid = div({display:'flex',flexWrap:'wrap',gap:'16px',alignItems:'flex-start'});

      // === AGORA column ===
      const agoraCol = div({flex:'1.5 1 440px',minWidth:'0',display:'flex',flexDirection:'column',gap:'12px'});

      agoraCol.appendChild(div({display:'flex',alignItems:'baseline',gap:'10px',padding:'0 2px'},
        span({flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#A68CF0',alignSelf:'center'}),
        span({fontSize:'11px',letterSpacing:'.16em',fontWeight:'600'},'AGORA'),
        span({fontSize:'12px',color:'#8A808C'},'o que depende de você')
      ));

      // Needs section
      const needsSection = div({background:'#231B2E',border:'1px solid rgba(166,140,240,.26)',borderRadius:'12px',padding:'20px',display:'flex',flexDirection:'column',gap:'16px'});
      needsSection.appendChild(div({display:'flex',justifyContent:'space-between',alignItems:'baseline'},
        div({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Precisa de você'),
        div({fontSize:'12px',color:'#A59BA6'}, humanList.length===1?'1 ação':humanList.length+' ações')
      ));

      const needsGrid = div({display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:'8px'});
      [['execucao','Execução'],['aprovacao','Aprovação'],['decisao','Decisão'],['bloqueio','Bloqueio']].forEach(([k,label]) => {
        const n = humanList.filter(c=>c.pendingType===k).length;
        needsGrid.appendChild(btn('btn2',{padding:'10px 12px',border:'0',borderRadius:'8px',background:n>0?'rgba(166,140,240,.2)':'rgba(255,255,255,.04)',color:'#F2EDF0',textAlign:'left',display:'flex',flexDirection:'column',gap:'2px'},
          {onClick:()=>this.setState({screen:'producao'})},
          span({fontSize:'24px',fontWeight:'600',lineHeight:'1.1',color:n>0?'#CDBDF8':'#8A808C'},String(n)),
          span({fontSize:'11.5px',color:'#A59BA6'},label)
        ));
      });
      needsSection.appendChild(needsGrid);

      // Task cards
      humanList.forEach(c => {
        const card = div({background:'#1A1420',border:'1px solid rgba(255,255,255,.07)',borderRadius:'10px',padding:'18px',display:'flex',flexDirection:'column',gap:'10px'});
        card.appendChild(div({display:'flex',flexWrap:'wrap',alignItems:'center',gap:'8px 12px'},
          span({padding:'2px 8px',borderRadius:'4px',background:'rgba(166,140,240,.2)',color:'#CDBDF8',fontSize:'11px',fontWeight:'600'}, PENDING[c.pendingType]||cap(c.pendingType)),
          span({fontSize:'12px',color:'#A59BA6'}, c.id+' · revisão '+(c.revision==null?'não informada':c.revision))
        ));
        card.appendChild(div({fontSize:'19px',fontWeight:'600',lineHeight:'1.3',letterSpacing:'-.01em'}, c.nextAction||'Próxima ação não informada'));
        card.appendChild(div({display:'flex',flexWrap:'wrap',alignItems:'center',gap:'4px 14px',fontSize:'12.5px',color:'#A59BA6'},
          span({},c.title),
          span({display:'flex',alignItems:'center',gap:'6px',fontWeight:'600',letterSpacing:'.06em',color:'#CDBDF8'},
            span({flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:this.stageColorOf(c)}),
            c.strategy&&c.strategy.journey?c.strategy.journey:'Etapa não informada'),
          span({},'Publicação: '+(c.publishDate?short(c.publishDate):'sem data'))
        ));
        card.appendChild(div({display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'6px'},
          btn('btn1',{minHeight:'40px',padding:'0 16px',border:'0',borderRadius:'8px',background:'#6F52D1',color:'#FFFFFF',fontSize:'13px',fontWeight:'600'},
            {onClick:()=>this.setState({detail:c.id})}, 'Abrir '+c.id)
        ));
        needsSection.appendChild(card);
      });

      if (humanList.length===0) needsSection.appendChild(div({padding:'14px 4px',fontSize:'13px',color:'#A59BA6'},'Nenhuma pendência sua registrada.'));
      agoraCol.appendChild(needsSection);

      // In-flight section
      const inflightSec = div({background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'16px 14px 16px',display:'flex',flexDirection:'column',gap:'4px'});
      inflightSec.appendChild(div({display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:'6px',padding:'0 6px 6px'},
        div({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#A59BA6'},'Em andamento · '+inflightRecs.length),
        div({display:'flex',alignItems:'center',gap:'12px'},
          stageFilter ? btn('', {minHeight:'28px',padding:'0 10px',border:'0',borderRadius:'6px',background:'rgba(166,140,240,.18)',color:'#CDBDF8',fontSize:'11.5px',fontWeight:'600'},{onClick:()=>this.setState({stage:null})}, stageFilter+' ×') : null,
          btn('lnk',{minHeight:'32px',padding:'0',border:'0',background:'none',color:'#A59BA6',fontSize:'12px',fontWeight:'500'},{onClick:()=>this.setState({screen:'producao'})},'Ver produção →')
        )
      ));

      inflightRecs.forEach(c => {
        const dim = stageFilter && !(c.strategy&&c.strategy.stages.indexOf(stageFilter)>=0) ? '0.35' : '1';
        inflightSec.appendChild(btn('row',{boxSizing:'border-box',width:'100%',padding:'10px 6px',border:'0',borderRadius:'8px',background:'transparent',color:'#F2EDF0',textAlign:'left',display:'flex',gap:'12px',alignItems:'flex-start',opacity:dim},
          {onClick:()=>this.setState({detail:c.id})},
          span({flex:'none',width:'26px',paddingTop:'1px',fontSize:'12px',fontWeight:'600',color:'#8A808C'},c.id),
          span({flex:'1 1 auto',minWidth:'0',display:'flex',flexDirection:'column',gap:'3px'},
            span({fontSize:'13.5px',fontWeight:'500'},c.title),
            span({display:'flex',flexWrap:'wrap',alignItems:'center',gap:'2px 12px',fontSize:'12px',color:'#A59BA6'},
              span({display:'flex',alignItems:'center',gap:'6px',letterSpacing:'.04em'},
                span({flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:this.stageColorOf(c)}),
                c.strategy&&c.strategy.journey?c.strategy.journey:'Etapa não informada'),
              span({}, STATUS[c.status]+(c.substatus?' · '+this.subLabel(c.substatus):'')+(c.local?' · local':''))
            ),
            span({fontSize:'12px',color:c.nextAction?'#A59BA6':'#8A808C'},'→ '+(c.nextAction||'Próxima ação não informada'))
          ),
          span({flex:'none',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px',fontSize:'12px'},
            span({color:c.publishDate?'#8DB7F4':'#8A808C'}, c.publishDate?'Publicação '+short(c.publishDate):'Sem data de publicação'),
            this.needsHuman(c) ? span({padding:'1px 7px',borderRadius:'4px',background:'rgba(166,140,240,.2)',color:'#CDBDF8',fontSize:'11px',fontWeight:'600'},'Sua '+(PENDING[c.pendingType]||c.pendingType).toLowerCase()) : null
          )
        ));
      });
      if (inflightRecs.length===0) inflightSec.appendChild(div({padding:'10px 6px',fontSize:'12.5px',color:'#8A808C'},'Nenhum conteúdo em andamento.'));

      // Pipeline bar
      const barData = [{label:'em andamento',n:inflightRecs.length,color:'#CFC6D1'},{label:'backlog',n:backlogRecs.length,color:'#4B424D'},{label:'publicado',n:pubRecs.length,color:'#5FBF8F'}].filter(p=>p.n>0);
      if (barData.length) {
        const barWrap = div({margin:'8px 6px 0',paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,.06)'});
        const bar = div({display:'flex',height:'6px',borderRadius:'3px',overflow:'hidden',gap:'2px'});
        barData.forEach(p => bar.appendChild(div({flex:p.n+' 1 0',background:p.color})));
        barWrap.appendChild(bar);
        const legend = div({display:'flex',flexWrap:'wrap',gap:'4px 16px',marginTop:'8px',fontSize:'11.5px',color:'#A59BA6'});
        barData.forEach(p => legend.appendChild(span({display:'flex',alignItems:'center',gap:'6px'},span({width:'7px',height:'7px',borderRadius:'50%',background:p.color}),p.n+' '+p.label)));
        barWrap.appendChild(legend);
        inflightSec.appendChild(barWrap);
      }
      agoraCol.appendChild(inflightSec);
      grid.appendChild(agoraCol);

      // === DEPOIS column ===
      const depoisCol = div({flex:'1 1 300px',minWidth:'0',display:'flex',flexDirection:'column',gap:'12px'});
      depoisCol.appendChild(div({display:'flex',alignItems:'baseline',gap:'10px',padding:'0 2px'},
        span({flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#6FA3EF',alignSelf:'center'}),
        span({fontSize:'11px',letterSpacing:'.16em',fontWeight:'600'},'DEPOIS'),
        span({fontSize:'12px',color:'#8A808C'},'o que vem a seguir')
      ));

      // This week
      const weekSec = div({background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'16px 14px 14px',display:'flex',flexDirection:'column',gap:'4px'});
      weekSec.appendChild(div({display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'0 6px'},
        div({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#8DB7F4'},'Esta semana'),
        btn('lnk',{minHeight:'32px',padding:'0',border:'0',background:'none',color:'#A59BA6',fontSize:'12px',fontWeight:'500'},{onClick:()=>this.setState({screen:'calendario',view:'semana',cursor:TODAY})},'Abrir no calendário →')
      ));
      weekSec.appendChild(div({padding:'0 6px 6px',fontSize:'15px',fontWeight:'600'}, weekLabel(todayWeek)));

      [0,1,2,3,4,5,6].forEach(i => {
        const iso = addDays(todayWeek, i);
        const entries = R.filter(c => c.publishDate===iso);
        const today = iso === TODAY;
        const row = div({display:'flex',gap:'12px',alignItems:'flex-start',padding:'8px 6px',borderRadius:'8px',background:today?'rgba(111,163,239,0.1)':'transparent'});
        row.appendChild(div({flex:'none',width:'34px',display:'flex',flexDirection:'column',alignItems:'flex-start'},
          span({fontSize:'10px',letterSpacing:'.1em',fontWeight:'600',color:today?'#8DB7F4':'#8A808C'},DOWS[i]),
          span({fontSize:'17px',fontWeight:'600',lineHeight:'1.15',color:today?'#8DB7F4':'#F2EDF0'},iso.slice(8,10))
        ));
        const entryCol = div({flex:'1 1 auto',minWidth:'0',display:'flex',flexDirection:'column',gap:'4px'});
        if (entries.length) {
          entries.forEach(e => {
            entryCol.appendChild(btn('row',{boxSizing:'border-box',width:'100%',padding:'6px 8px',margin:'-2px -8px',border:'0',borderRadius:'6px',background:'transparent',color:'#F2EDF0',textAlign:'left',display:'flex',flexDirection:'column',gap:'2px'},
              {onClick:()=>this.setState({detail:e.id})},
              span({display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',fontWeight:'500'},
                span({flex:'none',width:'8px',height:'8px',borderRadius:'50%',background:this.catStyle(this.catOf(e)).color}), e.title),
              span({fontSize:'11.5px',color:'#A59BA6'},(e.strategy&&e.strategy.journey?e.strategy.journey+' · ':'')+(STATUS[e.status]||''))
            ));
          });
        } else {
          entryCol.appendChild(div({paddingTop:'8px',fontSize:'12px',color:'#8A808C'},'Sem conteúdo com data'));
        }
        row.appendChild(entryCol);
        if (today) row.appendChild(span({flex:'none',paddingTop:'3px',fontSize:'11px',fontWeight:'600',color:'#8DB7F4'},'hoje'));
        weekSec.appendChild(row);
      });

      // No-date chips
      const nodate = R.filter(c => c.status!=='publicado'&&c.status!=='backlog'&&!c.publishDate);
      if (nodate.length) {
        const nd = div({margin:'6px 6px 0',paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,.06)',display:'flex',flexWrap:'wrap',alignItems:'center',gap:'8px'});
        nd.appendChild(span({fontSize:'12px',fontWeight:'600',color:'#CDBDF8'},'Em andamento, sem data de publicação'));
        nodate.forEach(c => nd.appendChild(btn('btn2',{minHeight:'28px',padding:'0 10px',border:'0',borderRadius:'6px',background:'rgba(166,140,240,.16)',color:'#CDBDF8',fontSize:'12px',fontWeight:'600'},{onClick:()=>this.setState({detail:c.id})},c.id)));
        weekSec.appendChild(nd);
      }
      depoisCol.appendChild(weekSec);

      // Próximos passos
      const upcoming = R.filter(c=>c.publishDate&&c.publishDate>=TODAY&&c.status!=='publicado').sort((a,b)=>a.publishDate<b.publishDate?-1:1)[0];
      const frozenPk = [...new Set(R.filter(c=>c.pkg&&c.pkg.status==='frozen').map(c=>c.pkg.id))].sort();
      const todoPk = [...new Set(R.filter(c=>c.pkg&&c.pkg.status==='todo').map(c=>c.pkg.id))].sort();
      const nextSteps = [
        {label:'Próxima publicação', value: upcoming?upcoming.title+' · '+short(upcoming.publishDate):'Nenhum conteúdo com data de publicação definida', go:()=>this.setState({screen:'calendario',view:'semana',cursor:upcoming?upcoming.publishDate:TODAY})},
        {label:'Pacotes científicos', value:'Congelados: '+(frozenPk.join(', ')||'nenhum')+'. A produzir: '+(todoPk.join(', ')||'nenhum'), go:()=>this.setState({screen:'backlog'})},
        {label:'Próximo trabalho estratégico', value:'Ainda não definido pelo Strategist', go:()=>this.setState({screen:'jornada'})},
        {label:'Backlog', value:R.filter(c=>c.status==='backlog').length+' propostas históricas do calendário v1, aguardando seleção', go:()=>this.setState({screen:'backlog'})},
      ];
      const nextSec = div({background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'16px 14px 8px',display:'flex',flexDirection:'column'});
      nextSec.appendChild(div({padding:'0 6px 6px',fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#8DB7F4'},'Próximos passos'));
      nextSteps.forEach(x => {
        nextSec.appendChild(btn('row',{boxSizing:'border-box',width:'100%',padding:'10px 6px',border:'0',borderTop:'1px solid rgba(255,255,255,.06)',borderRadius:'0',background:'transparent',color:'#F2EDF0',textAlign:'left',display:'flex',gap:'10px',alignItems:'flex-start'},
          {onClick:x.go},
          span({flex:'1 1 auto',minWidth:'0',display:'flex',flexDirection:'column',gap:'2px'},
            span({fontSize:'11.5px',color:'#8A808C'},x.label),
            span({fontSize:'13px',lineHeight:'1.4'},x.value)),
          span({flex:'none',paddingTop:'14px',color:'#6FA3EF',innerHTML:ICON.arrowR})
        ));
      });
      depoisCol.appendChild(nextSec);
      grid.appendChild(depoisCol);

      // === CONTEXTO column ===
      const ctxCol = div({flex:'1.15 1 340px',minWidth:'0',display:'flex',flexDirection:'column',gap:'12px'});
      ctxCol.appendChild(div({display:'flex',alignItems:'baseline',gap:'10px',padding:'0 2px'},
        span({flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:'#8466DB',alignSelf:'center'}),
        span({fontSize:'11px',letterSpacing:'.16em',fontWeight:'600'},'CONTEXTO'),
        span({fontSize:'12px',color:'#8A808C'},'para onde vai a estratégia')
      ));

      // Bloco atual
      const blocked = R.filter(c=>c.block);
      const blockCodes = [...new Set(blocked.map(c=>c.block))];
      const blockTerr = [...new Set(blocked.map(c=>c.territory.label).filter(Boolean))];
      const transRecs = R.filter(c=>c.territory.code==='TRANS'&&c.status!=='backlog');

      const blocoSec = div({background:'#1D1620',border:'1px solid rgba(166,140,240,.2)',borderRadius:'12px',padding:'20px',display:'flex',flexDirection:'column',gap:'14px'});
      blocoSec.appendChild(div({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Bloco atual'));
      blocoSec.appendChild(h('h2',{style:{margin:'0',fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:'36px',fontWeight:'500',lineHeight:'1.05',letterSpacing:'-.005em'}}, blockCodes.length?blockCodes.map(b=>this.blockLabel(b)).join(' · '):'Bloco não informado'));
      blocoSec.appendChild(div({fontSize:'13px',color:'#CFC6D1'}, blocked.length?blockTerr.join(' · '):'Nenhum conteúdo tem bloco atribuído'));
      if (blocked.length) blocoSec.appendChild(div({fontSize:'12px',lineHeight:'1.5',color:'#8A808C'}, 'Conteúdo no bloco: '+blocked.map(c=>c.id+' '+c.title).join('; ')));

      const alwaysOn = div({paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,.06)',display:'flex',flexDirection:'column',gap:'8px'});
      alwaysOn.appendChild(div({display:'flex',alignItems:'center',gap:'10px',fontSize:'12.5px'},
        span({flex:'none',width:'9px',height:'9px',boxSizing:'border-box',borderRadius:'50%',border:'1.5px solid #8A808C'}),
        span({color:'#8A808C',width:'82px',flex:'none'},'Always-on'),
        span({color:'#8A808C'},'não informado no snapshot')));
      transRecs.forEach(t => {
        alwaysOn.appendChild(div({display:'flex',alignItems:'center',gap:'10px',fontSize:'12.5px'},
          span({flex:'none',width:'9px',height:'9px',boxSizing:'border-box',borderRadius:'50%',border:'1.5px dashed #CFC6D1'}),
          span({color:'#8A808C',width:'82px',flex:'none'},'Transversal'),
          span({minWidth:'0'},t.title),
          span({marginLeft:'auto',flex:'none',fontSize:'11.5px',color:t.status==='publicado'?'#78D0A5':'#8A808C'}, STATUS[t.status]+(t.status==='publicado'&&t.publishDate?' '+short(t.publishDate):''))
        ));
      });
      blocoSec.appendChild(alwaysOn);
      ctxCol.appendChild(blocoSec);

      // Jornada editorial
      const stageCount = (k) => confirmed.filter(c=>c.strategy.stages.indexOf(k)>=0).length;
      const jorSec = div({background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'16px 14px 12px',display:'flex',flexDirection:'column',gap:'10px'});
      jorSec.appendChild(div({display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'baseline',gap:'4px',padding:'0 6px'},
        div({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Jornada editorial'),
        div({fontSize:'11.5px',color:'#8A808C'},'clique para filtrar')
      ));
      // Journey bar
      const jBarData = STAGES.filter(k=>stageCount(k)>0).map(k=>({n:stageCount(k),color:COLORS[k]}));
      if (jBarData.length) {
        const jbar = div({margin:'0 6px',display:'flex',height:'6px',borderRadius:'3px',overflow:'hidden',gap:'2px',background:'rgba(255,255,255,.05)'});
        jBarData.forEach(p=>jbar.appendChild(div({flex:p.n+' 1 0',background:p.color})));
        jorSec.appendChild(jbar);
      }
      const stagesCol = div({display:'flex',flexDirection:'column'});
      STAGES.forEach(k => {
        const n = stageCount(k);
        stagesCol.appendChild(btn('row',{boxSizing:'border-box',width:'100%',padding:'8px 6px',border:'0',borderRadius:'8px',background:stageFilter===k?'rgba(166,140,240,0.18)':'transparent',color:'#F2EDF0',textAlign:'left',display:'flex',gap:'10px',alignItems:'center'},
          {onClick:()=>this.setState({stage:this.state.stage===k?null:k})},
          span({flex:'none',width:'9px',height:'9px',borderRadius:'50%',background:COLORS[k]}),
          span({flex:'1 1 auto',minWidth:'0',display:'flex',flexDirection:'column'},
            span({fontSize:'12px',fontWeight:'600',letterSpacing:'.06em'},k),
            span({fontSize:'11.5px',color:'#8A808C'},STAGE_DESC[k])),
          span({flex:'none',fontSize:n>0?'18px':'11.5px',fontWeight:'600',color:n>0?'#F2EDF0':'#8A808C'}, n>0?String(n):'nenhum')
        ));
      });
      jorSec.appendChild(stagesCol);
      jorSec.appendChild(div({padding:'0 6px',fontSize:'11.5px',lineHeight:'1.5',color:'#8A808C'}, 'Leitura baseada em '+confirmed.length+(confirmed.length===1?' conteúdo com brief.':' conteúdos com brief.')+' Propostas históricas do backlog não entram aqui.'));
      ctxCol.appendChild(jorSec);

      // Bloqueios
      const blockItems = R.filter(c=>c.pendingType==='bloqueio');
      const blockSec = div({background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'16px 20px',display:'flex',flexDirection:'column',gap:'8px'});
      blockSec.appendChild(div({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Bloqueios'));
      if (blockItems.length) {
        blockItems.forEach(c => blockSec.appendChild(btn('row',{boxSizing:'border-box',width:'100%',padding:'6px',border:'0',borderRadius:'8px',background:'transparent',color:'#F2EDF0',textAlign:'left',display:'flex',gap:'10px',alignItems:'flex-start',fontSize:'12.5px',lineHeight:'1.45'},{onClick:()=>this.setState({detail:c.id})},
          span({flex:'none',width:'7px',height:'7px',marginTop:'7px',borderRadius:'50%',background:'#E5636B'}),
          span({color:'#F29A9F'},c.id+' · '+c.title+': '+(c.nextAction||'bloqueio registrado'))
        )));
      } else {
        blockSec.appendChild(div({fontSize:'12.5px',color:'#A59BA6'},'Sem bloqueios operacionais registrados.'));
      }
      ctxCol.appendChild(blockSec);
      grid.appendChild(ctxCol);
      main.appendChild(grid);
      return main;
    }

    // =====================================================================
    // CALENDÁRIO
    // =====================================================================
    renderCalendario(R, TODAY, todayWeek, curWeek) {
      const st = this.state;
      const isWeek = st.view==='semana';
      const isMonth = st.view==='mes';
      const cursor = st.cursor||TODAY;

      const first = (() => { const d=parse(cursor); d.setDate(1); return toISO(d); })();
      const calTitle = isWeek ? weekLabel(curWeek)+' de '+parse(curWeek).getFullYear() : cap(MESES[parse(first).getMonth()])+' de '+parse(first).getFullYear();
      const shiftMonth = (delta) => { const d=parse(cursor); d.setDate(1); d.setMonth(d.getMonth()+delta); return toISO(d); };

      const main = h('main', {style:{flex:'999 1 560px',minWidth:'0',boxSizing:'border-box',padding:'24px 28px 40px',display:'flex',flexDirection:'column',gap:'16px'}});

      // Header
      const header = div({display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'flex-end',gap:'12px'});
      header.appendChild(div({},
        h('h1',{style:{margin:'0',fontSize:'20px',fontWeight:'600',letterSpacing:'-.01em'}},'Calendário'),
        div({marginTop:'4px',fontSize:'13px',color:'#A59BA6'},calTitle),
        div({marginTop:'2px',fontSize:'11.5px',color:'#8A808C'},'Mover, editar e planejar aqui é simulação local. Nada é gravado no MOS.')
      ));
      const controls = div({display:'flex',flexWrap:'wrap',gap:'10px',alignItems:'center'});
      // View toggle
      const toggle = div({display:'flex',padding:'3px',background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'9px'});
      toggle.appendChild(h('button',{style:{height:'34px',padding:'0 16px',border:'0',borderRadius:'6px',background:isMonth?'rgba(166,140,240,.22)':'transparent',color:isMonth?'#E3D9FB':'#A59BA6',fontSize:'12.5px',fontWeight:'600'},onClick:()=>this.setState({view:'mes'})},'Mês'));
      toggle.appendChild(h('button',{style:{height:'34px',padding:'0 16px',border:'0',borderRadius:'6px',background:isWeek?'rgba(166,140,240,.22)':'transparent',color:isWeek?'#E3D9FB':'#A59BA6',fontSize:'12.5px',fontWeight:'600'},onClick:()=>this.setState({view:'semana'})},'Semana'));
      controls.appendChild(toggle);
      const navBtns = div({display:'flex',gap:'6px'});
      navBtns.appendChild(btn('btn2',{width:'40px',height:'40px',border:'1px solid rgba(255,255,255,.09)',borderRadius:'8px',background:'rgba(255,255,255,.05)',color:'#F2EDF0',display:'flex',alignItems:'center',justifyContent:'center'},{onClick:()=>this.setState({cursor:isWeek?addDays(cursor,-7):shiftMonth(-1)}),innerHTML:ICON.chevL}));
      navBtns.appendChild(btn('btn2',{height:'40px',padding:'0 14px',border:'1px solid rgba(255,255,255,.09)',borderRadius:'8px',background:'rgba(255,255,255,.05)',color:'#F2EDF0',fontSize:'12.5px',fontWeight:'600'},{onClick:()=>this.setState({cursor:TODAY})},'Hoje'));
      navBtns.appendChild(btn('btn2',{width:'40px',height:'40px',border:'1px solid rgba(255,255,255,.09)',borderRadius:'8px',background:'rgba(255,255,255,.05)',color:'#F2EDF0',display:'flex',alignItems:'center',justifyContent:'center'},{onClick:()=>this.setState({cursor:isWeek?addDays(cursor,7):shiftMonth(1)}),innerHTML:ICON.chevR}));
      controls.appendChild(navBtns);
      header.appendChild(controls);
      main.appendChild(header);

      if (isWeek) {
        // Strategic focus
        const blocked = R.filter(c=>c.block);
        const blockCodes = [...new Set(blocked.map(c=>c.block))];
        const blockTerr = [...new Set(blocked.map(c=>c.territory.label).filter(Boolean))];
        const stratSec = div({background:'#1D1620',border:'1px solid rgba(166,140,240,.28)',borderRadius:'12px',padding:'20px',display:'flex',flexDirection:'column',gap:'16px'});
        stratSec.appendChild(div({display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'baseline',gap:'4px 16px'},
          div({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Foco estratégico'),
          btn('lnk',{minHeight:'32px',padding:'0',border:'0',background:'none',color:'#A59BA6',fontSize:'12px',fontWeight:'500'},{onClick:()=>this.setState({screen:'jornada'})},'Ver Jornada →')
        ));
        stratSec.appendChild(div({display:'flex',flexWrap:'wrap',gap:'16px 40px',alignItems:'flex-start'},
          div({flex:'0 1 360px',minWidth:'0'},
            div({fontSize:'11.5px',color:'#8A808C'},'Bloco atual'),
            div({marginTop:'2px',fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:'28px',fontWeight:'500',lineHeight:'1.1'}, blockCodes.length?blockCodes.map(b=>this.blockLabel(b)).join(' · ')+' · '+blockTerr.join(' / '):'Bloco não informado no snapshot')
          ),
          div({flex:'1 1 320px',minWidth:'0',display:'flex',flexDirection:'column',gap:'6px'},
            div({fontSize:'11.5px',color:'#8A808C'},'Próximo trabalho estratégico'),
            div({fontSize:'14px',color:'#CFC6D1'},'Ainda não definido pelo Strategist')
          )
        ));
        main.appendChild(stratSec);

        // Legend
        const legendData = [
          {label:'Em andamento, sem data',bg:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.3)'},
          {label:'Planejado na simulação local',bg:'rgba(111,163,239,0.05)',border:'1px dashed rgba(111,163,239,0.8)'},
          {label:'Data definida',bg:'rgba(111,163,239,0.25)',border:'1px solid rgba(111,163,239,0.7)'},
          {label:'Publicado',bg:'rgba(95,191,143,0.25)',border:'1px solid rgba(95,191,143,0.6)'},
        ];
        const planSec = div({display:'flex',flexDirection:'column',gap:'12px'});
        const planHeader = div({display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:'8px 20px',padding:'0 2px'});
        planHeader.appendChild(span({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#8DB7F4'},'Plano da semana'));
        const legendRow = div({display:'flex',flexWrap:'wrap',gap:'6px 16px',fontSize:'11.5px',color:'#A59BA6'});
        legendData.forEach(l => legendRow.appendChild(span({display:'flex',alignItems:'center',gap:'7px'},
          span({flex:'none',width:'12px',height:'12px',boxSizing:'border-box',borderRadius:'3px',background:l.bg,border:l.border}),l.label)));
        planHeader.appendChild(legendRow);
        planSec.appendChild(planHeader);

        // Lane (planned for week, no day)
        const laneItems = R.filter(c=>c.plannedWeek===curWeek&&!c.publishDate&&c.status!=='publicado');
        const laneEl = div({padding:'10px 12px',borderRadius:'10px',border:'1px dashed rgba(111,163,239,.35)',background:'rgba(111,163,239,0.04)',onDragOver:this.allowDrop('lane'),onDrop:this.dropOn(id=>{this.planForWeek(id,curWeek);this.toastLocal('Planejado para '+weekShort(curWeek)+', sem dia');})});
        laneEl.appendChild(div({display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:'4px 12px',marginBottom:laneItems.length?'10px':'0'},
          span({fontSize:'12px',fontWeight:'600',color:'#8DB7F4'},'Escolhidos para a semana, sem dia · '+laneItems.length),
          span({fontSize:'11.5px',color:'#8A808C'},'Arraste para um dia para definir a data (simulação local)')
        ));
        const laneGrid = div({display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:'10px'});
        if (laneItems.length) laneItems.forEach(c => laneGrid.appendChild(this.buildCard(c)));
        else laneGrid.appendChild(div({fontSize:'12px',color:'#8A808C'},'Nada escolhido ainda. Use "Colocar nesta semana" nos conteúdos disponíveis, abaixo. Simulação local.'));
        laneEl.appendChild(laneGrid);
        planSec.appendChild(laneEl);

        // Week days grid
        const daysWrap = div({overflowX:'auto'});
        const daysGrid = div({minWidth:'980px',display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:'10px'});
        [0,1,2,3,4,5,6].forEach(i => {
          const iso = addDays(curWeek,i); const today = iso===TODAY;
          const items = R.filter(c=>c.publishDate===iso);
          const dayCol = div({boxSizing:'border-box',minHeight:'250px',padding:'10px',borderRadius:'12px',border:'1px solid rgba(255,255,255,.07)',background:today?'rgba(111,163,239,0.06)':'#171119',display:'flex',flexDirection:'column',gap:'8px',minWidth:'0',
            onDragOver:this.allowDrop(iso), onDrop:this.dropOn(id=>{this.setPublishDate(id,iso);this.toastLocal('Publicação em '+short(iso));})});
          const dayHead = div({display:'flex',alignItems:'baseline',gap:'8px',paddingBottom:'8px',borderBottom:'1px solid rgba(255,255,255,.07)'});
          dayHead.appendChild(span({fontSize:'10.5px',letterSpacing:'.1em',fontWeight:'600',color:today?'#8DB7F4':'#8A808C'},DOWS[i]));
          dayHead.appendChild(span({fontSize:'20px',fontWeight:'600',lineHeight:'1.1',color:today?'#8DB7F4':'#F2EDF0'},iso.slice(8,10)));
          if (today) dayHead.appendChild(span({marginLeft:'auto',fontSize:'11px',fontWeight:'600',color:'#8DB7F4'},'hoje'));
          dayCol.appendChild(dayHead);
          if (items.length) items.forEach(c => dayCol.appendChild(this.buildCard(c)));
          else dayCol.appendChild(div({marginTop:'6px',fontSize:'11.5px',lineHeight:'1.4',color:'#6F6573',textAlign:'center'},'Solte um conteúdo aqui'));
          daysGrid.appendChild(dayCol);
        });
        daysWrap.appendChild(daysGrid);
        planSec.appendChild(daysWrap);
        main.appendChild(planSec);
      }

      if (isMonth) {
        const lastDay = (() => { const d=parse(first); d.setMonth(d.getMonth()+1); d.setDate(0); return toISO(d); })();
        const monthWrap = div({overflowX:'auto'});
        const monthEl = div({minWidth:'1000px',display:'flex',flexDirection:'column',gap:'6px'});
        // DOW headers
        const dowHead = div({display:'grid',gridTemplateColumns:'112px repeat(7,minmax(0,1fr))',gap:'6px'});
        dowHead.appendChild(div({}));
        DOWS.forEach(d => dowHead.appendChild(div({padding:'0 4px',fontSize:'10.5px',letterSpacing:'.1em',fontWeight:'600',color:'#8A808C'},d)));
        monthEl.appendChild(dowHead);

        let mon = mondayOf(first);
        while (mon <= lastDay) {
          const m = mon;
          const weekRow = div({display:'grid',gridTemplateColumns:'112px repeat(7,minmax(0,1fr))',gap:'6px'});
          // Gutter
          const selN = R.filter(c=>!c.publishDate&&c.plannedWeek===m&&c.status!=='publicado').length;
          weekRow.appendChild(btn('row',{boxSizing:'border-box',padding:'10px',border:'1px solid rgba(255,255,255,.06)',borderRadius:'10px',background:m===todayWeek?'rgba(111,163,239,0.07)':'#171119',color:'#F2EDF0',textAlign:'left',display:'flex',flexDirection:'column',gap:'4px'},
            {onClick:()=>this.setState({view:'semana',cursor:m})},
            span({fontSize:'12.5px',fontWeight:'600'},weekShort(m)),
            span({fontSize:'11px',color:selN>0?'#8DB7F4':'#8A808C'},selN>0?selN+' planejado'+(selN>1?'s':'')+' sem dia':'nenhum planejado'),
            span({fontSize:'11px',color:'#8A808C'},'Abrir semana →')
          ));
          [0,1,2,3,4,5,6].forEach(i => {
            const iso = addDays(m,i); const inMonth = iso>=first&&iso<=lastDay; const today = iso===TODAY;
            const all = R.filter(c=>c.publishDate===iso);
            const cell = div({boxSizing:'border-box',minHeight:'104px',padding:'6px',borderRadius:'10px',border:'1px solid rgba(255,255,255,.06)',background:inMonth?'#171119':'#120D14',display:'flex',flexDirection:'column',gap:'4px',minWidth:'0',
              onDragOver:this.allowDrop(iso), onDrop:this.dropOn(id=>{this.setPublishDate(id,iso);this.toastLocal('Publicação em '+short(iso));})});
            cell.appendChild(h('button',{style:{alignSelf:'flex-start',minWidth:'28px',height:'26px',padding:'0 6px',border:'0',borderRadius:'13px',background:today?'rgba(111,163,239,0.28)':'transparent',color:today?'#8DB7F4':(inMonth?'#F2EDF0':'#6F6573'),fontSize:'12.5px',fontWeight:'600'},onClick:()=>this.setState({view:'semana',cursor:iso})},String(Number(iso.slice(8,10)))));
            all.slice(0,3).forEach(c => {
              const k = this.catStyle(this.catOf(c));
              cell.appendChild(btn('row',{boxSizing:'border-box',width:'100%',padding:'4px 6px',borderRadius:'5px',background:k.bg,border:k.border,color:'#F2EDF0',fontSize:'11.5px',textAlign:'left',display:'flex',alignItems:'center',gap:'6px',minWidth:'0'},
                {onClick:()=>this.setState({detail:c.id}), draggable:c.status!=='publicado'?'true':undefined, onDragStart:this.dragStart(c.id), onDragEnd:()=>this.dragEnd()},
                span({flex:'none',width:'6px',height:'6px',borderRadius:'50%',background:this.stageColorOf(c)}),
                span({minWidth:'0',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'},c.title)
              ));
            });
            if (all.length>3) cell.appendChild(span({padding:'0 4px',fontSize:'11px',color:'#8A808C'},'+ '+(all.length-3)));
            weekRow.appendChild(cell);
          });
          monthEl.appendChild(weekRow);
          mon = addDays(mon, 7);
        }
        monthWrap.appendChild(monthEl);
        main.appendChild(monthWrap);
      }

      // Sem data section
      const semItems = R.filter(c=>!c.publishDate&&!c.plannedWeek&&c.status!=='publicado'&&c.status!=='backlog');
      const semOpen = !!this.state.semOpen;
      const semSec = div({boxSizing:'border-box',background:'transparent',border:'1px solid rgba(255,255,255,.07)',borderRadius:'10px',padding:'0 14px',
        onDragOver:this.allowDrop('sem'), onDrop:this.dropOn(id=>{this.unplace(id);this.toastLocal('Retirado da semana');})});
      const semBtn = h('button',{style:{width:'100%',minHeight:'44px',padding:'0',border:'0',background:'none',color:'#F2EDF0',display:'flex',alignItems:'center',gap:'12px',textAlign:'left'},
        onClick:()=>this.setState({semOpen:!semOpen})});
      semBtn.appendChild(h('span',{style:{flex:'none',transform:semOpen?'rotate(90deg)':'rotate(0deg)',transition:'transform .15s'},innerHTML:ICON.chevRSmall}));
      semBtn.appendChild(span({flex:'none',fontSize:'12px',fontWeight:'600',letterSpacing:'.08em',textTransform:'uppercase',color:'#A59BA6'},'Sem data · '+semItems.length));
      semBtn.appendChild(span({minWidth:'0',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',fontSize:'12px',color:'#8A808C'}, semItems.slice(0,3).map(c=>c.title).join(' · ')+(semItems.length>3?' · +'+(semItems.length-3):'')));
      semSec.appendChild(semBtn);
      if (semOpen && semItems.length) {
        const semGrid = div({padding:'4px 0 14px',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'8px'});
        semItems.forEach(c => {
          semGrid.appendChild(h('div',{draggable:'true',onDragStart:this.dragStart(c.id),onDragEnd:()=>this.dragEnd(),style:{minWidth:'0'}},
            btn('row',{boxSizing:'border-box',width:'100%',padding:'8px 10px',borderRadius:'8px',background:'transparent',border:'1px solid rgba(255,255,255,.1)',color:'#F2EDF0',textAlign:'left',display:'flex',flexDirection:'column',gap:'3px'},
              {onClick:()=>this.setState({detail:c.id})},
              span({fontSize:'12.5px',fontWeight:'500',lineHeight:'1.3'},c.title),
              span({display:'flex',flexWrap:'wrap',alignItems:'center',gap:'2px 8px',fontSize:'11.5px',color:'#A59BA6'},
                span({display:'flex',alignItems:'center',gap:'6px'},span({flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:this.stageColorOf(c)}),this.journeyText(c)),
                span({},this.statusLabel(c)))
            )
          ));
        });
        semSec.appendChild(semGrid);
      }
      main.appendChild(semSec);

      // Conteúdos disponíveis (week view only)
      if (isWeek) {
        const fl = Object.assign({terr:'',pkg:''},this.state.f||{});
        const poolBase = R.filter(c=>c.status==='backlog'&&!c.publishDate&&!c.plannedWeek);
        const terrOpts = [...new Set(R.map(c=>c.territory.label).filter(Boolean))];
        const pkgOpts = [...new Set(R.filter(c=>c.pkg).map(c=>c.pkg.id))].sort();
        const poolRows = poolBase.filter(c=>(!fl.terr||c.territory.label===fl.terr)&&(!fl.pkg||(fl.pkg==='__none'?!c.pkg:(c.pkg&&c.pkg.id===fl.pkg))));
        const availOpen = this.state.availOpen !== false;

        const availSec = div({boxSizing:'border-box',background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',overflow:'hidden'});
        const availBtn = h('button',{style:{width:'100%',minHeight:'52px',padding:'0 16px',border:'0',background:'none',color:'#F2EDF0',display:'flex',alignItems:'center',gap:'12px',textAlign:'left'},
          onClick:()=>this.setState({availOpen:!availOpen})});
        availBtn.appendChild(h('span',{style:{flex:'none',transform:availOpen?'rotate(90deg)':'rotate(0deg)',transition:'transform .15s'},innerHTML:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A59BA6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"></path></svg>'}));
        availBtn.appendChild(span({flex:'none',fontSize:'12px',fontWeight:'600',letterSpacing:'.08em',textTransform:'uppercase',color:'#CDBDF8'},'Conteúdos disponíveis · '+poolBase.length));
        availBtn.appendChild(span({marginLeft:'auto',fontSize:'11.5px',color:'#8A808C'},'Registros do pipeline. Nada é criado aqui.'));
        availSec.appendChild(availBtn);

        if (availOpen) {
          const availBody = div({padding:'0 16px 16px',display:'flex',flexDirection:'column',gap:'12px'});
          // Filters
          const filterRow = div({display:'flex',flexWrap:'wrap',gap:'10px',alignItems:'flex-end'});
          [{label:'Território',key:'terr',opts:[{v:'',label:'Todos'}].concat(terrOpts.map(t=>({v:t,label:t})))},
           {label:'Pacote científico',key:'pkg',opts:[{v:'',label:'Todos'}].concat(pkgOpts.map(p=>({v:p,label:p}))).concat([{v:'__none',label:'Sem pacote associado'}])}
          ].forEach(f => {
            const label = h('label',{style:{flex:'1 1 170px',minWidth:'150px',display:'flex',flexDirection:'column',gap:'4px'}});
            label.appendChild(span({fontSize:'11.5px',color:'#8A808C'},f.label));
            const sel = h('select',{style:{height:'36px',boxSizing:'border-box',padding:'0 8px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',background:'#1D1620',color:'#F2EDF0',fontSize:'12.5px',colorScheme:'dark'},
              onChange:e=>this.setState({f:Object.assign({},fl,{[f.key]:e.target.value})})});
            f.opts.forEach(o => { const opt=h('option',{value:o.v},o.label); if(fl[f.key]===o.v)opt.selected=true; sel.appendChild(opt); });
            label.appendChild(sel);
            filterRow.appendChild(label);
          });
          if (fl.terr||fl.pkg) filterRow.appendChild(btn('btn2',{height:'36px',padding:'0 12px',border:'0',borderRadius:'8px',background:'rgba(166,140,240,.16)',color:'#CDBDF8',fontSize:'12px',fontWeight:'600'},{onClick:()=>this.setState({f:{terr:'',pkg:''}})},'Limpar filtros'));
          availBody.appendChild(filterRow);

          // Table
          const tableWrap = div({overflowX:'auto'});
          const tableEl = div({minWidth:'960px'});
          // Header
          tableEl.appendChild(div({display:'grid',gridTemplateColumns:'minmax(240px,2.2fr) 150px 150px 150px 120px 160px',gap:'12px',padding:'8px 14px',fontSize:'11px',letterSpacing:'.06em',fontWeight:'600',color:'#8A808C'},
            span({},'TÍTULO E OBJETIVO'),span({},'ETAPA'),span({},'TERRITÓRIO'),span({},'PACOTE CIENTÍFICO'),span({},'SITUAÇÃO'),span({},'')
          ));
          const tableBody = div({maxHeight:'440px',overflowY:'auto'});
          poolRows.forEach(c => {
            const row = div({display:'grid',gridTemplateColumns:'minmax(240px,2.2fr) 150px 150px 150px 120px 160px',gap:'12px',alignItems:'start',padding:'10px 14px',borderTop:'1px solid rgba(255,255,255,.06)',
              draggable:'true', onDragStart:this.dragStart(c.id), onDragEnd:()=>this.dragEnd()});
            const titleCol = div({minWidth:'0'});
            titleCol.appendChild(btn('row',{padding:'0',border:'0',background:'none',color:'#F2EDF0',textAlign:'left',fontSize:'13px',fontWeight:'500',lineHeight:'1.35'},{onClick:()=>this.setState({detail:c.id})},c.title));
            const obj = c.proposal&&c.proposal.objective&&!c.strategy ? 'Proposta histórica: '+c.proposal.objective : (this.objectiveOf(c)||'');
            if (obj) titleCol.appendChild(div({marginTop:'2px',fontSize:'11.5px',color:'#A59BA6'},obj));
            row.appendChild(titleCol);
            const stageCol = div({minWidth:'0',fontSize:'12px'});
            stageCol.appendChild(span({display:'flex',alignItems:'center',gap:'6px',color:c.strategy&&c.strategy.stages[0]?COLORS[c.strategy.stages[0]]:'#8A808C'},
              span({flex:'none',width:'7px',height:'7px',borderRadius:'50%',background:this.stageColorOf(c)}),this.journeyText(c)));
            if (c.proposal&&c.proposal.journey) stageCol.appendChild(div({marginTop:'2px',fontSize:'11px',color:'#8A808C'},'Legado: '+c.proposal.journey+' (não migrado)'));
            row.appendChild(stageCol);
            row.appendChild(span({fontSize:'12px',color:'#CFC6D1'},c.territory.label||'Não informado'));
            row.appendChild(span({fontSize:'12px',color:c.pkg?(c.pkg.status==='frozen'?'#CDBDF8':'#A59BA6'):'#8A808C'},this.pkgLabel(c)));
            row.appendChild(span({fontSize:'12px',color:'#A59BA6'},this.statusLabel(c)));
            row.appendChild(btn('btn2',{minHeight:'34px',padding:'0 10px',border:'0',borderRadius:'8px',background:'rgba(166,140,240,.18)',color:'#D8CBFA',fontSize:'12px',fontWeight:'600',textAlign:'center'},
              {onClick:()=>{this.planForWeek(c.id,curWeek);this.toastLocal(c.title+': planejado para a semana de '+weekShort(curWeek));}},
              '+ Colocar nesta semana'));
            tableBody.appendChild(row);
          });
          if (!poolRows.length) tableBody.appendChild(div({padding:'16px 14px',borderTop:'1px solid rgba(255,255,255,.06)',fontSize:'12.5px',color:'#8A808C'},'Nenhum conteúdo com esses filtros.'));
          tableEl.appendChild(tableBody);
          tableWrap.appendChild(tableEl);
          availBody.appendChild(tableWrap);
          availBody.appendChild(div({fontSize:'11.5px',color:'#8A808C'},'Arraste uma linha para um dia da semana, ou use o botão. Arraste um cartão do plano de volta para esta área para retirá-lo da semana.'));
          availSec.appendChild(availBody);
        }
        main.appendChild(availSec);
      }

      return main;
    }

    // =====================================================================
    // JORNADA
    // =====================================================================
    renderJornada(R, confirmed) {
      const stageCount = (k) => confirmed.filter(c=>c.strategy.stages.indexOf(k)>=0).length;

      const main = h('main', {style:{flex:'999 1 560px',minWidth:'0',boxSizing:'border-box',padding:'24px 28px 32px',display:'flex',flexDirection:'column',gap:'20px'}});
      main.appendChild(h('header',{},
        h('h1',{style:{margin:'0',fontSize:'20px',fontWeight:'600',letterSpacing:'-.01em'}},'Jornada'),
        div({marginTop:'4px',fontSize:'13px',color:'#A59BA6'},'Progressão estratégica confirmada por briefs. Propostas históricas do backlog não entram nesta leitura.')
      ));

      // Next strategic work
      const nextSec = div({background:'#231B2E',border:'1px solid rgba(166,140,240,.26)',borderRadius:'12px',padding:'20px',display:'flex',flexDirection:'column',gap:'10px'});
      nextSec.appendChild(div({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Próximo trabalho estratégico'));
      nextSec.appendChild(div({fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:'30px',fontWeight:'500',lineHeight:'1.15'},'Ainda não definido pelo Strategist'));
      nextSec.appendChild(div({maxWidth:'640px',fontSize:'13px',lineHeight:'1.55',color:'#A59BA6'},'Quando o Strategist definir o próximo objetivo estratégico, ele aparece aqui. Conteúdos do backlog não ocupam esta posição.'));
      main.appendChild(nextSec);

      // Progressão confirmada
      const progSec = div({background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'18px 16px',display:'flex',flexDirection:'column',gap:'12px'});
      progSec.appendChild(div({display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'baseline',gap:'4px 12px',padding:'0 4px'},
        div({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Progressão confirmada'),
        div({fontSize:'11.5px',color:'#8A808C'},confirmed.length+' com brief')
      ));

      const progWrap = div({overflowX:'auto'});
      const progEl = div({minWidth:'760px',display:'flex',flexDirection:'column',gap:'10px'});
      // Stage headers
      const stageGrid = div({display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:'10px'});
      STAGES.forEach(k => {
        const n = stageCount(k);
        stageGrid.appendChild(div({boxSizing:'border-box',padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',display:'flex',flexDirection:'column',gap:'4px',minWidth:'0'},
          span({display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',fontWeight:'600',letterSpacing:'.06em'},span({flex:'none',width:'9px',height:'9px',borderRadius:'50%',background:COLORS[k]}),k),
          span({fontSize:'11.5px',lineHeight:'1.4',color:'#A59BA6'},STAGE_DESC[k]),
          span({fontSize:'11.5px',color:n>0?'#CFC6D1':'#8A808C'},n>0?n+(n===1?' conteúdo confirmado':' conteúdos confirmados'):'Sem conteúdo confirmado')
        ));
      });
      progEl.appendChild(stageGrid);

      // Content rows
      confirmed.forEach(c => {
        const idx = c.strategy.stages.map(s=>STAGES.indexOf(s));
        const lo = idx.length?Math.min(...idx):0; const hi = idx.length?Math.max(...idx):0;
        const rowGrid = div({display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:'10px'});
        rowGrid.appendChild(btn('row',{gridColumn:(lo+1)+' / '+(hi+2),boxSizing:'border-box',padding:'10px 12px',borderRadius:'10px',border:'1px solid '+COLORS[STAGES[lo]],background:'rgba(166,140,240,.08)',color:'#F2EDF0',textAlign:'left',display:'flex',flexDirection:'column',gap:'3px',minWidth:'0'},
          {onClick:()=>this.setState({detail:c.id})},
          span({display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:'2px 10px',fontSize:'11px',fontWeight:'600',letterSpacing:'.05em',color:'#CDBDF8'},
            span({},c.id+' · '+(c.strategy.fn||'Função não informada')),span({},c.strategy.journey||'Etapa não informada')),
          span({fontSize:'13px',fontWeight:'500',lineHeight:'1.35'},c.title),
          span({fontSize:'11.5px',lineHeight:'1.45',color:'#A59BA6'},c.strategy.objective||''),
          span({fontSize:'11px',color:'#8A808C'},STATUS[c.status])
        ));
        progEl.appendChild(rowGrid);
      });
      progWrap.appendChild(progEl);
      progSec.appendChild(progWrap);
      main.appendChild(progSec);

      // Editorial functions
      const funcSec = div({background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'18px 16px',display:'flex',flexDirection:'column',gap:'12px'});
      funcSec.appendChild(div({padding:'0 4px',fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Funções editoriais confirmadas'));
      const funcGrid = div({display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'10px'});
      FUNCS.forEach(f => {
        const ids = confirmed.filter(c=>(c.strategy.fn||'').toUpperCase()===f).map(c=>c.id);
        funcGrid.appendChild(div({boxSizing:'border-box',padding:'12px',borderRadius:'10px',background:ids.length?'rgba(166,140,240,.14)':'rgba(255,255,255,.03)',display:'flex',flexDirection:'column',gap:'4px',minWidth:'0'},
          span({fontSize:'12px',fontWeight:'600',letterSpacing:'.04em'},f),
          span({fontSize:'11.5px',color:ids.length?'#F2EDF0':'#8A808C'},ids.length?ids.join(', '):'nenhum conteúdo confirmado')
        ));
      });
      funcSec.appendChild(funcGrid);
      main.appendChild(funcSec);
      return main;
    }

    // =====================================================================
    // PRODUÇÃO
    // =====================================================================
    renderProducao(R) {
      const main = h('main', {style:{flex:'999 1 560px',minWidth:'0',boxSizing:'border-box',padding:'24px 28px 32px',display:'flex',flexDirection:'column',gap:'20px'}});
      main.appendChild(h('header',{},
        h('h1',{style:{margin:'0',fontSize:'20px',fontWeight:'600',letterSpacing:'-.01em'}},'Produção'),
        div({marginTop:'4px',fontSize:'13px',color:'#A59BA6'},'Situação real de cada conteúdo no pipeline, com a próxima ação e as referências disponíveis.')
      ));

      const grid = div({display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'12px',alignItems:'start'});
      ['selecionado','em-desenvolvimento','em-producao','revisao','pronto','publicado'].forEach(s => {
        const items = R.filter(c=>c.status===s);
        const sec = div({boxSizing:'border-box',background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'12px',display:'flex',flexDirection:'column',gap:'10px',minWidth:'0'});
        sec.appendChild(div({display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'0 4px'},
          span({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:s==='publicado'?'#78D0A5':'#CDBDF8'},STATUS[s]),
          span({fontSize:'12px',color:'#8A808C'},String(items.length))
        ));
        items.forEach(c => {
          const tags = [];
          if (c.refs.brief) tags.push({label:'Brief',color:'#CDBDF8',border:'1px solid rgba(166,140,240,0.4)'});
          if (c.refs.copy) tags.push({label:'Copy aprovada',color:'#CFC6D1',border:'1px solid rgba(255,255,255,0.18)'});
          if (c.refs.visual) tags.push({label:'Brief visual',color:'#CFC6D1',border:'1px solid rgba(255,255,255,0.18)'});
          if (c.pkg) tags.push({label:'Pacote '+c.pkg.id+(c.pkg.status==='frozen'?' congelado':' a produzir'),color:c.pkg.status==='frozen'?'#CDBDF8':'#A59BA6',border:'1px solid rgba(255,255,255,0.18)'});

          const card = btn('row',{boxSizing:'border-box',width:'100%',padding:'12px',borderRadius:'10px',border:'1px solid rgba(255,255,255,.1)',background:'#1D1620',color:'#F2EDF0',textAlign:'left',display:'flex',flexDirection:'column',gap:'6px',minWidth:'0'},
            {onClick:()=>this.setState({detail:c.id})},
            span({fontSize:'11px',fontWeight:'600',letterSpacing:'.06em',color:'#8A808C'},c.id),
            span({fontSize:'13.5px',fontWeight:'500',lineHeight:'1.35'},c.title),
            c.substatus ? span({fontSize:'12px',color:'#CDBDF8'},this.subLabel(c.substatus)) : null,
            c.nextAction||s!=='publicado' ? span({fontSize:'12px',lineHeight:'1.45',color:c.nextAction?'#CFC6D1':'#8A808C'},'→ '+(c.nextAction||(s==='publicado'?'':'Próxima ação não informada'))) : null,
            span({fontSize:'11.5px',color:s==='publicado'?'#78D0A5':(c.publishDate?'#8DB7F4':'#8A808C')}, c.publishDate?(s==='publicado'?'Publicado em ':'Publicação ')+short(c.publishDate):'Sem data de publicação'),
            div({display:'flex',flexWrap:'wrap',gap:'5px'},
              tags.map(t=>span({padding:'2px 7px',borderRadius:'4px',border:t.border,color:t.color,fontSize:'11px'},t.label)),
              s!=='publicado'&&c.pkg&&c.pkg.status!=='frozen' ? span({padding:'2px 7px',borderRadius:'4px',border:'1px solid rgba(166,140,240,.55)',color:'#CDBDF8',fontSize:'11px'},'Dependência: pacote '+c.pkg.id+' a produzir') : null,
              this.needsHuman(c) ? span({padding:'2px 7px',borderRadius:'4px',background:'rgba(166,140,240,.2)',color:'#CDBDF8',fontSize:'11px',fontWeight:'600'},'Sua '+(PENDING[c.pendingType]||c.pendingType).toLowerCase()) : null,
              c.local ? span({padding:'2px 7px',borderRadius:'4px',background:'rgba(255,255,255,.06)',color:'#A59BA6',fontSize:'11px'},'local') : null
            )
          );
          sec.appendChild(card);
        });
        if (!items.length) sec.appendChild(div({padding:'6px 4px 8px',fontSize:'12px',color:'#6F6573'},'Nenhum conteúdo'));
        grid.appendChild(sec);
      });
      main.appendChild(grid);
      return main;
    }

    // =====================================================================
    // BACKLOG
    // =====================================================================
    renderBacklog(R) {
      const bf = Object.assign({terr:'',pkg:''},this.state.bf||{});
      const blPool = R.filter(c=>c.proposal&&(c.status==='backlog'||(c.status==='selecionado'&&this.baseOf(c.id)&&this.baseOf(c.id).status==='backlog')));
      const blRows = blPool.filter(c=>(!bf.terr||c.territory.label===bf.terr)&&(!bf.pkg||(bf.pkg==='__none'?!c.pkg:(c.pkg&&c.pkg.status===bf.pkg))));
      const blTerr = [...new Set(R.filter(c=>c.status==='backlog'||(c.proposal&&c.status==='selecionado')).map(c=>c.territory.label).filter(Boolean))];

      const main = h('main', {style:{flex:'999 1 560px',minWidth:'0',boxSizing:'border-box',padding:'24px 28px 32px',display:'flex',flexDirection:'column',gap:'18px'}});
      main.appendChild(h('header',{},
        h('h1',{style:{margin:'0',fontSize:'20px',fontWeight:'600',letterSpacing:'-.01em'}},'Backlog'),
        div({marginTop:'4px',fontSize:'13px',color:'#A59BA6'},'Temas do calendário v1, como propostas históricas. A estratégia de cada um é confirmada pelo Strategist quando for selecionado.'),
        div({marginTop:'2px',fontSize:'11.5px',color:'#8A808C'},'Selecionar aqui é simulação local. Nada é gravado no MOS.')
      ));

      // Filters
      const filterRow = div({display:'flex',flexWrap:'wrap',gap:'10px',alignItems:'flex-end'});
      [{label:'Território',key:'terr',opts:[{v:'',label:'Todos'}].concat(blTerr.map(t=>({v:t,label:t})))},
       {label:'Pacote científico',key:'pkg',opts:[{v:'',label:'Todos'},{v:'frozen',label:'Congelado'},{v:'todo',label:'A produzir'},{v:'__none',label:'Sem pacote associado'}]}
      ].forEach(f => {
        const label = h('label',{style:{flex:'1 1 200px',maxWidth:'280px',minWidth:'150px',display:'flex',flexDirection:'column',gap:'4px'}});
        label.appendChild(span({fontSize:'11.5px',color:'#8A808C'},f.label));
        const sel = h('select',{style:{height:'36px',boxSizing:'border-box',padding:'0 8px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',background:'#1D1620',color:'#F2EDF0',fontSize:'12.5px',colorScheme:'dark'},
          onChange:e=>this.setState({bf:Object.assign({},bf,{[f.key]:e.target.value})})});
        f.opts.forEach(o => { const opt=h('option',{value:o.v},o.label); if(bf[f.key]===o.v)opt.selected=true; sel.appendChild(opt); });
        label.appendChild(sel);
        filterRow.appendChild(label);
      });
      if (bf.terr||bf.pkg) filterRow.appendChild(btn('btn2',{height:'36px',padding:'0 12px',border:'0',borderRadius:'8px',background:'rgba(166,140,240,.16)',color:'#CDBDF8',fontSize:'12px',fontWeight:'600'},{onClick:()=>this.setState({bf:{terr:'',pkg:''}})},'Limpar filtros'));
      filterRow.appendChild(span({marginLeft:'auto',fontSize:'12px',color:'#8A808C'},blRows.length+' de '+blPool.length));
      main.appendChild(filterRow);

      // Groups by territory
      const orderTerr = [...new Set(blRows.map(c=>c.territory.code||'~'))].sort();
      orderTerr.forEach(code => {
        const items = blRows.filter(c=>(c.territory.code||'~')===code);
        const label = items.length ? items[0].territory.label : 'Território não informado';
        const sec = div({display:'flex',flexDirection:'column',gap:'10px'});
        sec.appendChild(div({display:'flex',alignItems:'baseline',gap:'10px',padding:'0 2px'},
          span({fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#A59BA6'},label),
          span({fontSize:'12px',color:'#8A808C'},String(items.length))
        ));
        const grid = div({display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'10px'});
        items.forEach(c => {
          const sel = c.status==='selecionado';
          const card = div({boxSizing:'border-box',padding:'14px',borderRadius:'10px',border:sel?'1px solid rgba(166,140,240,0.6)':'1px solid rgba(255,255,255,0.09)',background:sel?'rgba(166,140,240,0.08)':'#171119',display:'flex',flexDirection:'column',gap:'8px',minWidth:'0'});
          card.appendChild(div({display:'flex',flexWrap:'wrap',alignItems:'center',gap:'6px 8px'},
            span({fontSize:'11px',fontWeight:'600',letterSpacing:'.06em',color:'#8A808C'},c.id),
            span({padding:'1px 7px',borderRadius:'4px',background:'rgba(255,255,255,.06)',color:'#A59BA6',fontSize:'11px'},'Proposta histórica')
          ));
          card.appendChild(btn('row',{padding:'0',border:'0',background:'none',color:'#F2EDF0',textAlign:'left',fontSize:'13.5px',fontWeight:'500',lineHeight:'1.35'},{onClick:()=>this.setState({detail:c.id})},c.title));
          if (c.proposal&&c.proposal.objective) card.appendChild(div({fontSize:'12px',lineHeight:'1.5',color:'#A59BA6'},c.proposal.objective));
          card.appendChild(div({fontSize:'11.5px',color:c.pkg?(c.pkg.status==='frozen'?'#CDBDF8':'#A59BA6'):'#8A808C'},this.pkgLabel(c)));
          card.appendChild(btn('btn2',{alignSelf:'flex-start',minHeight:'34px',padding:'0 12px',border:'0',borderRadius:'8px',background:sel?'rgba(166,140,240,.28)':'rgba(255,255,255,.06)',color:sel?'#E3D9FB':'#F2EDF0',fontSize:'12px',fontWeight:'600'},
            {onClick:()=>{if(sel){this.unselectItem(c.id);this.toastLocal(c.title+': seleção desfeita');}else{this.selectItem(c.id);this.toastLocal(c.title+': selecionado');}}},
            sel?'Selecionado (simulação local). Desfazer':'Selecionar (simulação local)'
          ));
          grid.appendChild(card);
        });
        sec.appendChild(grid);
        main.appendChild(sec);
      });
      if (!blRows.length) main.appendChild(div({fontSize:'13px',color:'#8A808C'},'Nenhuma proposta com esses filtros.'));
      return main;
    }

    // =====================================================================
    // ANÁLISE
    // =====================================================================
    renderAnalise(R, confirmed) {
      const pubRecs = R.filter(c=>c.status==='publicado');

      const main = h('main', {style:{flex:'999 1 560px',minWidth:'0',boxSizing:'border-box',padding:'24px 28px 32px',display:'flex',flexDirection:'column',gap:'20px'}});
      main.appendChild(h('header',{},
        h('h1',{style:{margin:'0',fontSize:'20px',fontWeight:'600',letterSpacing:'-.01em'}},'Análise'),
        div({marginTop:'4px',fontSize:'13px',color:'#A59BA6'},'Estrutura pronta para receber performance e aprendizado. O pipeline atual não traz dados de resultado.')
      ));

      // Publicados
      const pubSec = div({background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'16px 14px',display:'flex',flexDirection:'column',gap:'6px'});
      pubSec.appendChild(div({padding:'0 6px 6px',fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#78D0A5'},'Publicados'));
      pubRecs.forEach(c => {
        const md = c.metricsData || {};
        const snaps = md.snapshots || [];
        const lastSnap = snaps.length ? snaps[snaps.length - 1] : null;
        const perfLabel = lastSnap
          ? ['reach','views','likes','comments','shares','saves'].filter(f=>lastSnap[f]!=null).map(f=>f+': '+lastSnap[f].toLocaleString('pt-BR')).join(' · ') || 'Sem valores'
          : 'Sem dados de performance';
        const perfColor = lastSnap ? '#A59BA6' : '#6F6573';
        pubSec.appendChild(btn('row',{boxSizing:'border-box',width:'100%',padding:'10px 6px',border:'0',borderRadius:'8px',background:'transparent',color:'#F2EDF0',textAlign:'left',display:'flex',flexWrap:'wrap',gap:'4px 14px',alignItems:'baseline'},
          {onClick:()=>this.setState({detail:c.id})},
          span({fontSize:'13.5px',fontWeight:'500'},c.title),
          span({fontSize:'12px',color:'#78D0A5'},c.publishDate?short(c.publishDate):'sem data'),
          span({fontSize:'12px',color:'#8A808C'},c.strategy?'Com brief':'Registro retroativo, sem brief'),
          span({marginLeft:'auto',fontSize:'12px',color:perfColor},perfLabel),
          c.postUrl ? h('a',{href:c.postUrl,target:'_blank',rel:'noopener',style:{fontSize:'11px',color:'#78D0A5'},onClick:e=>e.stopPropagation()},'Ver post ↗') : null
        ));
      });
      pubSec.appendChild(div({padding:'4px 6px 0',fontSize:'11.5px',color:'#8A808C'},
        confirmed.length+(confirmed.length===1?' conteúdo com brief confirmado':' conteúdos com brief confirmado')+'; '+pubRecs.filter(c=>!c.strategy).length+' publicado sem brief (registro retroativo).'));
      main.appendChild(pubSec);

      // Hierarquia de performance
      const perfSec = div({background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'16px 14px',display:'flex',flexDirection:'column',gap:'10px'});
      perfSec.appendChild(div({padding:'0 6px',fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Da atenção à receita'));
      const perfGrid = div({display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'8px'});
      ['Atenção qualificada','Confiança','Lead qualificado','Agendamento','Comparecimento','Receita','Recorrência e indicação'].forEach((l,i) => {
        perfGrid.appendChild(div({boxSizing:'border-box',padding:'10px 12px',borderRadius:'8px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',display:'flex',flexDirection:'column',gap:'4px',minWidth:'0'},
          span({fontSize:'11px',color:'#8A808C'},String(i+1)),
          span({fontSize:'12.5px',fontWeight:'500'},l),
          span({fontSize:'12px',color:'#6F6573'},'Sem dado')
        ));
      });
      perfSec.appendChild(perfGrid);
      perfSec.appendChild(div({padding:'0 6px',fontSize:'11.5px',lineHeight:'1.5',color:'#8A808C'},'Ausência de dado não é zero. O modelo de lead qualificado é decisão humana e ainda não está conectado a este painel.'));
      main.appendChild(perfSec);

      // Aprendizado
      const learnSec = div({background:'#171119',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'16px 14px',display:'flex',flexDirection:'column',gap:'10px'});
      learnSec.appendChild(div({padding:'0 6px',fontSize:'12px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Aprendizado'));
      const learnGrid = div({display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'8px'});
      [['OBSERVATION','Aguardando dados'],['CANDIDATE LEARNING','Aguardando dados'],['APPROVED RULE','Aguardando dados']].forEach(([l,t]) => {
        learnGrid.appendChild(div({boxSizing:'border-box',padding:'10px 12px',borderRadius:'8px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',display:'flex',flexDirection:'column',gap:'4px'},
          span({fontSize:'12px',fontWeight:'600',letterSpacing:'.04em'},l),
          span({fontSize:'12px',color:'#6F6573'},t)
        ));
      });
      learnSec.appendChild(learnGrid);
      main.appendChild(learnSec);
      return main;
    }

    // =====================================================================
    // DETAIL PANEL
    // =====================================================================
    renderDetail(sel, R, TODAY, todayWeek) {
      const cat = this.catOf(sel); const k = this.catStyle(cat);

      const overlay = h('div', {style:{position:'fixed',top:'0',right:'0',bottom:'0',left:'0',background:'rgba(5,3,6,.6)',zIndex:'50',display:'flex',justifyContent:'flex-end'},
        onClick: () => this.setState({detail:null})});

      const panel = h('aside', {style:{boxSizing:'border-box',width:'min(460px,100%)',height:'100%',overflowY:'auto',background:'#171119',borderLeft:'1px solid rgba(255,255,255,.08)',padding:'24px',display:'flex',flexDirection:'column',gap:'16px'},
        onClick: e => e.stopPropagation()});

      // Header
      panel.appendChild(div({display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px'},
        div({minWidth:'0'},
          div({fontSize:'12px',fontWeight:'600',letterSpacing:'.08em',color:'#8A808C'},sel.id),
          h('h3',{style:{margin:'4px 0 0',fontSize:'20px',fontWeight:'600',lineHeight:'1.25',letterSpacing:'-.01em'}},sel.title)
        ),
        btn('btn2',{flex:'none',minHeight:'40px',padding:'0 14px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',background:'rgba(255,255,255,.06)',color:'#F2EDF0',fontSize:'12.5px',fontWeight:'500'},{onClick:()=>this.setState({detail:null})},'Fechar')
      ));

      // Badges
      const badges = div({display:'flex',flexWrap:'wrap',gap:'8px'});
      badges.appendChild(span({padding:'3px 9px',borderRadius:'5px',background:k.bg,color:k.color,fontSize:'11.5px',fontWeight:'600'}, cat==='producao'?(STATUS[sel.status]||'Situação não informada'):k.label));
      if (sel.local) badges.appendChild(span({padding:'3px 9px',borderRadius:'5px',background:'rgba(255,255,255,.06)',color:'#A59BA6',fontSize:'11.5px',fontWeight:'600'},'alterado localmente'));
      if (this.needsHuman(sel)) badges.appendChild(span({padding:'3px 9px',borderRadius:'5px',background:'rgba(166,140,240,.2)',color:'#CDBDF8',fontSize:'11.5px',fontWeight:'600'},'Sua '+(PENDING[sel.pendingType]||sel.pendingType).toLowerCase()));
      panel.appendChild(badges);

      // Editable fields
      const fields = div({display:'flex',flexDirection:'column',gap:'12px'});
      // Title
      const mkField = (label, type, value, onChange, extra) => {
        const wrap = h('label',{style:{display:'flex',flexDirection:'column',gap:'4px'}});
        wrap.appendChild(span({fontSize:'11.5px',color:'#8A808C'},label));
        if (type==='text') {
          wrap.appendChild(h('input',{type:'text',value:value||'',placeholder:extra||'',style:{height:'38px',boxSizing:'border-box',padding:'0 12px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',background:'#1D1620',color:'#F2EDF0',fontSize:'13px'},onChange}));
        } else if (type==='date') {
          wrap.appendChild(h('input',{type:'date',value:value||'',style:{height:'38px',boxSizing:'border-box',padding:'0 12px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',background:'#1D1620',color:'#F2EDF0',fontSize:'13px',colorScheme:'dark'},onChange}));
        } else if (type==='select') {
          const s = h('select',{style:{height:'38px',boxSizing:'border-box',padding:'0 10px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',background:'#1D1620',color:'#F2EDF0',fontSize:'13px',colorScheme:'dark'},onChange});
          if (extra&&extra.disabled) s.disabled = true;
          (extra&&extra.options||[]).forEach(o => { const opt=h('option',{value:o.v},o.label); if(value===o.v)opt.selected=true; s.appendChild(opt); });
          wrap.appendChild(s);
        }
        return wrap;
      };

      fields.appendChild(mkField('Título','text',sel.title,e=>this.patch(sel.id,{title:e.target.value}),'Título do conteúdo'));
      const statusOpts = ['backlog','selecionado','em-desenvolvimento','em-producao','revisao','pronto','publicado'].map(s=>({v:s,label:STATUS[s]}));
      fields.appendChild(mkField('Situação no pipeline','select',sel.status,e=>this.patch(sel.id,{status:e.target.value}),{options:statusOpts}));
      fields.appendChild(mkField('Próxima ação','text',sel.nextAction,e=>this.patch(sel.id,{nextAction:e.target.value||null}),'Não informada'));
      const dateField = mkField('Data de publicação','date',sel.publishDate,e=>this.setPublishDate(sel.id,e.target.value||null));
      dateField.appendChild(span({fontSize:'11px',color:'#8A808C'},'Mover a data move o conteúdo no calendário. Simulação local.'));
      fields.appendChild(dateField);

      const weekOpts = [{v:'',label:'Sem semana planejada'}].concat([-1,0,1,2,3,4].map(n=>addDays(todayWeek,n*7)).map(m=>({v:m,label:'Semana de '+weekLabel(m)})));
      const weekField = mkField('Semana planejada (simulação local)','select',sel.plannedWeek||'',e=>{if(e.target.value)this.planForWeek(sel.id,e.target.value);else this.unplace(sel.id);},{options:weekOpts,disabled:!!sel.publishDate});
      if (sel.publishDate) weekField.appendChild(span({fontSize:'11px',color:'#8A808C'},'Definida pela data de publicação.'));
      fields.appendChild(weekField);
      panel.appendChild(fields);

      // Info sections
      const kv = (arr) => arr.filter(x=>x[1]).map(x=>({k:x[0],v:String(x[1])}));

      const renderSection = (title, rows, hint) => {
        const sec = div({padding:'12px 14px',borderRadius:'10px',background:'#1D1620',display:'flex',flexDirection:'column',gap:'8px'});
        sec.appendChild(div({fontSize:'11.5px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},title));
        if (hint) sec.appendChild(div({fontSize:'11.5px',lineHeight:'1.5',color:'#8A808C'},hint));
        rows.forEach(r => sec.appendChild(div({display:'flex',flexDirection:'column',gap:'1px'},
          span({fontSize:'11px',color:'#8A808C'},r.k),
          span({fontSize:'12.5px',lineHeight:'1.5',color:'#E4DCE6'},r.v)
        )));
        return sec;
      };

      const regRows = kv([['Território',sel.territory.label],['Bloco',sel.block?this.blockLabel(sel.block):''],['Subetapa',sel.substatus?this.subLabel(sel.substatus):''],['Revisão',sel.revision==null?'':sel.revision],['Responsável',sel.currentOwner||''],['Pendência',sel.pendingType&&sel.pendingType!=='nenhuma'?(PENDING[sel.pendingType]||sel.pendingType):'']]);
      if (regRows.length) panel.appendChild(renderSection('Registro operacional', regRows));

      if (sel.strategy) {
        panel.appendChild(renderSection('Estratégia confirmada (brief)', kv([['Função editorial',sel.strategy.fn],['Etapa da jornada',sel.strategy.journey],['Objetivo estratégico',sel.strategy.objective],['Trabalho principal',sel.strategy.primaryJob],['Mudança desejada',sel.strategy.desiredChange],['Mensagem central',sel.strategy.coreMessage],['Segmento',sel.strategy.segment],['Formato',sel.strategy.format],['Legenda',sel.strategy.caption]])));
      }
      if (sel.proposal) {
        panel.appendChild(renderSection('Proposta histórica (calendário v1)', kv([['Fonte',sel.proposal.source],['Etapa (vocabulário legado)',sel.proposal.journey],['Função (como registrada)',sel.proposal.fn],['Objetivo proposto',sel.proposal.objective],['Formato histórico',sel.proposal.format],['Nota',sel.proposal.note]]),
          'Direção do calendário v1. Não é brief nem estratégia vigente. O Strategist reconfirma quando o conteúdo for selecionado.'));
      }

      // References
      const refRows = [];
      if (sel.pkg) refRows.push({k:'Pacote científico',v:sel.pkg.id+(sel.pkg.status==='frozen'?', congelado':', a produzir')});
      else refRows.push({k:'Pacote científico',v:'Sem pacote associado'});
      if (sel.refs.brief) refRows.push({k:'Brief',v:'Associado'});
      if (sel.refs.copy) refRows.push({k:'Copy aprovada',v:'Associada'});
      if (sel.refs.visual) refRows.push({k:'Brief visual',v:'Associado'});
      panel.appendChild(renderSection('Referências', refRows));

      // ---- PUBLICATION FORM (only for pronto or unpublished content without pending) ----
      if (sel.status !== 'publicado' && sel.status !== 'backlog') {
        const pubForm = div({padding:'12px 14px',borderRadius:'10px',background:'#1D1620',display:'flex',flexDirection:'column',gap:'8px'});
        pubForm.appendChild(div({fontSize:'11.5px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#78D0A5'},'Registrar publicação'));
        const pubDate = h('input',{type:'date',id:'pub-date-'+sel.id,value:sel.publishDate||toISO(new Date()),style:{height:'34px',boxSizing:'border-box',padding:'0 10px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',background:'#1D1620',color:'#F2EDF0',fontSize:'12.5px',colorScheme:'dark'}});
        const pubFormat = h('input',{type:'text',id:'pub-format-'+sel.id,value:sel.strategy&&sel.strategy.format||'',placeholder:'Ex: Carrossel 6 cards',style:{height:'34px',boxSizing:'border-box',padding:'0 10px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',background:'#1D1620',color:'#F2EDF0',fontSize:'12.5px'}});
        const pubUrl = h('input',{type:'url',id:'pub-url-'+sel.id,placeholder:'https://www.instagram.com/p/...',style:{height:'34px',boxSizing:'border-box',padding:'0 10px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',background:'#1D1620',color:'#F2EDF0',fontSize:'12.5px'}});
        pubForm.appendChild(div({display:'flex',flexDirection:'column',gap:'4px'}, span({fontSize:'11px',color:'#8A808C'},'Data de publicação'), pubDate));
        pubForm.appendChild(div({display:'flex',flexDirection:'column',gap:'4px'}, span({fontSize:'11px',color:'#8A808C'},'Formato'), pubFormat));
        pubForm.appendChild(div({display:'flex',flexDirection:'column',gap:'4px'}, span({fontSize:'11px',color:'#8A808C'},'URL do Instagram'), pubUrl));
        pubForm.appendChild(btn('btn1',{alignSelf:'flex-start',minHeight:'34px',padding:'0 14px',border:'0',borderRadius:'6px',background:'#5FBF8F',color:'#110C13',fontSize:'12.5px',fontWeight:'600'},
          {onClick:async()=>{
            const url = pubUrl.value.trim(); const date = pubDate.value; const fmt = pubFormat.value.trim();
            if (!url || !date) { this.toast('Preencha data e URL.'); return; }
            // Fetch fresh revision before submitting
            const fresh = await (await fetch(`/api/content/${encodeURIComponent(sel.id)}`)).json();
            if (!fresh || fresh.error) { this.toast('Erro ao verificar revisão atual.'); return; }
            await this.apiPublish(sel.id, {agent:'Caroline', expectedRevision:fresh.revision, publishDate:date, postUrl:url, format:fmt||null, platform:'instagram'});
            this.setState({detail:sel.id});
          }},'Marcar como publicado'));
        pubForm.appendChild(div({fontSize:'11px',lineHeight:'1.5',color:'#8A808C'},'Grava no pipeline real. Muda o status para Publicado.'));
        panel.appendChild(pubForm);
      }

      // ---- METRICS FORM (only for publicado) ----
      if (sel.status === 'publicado') {
        // Show existing metrics
        const md = sel.metricsData || {};
        const snaps = md.snapshots || [];
        const evids = md.evidence || [];

        if (snaps.length || evids.length) {
          const existSec = div({padding:'12px 14px',borderRadius:'10px',background:'#1D1620',display:'flex',flexDirection:'column',gap:'8px'});
          existSec.appendChild(div({fontSize:'11.5px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#78D0A5'},'Performance registrada'));
          snaps.forEach((s,i) => {
            const vals = ['reach','views','likes','comments','shares','saves','profileVisits','follows']
              .filter(f=>s[f]!=null).map(f=>f+': '+s[f].toLocaleString('pt-BR')).join(' · ');
            existSec.appendChild(div({padding:'6px 8px',borderRadius:'6px',background:'rgba(255,255,255,.03)',display:'flex',flexDirection:'column',gap:'2px'},
              span({fontSize:'11.5px',fontWeight:'500',color:'#E4DCE6'},'Snapshot '+(i+1)+' — '+short(s.date)+' ('+s.source+')'),
              span({fontSize:'11.5px',color:'#A59BA6'},vals || 'Sem valores numéricos'),
              s.note ? span({fontSize:'11px',color:'#8A808C'},s.note) : null
            ));
          });
          evids.forEach(e => {
            existSec.appendChild(div({padding:'6px 8px',borderRadius:'6px',background:'rgba(255,255,255,.03)',display:'flex',flexDirection:'column',gap:'2px'},
              span({fontSize:'11.5px',fontWeight:'500',color:'#E4DCE6'},'Evidência — '+short(e.date)+' ('+e.type+')'),
              span({fontSize:'11px',color:'#8A808C'},e.path),
              e.note ? span({fontSize:'11px',color:'#8A808C'},e.note) : null
            ));
          });
          panel.appendChild(existSec);
        }

        // Add metrics form
        const metForm = div({padding:'12px 14px',borderRadius:'10px',background:'#1D1620',display:'flex',flexDirection:'column',gap:'8px'});
        metForm.appendChild(div({fontSize:'11.5px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Adicionar métricas'));
        const mDate = h('input',{type:'date',value:toISO(new Date()),style:{height:'34px',boxSizing:'border-box',padding:'0 10px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',background:'#1D1620',color:'#F2EDF0',fontSize:'12.5px',colorScheme:'dark'}});
        metForm.appendChild(div({display:'flex',flexDirection:'column',gap:'4px'}, span({fontSize:'11px',color:'#8A808C'},'Data da coleta'), mDate));

        const metricFields = ['reach','views','likes','comments','shares','saves','profileVisits','follows'];
        const metricLabels = {reach:'Alcance',views:'Visualizações',likes:'Curtidas',comments:'Comentários',shares:'Compartilhamentos',saves:'Salvamentos',profileVisits:'Visitas ao perfil',follows:'Seguidores novos'};
        const metricInputs = {};
        const metGrid = div({display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'});
        metricFields.forEach(f => {
          const inp = h('input',{type:'number',min:'0',placeholder:'—',style:{height:'30px',width:'100%',boxSizing:'border-box',padding:'0 8px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'5px',background:'#1D1620',color:'#F2EDF0',fontSize:'12px'}});
          metricInputs[f] = inp;
          metGrid.appendChild(div({display:'flex',flexDirection:'column',gap:'2px'}, span({fontSize:'10.5px',color:'#8A808C'},metricLabels[f]), inp));
        });
        metForm.appendChild(metGrid);
        const mNote = h('input',{type:'text',placeholder:'Nota (opcional)',style:{height:'30px',boxSizing:'border-box',padding:'0 8px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'5px',background:'#1D1620',color:'#F2EDF0',fontSize:'12px'}});
        metForm.appendChild(mNote);
        metForm.appendChild(btn('btn1',{alignSelf:'flex-start',minHeight:'34px',padding:'0 14px',border:'0',borderRadius:'6px',background:'#6F52D1',color:'#FFFFFF',fontSize:'12.5px',fontWeight:'600'},
          {onClick:async()=>{
            const snapshot = {date:mDate.value, source:'manual'};
            metricFields.forEach(f => { const v=metricInputs[f].value; snapshot[f] = v===''?null:parseInt(v,10); });
            if (mNote.value.trim()) snapshot.note = mNote.value.trim();
            const hasAny = metricFields.some(f=>snapshot[f]!==null);
            if (!hasAny) { this.toast('Preencha pelo menos uma métrica.'); return; }
            // Fetch fresh revision before submitting
            const fresh = await (await fetch(`/api/content/${encodeURIComponent(sel.id)}`)).json();
            if (!fresh || fresh.error) { this.toast('Erro ao verificar revisão atual.'); return; }
            await this.apiMetrics(sel.id, {agent:'Caroline', expectedRevision:fresh.revision, snapshot});
            this.setState({detail:sel.id});
          }},'Registrar métricas'));
        panel.appendChild(metForm);

        // Evidence upload
        const evForm = div({padding:'12px 14px',borderRadius:'10px',background:'#1D1620',display:'flex',flexDirection:'column',gap:'8px'});
        evForm.appendChild(div({fontSize:'11.5px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:'600',color:'#CDBDF8'},'Anexar evidência'));
        const fileInput = h('input',{type:'file',accept:'image/png,image/jpeg,image/webp,application/pdf',style:{fontSize:'12px',color:'#A59BA6'}});
        const evNote = h('input',{type:'text',placeholder:'Nota (ex: Insights 48h)',style:{height:'30px',boxSizing:'border-box',padding:'0 8px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'5px',background:'#1D1620',color:'#F2EDF0',fontSize:'12px'}});
        evForm.appendChild(fileInput);
        evForm.appendChild(evNote);
        evForm.appendChild(btn('btn1',{alignSelf:'flex-start',minHeight:'34px',padding:'0 14px',border:'0',borderRadius:'6px',background:'#6F52D1',color:'#FFFFFF',fontSize:'12.5px',fontWeight:'600'},
          {onClick:async()=>{
            const file = fileInput.files && fileInput.files[0];
            if (!file) { this.toast('Selecione um arquivo.'); return; }
            const uploadResult = await this.apiUploadEvidence(sel.id, file);
            if (!uploadResult) return;
            // Re-fetch current revision to avoid 409 after prior operations
            const fresh = await (await fetch(`/api/content/${encodeURIComponent(sel.id)}`)).json();
            if (!fresh || fresh.error) { this.toast('Erro ao verificar revisão atual.'); return; }
            const metResult = await this.apiMetrics(sel.id, {agent:'Caroline', expectedRevision:fresh.revision, evidence:{date:toISO(new Date()), type:'insight-screenshot', path:uploadResult.path, note:evNote.value.trim()||null}});
            if (!metResult) { this.toast('Upload salvo mas não vinculado. Arquivo: ' + uploadResult.path); }
            this.setState({detail:sel.id});
          }},'Enviar evidência'));
        evForm.appendChild(div({fontSize:'11px',lineHeight:'1.5',color:'#8A808C'},'Aceita PNG, JPG, WebP ou PDF até 10 MB. Salvo em tests/marketing-os/evidence/.'));
        panel.appendChild(evForm);

        // Post URL
        if (sel.postUrl) {
          panel.appendChild(div({padding:'8px 14px',borderRadius:'8px',background:'rgba(95,191,143,.08)',display:'flex',flexDirection:'column',gap:'2px'},
            span({fontSize:'11px',color:'#78D0A5'},'Publicado em '+(sel.publishDate?short(sel.publishDate):'')),
            h('a',{href:sel.postUrl,target:'_blank',rel:'noopener',style:{fontSize:'12px',color:'#78D0A5',wordBreak:'break-all'}},sel.postUrl)
          ));
        }
      }

      // Action buttons
      panel.appendChild(div({display:'flex',flexWrap:'wrap',gap:'8px'},
        btn('btn1',{minHeight:'40px',padding:'0 16px',border:'0',borderRadius:'8px',background:'#6F52D1',color:'#FFFFFF',fontSize:'13px',fontWeight:'600'},
          {onClick:()=>this.setState({screen:'calendario',view:'semana',cursor:sel.publishDate||sel.plannedWeek||TODAY,detail:null})},'Ver no calendário'),
        (sel.publishDate||sel.plannedWeek)&&sel.status!=='publicado' ?
          btn('btn2',{minHeight:'40px',padding:'0 16px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',background:'rgba(255,255,255,.06)',color:'#F2EDF0',fontSize:'13px',fontWeight:'500'},
            {onClick:()=>{this.unplace(sel.id);this.toastLocal(sel.title+': retirado do calendário');}},'Retirar do calendário') : null
      ));

      if (sel.local) {
        panel.appendChild(btn('btn2',{alignSelf:'flex-start',minHeight:'36px',padding:'0 14px',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',background:'rgba(255,255,255,.06)',color:'#F2EDF0',fontSize:'12.5px',fontWeight:'500'},
          {onClick:()=>{this.discard(sel.id);this.toast(sel.title+': alterações locais descartadas');}},'Desfazer alterações locais'));
      }

      panel.appendChild(div({fontSize:'11.5px',lineHeight:'1.5',color:'#8A808C'},'Os campos acima são uma simulação local. As edições aparecem em todas as telas desta página, mas não são gravadas no MOS.'));
      overlay.appendChild(panel);
      return overlay;
    }
  }

  // =====================================================================
  // BOOT
  // =====================================================================
  document.addEventListener('DOMContentLoaded', () => {
    new MarketingOS(document.getElementById('app'));
  });
})();
