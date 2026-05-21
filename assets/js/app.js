/* ============================================================================
   GRCentral · App bootstrap
   ============================================================================ */

(() => {
  const state = {
    route:   'dashboard',
    persona: DATA.personas[0]   // Aarav Mehta · CCO
  };

  const NAV = [
    { section: 'Workspace' },
    { id: 'dashboard',  label: 'Dashboard',         icon: 'layout-dashboard' },
    { id: 'radar',      label: 'Regulatory Radar',  icon: 'radar' },
    { id: 'drift',      label: 'Risk Drift',        icon: 'activity' },

    { section: 'Compliance' },
    { id: 'gaps',       label: 'Compliance Gaps',   icon: 'alert-triangle' },
    { id: 'actions',    label: 'Preventive Actions',icon: 'check-square' },
    { id: 'controls',   label: 'Controls',          icon: 'shield' },
    { id: 'policies',   label: 'Internal Policies', icon: 'file-text' },
    { id: 'evidence',   label: 'Evidence Vault',    icon: 'archive' },

    { section: 'Configuration' },
    { id: 'sources',    label: 'Sources',           icon: 'satellite' },
    { id: 'team',       label: 'Team',              icon: 'users' },
    { id: 'about',      label: 'About',             icon: 'book-open' }
  ];

  /* ---- Rendering -------------------------------------------------------- */

  function renderNav() {
    const html = NAV.map(item => {
      if (item.section) return `<div class="nav-section">${item.section}</div>`;
      const active = state.route === item.id || (item.id === 'radar' && state.route.startsWith('regulation/'));
      return `<div class="nav-item ${active ? 'active' : ''}" data-route="${item.id}">
        <i data-lucide="${item.icon}" class="w-4 h-4"></i><span>${item.label}</span>
      </div>`;
    }).join('');
    document.getElementById('nav').innerHTML = html;
  }

  function renderPersona() {
    const p = state.persona;
    document.getElementById('personaSwitcher').innerHTML = `
      <button id="personaBtn" class="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5">
        ${UI.avatar(p)}
        <div class="text-left leading-tight hidden sm:block">
          <div class="text-[12px] font-semibold">${p.name}</div>
          <div class="text-[10px] text-white/45">${p.role}</div>
        </div>
        <i data-lucide="chevron-down" class="w-3 h-3 text-white/40"></i>
      </button>`;
    document.getElementById('personaBtn').addEventListener('click', openPersonaPicker);
  }

  function openPersonaPicker() {
    UI.openModal(`
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg">Switch persona</h3>
        <button onclick="UI.closeModal()" class="text-white/40 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>
      <p class="text-xs text-white/50 mb-4">GRCentral renders role-specific dashboards. The risk numbers stay the same — what each persona sees first changes.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${DATA.personas.map(p => `
          <button class="text-left p-4 rounded-xl border border-white/5 hover:border-babcom-500/40 hover:bg-white/[0.02] transition" data-pick="${p.id}">
            <div class="flex items-center gap-3">
              ${UI.avatar(p, 'lg')}
              <div>
                <div class="font-bold">${p.name}</div>
                <div class="text-xs text-white/55">${p.role}</div>
                <div class="text-[10px] text-white/40 mt-1">Lands on · ${p.primaryView}</div>
              </div>
            </div>
          </button>`).join('')}
      </div>`);
    document.querySelectorAll('[data-pick]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-pick');
        state.persona = DATA.indexes.personas[id];
        UI.closeModal();
        renderPersona();
        navigate(state.persona.primaryView);
        if (window.lucide) lucide.createIcons();
      });
    });
  }

  function renderView() {
    const root = document.getElementById('view');
    const r = state.route;
    let html = '';
    let section = 'Workspace', page = 'Overview';

    if (r === 'dashboard')              { html = Views.dashboard(state.persona); section = 'Workspace'; page = 'Dashboard'; }
    else if (r === 'radar')             { html = Views.radar();              section = 'Workspace'; page = 'Regulatory Radar'; }
    else if (r === 'drift')             { html = Views.drift();              section = 'Workspace'; page = 'Risk Drift'; }
    else if (r === 'gaps')              { html = Views.gaps();               section = 'Compliance'; page = 'Compliance Gaps'; }
    else if (r === 'actions')           { html = Views.actions();            section = 'Compliance'; page = 'Preventive Actions'; }
    else if (r === 'controls')          { html = Views.controls();           section = 'Compliance'; page = 'Controls'; }
    else if (r === 'policies')          { html = Views.policies();           section = 'Compliance'; page = 'Internal Policies'; }
    else if (r === 'evidence')          { html = Views.evidence();           section = 'Compliance'; page = 'Evidence Vault'; }
    else if (r === 'sources')           { html = Views.sources();            section = 'Configuration'; page = 'Sources'; }
    else if (r === 'team')              { html = Views.team();               section = 'Configuration'; page = 'Team'; }
    else if (r === 'about')             { html = Views.about();              section = 'Configuration'; page = 'About'; }
    else if (r.startsWith('regulation/')) {
      const id = r.split('/')[1];
      html = Views.regulationDetail(id);
      section = 'Workspace'; page = (DATA.indexes.regulations[id]?.shortTitle ?? 'Regulation');
    } else {
      html = `<div class="gr-card p-6">Unknown route: ${r}</div>`;
    }

    root.innerHTML = html;
    document.getElementById('crumb-section').textContent = section;
    document.getElementById('crumb-page').textContent = page;

    if (window.lucide) lucide.createIcons();
    Views.mountCharts(r);
    root.scrollTop = 0;
  }

  function navigate(route) {
    state.route = route;
    renderNav();
    renderView();
  }

  /* ---- Event delegation -------------------------------------------------- */

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-route]');
    if (!el) return;
    const route = el.getAttribute('data-route');
    if (route) {
      e.preventDefault();
      navigate(route);
    }
  });

  /* ---- Sync now button --------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    /* Render */
    renderNav();
    renderPersona();
    renderView();

    /* Reveal */
    setTimeout(() => {
      document.getElementById('splash').remove();
      document.getElementById('app').classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }, 350);

    document.getElementById('syncNow').addEventListener('click', () => {
      const btn = document.getElementById('syncNow');
      btn.textContent = 'Syncing…';
      btn.disabled = true;
      setTimeout(() => {
        document.getElementById('lastSync').textContent = 'just now';
        btn.textContent = '✓ Synced';
        setTimeout(() => { btn.textContent = 'Sync now'; btn.disabled = false; }, 1400);
      }, 900);
    });

    /* Global search → open modal with hits */
    document.getElementById('globalSearch').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const q = e.target.value.trim().toLowerCase();
      if (!q) return;
      const regHits = DATA.regulations.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.shortTitle.toLowerCase().includes(q) ||
        (r.celex || '').toLowerCase().includes(q) ||
        r.topics.some(t => t.toLowerCase().includes(q))
      );
      const ctrlHits = DATA.controls.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
      const articleHits = [];
      DATA.regulations.forEach(r => r.articles.forEach(a => {
        if ((a.title || '').toLowerCase().includes(q) || (a.num || '').toLowerCase().includes(q)) {
          articleHits.push({ reg: r, art: a });
        }
      }));
      /* SECURITY: user query is escaped before being rendered into the modal title. */
      const qEsc = UI.htmlEscape(q);
      UI.openModal(`
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">Search · "${qEsc}"</h3>
          <button onclick="UI.closeModal()" class="text-white/40 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <div class="space-y-5">
          <div>
            <div class="text-[10px] uppercase tracking-widest text-white/40 mb-2">Regulations · ${regHits.length}</div>
            ${regHits.map(r => `<div class="p-3 rounded-lg hover:bg-white/5 cursor-pointer flex items-center justify-between" data-route="regulation/${r.id}">
              <div><div class="font-semibold text-sm">${r.shortTitle}</div><div class="text-[11px] text-white/40">${r.title}</div></div>
              ${r.celex ? `<span class="chip">${r.celex}</span>` : ''}
            </div>`).join('') || `<div class="text-xs text-white/40">none</div>`}
          </div>
          <div>
            <div class="text-[10px] uppercase tracking-widest text-white/40 mb-2">Controls · ${ctrlHits.length}</div>
            ${ctrlHits.map(c => `<div class="p-3 rounded-lg hover:bg-white/5 flex items-center justify-between"><div><div class="font-semibold text-sm">${c.id} · ${c.name}</div><div class="text-[11px] text-white/40">${c.framework}</div></div></div>`).join('') || `<div class="text-xs text-white/40">none</div>`}
          </div>
          <div>
            <div class="text-[10px] uppercase tracking-widest text-white/40 mb-2">Articles · ${articleHits.length}</div>
            ${articleHits.map(h => `<div class="p-3 rounded-lg hover:bg-white/5 cursor-pointer" data-route="regulation/${h.reg.id}"><div class="font-semibold text-sm">${h.reg.shortTitle} · ${h.art.num}</div><div class="text-[11px] text-white/55">${h.art.title}</div></div>`).join('') || `<div class="text-xs text-white/40">none</div>`}
          </div>
        </div>`);
      if (window.lucide) lucide.createIcons();
    });
  });
})();
