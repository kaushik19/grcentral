/* ============================================================================
   GRCentral · Views
   ============================================================================ */

window.Views = (() => {

  /* ---- One-time engine context ------------------------------------------ */
  const ctx = {
    regulations:    DATA.regulations,
    controls:       DATA.controls,
    risks:          DATA.risks,
    changes:        DATA.changes,
    evidence:       DATA.evidence,
    actions:        DATA.actions,
    businessUnits:  DATA.businessUnits,
    driftHistoryByReg: DATA.driftHistoryByReg
  };
  const driftScores  = RiskEngine.computeAll(ctx);
  const driftById    = Object.fromEntries(driftScores.map(d => [d.regId, d]));
  const enterprise   = RiskEngine.rollUpEnterprise(driftScores);

  /* Track Chart.js instances so we can destroy them when re-rendering */
  let CHARTS = [];
  function disposeCharts() { CHARTS.forEach(c => { try { c.destroy(); } catch (_) {} }); CHARTS = []; }

  /* ====================================================================== */
  /*  1. DASHBOARD                                                          */
  /* ====================================================================== */
  function dashboard(persona) {
    const openRisks   = DATA.risks.length;
    const criticalR   = DATA.risks.filter(r => r.severity === 'critical').length;
    const evidenceOld = DATA.evidence.filter(e => e.expiresInDays == null || e.expiresInDays < 0).length;
    const recentChg   = DATA.changes.filter(c => (Date.now() - new Date(c.detectedAt).getTime()) < 7 * 86400000).length;
    const sortedDrift = [...driftScores].sort((a,b) => b.score - a.score);

    return `
      <!-- Hero -->
      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 lg:col-span-8 gr-card p-6 fade-up">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">Good evening, ${persona.name.split(' ')[0]}</div>
              <h2 class="text-2xl font-extrabold tracking-tight">Enterprise compliance posture</h2>
              <p class="text-sm text-white/55 mt-1">10 active regulatory feeds · ${ctx.regulations.length} regulations tracked · last sync <span data-live-since="${Date.now() - 12000}">just now</span></p>
            </div>
            ${UI.badgeForBand(enterprise.band)}
          </div>
          <div class="grid grid-cols-12 gap-4 mt-6 items-center">
            <div class="col-span-12 sm:col-span-4 flex justify-center">
              ${UI.driftGauge(enterprise.score, enterprise.band, 200)}
            </div>
            <div class="col-span-12 sm:col-span-8">
              <div class="text-xs uppercase tracking-widest text-white/40 mb-3">Drift composition (last computation)</div>
              <div class="space-y-3">
                ${componentBar('Regulation Impact',  avgComponent('regulation'),  '#fb7185', 30)}
                ${componentBar('Coverage Gap',        avgComponent('coverage'),    '#fbbf24', 25)}
                ${componentBar('Control Drift',       avgComponent('control'),     '#ff7a3d', 20)}
                ${componentBar('Evidence Aging',      avgComponent('evidence'),    '#a78bfa', 10)}
                ${componentBar('Remediation Delay',   avgComponent('remediation'), '#22d3ee', 10)}
                ${componentBar('Business Criticality',avgComponent('criticality'), '#34d399', 5)}
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
          ${UI.kpiTile({ label: 'Open Risks',             value: openRisks, delta: '+2 this week', deltaPositive: false, icon: 'alert-triangle', color: '#fbbf24', route: 'gaps'     })}
          ${UI.kpiTile({ label: 'Critical',               value: criticalR, delta: '+1 this week', deltaPositive: false, icon: 'octagon-alert',  color: '#fb7185', route: 'gaps'     })}
          ${UI.kpiTile({ label: 'Aged Evidence',          value: evidenceOld, delta: '-1 today',    deltaPositive: true,  icon: 'file-clock',     color: '#a78bfa', route: 'evidence' })}
          ${UI.kpiTile({ label: 'Reg. changes · 7d',      value: recentChg, delta: 'live',          deltaPositive: true,  icon: 'radio-tower',    color: '#22d3ee', route: 'radar'    })}
        </div>
      </div>

      <!-- Trend + worst regs -->
      <div class="grid grid-cols-12 gap-6 mt-6">
        <div class="col-span-12 lg:col-span-8 gr-card p-6 fade-up fade-up-1">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-bold tracking-tight text-[15px]">Risk drift · last 90 days</h3>
              <p class="text-xs text-white/40 mt-1">Enterprise average across all tracked regulations</p>
            </div>
            <div class="flex gap-2 text-[11px] text-white/60">
              <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-babcom-500"></span>Average</span>
              <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-accent-rose"></span>Worst-of</span>
            </div>
          </div>
          <div style="position: relative; height: 240px;"><canvas id="chart-trend"></canvas></div>
        </div>

        <div class="col-span-12 lg:col-span-4 gr-card p-6 fade-up fade-up-2">
          <h3 class="font-bold tracking-tight text-[15px] mb-3">Top drift regulations</h3>
          <div class="space-y-3">
            ${sortedDrift.slice(0, 5).map(d => {
              const reg = DATA.indexes.regulations[d.regId];
              return `
                <div class="flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 rounded-lg px-2 py-2 -mx-2" data-route="regulation/${reg.id}">
                  <div class="min-w-0">
                    <div class="font-semibold text-sm truncate">${reg.shortTitle}</div>
                    <div class="text-[11px] text-white/40 truncate">${reg.title}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-base" style="color:${RiskEngine.bandColor(d.band)}">${UI.fmt.score(d.score)}</div>
                    ${UI.badgeForBand(d.band)}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Risk landscape: category donut + heatmap + upcoming reviews -->
      <div class="grid grid-cols-12 gap-6 mt-6">
        <div class="col-span-12 lg:col-span-4 gr-card p-6 fade-up fade-up-3">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-bold tracking-tight text-[15px]">Risk by category</h3>
              <p class="text-xs text-white/40 mt-1">Open risks grouped by regulatory domain</p>
            </div>
            <span class="chip">${DATA.risks.length} total</span>
          </div>
          <div style="position: relative; height: 220px;">
            <canvas id="chart-risk-category"></canvas>
          </div>
          <div id="risk-category-legend" class="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-4 text-[11px]"></div>
        </div>

        <div class="col-span-12 lg:col-span-5 gr-card p-6 fade-up fade-up-3">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-bold tracking-tight text-[15px]">Risk heatmap</h3>
              <p class="text-xs text-white/40 mt-1">Impact (severity) × Likelihood (SLA pressure)</p>
            </div>
            <div class="flex items-center gap-2 text-[10px] text-white/45">
              <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-accent-emerald"></span>low</span>
              <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-accent-amber"></span>med</span>
              <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-babcom-500"></span>high</span>
              <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-accent-rose"></span>crit</span>
            </div>
          </div>
          ${riskHeatmap()}
        </div>

        <div class="col-span-12 lg:col-span-3 gr-card p-6 fade-up fade-up-3">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-bold tracking-tight text-[15px]">Upcoming reviews</h3>
              <p class="text-xs text-white/40 mt-1">Next 30 days · evidence renewals</p>
            </div>
            <button class="btn btn-ghost text-[11px]" data-route="evidence">Vault <i data-lucide="arrow-right" class="w-3 h-3"></i></button>
          </div>
          <div class="space-y-2">
            ${upcomingReviews()}
          </div>
        </div>
      </div>

      <!-- Live regulatory feed -->
      <div class="grid grid-cols-12 gap-6 mt-6">
        <div class="col-span-12 lg:col-span-7 gr-card p-6 fade-up fade-up-3">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-bold tracking-tight text-[15px] flex items-center gap-2">
                <span class="pulse-dot"></span> Live regulatory radar
              </h3>
              <p class="text-xs text-white/40 mt-1">Top recent changes detected across all sources</p>
            </div>
            <button class="btn btn-ghost text-xs" data-route="radar">Open Radar <i data-lucide="arrow-right" class="w-3 h-3"></i></button>
          </div>
          <div>
            ${[...DATA.changes].sort((a,b) => new Date(b.detectedAt) - new Date(a.detectedAt)).slice(0, 7).map(UI.timelineRow).join('')}
          </div>
        </div>

        <div class="col-span-12 lg:col-span-5 gr-card p-6 fade-up fade-up-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-bold tracking-tight text-[15px]">Preventive actions due soon</h3>
              <p class="text-xs text-white/40 mt-1">Sorted by SLA · click to expand</p>
            </div>
            <button class="btn btn-ghost text-xs" data-route="actions">All actions <i data-lucide="arrow-right" class="w-3 h-3"></i></button>
          </div>
          <div class="space-y-3">
            ${[...DATA.actions].sort((a,b) => a.dueInDays - b.dueInDays).slice(0, 5).map(a => {
              const owner = DATA.indexes.personas[a.ownerId];
              const overdue = a.dueInDays < 0;
              return `
                <div class="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  ${UI.avatar(owner)}
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold truncate">${a.title}</div>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-[11px] text-white/40">${owner.name}</span>
                      <span class="chip" style="background:${overdue ? 'rgba(251,113,133,0.15)' : 'rgba(255,255,255,0.05)'};color:${overdue ? '#fda4af' : 'inherit'}">${overdue ? `${Math.abs(a.dueInDays)}d overdue` : `due in ${a.dueInDays}d`}</span>
                      <span class="chip">${a.effort}</span>
                    </div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Coverage matrix -->
      <div class="gr-card p-6 mt-6 fade-up fade-up-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-bold tracking-tight text-[15px]">Regulation × Business-unit exposure</h3>
            <p class="text-xs text-white/40 mt-1">Cell colour = risk drift contribution to that BU</p>
          </div>
        </div>
        ${coverageHeatmap()}
      </div>
    `;
  }

  function avgComponent(key) {
    const arr = driftScores.map(d => d.components[key]);
    return arr.reduce((a,b) => a + b, 0) / arr.length;
  }

  function componentBar(label, value, color, weight) {
    return `
      <div>
        <div class="flex items-center justify-between text-[11px] mb-1">
          <span class="text-white/60 flex items-center gap-2">
            <span class="text-white/35">${(weight/100).toFixed(2)}×</span>${label}
          </span>
          <span class="font-semibold" style="color:${color}">${UI.fmt.score(value)}</span>
        </div>
        <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div class="h-full rounded-full" style="width:${value}%;background:${color}"></div>
        </div>
      </div>`;
  }

  function riskCategoryData() {
    var buckets = {
      "Data Protection":        { regs: ["reg-gdpr","reg-edpb-opn-4-2026"],                       color: "#22d3ee" },
      "AI Governance":          { regs: ["reg-ai-act"],                                           color: "#a78bfa" },
      "Cybersecurity":          { regs: ["reg-nis2","reg-cra","reg-nist-csf","reg-certin-2024"], color: "#fb7185" },
      "Operational Resilience": { regs: ["reg-dora"],                                             color: "#fbbf24" },
      "Digital Identity":       { regs: ["reg-eidas2"],                                           color: "#34d399" },
      "Platforms & Data":       { regs: ["reg-dsa","reg-data-act"],                               color: "#ff5a1f" }
    };
    return Object.keys(buckets).map(function(label) {
      var def = buckets[label];
      var n = DATA.risks.filter(function(r) { return def.regs.indexOf(r.regId) >= 0; }).length;
      return { label: label, value: n, color: def.color };
    }).filter(function(x) { return x.value > 0; });
  }

  function riskHeatmap() {
    var impactOf = { critical: 5, high: 4, medium: 3, low: 2 };
    function likelihoodOf(r) {
      if (r.remediationDueDays < 0)  return 5;
      if (r.remediationDueDays < 7)  return 4;
      if (r.remediationDueDays < 21) return 3;
      if (r.remediationDueDays < 45) return 2;
      return 1;
    }
    var grid = [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]];
    DATA.risks.forEach(function(r) {
      var i = (impactOf[r.severity] || 1) - 1;
      var l = likelihoodOf(r) - 1;
      grid[i][l]++;
    });
    function cellColor(impact, likelihood) {
      var s = (impact + 1) * (likelihood + 1);
      if (s >= 16) return "#fb7185";
      if (s >= 10) return "#ff5a1f";
      if (s >= 5)  return "#fbbf24";
      return "#34d399";
    }
    var rows = [];
    for (var i = 4; i >= 0; i--) {
      var cells = [];
      for (var l = 0; l < 5; l++) {
        var n = grid[i][l];
        var c = cellColor(i, l);
        cells.push('<div class="aspect-square rounded-md flex items-center justify-center text-xs font-bold" style="background:' + c + (n ? "22" : "0a") + ';color:' + (n ? c : "rgba(255,255,255,0.25)") + ';border:1px solid ' + c + (n ? "55" : "15") + '">' + (n || "") + '</div>');
      }
      rows.push('<div class="grid grid-cols-5 gap-1.5">' + cells.join("") + '</div>');
    }
    return '<div class="flex gap-2 items-stretch">' +
      '<div class="flex flex-col justify-between text-[9px] uppercase tracking-widest text-white/40 py-1"><span>Crit</span><span>High</span><span>Med</span><span>Low</span><span>Min</span></div>' +
      '<div class="flex-1 space-y-1.5">' + rows.join("") +
      '<div class="grid grid-cols-5 gap-1.5 text-[9px] uppercase tracking-widest text-white/40 text-center pt-1"><span>Rare</span><span>Unlikely</span><span>Possible</span><span>Likely</span><span>Certain</span></div>' +
      '</div></div>';
  }

  function upcomingReviews() {
    var items = DATA.evidence
      .filter(function(e) { return e.expiresInDays != null && e.expiresInDays >= 0 && e.expiresInDays <= 30; })
      .sort(function(a, b) { return a.expiresInDays - b.expiresInDays; })
      .slice(0, 6);
    if (!items.length) return '<div class="text-xs text-white/40">No reviews due in the next 30 days.</div>';
    return items.map(function(e) {
      var ctrl = DATA.indexes.controls[e.controlId];
      var urgent = e.expiresInDays < 7;
      return '<div class="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5">' +
        '<div class="mt-1 h-2 w-2 rounded-full" style="background:' + (urgent ? "#fb7185" : "#fbbf24") + '"></div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="text-[12px] font-semibold truncate">' + e.name + '</div>' +
          '<div class="text-[10px] text-white/40 truncate">' + (ctrl ? ctrl.id : "") + '</div>' +
        '</div>' +
        '<span class="chip" style="background:' + (urgent ? "rgba(251,113,133,0.15)" : "rgba(255,255,255,0.05)") + ';color:' + (urgent ? "#fda4af" : "inherit") + '">' + e.expiresInDays + 'd</span>' +
      '</div>';
    }).join("");
  }

  function coverageHeatmap() {
    const regs = ctx.regulations.filter(r => r.buExposure.length).slice(0, 9);
    const bus  = ctx.businessUnits;
    const cell = (reg, bu) => {
      if (!reg.buExposure.includes(bu.id)) return `<td class="p-2"><div class="h-8 rounded-md bg-white/[0.02]"></div></td>`;
      const drift = driftById[reg.id]?.score ?? 0;
      const adj = drift * (bu.criticality / 100);
      const color = RiskEngine.bandColor(RiskEngine.bandFor(adj));
      return `<td class="p-2">
        <div class="h-8 rounded-md flex items-center justify-center text-[11px] font-bold" style="background:${color}22;color:${color};border:1px solid ${color}44">
          ${UI.fmt.score(adj)}
        </div>
      </td>`;
    };
    return `
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr>
              <th class="text-left text-[10px] uppercase tracking-widest text-white/40 p-2">Regulation</th>
              ${bus.map(b => `<th class="text-left text-[10px] uppercase tracking-widest text-white/40 p-2">${b.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${regs.map(r => `
              <tr>
                <td class="p-2 font-semibold whitespace-nowrap">${r.shortTitle}</td>
                ${bus.map(b => cell(r, b)).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  /* ====================================================================== */
  /*  2. REGULATORY RADAR                                                   */
  /* ====================================================================== */
  function radar() {
    const sorted = [...DATA.changes].sort((a,b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    return `
      <div class="flex items-end justify-between mb-6">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight">Regulatory Radar</h2>
          <p class="text-sm text-white/55 mt-1">Auto-detected changes across all sources · grouped by detection time</p>
        </div>
        <div class="flex items-center gap-2">
          ${DATA.sources.slice(0, 6).map(s => UI.sourcePill(s)).join(' ')}
          <span class="text-[11px] text-white/40">+ ${DATA.sources.length - 6} more</span>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 lg:col-span-8 gr-card p-6 fade-up">
          <h3 class="font-bold text-[15px] tracking-tight mb-4">Detected changes</h3>
          ${sorted.map(UI.timelineRow).join('')}
        </div>

        <div class="col-span-12 lg:col-span-4 space-y-6">
          <div class="gr-card p-6 fade-up fade-up-1">
            <h3 class="font-bold text-[15px] tracking-tight mb-3">Most active regulations</h3>
            <div class="space-y-2">
              ${ctx.regulations
                .map(r => ({ r, n: DATA.changes.filter(c => c.regId === r.id).length }))
                .filter(x => x.n > 0)
                .sort((a,b) => b.n - a.n).slice(0, 6)
                .map(({r, n}) => `
                  <div class="flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-lg px-2 py-2 -mx-2" data-route="regulation/${r.id}">
                    <div class="min-w-0">
                      <div class="font-semibold text-sm truncate">${r.shortTitle}</div>
                      <div class="text-[11px] text-white/40 truncate">${r.celex || r.sourceId.toUpperCase()}</div>
                    </div>
                    <span class="chip">${n} change${n === 1 ? '' : 's'}</span>
                  </div>`).join('')}
            </div>
          </div>

          <div class="gr-card p-6 fade-up fade-up-2">
            <h3 class="font-bold text-[15px] tracking-tight mb-3">Source health</h3>
            <div class="space-y-2">
              ${DATA.sources.map(s => {
                const syncedAt = Date.now() - (s.lastSyncMin || 0) * 60_000;
                return `
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full live-fresh-pulse" style="background:${s.status === 'healthy' ? '#34d399' : '#fbbf24'}"></span>
                    <span class="font-medium">${s.name}</span>
                  </div>
                  <span class="text-[11px] text-white/40" data-live-since="${syncedAt}">${s.lastSyncMin} min ago</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ====================================================================== */
  /*  3. REGULATION DETAIL  (ELI-level diff)                                */
  /* ====================================================================== */
  function regulationDetail(regId) {
    const reg = DATA.indexes.regulations[regId];
    if (!reg) return `<div class="gr-card p-6">Regulation not found.</div>`;
    const drift = driftById[reg.id];
    const linkedRisks   = DATA.risks.filter(r => r.regId === reg.id);
    const linkedControls = [...new Set(linkedRisks.map(r => r.controlId))].map(id => DATA.indexes.controls[id]).filter(Boolean);
    const source = DATA.indexes.sources[reg.sourceId];

    return `
      <button class="btn btn-ghost text-xs mb-4" data-route="radar"><i data-lucide="arrow-left" class="w-3 h-3"></i> Back to Radar</button>

      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 lg:col-span-8 gr-card p-6 fade-up">
          <div class="flex items-center gap-2 flex-wrap mb-3">
            ${source ? UI.sourcePill(source) : ''}
            <span class="chip">${reg.jurisdiction}</span>
            ${reg.celex ? `<span class="chip" title="CELEX number">${reg.celex}</span>` : ''}
            <span class="chip">v ${reg.version}</span>
            ${UI.badgeChangeType(reg.changeType)}
          </div>
          <h2 class="text-2xl font-extrabold tracking-tight">${reg.title}</h2>
          <p class="text-sm text-white/65 mt-2 max-w-3xl">${reg.summary}</p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div class="rounded-lg border border-white/5 p-3">
              <div class="text-[10px] uppercase tracking-widest text-white/40">Effective</div>
              <div class="font-semibold text-sm mt-1">${UI.fmt.date(reg.effectiveDate)}</div>
            </div>
            <div class="rounded-lg border border-white/5 p-3">
              <div class="text-[10px] uppercase tracking-widest text-white/40">Last change</div>
              <div class="font-semibold text-sm mt-1">${UI.fmt.relTime(reg.lastChange)}</div>
            </div>
            <div class="rounded-lg border border-white/5 p-3">
              <div class="text-[10px] uppercase tracking-widest text-white/40">Articles</div>
              <div class="font-semibold text-sm mt-1">${reg.articles.length}</div>
            </div>
            <div class="rounded-lg border border-white/5 p-3">
              <div class="text-[10px] uppercase tracking-widest text-white/40">Open risks</div>
              <div class="font-semibold text-sm mt-1">${linkedRisks.length}</div>
            </div>
          </div>

          ${reg.stagedDates ? `
            <div class="mt-5">
              <div class="text-[10px] uppercase tracking-widest text-white/40 mb-2">Application timeline</div>
              <div class="flex items-center gap-3 overflow-x-auto pb-2">
                ${reg.stagedDates.map(s => `
                  <div class="min-w-[160px] rounded-lg border border-babcom-500/20 bg-babcom-500/5 p-3">
                    <div class="text-xs font-bold text-babcom-300">${UI.fmt.date(s.date)}</div>
                    <div class="text-[11px] text-white/60 mt-1">${s.label}</div>
                  </div>`).join('')}
              </div>
            </div>
          ` : ''}

          <div class="flex flex-wrap gap-3 mt-5">
            ${reg.sourceUrl ? `<a href="${reg.sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary"><i data-lucide="external-link" class="w-3 h-3"></i> Open in EUR-Lex</a>` : ''}
            ${reg.htmlUrl ? `<a href="${reg.htmlUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost"><i data-lucide="file-text" class="w-3 h-3"></i> HTML version</a>` : ''}
            ${reg.eli ? `<a href="${reg.eli}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost"><i data-lucide="link" class="w-3 h-3"></i> ELI URI</a>` : ''}
          </div>

          ${reg.articles.length ? `
            <div class="mt-7">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-[15px] tracking-tight">Article-level diff vs previous snapshot</h3>
                <div class="flex items-center gap-2 text-[11px] text-white/50">
                  <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-accent-emerald"></span>added</span>
                  <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-accent-amber"></span>modified</span>
                  <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-accent-rose"></span>removed</span>
                </div>
              </div>
              <div>
                ${reg.articles.map(a => renderArticleDiff(a)).join('')}
              </div>
            </div>` : ''}
        </div>

        <div class="col-span-12 lg:col-span-4 space-y-6">
          <div class="gr-card p-6 fade-up fade-up-1 flex flex-col items-center text-center">
            ${UI.driftGauge(drift.score, drift.band, 180)}
            <div class="text-xs text-white/45 mt-3">Trend multiplier <span class="text-white/80 font-semibold">×${drift.trend.toFixed(2)}</span></div>
            <div class="w-full mt-5 space-y-2">
              ${componentBar('Regulation Impact',  drift.components.regulation,  '#fb7185', 30)}
              ${componentBar('Coverage Gap',        drift.components.coverage,    '#fbbf24', 25)}
              ${componentBar('Control Drift',       drift.components.control,     '#ff7a3d', 20)}
              ${componentBar('Evidence Aging',      drift.components.evidence,    '#a78bfa', 10)}
              ${componentBar('Remediation Delay',   drift.components.remediation, '#22d3ee', 10)}
              ${componentBar('Business Criticality',drift.components.criticality, '#34d399', 5)}
            </div>
          </div>

          <div class="gr-card p-6 fade-up fade-up-2">
            <h3 class="font-bold text-[15px] tracking-tight mb-3">Linked controls</h3>
            <div class="space-y-2">
              ${linkedControls.map(c => `
                <div class="p-3 rounded-lg border border-white/5">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-semibold text-sm">${c.id}</span>
                    <span class="chip">${UI.fmt.pct(c.maturity)} maturity</span>
                  </div>
                  <div class="text-[12px] text-white/65">${c.name}</div>
                  <div class="text-[10px] text-white/40 mt-1">${c.framework}</div>
                </div>`).join('') || `<div class="text-xs text-white/40">No controls linked yet.</div>`}
            </div>
          </div>

          <div class="gr-card p-6 fade-up fade-up-3">
            <h3 class="font-bold text-[15px] tracking-tight mb-3">90-day drift</h3>
            <div style="position: relative; height: 200px;"><canvas id="chart-reg-drift"></canvas></div>
          </div>
        </div>
      </div>
    `;
  }

  function renderArticleDiff(a) {
    if (a.status === 'add') {
      return `
        <div class="article-block diff-add">
          <h5>${a.num} · ${a.title} <span class="badge badge-stable ml-2">NEW</span></h5>
          <div>${a.after}</div>
        </div>`;
    }
    if (a.status === 'remove') {
      return `
        <div class="article-block diff-remove">
          <h5>${a.num} · ${a.title} <span class="badge badge-critical ml-2">REMOVED</span></h5>
          <div>${a.before}</div>
        </div>`;
    }
    if (a.status === 'modify') {
      return `
        <div class="article-block diff-modify">
          <h5>${a.num} · ${a.title} <span class="badge badge-elevated ml-2">MODIFIED</span></h5>
          <div class="text-[12px] text-white/45 mb-1">previous:</div>
          <div class="text-white/55 line-through">${a.before}</div>
          <div class="text-[12px] text-white/45 mt-2 mb-1">+ current</div>
          <div>${a.after}</div>
        </div>`;
    }
    return `
      <div class="article-block diff-keep">
        <h5>${a.num} · ${a.title}</h5>
        <div class="text-white/55">No change since last snapshot.</div>
      </div>`;
  }

  /* ====================================================================== */
  /*  4. RISK DRIFT                                                          */
  /* ====================================================================== */
  function drift() {
    return `
      <div class="flex items-end justify-between mb-6">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight">Risk Drift</h2>
          <p class="text-sm text-white/55 mt-1">Quantified evolution of compliance risk over time · weighted formula explained below</p>
        </div>
        <div class="flex items-center gap-2">
          ${UI.badgeForBand(enterprise.band)}
          <span class="text-[11px] text-white/40">Enterprise score · ${UI.fmt.score(enterprise.score)}</span>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 lg:col-span-8 gr-card p-6 fade-up">
          <h3 class="font-bold text-[15px] tracking-tight mb-4">Per-regulation drift · last 90 days</h3>
          <div style="position: relative; height: 360px;"><canvas id="chart-drift-multi"></canvas></div>
        </div>
        <div class="col-span-12 lg:col-span-4 gr-card p-6 fade-up fade-up-1">
          <h3 class="font-bold text-[15px] tracking-tight mb-3">Formula</h3>
          <div class="rounded-lg bg-black/40 border border-white/5 p-4 font-mono text-[12px] leading-6 text-white/85">
DriftScore =<br/>
&nbsp;&nbsp;(<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-accent-rose">0.30</span>·RegulationImpact<br/>
&nbsp;+ <span class="text-accent-amber">0.25</span>·CoverageGap<br/>
&nbsp;+ <span class="text-babcom-400">0.20</span>·ControlDrift<br/>
&nbsp;+ <span class="text-accent-violet">0.10</span>·EvidenceAging<br/>
&nbsp;+ <span class="text-accent-cyan">0.10</span>·RemediationDelay<br/>
&nbsp;+ <span class="text-accent-emerald">0.05</span>·BusinessCriticality<br/>
&nbsp;&nbsp;) × TrendMultiplier
          </div>
          <p class="text-[11px] text-white/50 mt-3">TrendMultiplier = clamp(1 + slope<sub>30d</sub> / 100, 0.7, 1.5). Sub-scores are normalised to 0–100.</p>
        </div>
      </div>

      <div class="gr-card p-6 mt-6 fade-up fade-up-2">
        <h3 class="font-bold text-[15px] tracking-tight mb-4">Per-regulation breakdown</h3>
        <div class="overflow-x-auto">
          <table class="gr-table">
            <thead>
              <tr>
                <th>Regulation</th>
                <th>Score</th>
                <th>Band</th>
                <th>Trend</th>
                <th>Reg.&nbsp;Impact</th>
                <th>Coverage&nbsp;Gap</th>
                <th>Control&nbsp;Drift</th>
                <th>Evidence&nbsp;Aging</th>
                <th>Remed.&nbsp;Delay</th>
                <th>Biz&nbsp;Crit.</th>
              </tr>
            </thead>
            <tbody>
              ${[...driftScores].sort((a,b) => b.score - a.score).map(d => {
                const reg = DATA.indexes.regulations[d.regId];
                return `
                <tr class="cursor-pointer" data-route="regulation/${reg.id}">
                  <td class="font-semibold">${reg.shortTitle}<div class="text-[11px] text-white/40 font-normal">${reg.celex || reg.sourceId.toUpperCase()}</div></td>
                  <td><span class="font-bold" style="color:${RiskEngine.bandColor(d.band)}">${UI.fmt.score(d.score)}</span></td>
                  <td>${UI.badgeForBand(d.band)}</td>
                  <td><span class="chip">×${d.trend.toFixed(2)}</span></td>
                  <td>${UI.fmt.score(d.components.regulation)}</td>
                  <td>${UI.fmt.score(d.components.coverage)}</td>
                  <td>${UI.fmt.score(d.components.control)}</td>
                  <td>${UI.fmt.score(d.components.evidence)}</td>
                  <td>${UI.fmt.score(d.components.remediation)}</td>
                  <td>${UI.fmt.score(d.components.criticality)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ====================================================================== */
  /*  5. COMPLIANCE GAPS                                                    */
  /* ====================================================================== */
  function gaps() {
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const filter   = window.__gapsFilter || {};
    const all      = DATA.risks.slice();

    /* Apply optional filters (policyId, regId, severity). */
    const filtered = all.filter(function (r) {
      if (filter.policyId && r.sourcePolicyId !== filter.policyId && r.policyId !== filter.policyId) return false;
      if (filter.regId    && r.regId !== filter.regId)         return false;
      if (filter.severity && r.severity !== filter.severity)   return false;
      return true;
    });

    /* Aggregate by policy → list of (regulation → gaps). */
    const byPolicy = {};
    filtered.forEach(function (r) {
      const polId = r.sourcePolicyId || r.policyId || '_unattributed';
      if (!byPolicy[polId]) byPolicy[polId] = { policyId: polId, items: [] };
      byPolicy[polId].items.push(r);
    });

    /* Build a "policy first, then unattributed" order, each group sorted by severity. */
    const policyGroups = Object.keys(byPolicy)
      .filter(function (k) { return k !== '_unattributed'; })
      .map(function (k) { return byPolicy[k]; })
      .concat(byPolicy._unattributed ? [byPolicy._unattributed] : []);
    policyGroups.forEach(function (g) {
      g.items.sort(function (a, b) { return sevOrder[a.severity] - sevOrder[b.severity]; });
    });

    /* Build framework filter chips. */
    const fwFilterChips = ['<button class="chip ' + (!filter.regId ? 'chip-active' : '') + '" onclick="Views.setGapsFilter(\'regId\', null)">All frameworks</button>']
      .concat(DATA.regulations.map(function (reg) {
        const count = all.filter(function (r) { return r.regId === reg.id; }).length;
        if (!count) return '';
        return '<button class="chip ' + (filter.regId === reg.id ? 'chip-active' : '') + '" onclick="Views.setGapsFilter(\'regId\', \'' + UI.htmlEscape(reg.id) + '\')">' + UI.htmlEscape(reg.shortTitle) + ' · ' + count + '</button>';
      })).join('');

    /* Active-filter banner (when scoped to a single policy or framework). */
    let activeBanner = '';
    if (filter.policyId) {
      const pol = DATA.getPolicyById(filter.policyId);
      activeBanner = pol
        ? '<div class="mb-4 rounded-lg border border-babcom-500/30 bg-babcom-500/10 px-4 py-2 flex items-center gap-3 text-[12px]">' +
            '<i data-lucide="filter" class="w-3.5 h-3.5 text-babcom-200"></i>' +
            '<span>Showing gaps for policy <span class="font-semibold text-white">' + UI.htmlEscape(pol.title) + '</span></span>' +
            '<button class="ml-auto text-babcom-200 hover:text-white text-[11px] underline" onclick="Views.clearGapsFilter()">Clear filter</button>' +
          '</div>'
        : '';
    }

    /* Severity totals. */
    const critN = filtered.filter(function (r) { return r.severity === 'critical'; }).length;
    const highN = filtered.filter(function (r) { return r.severity === 'high';     }).length;
    const medlN = filtered.filter(function (r) { return r.severity === 'medium' || r.severity === 'low'; }).length;

    /* Per-policy group renderer. */
    const groupHtml = policyGroups.map(function (g) {
      const pol = g.policyId === '_unattributed' ? null : DATA.getPolicyById(g.policyId);
      const polTitle = pol ? pol.title : 'Unattributed gaps';
      const polVersion = pol ? ' \u00b7 v' + UI.htmlEscape(pol.version) : '';

      /* Per-framework rollup inside this policy. */
      const fwRollup = {};
      g.items.forEach(function (r) {
        const fwName = (DATA.indexes.regulations[r.regId] || {}).shortTitle || r.regId;
        if (!fwRollup[fwName]) fwRollup[fwName] = 0;
        fwRollup[fwName]++;
      });
      const rollupChips = Object.keys(fwRollup).map(function (n) {
        return '<span class="chip">' + UI.htmlEscape(n) + ' · ' + fwRollup[n] + '</span>';
      }).join('');

      const rows = g.items.map(function (r) {
        const reg = DATA.indexes.regulations[r.regId];
        const fc  = r.frameworkControlId ? DATA.getFrameworkControlById(r.frameworkControlId) : null;
        const bu  = DATA.indexes.bu[r.businessUnitId];
        const owner = DATA.indexes.personas[r.ownerId];
        const overdue = r.remediationDueDays < 0;
        const gapTypeChip = r.gapType
          ? '<span class="chip" style="color:' + (r.gapType === 'missing' ? '#fda4af' : '#fcd34d') + ';border-color:' + (r.gapType === 'missing' ? 'rgba(251,113,133,0.4)' : 'rgba(251,191,36,0.4)') + '">' + r.gapType + '</span>'
          : '';
        return '<tr>' +
                 '<td class="font-mono text-[11px] text-white/60">' + UI.htmlEscape(r.id) + '</td>' +
                 '<td class="font-semibold">' + UI.htmlEscape(r.title) + ' ' + gapTypeChip + '</td>' +
                 '<td class="cursor-pointer hover:text-babcom-300" data-route="regulation/' + UI.htmlEscape(r.regId) + '">' + (reg ? UI.htmlEscape(reg.shortTitle) : '—') + '</td>' +
                 '<td class="text-[12px]">' + (fc
                   ? '<span class="font-mono">' + UI.htmlEscape(fc.code) + '</span><div class="text-[10px] text-white/40">' + UI.htmlEscape(fc.title) + '</div>'
                   : '<span class="text-white/40">—</span>') + '</td>' +
                 '<td>' + (bu ? UI.htmlEscape(bu.name) : '—') + '</td>' +
                 '<td>' + (owner ? '<div class="flex items-center gap-2">' + UI.avatar(owner) + '<span class="text-[12px]">' + UI.htmlEscape(owner.name.split(' ')[0]) + '</span></div>' : '—') + '</td>' +
                 '<td>' + UI.badgeSeverity(r.severity) + '</td>' +
                 '<td><span class="chip" style="background:' + (overdue ? 'rgba(251,113,133,0.15)' : 'rgba(255,255,255,0.05)') + ';color:' + (overdue ? '#fda4af' : 'inherit') + '">' + (overdue ? Math.abs(r.remediationDueDays) + 'd overdue' : r.remediationDueDays + 'd') + '</span></td>' +
               '</tr>';
      }).join('');

      const headerLine = pol
        ? '<div class="flex items-start justify-between gap-3 mb-3">' +
            '<div class="min-w-0">' +
              '<div class="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1">Internal policy</div>' +
              '<div class="font-bold text-base truncate">' + UI.htmlEscape(polTitle) + '<span class="text-white/45 font-normal">' + polVersion + '</span></div>' +
              '<div class="mt-1 flex flex-wrap gap-1.5">' + rollupChips + '</div>' +
            '</div>' +
            '<div class="flex items-center gap-2 flex-shrink-0">' +
              '<button class="btn btn-ghost text-[11px] py-1" onclick="Views.openPolicyViewer(\'' + UI.htmlEscape(pol.id) + '\')"><i data-lucide="eye" class="w-3 h-3"></i> View policy</button>' +
              '<button class="btn btn-ghost text-[11px] py-1" onclick="Views.openPolicyComplianceModal(\'' + UI.htmlEscape(pol.id) + '\')"><i data-lucide="shield-alert" class="w-3 h-3"></i> Coverage</button>' +
            '</div>' +
          '</div>'
        : '<div class="font-bold text-base mb-3">' + UI.htmlEscape(polTitle) + '</div>';

      return '<div class="gr-card p-5 mb-4 fade-up">' +
               headerLine +
               '<div class="overflow-x-auto"><table class="gr-table">' +
                 '<thead><tr><th>ID</th><th>Gap</th><th>Framework</th><th>Framework control</th><th>BU</th><th>Owner</th><th>Severity</th><th>SLA</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody>' +
               '</table></div>' +
             '</div>';
    }).join('');

    return `
      <div class="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight">Compliance Gaps</h2>
          <p class="text-sm text-white/55 mt-1">Where an internal policy doesn't satisfy a framework control. Grouped by policy, with framework + control attribution.</p>
        </div>
        <div class="flex gap-2">
          <div class="rounded-lg border border-white/5 px-4 py-2"><div class="text-[10px] uppercase tracking-widest text-white/40">Critical</div><div class="font-bold text-accent-rose">${critN}</div></div>
          <div class="rounded-lg border border-white/5 px-4 py-2"><div class="text-[10px] uppercase tracking-widest text-white/40">High</div><div class="font-bold text-accent-amber">${highN}</div></div>
          <div class="rounded-lg border border-white/5 px-4 py-2"><div class="text-[10px] uppercase tracking-widest text-white/40">Med/Low</div><div class="font-bold">${medlN}</div></div>
        </div>
      </div>

      ${activeBanner}

      <div class="flex flex-wrap items-center gap-1.5 mb-4">${fwFilterChips}</div>

      ${policyGroups.length === 0
        ? '<div class="gr-card p-8 text-center text-white/55"><i data-lucide="shield-check" class="w-8 h-8 mx-auto text-emerald-300 mb-2"></i><div class="font-semibold">No gaps in this view.</div></div>'
        : groupHtml}
    `;
  }

  function setGapsFilter(key, value) {
    var f = window.__gapsFilter || {};
    if (value == null) delete f[key];
    else               f[key] = value;
    window.__gapsFilter = f;
    var nav = document.querySelector('[data-route="gaps"]');
    if (nav) nav.click();
  }
  function clearGapsFilter() {
    window.__gapsFilter = {};
    var nav = document.querySelector('[data-route="gaps"]');
    if (nav) nav.click();
  }

  /* ====================================================================== */
  /*  6. PREVENTIVE ACTIONS                                                 */
  /* ====================================================================== */
  function actions() {
    const cols = [
      { key: 'planned',     label: 'Planned',     color: '#a78bfa' },
      { key: 'in-progress', label: 'In progress', color: '#fbbf24' },
      { key: 'done',        label: 'Done',        color: '#34d399' }
    ];
    return `
      <div class="flex items-end justify-between mb-6">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight">Preventive Actions</h2>
          <p class="text-sm text-white/55 mt-1">AI-suggested mitigations with owners, effort estimate and SLA</p>
        </div>
        <button class="btn btn-primary"><i data-lucide="plus" class="w-3 h-3"></i> New action</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${cols.map(col => {
          const items = DATA.actions.filter(a => a.status === col.key);
          return `
            <div class="gr-card p-5 fade-up">
              <div class="flex items-center justify-between mb-4">
                <div class="font-bold text-sm flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full" style="background:${col.color}"></span>
                  ${col.label}
                </div>
                <span class="chip">${items.length}</span>
              </div>
              <div class="space-y-3">
                ${items.map(a => {
                  const owner = DATA.indexes.personas[a.ownerId];
                  const risk = DATA.indexes.risks[a.riskId];
                  const reg = risk ? DATA.indexes.regulations[risk.regId] : null;
                  const overdue = a.dueInDays < 0;
                  return `
                    <div class="p-3 rounded-xl border border-white/5 bg-white/[0.015] hover:border-babcom-500/30 transition">
                      <div class="text-sm font-semibold leading-snug">${a.title}</div>
                      <div class="flex items-center gap-2 mt-2 flex-wrap">
                        ${reg ? `<span class="chip" style="cursor:pointer" data-route="regulation/${reg.id}">${reg.shortTitle}</span>` : ''}
                        ${risk ? UI.badgeSeverity(risk.severity) : ''}
                        <span class="chip">${a.effort} effort</span>
                        <span class="chip" style="background:${overdue ? 'rgba(251,113,133,0.15)' : 'rgba(255,255,255,0.05)'};color:${overdue ? '#fda4af' : 'inherit'}">${overdue ? `${Math.abs(a.dueInDays)}d overdue` : `${a.dueInDays}d`}</span>
                      </div>
                      <div class="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                        ${UI.avatar(owner)}
                        <div class="text-[12px]">
                          <div class="font-semibold">${owner.name}</div>
                          <div class="text-white/40 text-[10px]">${owner.role}</div>
                        </div>
                      </div>
                    </div>`;
                }).join('') || `<div class="text-xs text-white/40">No items.</div>`}
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  }

  /* ====================================================================== */
  /*  7. EVIDENCE VAULT                                                     */
  /* ====================================================================== */
  function evidence() {
    const autoCount = DATA.evidence.filter(function (e) { return e.auto === true; }).length;
    return `
      <div class="flex items-end justify-between mb-6">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight">Evidence Vault</h2>
          <p class="text-sm text-white/55 mt-1">Audit trail. Each entry ties a policy section to a framework control, so an auditor can see the proof at a glance.</p>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        ${[
          { lbl: 'Total evidence', value: DATA.evidence.length, color: '#22d3ee', icon: 'database' },
          { lbl: 'Auto from policies', value: autoCount, color: '#a78bfa', icon: 'wand-2' },
          { lbl: 'Expired',        value: DATA.evidence.filter(e => e.expiresInDays != null && e.expiresInDays < 0).length, color: '#fb7185', icon: 'alert-triangle' },
          { lbl: 'Healthy',        value: DATA.evidence.filter(e => e.expiresInDays != null && e.expiresInDays >= 30).length, color: '#34d399', icon: 'shield-check' }
        ].map(k => `<div class="col-span-6 md:col-span-3">${UI.kpiTile({ label: k.lbl, value: k.value, icon: k.icon, color: k.color })}</div>`).join('')}
      </div>

      <div class="gr-card p-6 mt-6 fade-up">
        <div class="overflow-x-auto">
        <table class="gr-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Evidence</th>
              <th>Policy</th>
              <th>Framework control</th>
              <th>Section / snippet</th>
              <th>Collected</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${DATA.evidence.map(e => {
              const ctrl = DATA.indexes.controls[e.controlId];
              const pol  = e.policyId ? DATA.getPolicyById(e.policyId) : null;
              const fc   = e.frameworkControlId ? DATA.getFrameworkControlById(e.frameworkControlId) : null;
              const reg  = e.regId ? DATA.indexes.regulations[e.regId] : (fc ? DATA.indexes.regulations[fc.regId] : null);
              let badge, label;
              if (e.expiresInDays == null) { badge = 'badge-high'; label = 'MISSING'; }
              else if (e.expiresInDays < 0) { badge = 'badge-critical'; label = `${Math.abs(e.expiresInDays)}D EXPIRED`; }
              else if (e.expiresInDays < 30) { badge = 'badge-elevated'; label = `EXPIRES IN ${e.expiresInDays}D`; }
              else { badge = 'badge-stable'; label = `FRESH · ${e.expiresInDays}D LEFT`; }
              const polCell = pol
                ? `<button class="text-[12px] text-babcom-200 hover:text-babcom-100 underline-offset-2 hover:underline text-left truncate max-w-[200px]" onclick="Views.openPolicyViewer('${UI.htmlEscape(pol.id)}'${e.policySectionId ? `, { highlightSectionId: '${UI.htmlEscape(e.policySectionId)}' }` : ''})">${UI.htmlEscape(pol.title)}</button>`
                : `<span class="text-[12px] text-white/40">—</span>`;
              const fcCell = fc
                ? `<span class="font-mono text-[11px]">${UI.htmlEscape(fc.code)}</span><div class="text-[10px] text-white/45">${reg ? UI.htmlEscape(reg.shortTitle) + ' · ' : ''}${UI.htmlEscape(fc.title)}</div>`
                : `<span class="text-[12px]">${ctrl?.id ?? '—'}</span><div class="text-[10px] text-white/40">${ctrl?.name ?? ''}</div>`;
              const snippetCell = e.policySectionRef || e.snippet
                ? `<div class="text-[11px] font-semibold text-white/75">${UI.htmlEscape(e.policySectionRef || '')}</div>${e.snippet ? `<div class="text-[10.5px] text-white/50 italic truncate max-w-[280px]" title="${UI.htmlEscape(e.snippet)}">\u201c${UI.htmlEscape(e.snippet)}\u201d</div>` : ''}`
                : `<span class="chip">${UI.htmlEscape(e.source || '')}</span>`;
              return `
                <tr>
                  <td class="font-mono text-[11px] text-white/60">${UI.htmlEscape(e.id)}</td>
                  <td><div class="font-semibold text-[12.5px]">${UI.htmlEscape(e.name)}</div>${e.auto ? '<span class="chip mt-1 text-[10px]" style="color:#c4b5fd;border-color:rgba(167,139,250,0.4)">auto-derived</span>' : ''}</td>
                  <td>${polCell}</td>
                  <td>${fcCell}</td>
                  <td>${snippetCell}</td>
                  <td>${e.collectedAt ? UI.fmt.date(e.collectedAt) : '—'}</td>
                  <td><span class="badge ${badge}">${label}</span></td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
        </div>
      </div>
    `;
  }

  /* ====================================================================== */
  /*  8. CONTROLS                                                           */
  /* ====================================================================== */
  /* For a given framework control, sum the policy coverage across the catalogue
     so the Controls page can show "this clause is covered by N policies; M still
     don't satisfy it." Used by the framework-controls section below. */
  function _frameworkControlCoverage(fcId) {
    var policies = DATA.getAllPolicies();
    var compliant = 0, partial = 0, missing = 0, total = 0;
    var compliantPolicies = [];
    policies.forEach(function (p) {
      if (!Array.isArray(p.mapsToRegulations)) return;
      var fcEntry = DATA.getFrameworkControlById(fcId);
      if (!fcEntry) return;
      if (p.mapsToRegulations.indexOf(fcEntry.regId) === -1) return;
      total++;
      var scan = DATA.scanPolicyCompliance(p);
      var fw = scan.byFramework.find(function (b) { return b.regId === fcEntry.regId; });
      if (!fw) return;
      var ctrl = fw.controls.find(function (c) { return c.id === fcId; });
      if (!ctrl) return;
      if (ctrl.status === 'compliant') { compliant++; compliantPolicies.push(p); }
      else if (ctrl.status === 'partial') partial++;
      else missing++;
    });
    return { total: total, compliant: compliant, partial: partial, missing: missing, compliantPolicies: compliantPolicies };
  }

  function controls() {
    /* Framework controls section : grouped by regulation, each control showing
       cross-policy coverage so the auditor can see whose policies satisfy it. */
    var frameworksHtml = DATA.regulations.map(function (reg) {
      var fcs = DATA.getFrameworkControlsForReg(reg.id);
      if (!fcs.length) return '';
      var rowCount = fcs.length;
      var cards = fcs.map(function (fc) {
        var cov = _frameworkControlCoverage(fc.id);
        var color = cov.total === 0     ? '#71717a'
                  : cov.missing > 0     ? '#fb7185'
                  : cov.partial > 0     ? '#fbbf24'
                  : '#34d399';
        var label = cov.total === 0 ? 'No policy mapped'
                  : cov.compliant + '/' + cov.total + ' policies cover this';
        var coveringList = cov.compliantPolicies.slice(0, 3).map(function (p) {
          return '<button class="chip" onclick="Views.openPolicyViewer(\'' + UI.htmlEscape(p.id) + '\')">' + UI.htmlEscape(p.title) + '</button>';
        }).join('');
        return '<div class="rounded-lg border border-white/5 p-3 flex flex-col">' +
                 '<div class="flex items-start justify-between gap-2 mb-1">' +
                   '<div class="min-w-0">' +
                     '<div class="font-mono text-[10.5px] text-white/45">' + UI.htmlEscape(fc.code) + '</div>' +
                     '<div class="font-bold text-[13px] leading-snug">' + UI.htmlEscape(fc.title) + '</div>' +
                   '</div>' +
                   '<span class="text-[10px] uppercase tracking-widest" style="color:' + color + '">' + UI.htmlEscape(fc.severity) + '</span>' +
                 '</div>' +
                 '<div class="text-[11px] text-white/55 mt-1 leading-relaxed line-clamp-2">' + UI.htmlEscape(fc.summary) + '</div>' +
                 '<div class="mt-2 flex items-center gap-2">' +
                   '<span class="h-1.5 w-1.5 rounded-full" style="background:' + color + '"></span>' +
                   '<span class="text-[10.5px] text-white/55">' + label + '</span>' +
                 '</div>' +
                 (coveringList ? '<div class="mt-2 flex flex-wrap gap-1">' + coveringList + '</div>' : '') +
               '</div>';
      }).join('');
      return '<div class="gr-card p-5 mb-4 fade-up">' +
               '<div class="flex items-center justify-between mb-3">' +
                 '<div>' +
                   '<div class="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">Framework</div>' +
                   '<div class="font-bold text-base">' + UI.htmlEscape(reg.shortTitle) + ' \u2014 ' + UI.htmlEscape(reg.title) + '</div>' +
                 '</div>' +
                 '<span class="chip">' + rowCount + ' controls</span>' +
               '</div>' +
               '<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">' + cards + '</div>' +
             '</div>';
    }).join('');

    return `
      <div class="flex items-end justify-between mb-6">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight">Controls</h2>
          <p class="text-sm text-white/55 mt-1">Frameworks (regulations) and their controls (clauses), plus our internal operational controls. Each framework control shows how many policies actually cover it.</p>
        </div>
      </div>

      <div class="mb-2 flex items-center gap-2">
        <i data-lucide="layers" class="w-4 h-4 text-babcom-300"></i>
        <h3 class="font-bold text-sm uppercase tracking-[0.2em] text-white/75">Framework controls</h3>
        <span class="chip">${DATA.allFrameworkControls().length}</span>
      </div>
      ${frameworksHtml}

      <div class="mb-2 mt-8 flex items-center gap-2">
        <i data-lucide="server-cog" class="w-4 h-4 text-babcom-300"></i>
        <h3 class="font-bold text-sm uppercase tracking-[0.2em] text-white/75">Operational controls</h3>
        <span class="chip">${DATA.controls.length}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${DATA.controls.map(c => {
          const owner = DATA.indexes.personas[c.owner];
          const driftBand = c.drift > 20 ? 'critical' : c.drift > 10 ? 'high' : c.drift > 5 ? 'elevated' : 'stable';
          const linkedPolicy = DATA.getPolicyForControl(c.id);
          /* SECURITY: every value interpolated here is either a known-safe
             system string (drift band, owner.role) or escaped via UI.htmlEscape. */
          const policyRow = linkedPolicy
            ? `<div class="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                 <div class="min-w-0">
                   <div class="kpi-label">Linked policy</div>
                   <button class="text-[12px] font-semibold truncate text-left text-babcom-200 hover:text-babcom-100 transition" onclick="Views.openPolicyViewer('${UI.htmlEscape(linkedPolicy.id)}')" title="Open policy in viewer">${UI.htmlEscape(linkedPolicy.title)} <span class="text-white/40 font-normal">· v${UI.htmlEscape(linkedPolicy.version)}</span></button>
                 </div>
                 <button class="btn btn-ghost text-[11px] py-1.5" onclick="Views.openPolicyPickerModal('${UI.htmlEscape(c.id)}')">
                   <i data-lucide="link" class="w-3 h-3"></i> Change
                 </button>
               </div>`
            : `<div class="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                 <div class="text-[11px] text-white/45">No linked policy</div>
                 <button class="btn btn-ghost text-[11px] py-1.5" onclick="Views.openPolicyPickerModal('${UI.htmlEscape(c.id)}')">
                   <i data-lucide="link" class="w-3 h-3"></i> Link policy
                 </button>
               </div>`;
          return `
            <div class="gr-card gr-card-hover p-5 fade-up">
              <div class="flex items-start justify-between mb-2">
                <span class="font-mono text-[11px] text-white/50">${c.id}</span>
                ${UI.badgeForBand(driftBand)}
              </div>
              <h4 class="font-bold text-sm leading-snug">${c.name}</h4>
              <p class="text-[11px] text-white/40 mt-1">${c.framework}</p>
              <div class="mt-4">
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="text-white/55">Maturity</span><span class="font-semibold">${UI.fmt.pct(c.maturity)}</span>
                </div>
                <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" style="width:${c.maturity}%;background:${RiskEngine.bandColor(driftBand)}"></div>
                </div>
              </div>
              ${policyRow}
              <div class="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                ${UI.avatar(owner)}
                <div class="text-[12px]">
                  <div class="font-semibold">${owner.name}</div>
                  <div class="text-white/40 text-[10px]">${owner.role}</div>
                </div>
                <div class="ml-auto text-[11px]">
                  <span class="chip">drift ${c.drift}%</span>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  }

  /* ====================================================================== */
  /*  9. TEAM / PERSONAS                                                    */
  /* ====================================================================== */
  function team() {
    const counts = (id) => ({
      risks:   DATA.risks.filter(r => r.ownerId === id).length,
      actions: DATA.actions.filter(a => a.ownerId === id).length,
      controls: DATA.controls.filter(c => c.owner === id).length
    });
    return `
      <div class="flex items-end justify-between mb-6">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight">Team</h2>
          <p class="text-sm text-white/55 mt-1">Role-based access · 7 personas across compliance, risk, security and audit</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${DATA.personas.map(p => {
          const k = counts(p.id);
          return `
            <div class="gr-card gr-card-hover p-5 fade-up">
              <div class="flex items-center gap-4">
                ${UI.avatar(p, 'lg')}
                <div class="min-w-0">
                  <div class="font-bold text-base truncate">${p.name}</div>
                  <div class="text-xs text-white/55">${p.role}</div>
                  <div class="text-[11px] text-white/40 mt-1 truncate">${p.email}</div>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-white/5 text-center">
                <div><div class="kpi-label">Risks</div><div class="font-bold">${k.risks}</div></div>
                <div><div class="kpi-label">Actions</div><div class="font-bold">${k.actions}</div></div>
                <div><div class="kpi-label">Controls</div><div class="font-bold">${k.controls}</div></div>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  }

  /* ====================================================================== */
  /*  10. SOURCES                                                           */
  /* ====================================================================== */
  function sources() {
    const totalDocs = DATA.sources.reduce(function (a, s) { return a + (s.documentsTracked || 0); }, 0);
    const healthy   = DATA.sources.filter(function (s) { return s.status === 'healthy'; }).length;
    const syncedH   = DATA.sources.filter(function (s) { return (s.lastSyncMin || 0) <= 60; }).length;
    return `
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight">Regulatory Sources</h2>
          <p class="text-sm text-white/55 mt-1">${DATA.sources.length} active feeds across EU, UK, US, India and global standards · each is the official authority</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="hidden md:flex items-center gap-4 pr-4 border-r border-white/5">
            <div class="text-right">
              <div class="kpi-label">Feeds</div>
              <div class="font-bold text-sm mt-0.5">${healthy}<span class="text-white/30"> / ${DATA.sources.length}</span></div>
            </div>
            <div class="text-right">
              <div class="kpi-label">Documents</div>
              <div class="font-bold text-sm mt-0.5">${totalDocs.toLocaleString()}</div>
            </div>
            <div class="text-right">
              <div class="kpi-label">Fresh ≤1h</div>
              <div class="font-bold text-sm mt-0.5 text-accent-emerald">${syncedH}</div>
            </div>
          </div>
          <button class="btn btn-primary" onclick="Views.openAddSourceModal()">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add source
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${DATA.sources.map(function (s) {
          const statusColor = s.status === 'healthy' ? '#34d399' : s.status === 'degraded' ? '#fbbf24' : '#fb7185';
          const syncBadge = (s.lastSyncMin == null) ? 'never' : (s.lastSyncMin < 60 ? s.lastSyncMin + 'm ago' : Math.round(s.lastSyncMin / 60) + 'h ago');
          const flag = { EU: '🇪🇺', UK: '🇬🇧', US: '🇺🇸', IN: '🇮🇳', Global: '🌐' }[s.jurisdiction] || '';
          /* SECURITY: every user-controlled field is rendered through UI.htmlEscape;
             URLs are passed through UI.safeUrl which rejects non-http(s) schemes. */
          const _name = UI.htmlEscape(s.name);
          const _jur  = UI.htmlEscape(s.jurisdiction);
          const _type = UI.htmlEscape(s.type);
          const _url  = UI.safeUrl(s.url);
          const _urlT = UI.htmlEscape(s.url);
          const _desc = UI.htmlEscape(s.description);
          const _fmt  = UI.htmlEscape(s.outputFormat || s.type);
          const _ing  = UI.htmlEscape(s.ingestion || '—');
          const _poll = UI.htmlEscape(s.pollInterval || '—');
          const _sb   = UI.htmlEscape(syncBadge);
          const _stat = UI.htmlEscape(s.status.toUpperCase());
          return `
            <div class="gr-card gr-card-hover p-5 fade-up flex flex-col">
              <div class="flex items-start justify-between mb-3 gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-base truncate">${_name}</span>
                  </div>
                  <div class="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                    <span>${flag}</span><span>${_jur}</span><span class="text-white/20">•</span><span>${_type}</span>
                  </div>
                </div>
                <span class="badge ${s.status === 'healthy' ? 'badge-stable' : (s.status === 'degraded' ? 'badge-high' : 'badge-critical')}">
                  <span class="badge-dot" style="background:${statusColor}"></span>${_stat}
                </span>
              </div>

              <a href="${_url}" target="_blank" rel="noopener noreferrer" class="text-xs text-white/55 hover:text-babcom-300 break-all transition">${_urlT}</a>

              ${s.description ? '<p class="text-[11px] text-white/45 mt-2 leading-relaxed">' + _desc + '</p>' : ''}

              <div class="grid grid-cols-2 gap-2 mt-4">
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Format</div>
                  <div class="font-semibold text-xs mt-1 truncate">${_fmt}</div>
                </div>
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Ingestion</div>
                  <div class="font-semibold text-xs mt-1 truncate">${_ing}</div>
                </div>
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Polling</div>
                  <div class="font-semibold text-xs mt-1">${_poll}</div>
                </div>
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Last sync</div>
                  <div class="font-semibold text-xs mt-1" data-live-since="${Date.now() - (s.lastSyncMin || 0) * 60_000}">${_sb}</div>
                </div>
              </div>

              <div class="mt-3 flex items-center justify-between text-[11px]">
                <div class="flex items-center gap-1.5">
                  <span class="h-1.5 w-1.5 rounded-full live-fresh-pulse" style="background:${statusColor}"></span>
                  <span class="text-white/55 tabular-nums" data-live-next="${UI.htmlEscape(s.id)}">next in &mdash;</span>
                </div>
                ${s.documentsTracked != null ? `<span class="text-white/45">${s.documentsTracked.toLocaleString()} documents tracked</span>` : ''}
              </div>
              <div class="mt-2 flex items-center justify-end text-[11px]">
                <a href="${_url}" target="_blank" rel="noopener noreferrer" class="text-babcom-400 hover:text-babcom-300 font-semibold">Visit →</a>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  }

  /* ====================================================================== */
  /*  Add-source modal: form + multi-step verify + save                     */
  /* ====================================================================== */

  /* Deterministic verification simulator. Returns a result that depends on
     the URL shape, so a clearly-bad URL always fails and a clean HTTPS URL
     always passes. */
  function _canonicaliseUrl(url) {
    if (!url) return '';
    /* Strip zero-width / BOM / smart-quote-edge / control chars and trim. */
    var cleaned = String(url).replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();
    /* Auto-prepend https:// if no scheme. */
    /* Detect any URI scheme. Scheme chars exclude '.' so that 'example.com:8080' still
       counts as a hostname:port (no scheme) and gets auto-prefixed. */
    if (cleaned && !/^[a-zA-Z][a-zA-Z0-9+-]*:(?!\d)/.test(cleaned)) cleaned = 'https://' + cleaned;
    return cleaned;
  }

  function _addSrcSimulate(url, format) {
    url = _canonicaliseUrl(url);
    var s = url.toLowerCase();
    if (!/^https?:\/\//.test(s)) return { ok: false, reason: 'URL must start with http:// or https:// (we tried adding it for you but it still didn\'t parse)', url: url };
    var hostMatch = s.match(/^https?:\/\/([^\/]+)/);
    if (!hostMatch) return { ok: false, reason: 'Could not parse host from URL', url: url };
    var host = hostMatch[1];
    if (/^(localhost|127\.|192\.168|10\.)/.test(host)) return { ok: false, reason: 'Private / loopback addresses are not reachable from the ingestion VPC', url: url };
    if (!/\./.test(host)) return { ok: false, reason: 'Hostname has no TLD', url: url };
    if (host.length < 4) return { ok: false, reason: 'Hostname looks malformed', url: url };
    /* Deterministic counts derived from the URL hash */
    var h = 0; for (var i = 0; i < url.length; i++) h = ((h << 5) - h + url.charCodeAt(i)) | 0;
    var docs = Math.abs(h % 1800) + 24;
    var sampleSize = Math.abs(h % 500) + 18;
    var detected = format || (/\.json/.test(s) ? 'JSON' :
                              /\.xml/.test(s)  ? 'XML'  :
                              /rss|feed/.test(s) ? 'RSS' :
                              /github\.com/.test(s) ? 'Git releases' :
                              'HTML + PDF');
    return { ok: true, host: host, docs: docs, sampleSize: sampleSize, detected: detected, url: url };
  }

  function openAddSourceModal() {
    const html = `
      <div class="flex items-start justify-between mb-5">
        <div>
          <div class="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">New ingestion target</div>
          <h3 class="text-xl font-extrabold tracking-tight">Add a regulatory source</h3>
          <p class="text-xs text-white/55 mt-1">GRCentral will poll this source on a schedule, diff every document against the last snapshot and feed the Risk Drift engine.</p>
        </div>
        <button onclick="UI.closeModal()" class="text-white/40 hover:text-white p-1"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>

      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 md:col-span-7 space-y-3">
          <label class="block">
            <span class="kpi-label">Source name</span>
            <input id="src-name" placeholder="e.g. BaFin Circulars" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-babcom-500/50" />
          </label>
          <label class="block">
            <span class="kpi-label">URL</span>
            <input id="src-url" placeholder="https://www.example.gov/" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-babcom-500/50 font-mono text-[12px]" />
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="kpi-label">Jurisdiction</span>
              <select id="src-jur" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm focus:outline-none focus:border-babcom-500/50">
                <option>EU</option><option>UK</option><option>US</option><option>IN</option><option>Global</option><option>Other</option>
              </select>
            </label>
            <label class="block">
              <span class="kpi-label">Source type</span>
              <select id="src-type" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm focus:outline-none focus:border-babcom-500/50">
                <option value="primary">Primary law</option>
                <option value="guidance">Guidance</option>
                <option value="advisory">Advisory</option>
                <option value="standard">Standard / framework</option>
                <option value="policy">Policy portal</option>
                <option value="cyber">Cyber advisory</option>
              </select>
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="kpi-label">Output format</span>
              <select id="src-format" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm focus:outline-none focus:border-babcom-500/50">
                <option>HTML</option>
                <option>HTML + PDF</option>
                <option>PDF</option>
                <option>RSS</option>
                <option>JSON</option>
                <option>XML</option>
                <option>Akoma Ntoso XML</option>
                <option>Git releases</option>
              </select>
            </label>
            <label class="block">
              <span class="kpi-label">Polling interval</span>
              <select id="src-poll" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm focus:outline-none focus:border-babcom-500/50">
                <option>15m</option><option selected>1h</option><option>3h</option><option>6h</option><option>24h</option>
              </select>
            </label>
          </div>
          <label class="block">
            <span class="kpi-label">Description (optional)</span>
            <textarea id="src-desc" rows="2" placeholder="What does this source publish?" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-babcom-500/50 resize-none"></textarea>
          </label>
        </div>

        <div class="col-span-12 md:col-span-5">
          <div class="gr-card p-4 h-full flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <div class="font-bold text-sm">Verification</div>
              <span id="verify-state" class="badge badge-neutral">Not started</span>
            </div>
            <div id="verify-steps" class="space-y-2 flex-1">
              <div class="text-xs text-white/40">Fill the form, then click <span class="text-white/70 font-semibold">Verify source</span>. We'll reach out, sample documents and detect the format before letting you save.</div>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button id="verify-btn" class="btn btn-ghost text-xs justify-center" onclick="Views.verifyAddSource()">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Verify source
              </button>
              <button id="save-btn" disabled class="btn btn-primary text-xs justify-center opacity-40 cursor-not-allowed" onclick="Views.saveAddSource()">
                <i data-lucide="save" class="w-3.5 h-3.5"></i> Save source
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    UI.openModal(html);
  }

  function _setStepUI(steps, idx, status, detail) {
    var rows = steps.map(function (label, i) {
      var dot = '<span class="h-2 w-2 rounded-full" style="background:rgba(255,255,255,0.15)"></span>';
      var labelCls = 'text-white/40';
      if (i < idx)              { dot = '<i data-lucide="check" class="w-3.5 h-3.5 text-accent-emerald"></i>'; labelCls = 'text-white/85'; }
      else if (i === idx) {
        if (status === 'fail')  { dot = '<i data-lucide="x" class="w-3.5 h-3.5 text-accent-rose"></i>';      labelCls = 'text-accent-rose'; }
        else                    { dot = '<span class="pulse-dot" style="background:#fbbf24"></span>';         labelCls = 'text-accent-amber font-semibold'; }
      }
      return '<div class="flex items-center gap-2 text-xs"><span class="w-4 flex items-center justify-center">' + dot + '</span><span class="' + labelCls + '">' + label + '</span></div>';
    }).join('');
    var detailHtml = detail ? '<div class="mt-3 pt-3 border-t border-white/5">' + detail + '</div>' : '';
    var el = document.getElementById('verify-steps');
    if (el) el.innerHTML = rows + detailHtml;
    if (window.lucide) lucide.createIcons();
  }

  function verifyAddSource() {
    var nameEl = document.getElementById('src-name');
    var urlEl  = document.getElementById('src-url');
    var fmtEl  = document.getElementById('src-format');
    var name   = (nameEl || {}).value || '';
    var rawUrl = (urlEl  || {}).value || '';
    var format = (fmtEl  || {}).value || 'HTML';

    /* Canonicalise the URL once: strip zero-width chars, trim, auto-prepend
       https:// if needed. Echo the cleaned value back to the input so the
       user can see exactly what we will check. */
    var url = _canonicaliseUrl(rawUrl);
    if (urlEl && url !== rawUrl) urlEl.value = url;

    if (!name.trim() || !url) {
      var stateB = document.getElementById('verify-state');
      if (stateB) { stateB.className = 'badge badge-high'; stateB.textContent = 'Name + URL required'; }
      return;
    }
    var saveBtn = document.getElementById('save-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.classList.add('opacity-40','cursor-not-allowed'); }
    var state = document.getElementById('verify-state');
    if (state) { state.className = 'badge badge-info'; state.textContent = 'Verifying...'; }

    var preHostMatch = url.match(/^https?:\/\/([^\/]+)/);
    var preHost = preHostMatch ? preHostMatch[1] : '(invalid URL)';
    /* SECURITY: every user-controlled string goes through UI.htmlEscape before
       being concatenated into the verifier step labels (rendered via innerHTML). */
    var steps = [
      'Resolving DNS for ' + UI.htmlEscape(preHost),
      'Establishing TLS handshake',
      'Fetching HEAD + sample (' + UI.htmlEscape(format) + ')',
      'Parsing structure & extracting documents'
    ];
    var result = _addSrcSimulate(url, format);
    _setStepUI(steps, 0, 'pending');

    setTimeout(function () { _setStepUI(steps, 1, 'pending'); }, 700);
    setTimeout(function () { _setStepUI(steps, 2, 'pending'); }, 1500);
    setTimeout(function () { _setStepUI(steps, 3, 'pending'); }, 2300);
    setTimeout(function () {
      if (!result.ok) {
        _setStepUI(steps, 3, 'fail',
          '<div class="flex items-start gap-2 text-xs text-accent-rose">' +
            '<i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>' +
            '<div class="min-w-0">' +
              '<div class="font-semibold">Verification failed</div>' +
              '<div class="text-white/55 mt-1">' + UI.htmlEscape(result.reason) + '</div>' +
              (result.url ? '<div class="text-[10px] text-white/35 mt-2 font-mono break-all">URL checked: ' + UI.htmlEscape(result.url) + '</div>' : '') +
            '</div>' +
          '</div>'
        );
        var st = document.getElementById('verify-state'); if (st) { st.className = 'badge badge-critical'; st.textContent = 'Failed'; }
        return;
      }
      _setStepUI(steps, 4, 'pending',
        '<div class="space-y-2 text-xs">' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Host</span><span class="font-mono text-white/85">' + UI.htmlEscape(result.host) + '</span></div>' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Detected format</span><span class="text-white/85 font-semibold">' + UI.htmlEscape(result.detected) + '</span></div>' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Documents found</span><span class="text-white/85 font-semibold">' + result.docs.toLocaleString() + '</span></div>' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Sample payload</span><span class="text-white/85 font-semibold">' + result.sampleSize + ' KB</span></div>' +
          '<div class="flex items-center gap-2 text-accent-emerald font-semibold pt-2"><i data-lucide="shield-check" class="w-4 h-4"></i>Source verified, ready to save.</div>' +
        '</div>'
      );
      var st2 = document.getElementById('verify-state'); if (st2) { st2.className = 'badge badge-stable'; st2.textContent = 'Verified'; }
      var sb = document.getElementById('save-btn'); if (sb) { sb.disabled = false; sb.classList.remove('opacity-40','cursor-not-allowed'); }
      window.__addSrcLastResult = { result: result, format: format };
    }, 3100);
  }

  function saveAddSource() {
    var name  = (document.getElementById('src-name') || {}).value || '';
    var url   = _canonicaliseUrl((document.getElementById('src-url') || {}).value || '');
    var jur   = (document.getElementById('src-jur')  || {}).value || 'Other';
    var type  = (document.getElementById('src-type') || {}).value || 'guidance';
    var poll  = (document.getElementById('src-poll') || {}).value || '1h';
    var desc  = (document.getElementById('src-desc') || {}).value || '';
    var last  = window.__addSrcLastResult;
    if (!last) return;

    var src = {
      id: 'usr-' + Math.random().toString(36).slice(2, 8),
      name: name.trim(),
      url: url.trim(),
      jurisdiction: jur,
      type: type,
      outputFormat: last.format,
      ingestion: 'Auto-detected',
      pollInterval: poll,
      status: 'healthy',
      lastSyncMin: 0,
      documentsTracked: last.result.docs,
      description: desc.trim() || 'User-added source.'
    };
    DATA.sources.push(src);
    DATA.indexes.sources[src.id] = src;
    UI.closeModal();
    /* Re-render the sources view; ask the app shell to navigate, falling back
       to direct re-render of the current view via the routed click handler. */
    var ev = new (window.CustomEvent || function () {})('click', { bubbles: true });
    var nav = document.querySelector('[data-route="sources"]');
    if (nav) nav.click();
  }

  /* ====================================================================== */
  /*  11. ABOUT / Formula explainer                                         */
  /* ====================================================================== */
  function about() {
    return `
      <div class="flex items-end justify-between mb-6">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight">About GRCentral</h2>
          <p class="text-sm text-white/55 mt-1">Notes on what this is, why it exists, and how the pieces fit together.</p>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 lg:col-span-7 gr-card p-6 fade-up">
          <h3 class="font-bold text-[15px] tracking-tight mb-3">Problem</h3>
          <p class="text-sm text-white/70 leading-relaxed">A large EU-active enterprise must comply with GDPR, the AI Act (Regulation 2024/1689), NIS2, DORA, DSA, DMA, eIDAS 2.0, EU Data Act and the Cyber Resilience Act, plus parallel guidance from EDPB, ENISA, ICO, NIST, CISA, CERT-In, OWASP and CIS. The texts change constantly through delegated acts, RTS and advisories. Without automation, by the time anyone notices, the company is already drifting out of compliance.</p>
          <h3 class="font-bold text-[15px] tracking-tight mb-3 mt-6">Solution</h3>
          <p class="text-sm text-white/70 leading-relaxed">GRCentral polls every official source, detects changes at the article / ELI level, maps each change to internal controls and policies, quantifies a Risk Drift Score over time, and recommends preventive actions with owners and SLAs.</p>

          <h3 class="font-bold text-[15px] tracking-tight mb-3 mt-6">Risk Drift formula</h3>
          <div class="rounded-lg bg-black/40 border border-white/5 p-4 font-mono text-[12px] leading-6 text-white/85">
DriftScore = (<br/>
&nbsp;&nbsp;<span class="text-accent-rose">0.30</span> · RegulationImpact &nbsp;&nbsp; <span class="text-white/40">severity & recency of changes</span><br/>
+ <span class="text-accent-amber">0.25</span> · CoverageGap &nbsp;&nbsp; <span class="text-white/40">100 − avg control maturity</span><br/>
+ <span class="text-babcom-400">0.20</span> · ControlDrift &nbsp;&nbsp; <span class="text-white/40">avg drift % of linked controls</span><br/>
+ <span class="text-accent-violet">0.10</span> · EvidenceAging &nbsp;&nbsp; <span class="text-white/40">% expired or expiring &lt; 30d</span><br/>
+ <span class="text-accent-cyan">0.10</span> · RemediationDelay &nbsp;&nbsp; <span class="text-white/40">severity-weighted overdue</span><br/>
+ <span class="text-accent-emerald">0.05</span> · BusinessCriticality &nbsp;&nbsp; <span class="text-white/40">max exposure across BUs</span><br/>
) × TrendMultiplier &nbsp;&nbsp; <span class="text-white/40">clamp(1 + slope<sub>30d</sub>/100, 0.7, 1.5)</span>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-5 space-y-6">
          <div class="gr-card p-6 fade-up fade-up-1">
            <h3 class="font-bold text-[15px] tracking-tight mb-3">How we get regulatory data (real APIs)</h3>
            <ul class="text-sm text-white/70 space-y-2 leading-relaxed">
              <li><span class="chip">EUR-Lex</span> SPARQL endpoint + Akoma Ntoso XML + ELI versioning</li>
              <li><span class="chip">EDPB</span> RSS + HTML scrape of opinions and guidelines</li>
              <li><span class="chip">ENISA</span> RSS + PDF parsing</li>
              <li><span class="chip">NIST</span> CSRC Publications JSON API</li>
              <li><span class="chip">CISA</span> JSON advisory feed</li>
              <li><span class="chip">CERT-In</span> Advisory HTML scrape</li>
              <li><span class="chip">ICO · OWASP · CIS</span> RSS + GitHub releases</li>
            </ul>
            <p class="text-[11px] text-white/45 mt-3">For each document we store (ELI/CELEX, version, contentHash, articleHashes[]). Hash diffs surface added / modified / removed articles.</p>
          </div>

          <div class="gr-card p-6 fade-up fade-up-2">
            <h3 class="font-bold text-[15px] tracking-tight mb-3">Drift bands</h3>
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between"><span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-accent-emerald"></span> Stable</span><span class="text-white/55">0–25</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-babcom-500"></span> Elevated</span><span class="text-white/55">26–50</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-accent-amber"></span> High</span><span class="text-white/55">51–75</span></div>
              <div class="flex items-center justify-between"><span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-accent-rose"></span> Critical</span><span class="text-white/55">76–100</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ====================================================================== */
  /*  Chart rendering — called after each view that uses canvases           */
  /* ====================================================================== */
  function mountCharts(route) {
    disposeCharts();
    if (!window.Chart) return;
    Chart.defaults.color = 'rgba(255,255,255,0.55)';
    Chart.defaults.font.family = "'Montserrat', system-ui, sans-serif";
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

    if (route === 'dashboard') {
      const el = document.getElementById('chart-trend');
      if (el) {
        const labels = DATA.driftHistoryByReg[ctx.regulations[0].id].map(p => p.date);
        const avgSeries = labels.map((_, i) => {
          const vals = ctx.regulations.map(r => DATA.driftHistoryByReg[r.id][i].score);
          return vals.reduce((a,b) => a + b, 0) / vals.length;
        });
        const worstSeries = labels.map((_, i) => {
          const vals = ctx.regulations.map(r => DATA.driftHistoryByReg[r.id][i].score);
          return Math.max(...vals);
        });
        CHARTS.push(new Chart(el, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Average',
                data: avgSeries,
                borderColor: '#ff5a1f',
                backgroundColor: function (c) { return makeGradient(c.chart.ctx, c.chart.chartArea, '#ff5a1f'); },
                fill: true, borderWidth: 2.5,
                pointBackgroundColor: '#ff5a1f', pointBorderColor: '#0d0d0f',
                pointHoverBackgroundColor: '#ffffff', pointHoverBorderColor: '#ff5a1f'
              },
              {
                label: 'Worst-of',
                data: worstSeries,
                borderColor: '#fb7185',
                backgroundColor: 'rgba(251,113,133,0)',
                borderDash: [4, 4], fill: false, borderWidth: 1.5,
                pointBackgroundColor: '#fb7185', pointBorderColor: '#0d0d0f',
                pointHoverBackgroundColor: '#ffffff', pointHoverBorderColor: '#fb7185'
              }
            ]
          },
          options: chartOptsTime()
        }));
      }
      const cat = document.getElementById('chart-risk-category');
      if (cat) {
        const rows = riskCategoryData();
        const total = rows.reduce(function (a, r) { return a + r.value; }, 0);
        const centerLabelPlugin = {
          id: 'donutCenterLabel-' + Math.random().toString(36).slice(2, 6),
          afterDraw: function (chart) {
            var c = chart.ctx, w = chart.width, h = chart.height;
            c.save();
            c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillStyle = 'rgba(255,255,255,0.9)';
            c.font = '700 26px Montserrat, system-ui, sans-serif';
            c.fillText(String(total), w / 2, h / 2 - 8);
            c.fillStyle = 'rgba(255,255,255,0.4)';
            c.font = '600 9.5px Montserrat, system-ui, sans-serif';
            c.fillText('TOTAL RISKS', w / 2, h / 2 + 12);
            c.restore();
          }
        };
        CHARTS.push(new Chart(cat, {
          type: 'doughnut',
          data: {
            labels: rows.map(function (r) { return r.label; }),
            datasets: [{
              data: rows.map(function (r) { return r.value; }),
              backgroundColor: rows.map(function (r) { return r.color; }),
              borderColor: '#0d0d0f', borderWidth: 3,
              hoverOffset: 10, hoverBorderColor: '#0d0d0f'
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '68%',
            animation: { animateRotate: true, duration: 800, easing: 'easeOutCubic' },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(13,13,15,0.96)',
                borderColor: 'rgba(255,90,31,0.35)', borderWidth: 1, padding: 10, cornerRadius: 10,
                titleColor: '#fff', titleFont: { size: 12, weight: '700' },
                bodyColor: 'rgba(255,255,255,0.85)', bodyFont: { size: 12 },
                displayColors: true, boxPadding: 6,
                callbacks: { label: function (ctx) { return ' ' + ctx.label + '  ' + ctx.parsed + ' risk' + (ctx.parsed === 1 ? '' : 's'); } }
              }
            }
          },
          plugins: [centerLabelPlugin]
        }));
        const legend = document.getElementById('risk-category-legend');
        if (legend) {
          legend.innerHTML = rows.map(r =>
            '<div class="flex items-center justify-between gap-2">' +
              '<span class="flex items-center gap-2 min-w-0"><span class="h-2 w-2 rounded-sm flex-shrink-0" style="background:' + r.color + '"></span><span class="truncate text-white/70">' + r.label + '</span></span>' +
              '<span class="font-semibold text-white/90">' + r.value + '</span>' +
            '</div>'
          ).join('');
        }
      }
    }

    if (route === 'drift') {
      const el = document.getElementById('chart-drift-multi');
      if (el) {
        const labels = DATA.driftHistoryByReg[ctx.regulations[0].id].map(p => p.date);
        const palette = ['#ff5a1f','#fb7185','#fbbf24','#22d3ee','#a78bfa','#34d399','#ff7a3d','#67e8f9','#fda4af','#c4b5fd','#86efac'];
        const datasets = ctx.regulations.slice(0, 8).map(function (r, i) {
          var color = palette[i % palette.length];
          return {
            label: r.shortTitle,
            data: DATA.driftHistoryByReg[r.id].map(function (p) { return p.score; }),
            borderColor: color,
            backgroundColor: color + '12',
            borderWidth: 2,
            fill: false,
            pointBackgroundColor: color,
            pointBorderColor: '#0d0d0f',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: color
          };
        });
        CHARTS.push(new Chart(el, { type: 'line', data: { labels: labels, datasets: datasets }, options: chartOptsTime(true) }));
      }
    }

    if (route.startsWith('regulation/')) {
      const id = route.split('/')[1];
      const el = document.getElementById('chart-reg-drift');
      const hist = DATA.driftHistoryByReg[id];
      if (el && hist) {
        CHARTS.push(new Chart(el, {
          type: 'line',
          data: {
            labels: hist.map(function (p) { return p.date; }),
            datasets: [{
              label: 'Drift',
              data: hist.map(function (p) { return p.score; }),
              borderColor: '#ff5a1f',
              backgroundColor: function (c) { return makeGradient(c.chart.ctx, c.chart.chartArea, '#ff5a1f'); },
              fill: true,
              borderWidth: 2.5,
              pointBackgroundColor: '#ff5a1f', pointBorderColor: '#0d0d0f',
              pointHoverBackgroundColor: '#ffffff', pointHoverBorderColor: '#ff5a1f'
            }]
          },
          options: chartOptsTime()
        }));
      }
    }
  }

  function chartOptsTime(showLegend) {
    showLegend = !!showLegend;
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutCubic' },
      layout: { padding: { top: 8, right: 8, bottom: 0, left: 0 } },
      plugins: {
        legend: {
          display: showLegend,
          align: 'end',
          labels: {
            boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle',
            padding: 14, color: 'rgba(255,255,255,0.65)', font: { size: 11, weight: '500' }
          },
          position: 'bottom'
        },
        tooltip: {
          backgroundColor: 'rgba(13,13,15,0.96)',
          borderColor: 'rgba(255,90,31,0.35)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          displayColors: true,
          boxPadding: 6,
          titleColor: '#fff',
          titleFont: { size: 12, weight: '700' },
          bodyColor: 'rgba(255,255,255,0.85)',
          bodyFont: { size: 12 },
          caretSize: 6,
          callbacks: {
            label: function (ctx) {
              var v = ctx.parsed && ctx.parsed.y;
              return ' ' + ctx.dataset.label + '  ' + (v == null ? '-' : Number(v).toFixed(1));
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 7, font: { size: 10 }, color: 'rgba(255,255,255,0.4)', padding: 6 },
          grid: { display: false },
          border: { display: false }
        },
        y: {
          min: 0, max: 100,
          ticks: {
            stepSize: 25, font: { size: 10 }, color: 'rgba(255,255,255,0.4)', padding: 8,
            callback: function (v) { return v; }
          },
          grid: { color: 'rgba(255,255,255,0.05)', drawTicks: false },
          border: { display: false }
        }
      },
      interaction: { mode: 'index', intersect: false },
      elements: {
        line: { tension: 0.4, cubicInterpolationMode: 'monotone', borderJoinStyle: 'round', borderCapStyle: 'round' },
        point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2, hoverBorderColor: '#0d0d0f' }
      }
    };
  }

  /* Helper: gradient fill matched to the canvas height. */
  function makeGradient(ctx, area, hex) {
    if (!area) return hex + '22';
    var g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0,    hex + 'BB');
    g.addColorStop(0.55, hex + '33');
    g.addColorStop(1,    hex + '00');
    return g;
  }

  /* ====================================================================== */
  /*  12. INTERNAL POLICIES                                                 */
  /* ====================================================================== */

  /* ---- Tiny formatters ---------------------------------------------------*/
  function _fmtBytes(n) {
    if (!n && n !== 0) return '—';
    if (n < 1024)            return n + ' B';
    if (n < 1024 * 1024)     return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }
  function _fmtDateOnly(d) {
    if (!d) return '—';
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }
  function _daysUntil(d) {
    if (!d) return null;
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return Math.ceil((dt - new Date('2026-05-21')) / 86400000);
  }
  function _formatBadge(format) {
    var map = { pdf: '#fb7185', markdown: '#22d3ee', html: '#ff9c6b', text: '#fbbf24', link: '#a78bfa' };
    var color = map[format] || '#cbd5e1';
    return '<span class="chip" style="background:' + color + '14;border-color:' + color + '40;color:' + color + '">' +
           UI.htmlEscape((format || 'pdf').toUpperCase()) + '</span>';
  }
  function _statusBadge(status) {
    if (status === 'draft')    return '<span class="badge badge-high">DRAFT</span>';
    if (status === 'retired')  return '<span class="badge badge-neutral">RETIRED</span>';
    return '<span class="badge badge-stable"><span class="badge-dot" style="background:#34d399"></span>PUBLISHED</span>';
  }
  function _sourceBadge(source) {
    if (source === 'server')   return '<span class="pill-soft" style="color:#a5f3fc;border-color:rgba(34,211,238,0.45)" title="Visible to every visitor of this deployment"><i data-lucide="cloud" class="w-3 h-3"></i>Server</span>';
    if (source === 'uploaded') return '<span class="pill-soft" style="color:#ffc3a3;border-color:rgba(255,90,31,0.35)" title="Stored in this browser only"><i data-lucide="upload-cloud" class="w-3 h-3"></i>Local</span>';
    return '<span class="pill-soft"><i data-lucide="package" class="w-3 h-3"></i>Seeded</span>';
  }

  /* ---- Main view ---------------------------------------------------------*/
  function policies(filter) {
    filter = filter || (window.__policiesFilter || { status: 'all', source: 'all' });
    window.__policiesFilter = filter;

    var all = DATA.getAllPolicies();
    var view = all.filter(function (p) {
      if (filter.status !== 'all' && p.status !== filter.status) return false;
      if (filter.source !== 'all' && p.source !== filter.source) return false;
      return true;
    });

    var totals = {
      total:        all.length,
      published:    all.filter(function (p) { return p.status === 'published'; }).length,
      draft:        all.filter(function (p) { return p.status === 'draft'; }).length,
      uploaded:     all.filter(function (p) { return p.source === 'uploaded'; }).length,
      server:       all.filter(function (p) { return p.source === 'server';   }).length,
      dueIn90:      all.filter(function (p) { var d = _daysUntil(p.nextReviewDate); return d != null && d >= 0 && d <= 90; }).length,
      overdue:      all.filter(function (p) { var d = _daysUntil(p.nextReviewDate); return d != null && d < 0; }).length
    };
    var cloudOn = !!(window.CloudPolicies && window.CloudPolicies.isAvailable());
    var storageBanner = cloudOn
      ? '<div class="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-4 py-2 flex items-center gap-3 text-[12px]">' +
          '<i data-lucide="cloud" class="w-3.5 h-3.5 text-cyan-300"></i>' +
          '<span><span class="font-semibold text-cyan-100">Server storage active.</span> Uploads land on Vercel Blob and are visible to every visitor of this deployment.' +
          (totals.server ? ' <span class="text-white/55">' + totals.server + ' policy' + (totals.server === 1 ? '' : 's') + ' currently hosted.</span>' : '') +
          '</span>' +
          '<button class="ml-auto text-cyan-200 hover:text-white text-[11px] underline" onclick="DATA.refreshServerPolicies().then(function(){var n=document.querySelector(\'[data-route=&quot;policies&quot;]\');if(n)n.click();})">Refresh</button>' +
        '</div>'
      : '<div class="mb-4 rounded-lg border border-white/10 bg-white/[0.015] px-4 py-2 flex items-center gap-3 text-[12px] text-white/65">' +
          '<i data-lucide="hard-drive" class="w-3.5 h-3.5 text-white/50"></i>' +
          '<span><span class="font-semibold">Local-only mode.</span> Uploads stay in this browser. Configure <code class="text-white/85">BLOB_READ_WRITE_TOKEN</code> on Vercel to make uploads visible to everyone.</span>' +
        '</div>';
    var attest = all.reduce(function (acc, p) {
      acc.req  += (p.attestations && p.attestations.required)  || 0;
      acc.done += (p.attestations && p.attestations.completed) || 0;
      return acc;
    }, { req: 0, done: 0 });
    var attestPct = attest.req ? Math.round((attest.done / attest.req) * 100) : 0;

    function filterPill(label, value, group, current) {
      var active = current === value;
      return '<button class="px-3 py-1.5 text-xs rounded-lg border transition ' +
             (active ? 'bg-babcom-500/15 border-babcom-500/40 text-babcom-200' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20') +
             '" onclick="Views.setPolicyFilter(\'' + group + '\', \'' + value + '\')">' + UI.htmlEscape(label) + '</button>';
    }

    return [
      '<div class="flex flex-wrap items-end justify-between gap-4 mb-6">',
        '<div>',
          '<h2 class="text-2xl font-extrabold tracking-tight">Internal Policies</h2>',
          '<p class="text-sm text-white/55 mt-1">' + totals.total + ' policies · ' + totals.published + ' published, ' + totals.draft + ' draft · the bridge between external regulations and technical controls</p>',
        '</div>',
        '<div class="flex items-center gap-3">',
          '<div class="hidden md:flex items-center gap-4 pr-4 border-r border-white/5">',
            '<div class="text-right"><div class="kpi-label">Total</div><div class="font-bold text-sm mt-0.5">' + totals.total + '</div></div>',
            '<div class="text-right"><div class="kpi-label">Due ≤90d</div><div class="font-bold text-sm mt-0.5 ' + (totals.dueIn90 ? 'text-accent-amber' : 'text-white/40') + '">' + totals.dueIn90 + '</div></div>',
            '<div class="text-right"><div class="kpi-label">Overdue</div><div class="font-bold text-sm mt-0.5 ' + (totals.overdue ? 'text-accent-rose' : 'text-white/40') + '">' + totals.overdue + '</div></div>',
            '<div class="text-right"><div class="kpi-label">Attestations</div><div class="font-bold text-sm mt-0.5">' + attestPct + '%</div></div>',
          '</div>',
          '<button class="btn btn-primary" onclick="Views.openUploadPolicyModal()">',
            '<i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i> Upload policy',
          '</button>',
        '</div>',
      '</div>',

      storageBanner,

      '<div class="flex flex-wrap items-center gap-2 mb-5">',
        '<span class="text-[10px] uppercase tracking-widest text-white/40 mr-1">Status</span>',
        filterPill('All', 'all', 'status', filter.status),
        filterPill('Published', 'published', 'status', filter.status),
        filterPill('Draft', 'draft', 'status', filter.status),
        filterPill('Retired', 'retired', 'status', filter.status),
        '<span class="text-[10px] uppercase tracking-widest text-white/40 ml-4 mr-1">Source</span>',
        filterPill('All', 'all', 'source', filter.source),
        filterPill('Seeded', 'seeded', 'source', filter.source),
        filterPill('Server', 'server', 'source', filter.source),
        filterPill('Local', 'uploaded', 'source', filter.source),
      '</div>',

      view.length === 0
        ? '<div class="gr-card p-10 text-center text-white/55">No policies match these filters. Try clearing them or <button class="text-babcom-300 underline" onclick="Views.openUploadPolicyModal()">upload one</button>.</div>'
        : '<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">' +
            view.map(_policyCard).join('') +
          '</div>'
    ].join('');
  }

  function _policyCard(p) {
    var owner    = p.ownerId    ? DATA.indexes.personas[p.ownerId]    : null;
    var approver = p.approverId ? DATA.indexes.personas[p.approverId] : null;
    var review   = _daysUntil(p.nextReviewDate);
    var reviewBadge = '';
    if (review != null) {
      if (review < 0)        reviewBadge = '<span class="chip" style="color:#fda4af;border-color:rgba(251,113,133,0.4)">Review overdue ' + Math.abs(review) + 'd</span>';
      else if (review <= 90) reviewBadge = '<span class="chip" style="color:#fcd34d;border-color:rgba(251,191,36,0.4)">Review in ' + review + 'd</span>';
      else                   reviewBadge = '<span class="chip">Reviews ' + _fmtDateOnly(p.nextReviewDate) + '</span>';
    }
    var regNames = (p.mapsToRegulations || []).map(function (id) {
      var r = DATA.indexes.regulations[id]; return r ? r.shortTitle : null;
    }).filter(Boolean);
    var attestPct = (p.attestations && p.attestations.required)
      ? Math.round((p.attestations.completed / p.attestations.required) * 100)
      : null;

    return [
      '<div class="gr-card gr-card-hover p-5 fade-up flex flex-col">',
        '<div class="flex items-start justify-between mb-3 gap-2">',
          '<div class="min-w-0">',
            '<div class="flex items-center gap-2 mb-1 flex-wrap">',
              _statusBadge(p.status),
              _formatBadge(p.format),
              _sourceBadge(p.source),
            '</div>',
            '<h4 class="font-bold text-base leading-snug">' + UI.htmlEscape(p.title) + '</h4>',
            '<div class="text-[10px] uppercase tracking-widest text-white/40 mt-1">v' + UI.htmlEscape(p.version) + ' · ' + UI.htmlEscape(p.fileName || 'no file') + ' · ' + _fmtBytes(p.fileSize) + '</div>',
          '</div>',
        '</div>',

        '<p class="text-[12px] text-white/55 mt-1 leading-relaxed line-clamp-3">' + UI.htmlEscape(p.description || '') + '</p>',

        '<div class="grid grid-cols-2 gap-2 mt-4">',
          '<div class="rounded-lg border border-white/5 px-3 py-2"><div class="kpi-label">Regulations</div><div class="font-semibold text-xs mt-1 truncate">' + (regNames.length ? UI.htmlEscape(regNames.join(' · ')) : '—') + '</div></div>',
          '<div class="rounded-lg border border-white/5 px-3 py-2"><div class="kpi-label">Controls</div><div class="font-semibold text-xs mt-1">' + ((p.implementedByControls || []).length || '—') + '</div></div>',
          '<div class="rounded-lg border border-white/5 px-3 py-2"><div class="kpi-label">Effective</div><div class="font-semibold text-xs mt-1">' + _fmtDateOnly(p.effectiveDate) + '</div></div>',
          '<div class="rounded-lg border border-white/5 px-3 py-2"><div class="kpi-label">Attestation</div><div class="font-semibold text-xs mt-1">' + (attestPct == null ? '—' : attestPct + '%') + '</div></div>',
        '</div>',

        '<div class="flex items-center gap-2 mt-3 flex-wrap">',
          reviewBadge,
          (p.tags || []).slice(0, 3).map(function (t) { return '<span class="chip">' + UI.htmlEscape(t) + '</span>'; }).join(''),
        '</div>',

        '<div class="mt-auto pt-4 border-t border-white/5 flex items-center gap-2">',
          owner ? UI.avatar(owner) : '<div class="avatar" style="background:rgba(255,255,255,0.08)">·</div>',
          '<div class="text-[11px] min-w-0">',
            '<div class="font-semibold truncate">' + UI.htmlEscape(owner ? owner.name : 'No owner') + '</div>',
            '<div class="text-white/40 text-[10px] truncate">' + UI.htmlEscape(owner ? owner.role : '—') + (approver ? ' · approved by ' + UI.htmlEscape(approver.name.split(' ')[0]) : '') + '</div>',
          '</div>',
          '<div class="ml-auto flex items-center gap-1">',
            '<button class="btn btn-ghost text-[11px] py-1.5" title="Compliance coverage" onclick="Views.openPolicyComplianceModal(\'' + UI.htmlEscape(p.id) + '\')"><i data-lucide="shield-alert" class="w-3 h-3"></i> Coverage</button>',
            '<button class="btn btn-primary text-[11px] py-1.5" onclick="Views.openPolicyViewer(\'' + UI.htmlEscape(p.id) + '\')"><i data-lucide="eye" class="w-3 h-3"></i> View</button>',
            '<button class="btn btn-ghost text-[11px] py-1.5" title="Open in new tab" onclick="Views.openPolicyDocument(\'' + UI.htmlEscape(p.id) + '\')"><i data-lucide="external-link" class="w-3 h-3"></i></button>',
            p.source === 'uploaded'
              ? '<button class="btn btn-ghost text-[11px] py-1.5" title="Delete uploaded policy" onclick="Views.deletePolicy(\'' + UI.htmlEscape(p.id) + '\')"><i data-lucide="trash-2" class="w-3 h-3"></i></button>'
              : '',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }

  function setPolicyFilter(group, value) {
    var f = window.__policiesFilter || { status: 'all', source: 'all' };
    f[group] = value;
    window.__policiesFilter = f;
    /* Re-render via the sidebar click — same trick used by saveAddSource. */
    var nav = document.querySelector('[data-route="policies"]');
    if (nav) nav.click();
  }

  /* ---- Open policy document ---------------------------------------------*/
  function openPolicyDocument(policyId) {
    var p = DATA.getPolicyById(policyId);
    if (!p) return;
    /* Server-hosted policy : the file lives on Vercel Blob's public CDN.
       Open the CDN URL directly in a new tab. */
    if (p.source === 'server' && p.fileUrl) {
      var safeFw = UI.safeUrl(p.fileUrl);
      if (safeFw !== '#') {
        window.open(p.fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    /* Local upload : reconstitute a blob URL and open in new tab. */
    if (p.source === 'uploaded' && p.hasFile) {
      var f = DATA.getPolicyFile(policyId);
      if (f && f.base64) {
        try {
          var byteChars = atob(f.base64);
          var byteNums  = new Uint8Array(byteChars.length);
          for (var i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
          var blob = new Blob([byteNums], { type: f.mimeType || 'application/octet-stream' });
          var url  = URL.createObjectURL(blob);
          window.open(url, '_blank', 'noopener,noreferrer');
          /* Best-effort revoke after a minute. */
          setTimeout(function () { try { URL.revokeObjectURL(url); } catch (_) {} }, 60000);
          return;
        } catch (_) { /* fall through to external link if available */ }
      }
    }
    /* Otherwise: open the external documentUrl (sanitised). */
    var safe = UI.safeUrl(p.documentUrl);
    if (safe !== '#') window.open(p.documentUrl, '_blank', 'noopener,noreferrer');
  }

  /* ---- Delete uploaded policy -------------------------------------------*/
  function deletePolicy(policyId) {
    var p = DATA.getPolicyById(policyId);
    if (!p || (p.source !== 'uploaded' && p.source !== 'server')) return;
    var label = p.source === 'server'
      ? 'Delete "' + p.title + '" from the server? This removes it for every visitor and cannot be undone.'
      : 'Delete "' + p.title + '"? This will also unlink it from any controls.';
    if (typeof confirm === 'function' && !confirm(label)) return;

    if (p.source === 'server') {
      /* Optimistic UI: drop the row immediately, then call the server. If the
         delete fails we re-pull the catalogue so the row reappears. */
      var nav = document.querySelector('[data-route="policies"]');
      DATA.deleteServerPolicy(policyId).then(function (ok) {
        if (!ok) {
          UI.toast({ title: 'Delete failed', body: 'The server could not delete this policy. Please retry.', ttl: 5000 });
        } else {
          UI.toast({ title: 'Policy deleted', body: 'Removed from server storage.', ttl: 3500 });
        }
        return DATA.refreshServerPolicies();
      }).then(function () {
        if (nav) nav.click();
      });
      return;
    }

    DATA.deleteUserPolicy(policyId);
    var navLocal = document.querySelector('[data-route="policies"]');
    if (navLocal) navLocal.click();
  }

  /* ====================================================================== */
  /*  12.a Upload-policy modal                                              */
  /* ====================================================================== */
  function openUploadPolicyModal() {
    var personasOpts = DATA.personas.map(function (p) {
      return '<option value="' + UI.htmlEscape(p.id) + '">' + UI.htmlEscape(p.name) + ' · ' + UI.htmlEscape(p.role) + '</option>';
    }).join('');
    var regsOpts = DATA.regulations.map(function (r) {
      return '<label class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/10 cursor-pointer hover:border-babcom-500/40">' +
               '<input type="checkbox" class="accent-babcom-500" name="pol-regs" value="' + UI.htmlEscape(r.id) + '">' +
               '<span class="text-xs">' + UI.htmlEscape(r.shortTitle) + '</span>' +
             '</label>';
    }).join('');
    var ctrlsOpts = DATA.controls.map(function (c) {
      return '<label class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/10 cursor-pointer hover:border-babcom-500/40">' +
               '<input type="checkbox" class="accent-babcom-500" name="pol-ctrls" value="' + UI.htmlEscape(c.id) + '">' +
               '<span class="text-xs">' + UI.htmlEscape(c.id) + '</span>' +
             '</label>';
    }).join('');

    var html = [
      '<div class="flex items-start justify-between mb-5">',
        '<div>',
          '<div class="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">New internal policy</div>',
          '<h3 class="text-xl font-extrabold tracking-tight">Upload a policy document</h3>',
          '<p class="text-xs text-white/55 mt-1">PDF, Markdown, HTML or TXT up to ' + (DATA.MAX_POLICY_FILE_BYTES / 1024 / 1024) + ' MB. The file lives in your browser (localStorage); no upload leaves this machine.</p>',
        '</div>',
        '<button onclick="UI.closeModal()" class="text-white/40 hover:text-white p-1"><i data-lucide="x" class="w-4 h-4"></i></button>',
      '</div>',

      '<div class="grid grid-cols-12 gap-5">',
        /* LEFT: drop-zone + metadata */
        '<div class="col-span-12 md:col-span-7 space-y-3">',
          '<label for="pol-file" class="policy-drop" id="pol-drop">',
            '<div class="icon-wrap"><i data-lucide="upload-cloud" class="w-5 h-5"></i></div>',
            '<div class="font-semibold text-sm">Drop file here or click to browse</div>',
            '<div class="text-[11px] text-white/45">PDF · Markdown · HTML · TXT (max ' + (DATA.MAX_POLICY_FILE_BYTES / 1024 / 1024) + ' MB)</div>',
            '<input id="pol-file" type="file" class="hidden" accept=".pdf,.md,.markdown,.html,.htm,.txt,application/pdf,text/markdown,text/html,text/plain" onchange="Views.handlePolicyFile(this)" />',
            '<div id="pol-file-info" class="text-[11px] text-white/55 mt-1"></div>',
          '</label>',

          '<div class="grid grid-cols-2 gap-3">',
            '<label class="block"><span class="kpi-label">Title *</span>',
              '<input id="pol-title" placeholder="e.g. Cloud Security Policy" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-babcom-500/50" />',
            '</label>',
            '<label class="block"><span class="kpi-label">Version</span>',
              '<input id="pol-version" placeholder="1.0" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-babcom-500/50" />',
            '</label>',
          '</div>',

          '<div class="grid grid-cols-2 gap-3">',
            '<label class="block"><span class="kpi-label">Owner</span>',
              '<select id="pol-owner" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm focus:outline-none focus:border-babcom-500/50">',
                '<option value="">select…</option>',
                personasOpts,
              '</select>',
            '</label>',
            '<label class="block"><span class="kpi-label">Approver</span>',
              '<select id="pol-approver" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm focus:outline-none focus:border-babcom-500/50">',
                '<option value="">select…</option>',
                personasOpts,
              '</select>',
            '</label>',
          '</div>',

          '<div class="grid grid-cols-2 gap-3">',
            '<label class="block"><span class="kpi-label">Effective date</span>',
              '<input id="pol-effective" type="date" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm focus:outline-none focus:border-babcom-500/50" />',
            '</label>',
            '<label class="block"><span class="kpi-label">Next review</span>',
              '<input id="pol-review" type="date" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm focus:outline-none focus:border-babcom-500/50" />',
            '</label>',
          '</div>',

          '<div class="grid grid-cols-2 gap-3">',
            '<label class="block"><span class="kpi-label">Status</span>',
              '<select id="pol-status" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm focus:outline-none focus:border-babcom-500/50">',
                '<option value="published">Published</option>',
                '<option value="draft">Draft</option>',
              '</select>',
            '</label>',
            '<label class="block"><span class="kpi-label">External URL (optional)</span>',
              '<input id="pol-url" placeholder="https://wiki.example.com/policy" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-babcom-500/50 font-mono text-[12px]" />',
            '</label>',
          '</div>',

          '<label class="block"><span class="kpi-label">Description</span>',
            '<textarea id="pol-desc" rows="2" placeholder="What does this policy govern?" class="mt-1 w-full px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-babcom-500/50 resize-none"></textarea>',
          '</label>',
        '</div>',

        /* RIGHT: maps + actions */
        '<div class="col-span-12 md:col-span-5">',
          '<div class="gr-card p-4 h-full flex flex-col">',
            '<div class="font-bold text-sm mb-3">Map to regulations</div>',
            '<div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pb-1">' + regsOpts + '</div>',
            '<div class="font-bold text-sm mt-5 mb-3">Implemented by controls</div>',
            '<div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pb-1">' + ctrlsOpts + '</div>',

            /* Verification panel : shows analyzer findings + projected drift impact. */
            '<div class="mt-5 flex items-center justify-between">',
              '<div class="font-bold text-sm">Policy verification</div>',
              '<button id="pol-verify" class="btn btn-ghost text-[11px] py-1" onclick="Views.runPolicyVerification()"><i data-lucide="shield-check" class="w-3 h-3"></i> Run checks</button>',
            '</div>',
            '<div id="pol-verify-out" class="mt-2 text-[11px] text-white/45">Click <span class="text-white/70">Run checks</span> to scan metadata and content for risks before saving.</div>',

            '<div id="pol-error" class="mt-4 text-xs text-accent-rose"></div>',
            '<div class="mt-auto pt-4 grid grid-cols-2 gap-2">',
              '<button class="btn btn-ghost text-xs justify-center" onclick="UI.closeModal()">Cancel</button>',
              '<button id="pol-save-btn" class="btn btn-primary text-xs justify-center" onclick="Views.savePolicyUpload()"><i data-lucide="save" class="w-3.5 h-3.5"></i> Save policy</button>',
            '</div>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
    UI.openModal(html);

    /* Drag-and-drop wiring (only attaches if elements exist). */
    var drop = document.getElementById('pol-drop');
    var file = document.getElementById('pol-file');
    if (drop && file) {
      ['dragenter','dragover'].forEach(function (ev) {
        drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-drag'); });
      });
      ['dragleave','drop'].forEach(function (ev) {
        drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-drag'); });
      });
      drop.addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          file.files = e.dataTransfer.files;
          handlePolicyFile(file);
        }
      });
    }
  }

  function handlePolicyFile(input) {
    var info = document.getElementById('pol-file-info');
    var f = input && input.files && input.files[0];
    if (!f) { if (info) info.textContent = ''; return; }
    if (f.size > DATA.MAX_POLICY_FILE_BYTES) {
      if (info) info.innerHTML = '<span class="text-accent-rose">File too large (max ' + (DATA.MAX_POLICY_FILE_BYTES / 1024 / 1024) + ' MB)</span>';
      input.value = '';
      return;
    }
    /* MIME / extension whitelist. */
    var name = (f.name || '').toLowerCase();
    var okExt  = /\.(pdf|md|markdown|html?|txt)$/.test(name);
    var okMime = /^(application\/pdf|text\/(markdown|html|plain))$/.test(f.type || '');
    if (!okExt && !okMime) {
      if (info) info.innerHTML = '<span class="text-accent-rose">Unsupported file type. PDF / Markdown / HTML / TXT only.</span>';
      input.value = '';
      return;
    }
    var fmt = /\.pdf$/.test(name)            ? 'pdf'
            : /\.(md|markdown)$/.test(name)  ? 'markdown'
            : /\.html?$/.test(name)          ? 'html'
            : 'text';
    var reader = new FileReader();
    reader.onload = function () {
      /* Strip the data-URL prefix, keep just the base64 body. */
      var s = String(reader.result || '');
      var idx = s.indexOf('base64,');
      var b64 = idx >= 0 ? s.slice(idx + 7) : '';
      window.__polUploadStaged = {
        fileName: f.name,
        fileSize: f.size,
        mimeType: f.type || 'application/octet-stream',
        format:   fmt,
        base64:   b64
      };
      /* Magic-byte sniff for PDFs : warn early if the file isn't really one. */
      var pdfWarning = '';
      if (fmt === 'pdf') {
        try {
          var head = atob((b64 || '').slice(0, 8)).slice(0, 5);
          if (head !== '%PDF-') {
            pdfWarning = '<div class="mt-1 text-[11px] text-amber-300">' +
                           '<i data-lucide="alert-triangle" class="w-3 h-3 inline mr-1"></i>' +
                           'This file does not start with the standard <code>%PDF-</code> header. ' +
                           'It will save, but the in-app preview may not render.' +
                         '</div>';
          }
        } catch (_) { /* ignore */ }
      }
      if (info) info.innerHTML = '<i data-lucide="file" class="w-3 h-3 inline mr-1"></i><span class="text-white/80 font-semibold">' + UI.htmlEscape(f.name) + '</span> · <span class="text-white/50">' + _fmtBytes(f.size) + ' · ' + UI.htmlEscape(fmt.toUpperCase()) + '</span>' + pdfWarning;
      if (window.lucide) lucide.createIcons();
    };
    reader.onerror = function () {
      if (info) info.innerHTML = '<span class="text-accent-rose">Could not read file.</span>';
    };
    reader.readAsDataURL(f);
  }

  function _collectUploadMeta() {
    var getVal = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
    var checked = function (name) {
      return Array.prototype.slice.call(document.querySelectorAll('input[name="' + name + '"]:checked'))
        .map(function (i) { return i.value; });
    };
    var staged = window.__polUploadStaged || null;
    return {
      meta: {
        title:           (getVal('pol-title') || '').trim(),
        version:         getVal('pol-version') || '1.0',
        ownerId:         getVal('pol-owner')    || null,
        approverId:      getVal('pol-approver') || null,
        effectiveDate:   getVal('pol-effective') || null,
        nextReviewDate:  getVal('pol-review')    || null,
        status:          getVal('pol-status') === 'draft' ? 'draft' : 'published',
        documentUrl:     (getVal('pol-url') || '').trim() || null,
        description:     getVal('pol-desc'),
        mapsToRegulations:    checked('pol-regs'),
        implementedByControls:checked('pol-ctrls'),
        format:          staged ? staged.format : 'link',
        fileName:        staged ? staged.fileName : null,
        fileSize:        staged ? staged.fileSize : 0
      },
      staged: staged
    };
  }

  function _sevDot(sev) {
    return '<span class="dot"></span>';
  }
  function _renderComplianceBreakdown(scan) {
    if (!scan || !Array.isArray(scan.byFramework) || scan.byFramework.length === 0) {
      return '<div class="text-white/45 text-[11px] mt-2">Map this policy to a regulation to run framework-control coverage.</div>';
    }
    var s = scan.summary;
    var headerChips =
      '<span class="chip" style="color:#86efac;border-color:rgba(52,211,153,0.4)">' + s.compliantControls + ' compliant</span>' +
      (s.partialControls ? '<span class="chip" style="color:#fcd34d;border-color:rgba(251,191,36,0.4)">' + s.partialControls + ' partial</span>' : '') +
      (s.missingControls ? '<span class="chip" style="color:#fda4af;border-color:rgba(251,113,133,0.4)">' + s.missingControls + ' missing</span>' : '') +
      '<span class="chip">' + s.coveragePct + '% coverage</span>';

    var fwBlocks = scan.byFramework.map(function (fw) {
      var rows = fw.controls.map(function (fc) {
        var color = fc.status === 'compliant' ? '#34d399'
                  : fc.status === 'partial'   ? '#fbbf24'
                  : '#fb7185';
        var hint  = fc.status === 'compliant' ? (fc.evidenceRefs[0] || 'matched')
                  : fc.status === 'partial'   ? 'only one weak match'
                  : 'no reference found';
        return '<li class="flex items-start gap-2 py-1">' +
                 '<span class="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style="background:' + color + '"></span>' +
                 '<div class="min-w-0 flex-1">' +
                   '<div class="text-[11px] flex flex-wrap items-baseline gap-1">' +
                     '<span class="font-mono text-white/55">' + UI.htmlEscape(fc.code) + '</span>' +
                     '<span class="text-white/85 font-semibold truncate">' + UI.htmlEscape(fc.title) + '</span>' +
                   '</div>' +
                   '<div class="text-[10.5px] text-white/45 mt-0.5 truncate">' + UI.htmlEscape(hint) + '</div>' +
                 '</div>' +
                 '<span class="text-[10px] uppercase tracking-widest" style="color:' + color + '">' + fc.status + '</span>' +
               '</li>';
      }).join('');
      return '<details class="rounded-lg border border-white/5 bg-black/20 mt-1.5" open>' +
               '<summary class="cursor-pointer px-3 py-2 flex items-center gap-2 select-none">' +
                 '<span class="font-semibold text-[12px]">' + UI.htmlEscape(fw.name) + '</span>' +
                 '<span class="text-white/40 text-[11px]">' + fw.compliant + '/' + fw.total + '</span>' +
                 (fw.missing ? '<span class="ml-1 chip" style="color:#fda4af;border-color:rgba(251,113,133,0.4)">' + fw.missing + ' missing</span>' : '') +
                 (fw.partial ? '<span class="ml-1 chip" style="color:#fcd34d;border-color:rgba(251,191,36,0.4)">' + fw.partial + ' partial</span>' : '') +
                 '<span class="ml-auto text-[10.5px] text-white/55">' + fw.coveragePct + '%</span>' +
               '</summary>' +
               '<ul class="px-3 pb-2">' + rows + '</ul>' +
             '</details>';
    }).join('');

    return '<div class="mt-3 pt-3 border-t border-white/5">' +
             '<div class="flex items-center justify-between mb-1">' +
               '<div class="font-bold text-[12px]">Framework-control coverage</div>' +
             '</div>' +
             '<div class="flex flex-wrap items-center gap-1.5 mb-1">' + headerChips + '</div>' +
             '<div class="max-h-56 overflow-y-auto pr-1">' + fwBlocks + '</div>' +
           '</div>';
  }
  function _renderVerificationPanel(analysis, scan) {
    var out = document.getElementById('pol-verify-out');
    var btn = document.getElementById('pol-save-btn');
    if (!out) return;
    var totalRiskOpeners = ((analysis && analysis.summary) ? analysis.summary.opensRisks : 0)
                        + ((scan && scan.summary) ? (scan.summary.missingControls + scan.summary.partialControls) : 0);
    if ((!analysis || analysis.summary.total === 0) && (!scan || !scan.byFramework || scan.byFramework.length === 0)) {
      out.innerHTML =
        '<div class="flex items-center gap-2 text-emerald-300 font-semibold">' +
          '<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> No issues detected. Policy looks clean.' +
        '</div>' +
        '<div class="text-white/45 mt-1">Re-run after editing fields to confirm.</div>';
      if (btn) btn.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i> Save policy';
      if (window.lucide) lucide.createIcons();
      return;
    }
    var s = analysis.summary;
    var driftPairs = Object.keys(analysis.projectedDriftDelta || {}).map(function (rid) {
      var reg = DATA.indexes.regulations[rid];
      return { name: reg ? reg.shortTitle : rid, delta: analysis.projectedDriftDelta[rid] };
    }).sort(function (a, b) { return b.delta - a.delta; }).slice(0, 3);

    var summaryChips =
      (s.critical ? '<span class="chip" style="color:#fb7185;border-color:rgba(251,113,133,0.4)">' + s.critical + ' critical</span>' : '') +
      (s.high     ? '<span class="chip" style="color:#fbbf24;border-color:rgba(251,191,36,0.4)">'  + s.high     + ' high</span>'     : '') +
      (s.medium   ? '<span class="chip" style="color:#ff9c6b;border-color:rgba(255,90,31,0.4)">'   + s.medium   + ' medium</span>'   : '') +
      (s.low      ? '<span class="chip">'                                                          + s.low      + ' low</span>'      : '');

    var driftLine = driftPairs.length
      ? '<div class="text-[11px] text-white/55 mt-2"><i data-lucide="trending-up" class="w-3 h-3 inline mr-1"></i>Projected drift: ' +
          driftPairs.map(function (p) {
            return '<span class="text-white/85 font-semibold">+' + p.delta + '</span> on ' + UI.htmlEscape(p.name);
          }).join(', ') +
        '</div>'
      : '';

    var findingsHtml = analysis.findings.slice(0, 6).map(function (f) {
      return '<div class="finding sev-' + UI.htmlEscape(f.severity) + ' mt-1.5">' +
               _sevDot(f.severity) +
               '<div class="min-w-0">' +
                 '<div class="text-[11.5px] font-semibold text-white/90 leading-snug">' + UI.htmlEscape(f.title) + '</div>' +
                 (f.detail ? '<div class="text-[10.5px] text-white/55 mt-0.5 leading-snug">' + UI.htmlEscape(f.detail) + '</div>' : '') +
                 (f.recommendation ? '<div class="text-[10.5px] text-white/45 mt-0.5 italic leading-snug">' + UI.htmlEscape(f.recommendation) + '</div>' : '') +
               '</div>' +
             '</div>';
    }).join('');
    var extra = analysis.findings.length > 6
      ? '<div class="text-[10.5px] text-white/40 mt-1">+ ' + (analysis.findings.length - 6) + ' more on save</div>'
      : '';

    var analysisHtml = analysis && analysis.summary && analysis.summary.total > 0
      ? ('<div class="flex flex-wrap items-center gap-1.5">' +
           '<span class="text-white/80 font-semibold">' + s.total + ' finding' + (s.total === 1 ? '' : 's') + '</span>' +
           summaryChips +
         '</div>' +
         driftLine +
         '<div class="mt-2 max-h-40 overflow-y-auto pr-1">' + findingsHtml + extra + '</div>')
      : '';

    out.innerHTML = analysisHtml + _renderComplianceBreakdown(scan);

    if (btn) {
      if (totalRiskOpeners > 0) {
        btn.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i> Save & open ' + totalRiskOpeners + ' risk' + (totalRiskOpeners === 1 ? '' : 's');
      } else {
        btn.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i> Save policy';
      }
    }
    if (window.lucide) lucide.createIcons();
  }

  function runPolicyVerification() {
    var collected = _collectUploadMeta();
    if (!collected.meta.title) {
      var out = document.getElementById('pol-verify-out');
      if (out) out.innerHTML = '<span class="text-accent-rose">Enter a title first so we know what we are verifying.</span>';
      return null;
    }
    var staged = collected.staged;
    var analysis = DATA.analyzePolicy(
      collected.meta,
      staged ? staged.base64 : null,
      staged ? staged.mimeType : null
    );
    /* Scan against framework controls in addition to the metadata heuristics.
       For the upload draft we synthesise a minimal policy-shape and decode the
       staged file body inline so the corpus is the same as it would be post-save. */
    var draftPolicy = {
      id:                 '__draft__',
      title:              collected.meta.title,
      description:        collected.meta.description,
      tags:               [],
      sections:           [],
      mapsToRegulations:  collected.meta.mapsToRegulations || [],
      implementedByControls: collected.meta.implementedByControls || [],
      source:             'uploaded',
      hasFile:            !!staged,
      format:             collected.meta.format
    };
    /* Inline body so `_buildScanCorpus` doesn't need to read localStorage
       for an unsaved draft. */
    if (staged && staged.base64 && staged.format !== 'pdf') {
      try {
        var bin = atob(staged.base64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        var body = typeof TextDecoder !== 'undefined'
          ? new TextDecoder('utf-8').decode(bytes)
          : bin;
        draftPolicy.sections.push({ id: 'body', num: 'body', title: 'Uploaded body', body: body });
      } catch (_) { /* ignore */ }
    }
    var scan = DATA.scanPolicyCompliance(draftPolicy);

    window.__polLastAnalysis = analysis;
    window.__polLastScan     = scan;
    _renderVerificationPanel(analysis, scan);
    return analysis;
  }

  function savePolicyUpload() {
    var err = document.getElementById('pol-error');
    function fail(msg) { if (err) err.textContent = msg; }

    var collected = _collectUploadMeta();
    var meta = collected.meta;
    var staged = collected.staged;
    if (!meta.title) return fail('Title is required.');
    if (!staged && !meta.documentUrl) return fail('Attach a file or provide an external URL.');
    if (meta.documentUrl) {
      var safe = UI.safeUrl(meta.documentUrl);
      if (safe === '#') return fail('External URL must be a valid http(s) URL.');
    }

    /* Decide write path :
       - If the cloud API answered the startup probe, send the upload to the
         server so every visitor sees it.
       - Otherwise persist locally to this browser's localStorage. */
    var saveBtn = document.getElementById('pol-save-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Saving...'; if (window.lucide) lucide.createIcons(); }

    var savePromise;
    var useCloud = !!(window.CloudPolicies && window.CloudPolicies.isAvailable());
    if (useCloud) {
      savePromise = DATA.addServerPolicy(meta, staged ? staged.base64 : null, staged ? staged.mimeType : null);
    } else {
      savePromise = Promise.resolve(DATA.addUserPolicy(meta, staged ? staged.base64 : null, staged ? staged.mimeType : null));
    }

    savePromise.then(function (res) {
    if (!res.ok) { if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i> Save policy'; if (window.lucide) lucide.createIcons(); } return fail(res.error); }

    /* Auto-link controls that the user just selected to this new policy. */
    (meta.implementedByControls || []).forEach(function (cid) {
      DATA.linkControlToPolicy(cid, res.policy.id);
    });

    /* Run the analyzer (if the user didn't already) and apply findings so the
       new policy materially affects drift + open risks. */
    var analysis = window.__polLastAnalysis;
    if (!analysis) {
      analysis = DATA.analyzePolicy(meta, staged ? staged.base64 : null, staged ? staged.mimeType : null);
    }
    var applied = DATA.applyPolicyFindings(res.policy.id, analysis);

    /* Run compliance scan against framework controls and materialise the gaps. */
    var scan = DATA.scanPolicyCompliance(res.policy);
    var appliedScan = DATA.applyComplianceGaps(res.policy.id, scan);

    window.__polUploadStaged = null;
    window.__polLastAnalysis = null;
    window.__polLastScan     = null;
    UI.closeModal();

    /* Surface what just changed and let the user jump straight to the risks. */
    var totalOpened = applied.openedRisks.length + appliedScan.openedRisks.length;
    if (totalOpened > 0) {
      var worstFw = scan.summary.worstFramework;
      var driftLine;
      if (worstFw) {
        driftLine = worstFw.name + ' coverage: ' + worstFw.compliant + '/' + worstFw.total +
                    (worstFw.missing ? ' (' + worstFw.missing + ' missing)' : '') + '.';
      } else if (analysis.summary.worstRegId) {
        var topReg = (DATA.indexes.regulations[analysis.summary.worstRegId] || {}).shortTitle;
        driftLine = 'Drift expected to rise on ' + topReg + (analysis.projectedDriftDelta[analysis.summary.worstRegId] ? ' (+' + analysis.projectedDriftDelta[analysis.summary.worstRegId] + ')' : '') + '.';
      } else {
        driftLine = 'Drift recomputed across linked regulations.';
      }
      window.__gapsFilter = { policyId: res.policy.id };
      UI.toast({
        title:   'Policy saved \u00b7 ' + totalOpened + ' risk' + (totalOpened === 1 ? '' : 's') + ' opened',
        body:    driftLine + ' ' + (useCloud ? 'Visible to every visitor of this deployment.' : 'Stored in this browser.') + ' Review the gaps.',
        ctaText: 'Open Gaps',
        route:   'gaps',
        ttl:     9000
      });
    } else if (scan.summary.compliantControls > 0) {
      UI.toast({
        title: 'Policy saved \u00b7 ' + scan.summary.compliantControls + ' framework control' + (scan.summary.compliantControls === 1 ? '' : 's') + ' covered',
        body:  scan.summary.coveragePct + '% coverage across mapped frameworks. ' + (useCloud ? 'Visible to everyone.' : 'Stored locally.'),
        ttl:   4500
      });
    } else {
      UI.toast({
        title: useCloud ? 'Policy saved to the server' : 'Policy saved',
        body:  useCloud ? 'Every visitor will now see this policy.' : 'Verification found no high-severity issues.',
        ttl:   3500
      });
    }

    var nav = document.querySelector('[data-route="policies"]');
    if (nav) nav.click();
    }).catch(function (e) {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i> Save policy'; if (window.lucide) lucide.createIcons(); }
      fail(e && e.message ? e.message : 'Upload failed. Check your network and retry.');
    });
  }

  /* ====================================================================== */
  /*  12.b Policy picker (reusable, called from Controls view)              */
  /* ====================================================================== */
  function openPolicyPickerModal(controlId) {
    var control = DATA.indexes.controls[controlId];
    if (!control) return;
    var current = DATA.getPolicyForControl(controlId);
    var all = DATA.getAllPolicies();

    function rowsHtml(q) {
      q = (q || '').toLowerCase();
      var rows = all.filter(function (p) {
        if (!q) return true;
        return (p.title + ' ' + (p.description || '') + ' ' + (p.tags || []).join(' '))
          .toLowerCase().indexOf(q) !== -1;
      });
      if (rows.length === 0) return '<div class="text-xs text-white/45 py-6 text-center">No matching policies. <button class="text-babcom-300 underline" onclick="UI.closeModal(); Views.openUploadPolicyModal()">Upload one</button></div>';
      return rows.map(function (p) {
        var sel = current && current.id === p.id ? ' is-selected' : '';
        var owner = p.ownerId ? DATA.indexes.personas[p.ownerId] : null;
        return '<div class="policy-pick' + sel + '" data-pick="' + UI.htmlEscape(p.id) + '">' +
                 '<div class="radio"></div>' +
                 '<div class="min-w-0 flex-1">' +
                   '<div class="flex items-center gap-2 flex-wrap mb-1">' +
                     '<span class="font-semibold text-sm">' + UI.htmlEscape(p.title) + '</span>' +
                     '<span class="chip">v' + UI.htmlEscape(p.version) + '</span>' +
                     _statusBadge(p.status) +
                     _sourceBadge(p.source) +
                   '</div>' +
                   '<div class="text-[11px] text-white/55 line-clamp-2">' + UI.htmlEscape(p.description || '') + '</div>' +
                   '<div class="text-[10px] text-white/40 mt-1">' + (owner ? UI.htmlEscape(owner.name) : 'No owner') + ' · ' + (p.implementedByControls || []).length + ' control' + ((p.implementedByControls || []).length === 1 ? '' : 's') + '</div>' +
                 '</div>' +
               '</div>';
      }).join('');
    }

    var html = [
      '<div class="flex items-start justify-between mb-4">',
        '<div>',
          '<div class="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">Map control to policy</div>',
          '<h3 class="text-xl font-extrabold tracking-tight">' + UI.htmlEscape(control.id) + ' · ' + UI.htmlEscape(control.name) + '</h3>',
          '<p class="text-xs text-white/55 mt-1">Choose an existing policy or <button class="text-babcom-300 underline" onclick="UI.closeModal(); Views.openUploadPolicyModal()">upload a new one</button>.</p>',
        '</div>',
        '<button onclick="UI.closeModal()" class="text-white/40 hover:text-white p-1"><i data-lucide="x" class="w-4 h-4"></i></button>',
      '</div>',

      '<div class="relative mb-3">',
        '<i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>',
        '<input id="pol-pick-search" placeholder="Search policies..." class="w-full pl-9 pr-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-babcom-500/50" />',
      '</div>',

      '<div id="pol-pick-list" class="space-y-2 max-h-[420px] overflow-y-auto pr-1">' + rowsHtml('') + '</div>',

      '<div class="mt-5 flex items-center justify-between gap-2">',
        '<button class="btn btn-ghost text-xs" onclick="Views.selectPolicyForControl(\'' + UI.htmlEscape(controlId) + '\', null)"><i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Clear link</button>',
        '<div class="flex items-center gap-2">',
          '<button class="btn btn-ghost text-xs" onclick="UI.closeModal()">Cancel</button>',
          '<button id="pol-pick-save" class="btn btn-primary text-xs"' + (current ? '' : ' disabled style="opacity:0.4;cursor:not-allowed"') + '><i data-lucide="check" class="w-3.5 h-3.5"></i> Link policy</button>',
        '</div>',
      '</div>'
    ].join('');
    UI.openModal(html);

    /* Wire click selection + search filtering. */
    var listEl   = document.getElementById('pol-pick-list');
    var searchEl = document.getElementById('pol-pick-search');
    var saveBtn  = document.getElementById('pol-pick-save');
    var selectedId = current ? current.id : null;

    function bindRowClicks() {
      Array.prototype.slice.call(listEl.querySelectorAll('.policy-pick')).forEach(function (row) {
        row.addEventListener('click', function () {
          selectedId = row.getAttribute('data-pick');
          Array.prototype.slice.call(listEl.querySelectorAll('.policy-pick')).forEach(function (r) { r.classList.remove('is-selected'); });
          row.classList.add('is-selected');
          if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = ''; saveBtn.style.cursor = ''; }
        });
      });
    }
    bindRowClicks();

    if (searchEl) {
      searchEl.addEventListener('input', function () {
        listEl.innerHTML = rowsHtml(searchEl.value);
        bindRowClicks();
        if (window.lucide) lucide.createIcons();
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        if (!selectedId) return;
        selectPolicyForControl(controlId, selectedId);
      });
    }
  }

  function selectPolicyForControl(controlId, policyId) {
    DATA.linkControlToPolicy(controlId, policyId);
    UI.closeModal();
    var nav = document.querySelector('[data-route="controls"]');
    if (nav) nav.click();
  }

  /* ====================================================================== */
  /*  12.c In-app policy viewer                                              */
  /* ====================================================================== */

  /* Tiny safe markdown: only handles headings, bold, italics, code, lists,
     and paragraphs. EVERY token is htmlEscape'd first so we cannot inject
     raw HTML even from a malicious uploaded .md. */
  function _renderMarkdown(src) {
    if (!src) return '';
    var safe = UI.htmlEscape(String(src));
    var lines = safe.split(/\r?\n/);
    var out = [];
    var inList = false;
    function closeList() { if (inList) { out.push('</ul>'); inList = false; } }
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (/^\s*$/.test(ln))                              { closeList(); continue; }
      if (/^#{1,6}\s/.test(ln)) {
        closeList();
        var depth = ln.match(/^#+/)[0].length;
        var text = ln.replace(/^#+\s*/, '');
        out.push('<h' + (depth + 2) + ' class="font-bold mt-4 mb-2 text-white/90">' + text + '</h' + (depth + 2) + '>');
        continue;
      }
      if (/^\s*[-*]\s+/.test(ln)) {
        if (!inList) { out.push('<ul class="list-disc list-inside space-y-1 my-2 text-white/75">'); inList = true; }
        out.push('<li>' + ln.replace(/^\s*[-*]\s+/, '') + '</li>');
        continue;
      }
      closeList();
      var p = ln
        .replace(/`([^`]+)`/g,         '<code class="bg-white/5 px-1.5 py-0.5 rounded text-[12px] text-babcom-200">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g,   '<strong class="text-white">$1</strong>')
        .replace(/\*([^*]+)\*/g,       '<em>$1</em>');
      out.push('<p class="my-2 text-white/75 leading-relaxed">' + p + '</p>');
    }
    closeList();
    return out.join('\n');
  }

  /* Decode base64 (FileReader output) -> Blob. */
  function _b64ToBlob(b64, mimeType) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mimeType || 'application/octet-stream' });
  }

  /* Decode base64 -> UTF-8 string (best-effort; text policies only). */
  function _b64ToText(b64) {
    try {
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes);
    } catch (_) { return ''; }
  }

  /* Track blob URLs so we can revoke them when the modal closes. */
  var _viewerBlobUrls = [];
  function _newBlobUrl(blob) {
    var url = URL.createObjectURL(blob);
    _viewerBlobUrls.push(url);
    return url;
  }
  function _revokeViewerBlobs() {
    _viewerBlobUrls.splice(0).forEach(function (u) { try { URL.revokeObjectURL(u); } catch (_) {} });
  }

  /* Per-policy compliance modal : a focused view of how this one policy
     stacks up against every framework control it claims to address. */
  function openPolicyComplianceModal(policyId) {
    var p = DATA.getPolicyById(policyId);
    if (!p) return;
    var scan = DATA.scanPolicyCompliance(p);

    var s = scan.summary;
    var fwBlocks = scan.byFramework.length === 0
      ? '<div class="text-[12px] text-white/55 p-3 rounded-lg border border-white/5 bg-black/20">' +
          'This policy is not mapped to any framework yet. Map it on upload to run framework-control coverage.' +
        '</div>'
      : scan.byFramework.map(function (fw) {
          var rows = fw.controls.map(function (fc) {
            var color = fc.status === 'compliant' ? '#34d399'
                      : fc.status === 'partial'   ? '#fbbf24'
                      : '#fb7185';
            var label = fc.status === 'compliant' ? 'Compliant'
                      : fc.status === 'partial'   ? 'Partial'
                      : 'Missing';
            var ev = fc.evidenceRefs && fc.evidenceRefs.length
              ? '<div class="text-[10.5px] text-emerald-200/80 mt-0.5">Found in: ' + UI.htmlEscape(fc.evidenceRefs.join(', ')) + '</div>'
              : '';
            var snippet = fc.evidenceSnippets && fc.evidenceSnippets[0]
              ? '<div class="text-[10.5px] text-white/45 mt-0.5 italic">\u201c' + UI.htmlEscape(fc.evidenceSnippets[0]) + '\u201d</div>'
              : '';
            var rec = fc.status === 'missing'
              ? '<div class="text-[10.5px] text-white/45 mt-0.5">Add a section that addresses: ' + UI.htmlEscape(fc.summary || fc.title) + '</div>'
              : (fc.status === 'partial'
                  ? '<div class="text-[10.5px] text-white/45 mt-0.5">Coverage is thin: strengthen with explicit references.</div>'
                  : '');
            return '<div class="flex items-start gap-3 py-2 border-b border-white/5 last:border-none">' +
                     '<span class="h-1.5 w-1.5 rounded-full mt-2 flex-shrink-0" style="background:' + color + '"></span>' +
                     '<div class="min-w-0 flex-1">' +
                       '<div class="flex flex-wrap items-baseline gap-2">' +
                         '<span class="font-mono text-[11px] text-white/55">' + UI.htmlEscape(fc.code) + '</span>' +
                         '<span class="font-semibold text-[12.5px]">' + UI.htmlEscape(fc.title) + '</span>' +
                         '<span class="chip text-[10px]" style="border-color:' + color + ';color:' + color + '">' + label + '</span>' +
                         '<span class="text-[10px] uppercase tracking-widest text-white/35 ml-auto">' + UI.htmlEscape(fc.severity) + '</span>' +
                       '</div>' +
                       ev + snippet + rec +
                     '</div>' +
                   '</div>';
          }).join('');
          return '<div class="gr-card p-4 mb-3">' +
                   '<div class="flex items-center gap-3 mb-2">' +
                     '<div class="font-bold text-sm">' + UI.htmlEscape(fw.name) + '</div>' +
                     '<span class="chip">' + fw.compliant + '/' + fw.total + ' compliant</span>' +
                     (fw.partial ? '<span class="chip" style="color:#fcd34d;border-color:rgba(251,191,36,0.4)">' + fw.partial + ' partial</span>' : '') +
                     (fw.missing ? '<span class="chip" style="color:#fda4af;border-color:rgba(251,113,133,0.4)">' + fw.missing + ' missing</span>' : '') +
                     '<span class="ml-auto text-[11px] text-white/55">' + fw.coveragePct + '%</span>' +
                   '</div>' +
                   '<div>' + rows + '</div>' +
                 '</div>';
        }).join('');

    var html = [
      '<div class="flex items-start justify-between mb-5">',
        '<div class="min-w-0">',
          '<div class="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">Compliance coverage</div>',
          '<h3 class="text-xl font-extrabold tracking-tight">' + UI.htmlEscape(p.title) + '</h3>',
          '<p class="text-xs text-white/55 mt-1">' + s.compliantControls + ' compliant \u00b7 ' + s.partialControls + ' partial \u00b7 ' + s.missingControls + ' missing across ' + s.totalControls + ' framework controls. Overall coverage: ' + s.coveragePct + '%.</p>',
        '</div>',
        '<button onclick="UI.closeModal()" class="text-white/40 hover:text-white p-1"><i data-lucide="x" class="w-4 h-4"></i></button>',
      '</div>',
      '<div class="max-h-[60vh] overflow-y-auto pr-1">' + fwBlocks + '</div>',
      '<div class="mt-5 pt-4 border-t border-white/5 flex items-center gap-2">',
        s.missingControls + s.partialControls > 0
          ? '<button class="btn btn-primary text-xs" onclick="UI.closeModal(); Views.setGapsFilter(\'policyId\', \'' + UI.htmlEscape(p.id) + '\')"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> Open in Compliance Gaps</button>'
          : '<div class="text-xs text-emerald-300 font-semibold flex items-center gap-2"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> All framework controls compliant.</div>',
        '<button class="btn btn-ghost text-xs ml-auto" onclick="UI.closeModal()">Close</button>',
      '</div>'
    ].join('');
    UI.openModal(html);
  }

  function openPolicyViewer(policyId, opts) {
    opts = opts || {};
    _revokeViewerBlobs();
    var p = DATA.getPolicyById(policyId);
    if (!p) return;
    var owner    = p.ownerId    ? DATA.indexes.personas[p.ownerId]    : null;
    var approver = p.approverId ? DATA.indexes.personas[p.approverId] : null;
    var regs     = (p.mapsToRegulations || []).map(function (id) { return DATA.indexes.regulations[id]; }).filter(Boolean);
    var ctrls    = (p.implementedByControls || []).map(function (id) { return DATA.indexes.controls[id]; }).filter(Boolean);

    /* ---- Body content depends on the policy's format + whether it has a file. */
    var body = '';
    var isLocalPdf  = (p.format === 'pdf') && p.source === 'uploaded' && p.hasFile;
    var isLocalText = ['markdown', 'html', 'text'].indexOf(p.format) >= 0 && p.source === 'uploaded' && p.hasFile;
    var isServerPdf  = (p.format === 'pdf') && p.source === 'server' && !!p.fileUrl;
    var isServerText = ['markdown', 'html', 'text'].indexOf(p.format) >= 0 && p.source === 'server' && !!p.fileUrl;
    var isPdf  = isLocalPdf  || isServerPdf;
    var isText = isLocalText || isServerText;
    if (isServerPdf) {
      /* Server-hosted PDFs render from the Blob CDN URL directly: no base64
         in localStorage, no magic-byte sniff needed (the server validated MIME
         on upload). */
      var safeUrl = UI.safeUrl(p.fileUrl);
      var safeUrlForFrame = (safeUrl !== '#') ? p.fileUrl : null;
      var serverFallbackCta =
        '<div class="flex flex-wrap items-center gap-2 mb-2 text-[11px] text-white/55">' +
          '<i data-lucide="info" class="w-3.5 h-3.5"></i>' +
          'PDF preview is rendered by your browser. If it does not load below,' +
          ' <button class="text-babcom-200 hover:text-babcom-100 underline" onclick="Views.openPolicyDocument(\'' + UI.htmlEscape(p.id) + '\')">open it in a new tab</button>.' +
        '</div>';
      if (safeUrlForFrame) {
        body = serverFallbackCta +
               '<div class="rounded-lg overflow-hidden border border-white/5" style="height:60vh">' +
                 '<iframe src="' + UI.htmlEscape(safeUrlForFrame) + '" class="w-full h-full bg-white" title="' + UI.htmlEscape(p.title) + ' (PDF preview)"></iframe>' +
               '</div>';
      } else {
        body = '<div class="rounded-lg border border-accent-rose/30 bg-accent-rose/5 p-5 text-center">' +
                 '<div class="font-semibold text-sm">Stored URL is not a safe https link</div>' +
               '</div>';
      }
    } else if (isServerText) {
      /* Markdown / HTML / TXT hosted on the CDN : fetch the body once and
         render it through the same safe pipeline we use for local uploads. */
      body = '<div id="srv-policy-body" class="rounded-lg border border-white/5 p-5 bg-black/30 max-h-[60vh] overflow-y-auto text-sm leading-relaxed">' +
               '<div class="text-white/45 text-[12px]"><i data-lucide="loader-2" class="w-3.5 h-3.5 inline-block animate-spin"></i> Loading policy body...</div>' +
             '</div>';
      /* Kick off the fetch after we've rendered the modal shell. The fetch
         target is the same-origin policy's fileUrl on blob.vercel-storage; we
         interpret nothing as HTML to keep XSS off the table. */
      setTimeout(function () {
        fetch(p.fileUrl, { cache: 'no-store' }).then(function (r) {
          return r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status));
        }).then(function (txt) {
          var el = document.getElementById('srv-policy-body');
          if (!el) return;
          if (p.format === 'markdown') {
            el.innerHTML = _renderMarkdown(txt);
          } else {
            /* HTML and TXT both rendered as escaped text. */
            el.innerHTML = '<pre class="whitespace-pre-wrap text-[12px] leading-relaxed text-white/80">' + UI.htmlEscape(txt) + '</pre>';
          }
          if (window.lucide) lucide.createIcons();
        }).catch(function () {
          var el = document.getElementById('srv-policy-body');
          if (el) el.innerHTML = '<div class="text-accent-rose text-[12px]">Could not load policy body from the server.</div>';
        });
      }, 0);
    } else if (isLocalPdf) {
      var f = DATA.getPolicyFile(p.id);
      if (f && f.base64) {
        var blob = _b64ToBlob(f.base64, f.mimeType);
        var url  = _newBlobUrl(blob);
        /* Quick magic-byte sniff so we can warn the user when an upload was
           renamed to .pdf but isn't actually one (the browser's PDF viewer
           would otherwise just render an empty grey "broken file" panel). */
        var looksLikePdf = false;
        try {
          var head = atob((f.base64 || '').slice(0, 8)).slice(0, 5);
          looksLikePdf = head === '%PDF-';
        } catch (_) { looksLikePdf = false; }

        var fallbackCta =
          '<div class="flex flex-wrap items-center gap-2 mb-2 text-[11px] text-white/55">' +
            '<i data-lucide="info" class="w-3.5 h-3.5"></i>' +
            'PDF preview is rendered by your browser. If it does not load below,' +
            ' <button class="text-babcom-200 hover:text-babcom-100 underline" onclick="Views.openPolicyDocument(\'' + UI.htmlEscape(p.id) + '\')">open it in a new tab</button>.' +
          '</div>';

        if (!looksLikePdf) {
          body = fallbackCta +
                 '<div class="rounded-lg border border-accent-rose/30 bg-accent-rose/5 p-5 text-center">' +
                   '<i data-lucide="file-warning" class="w-7 h-7 mx-auto text-accent-rose mb-2"></i>' +
                   '<div class="font-semibold text-sm">This file does not look like a valid PDF</div>' +
                   '<div class="text-[12px] text-white/55 mt-1">The uploaded file is missing the standard <code class="text-white/80">%PDF-</code> header. Try re-exporting from your source and uploading again.</div>' +
                   '<button class="btn btn-ghost text-xs mt-3 inline-flex" onclick="Views.openPolicyDocument(\'' + UI.htmlEscape(p.id) + '\')"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> Try opening it anyway</button>' +
                 '</div>';
        } else {
          /* `sandbox` is intentionally absent: the blob URL is from our own
             origin and the browser's built-in PDF viewer needs scripts to
             render the toolbar / pagination. CSP still keeps us from being
             framed and from loading any other plugin. */
          body = fallbackCta +
                 '<div class="rounded-lg overflow-hidden border border-white/5" style="height:60vh">' +
                   '<iframe src="' + url + '" class="w-full h-full bg-white" title="' + UI.htmlEscape(p.title) + ' (PDF preview)"></iframe>' +
                 '</div>';
        }
      } else {
        body = '<div class="rounded-lg border border-white/5 p-8 text-center bg-black/30">' +
                 '<i data-lucide="file-x" class="w-8 h-8 mx-auto text-white/30 mb-3"></i>' +
                 '<div class="font-semibold text-sm">The PDF payload is missing</div>' +
                 '<div class="text-[12px] text-white/45 mt-1">Your browser may have evicted it from local storage. Re-upload the file to view it.</div>' +
               '</div>';
      }
    } else if (isLocalText) {
      var f2 = DATA.getPolicyFile(p.id);
      var txt = f2 ? _b64ToText(f2.base64) : '';
      if (p.format === 'markdown') {
        body = '<div class="rounded-lg border border-white/5 p-5 bg-black/30 max-h-[60vh] overflow-y-auto text-sm leading-relaxed">' + _renderMarkdown(txt) + '</div>';
      } else {
        body = '<pre class="rounded-lg border border-white/5 p-5 bg-black/30 max-h-[60vh] overflow-auto text-[12px] leading-relaxed whitespace-pre-wrap text-white/80">' + UI.htmlEscape(txt) + '</pre>';
      }
    } else if (p.sections && p.sections.length) {
      /* Seeded policy : render its sections as a clean reading view. */
      body = '<div class="rounded-lg border border-white/5 bg-black/30 max-h-[60vh] overflow-y-auto">' +
        p.sections.map(function (s) {
          var hl = opts.highlightSectionId === s.id ? ' style="background:rgba(255,90,31,0.10);border-color:rgba(255,90,31,0.45)"' : '';
          var hlBadge = opts.highlightSectionId === s.id
            ? '<span class="badge badge-elevated ml-2"><span class="badge-dot" style="background:#ff7a3d"></span>NEEDS UPDATE</span>'
            : '';
          return '<div id="sec-' + UI.htmlEscape(s.id) + '" class="p-5 border-b border-white/5 last:border-none"' + hl + '>' +
                   '<div class="flex items-baseline gap-3 mb-2">' +
                     '<div class="text-[10px] uppercase tracking-widest text-white/40">\u00a7' + UI.htmlEscape(s.num) + '</div>' +
                     '<h4 class="font-bold text-sm">' + UI.htmlEscape(s.title) + '</h4>' +
                     hlBadge +
                   '</div>' +
                   '<p class="text-[13px] text-white/70 leading-relaxed">' + UI.htmlEscape(s.body) + '</p>' +
                 '</div>';
        }).join('') +
      '</div>';
    } else {
      var ext = UI.safeUrl(p.documentUrl);
      body = '<div class="rounded-lg border border-white/5 p-8 text-center bg-black/30">' +
               '<i data-lucide="file-search" class="w-8 h-8 mx-auto text-white/30 mb-3"></i>' +
               '<div class="font-semibold text-sm">No previewable content for this policy.</div>' +
               '<div class="text-[12px] text-white/45 mt-1">Either no file was uploaded or the format is not previewable here.</div>' +
               (ext !== '#'
                 ? '<a href="' + ext + '" target="_blank" rel="noopener noreferrer" class="btn btn-ghost text-xs mt-4 inline-flex"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> Open external URL</a>'
                 : '') +
             '</div>';
    }

    var hl = opts.highlightSectionId
      ? '<div class="mt-1 mb-3 rounded-lg border border-babcom-500/40 bg-babcom-500/10 px-3 py-2 text-[12px] text-babcom-200 flex items-center gap-2">' +
          '<i data-lucide="zap" class="w-3.5 h-3.5"></i>' +
          'A regulatory change requires updating section \u00a7' + UI.htmlEscape((p.sections || []).find(function (s) { return s.id === opts.highlightSectionId; }) ? p.sections.find(function (s) { return s.id === opts.highlightSectionId; }).num : '?') + '. Jump to it below.' +
        '</div>'
      : '';

    var headerHtml = [
      '<div class="flex items-start justify-between mb-4 gap-3">',
        '<div class="min-w-0">',
          '<div class="flex items-center gap-2 mb-1 flex-wrap">',
            _statusBadge(p.status), _formatBadge(p.format), _sourceBadge(p.source),
            '<span class="chip">v' + UI.htmlEscape(p.version) + '</span>',
          '</div>',
          '<h3 class="text-xl font-extrabold tracking-tight">' + UI.htmlEscape(p.title) + '</h3>',
          '<p class="text-xs text-white/55 mt-1">' + UI.htmlEscape(p.description || '') + '</p>',
        '</div>',
        '<button onclick="UI.closeModal(); (' + _revokeViewerBlobs.toString() + ')()" class="text-white/40 hover:text-white p-1"><i data-lucide="x" class="w-4 h-4"></i></button>',
      '</div>'
    ].join('');

    var metaHtml = [
      '<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">',
        '<div class="rounded-lg border border-white/5 px-3 py-2">',
          '<div class="kpi-label">Owner</div>',
          '<div class="font-semibold text-xs mt-1 truncate">' + UI.htmlEscape(owner ? owner.name : '\u2014') + '</div>',
        '</div>',
        '<div class="rounded-lg border border-white/5 px-3 py-2">',
          '<div class="kpi-label">Approver</div>',
          '<div class="font-semibold text-xs mt-1 truncate">' + UI.htmlEscape(approver ? approver.name : '\u2014') + '</div>',
        '</div>',
        '<div class="rounded-lg border border-white/5 px-3 py-2">',
          '<div class="kpi-label">Effective</div>',
          '<div class="font-semibold text-xs mt-1">' + _fmtDateOnly(p.effectiveDate) + '</div>',
        '</div>',
        '<div class="rounded-lg border border-white/5 px-3 py-2">',
          '<div class="kpi-label">Next review</div>',
          '<div class="font-semibold text-xs mt-1">' + _fmtDateOnly(p.nextReviewDate) + '</div>',
        '</div>',
      '</div>',

      regs.length || ctrls.length
        ? '<div class="flex flex-wrap items-center gap-1.5 mb-3">' +
            regs.map(function (r) { return '<span class="chip" title="Regulation"><i data-lucide="book" class="w-3 h-3"></i>' + UI.htmlEscape(r.shortTitle) + '</span>'; }).join('') +
            ctrls.map(function (c) { return '<span class="chip" title="Control" style="color:#ffc3a3"><i data-lucide="shield" class="w-3 h-3"></i>' + UI.htmlEscape(c.id) + '</span>'; }).join('') +
          '</div>'
        : ''
    ].join('');

    var footerHtml = [
      '<div class="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-white/5">',
        '<div class="text-[11px] text-white/45">' + (p.fileName ? UI.htmlEscape(p.fileName) + ' \u00b7 ' + _fmtBytes(p.fileSize) : 'Seeded policy \u00b7 no attached file') + '</div>',
        '<div class="flex items-center gap-2">',
          (isPdf || isText)
            ? '<button class="btn btn-ghost text-xs" onclick="Views.openPolicyDocument(\'' + UI.htmlEscape(p.id) + '\')"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> Open in new tab</button>'
            : '',
          '<button class="btn btn-primary text-xs" onclick="UI.closeModal(); (' + _revokeViewerBlobs.toString() + ')()"><i data-lucide="check" class="w-3.5 h-3.5"></i> Done</button>',
        '</div>',
      '</div>'
    ].join('');

    UI.openModal(headerHtml + hl + metaHtml + body + footerHtml);

    /* If a caller asked us to land on a specific section, scroll to it. */
    if (opts.highlightSectionId) {
      setTimeout(function () {
        var el = document.getElementById('sec-' + opts.highlightSectionId);
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }

  return {
    dashboard: dashboard, radar: radar, regulationDetail: regulationDetail, drift: drift,
    gaps: gaps, actions: actions, evidence: evidence, controls: controls, team: team,
    sources: sources, about: about, mountCharts: mountCharts,
    openAddSourceModal: openAddSourceModal, verifyAddSource: verifyAddSource, saveAddSource: saveAddSource,
    /* ---------- Policies ---------- */
    policies:              policies,
    setPolicyFilter:       setPolicyFilter,
    openUploadPolicyModal: openUploadPolicyModal,
    handlePolicyFile:      handlePolicyFile,
    runPolicyVerification: runPolicyVerification,
    savePolicyUpload:      savePolicyUpload,
    openPolicyPickerModal: openPolicyPickerModal,
    selectPolicyForControl:selectPolicyForControl,
    openPolicyDocument:    openPolicyDocument,
    openPolicyViewer:      openPolicyViewer,
    openPolicyComplianceModal: openPolicyComplianceModal,
    deletePolicy:          deletePolicy,
    /* ---------- Compliance Gaps filters ---------- */
    setGapsFilter:         setGapsFilter,
    clearGapsFilter:       clearGapsFilter
  };
})();
