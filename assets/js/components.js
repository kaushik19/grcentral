/* ============================================================================
   GRCentral · Reusable UI fragments
   ============================================================================ */

window.UI = (() => {

  const fmt = {
    date(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    },
    relTime(iso) {
      if (!iso) return '—';
      const ms = Date.now() - new Date(iso).getTime();
      const s = Math.floor(ms / 1000);
      if (s < 60) return `${s}s ago`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      if (d < 30) return `${d}d ago`;
      const mo = Math.floor(d / 30);
      return `${mo}mo ago`;
    },
    score(n) { return Number(n).toFixed(1); },
    pct(n)   { return `${Math.round(n)}%`; }
  };

  function avatar(persona, size = '') {
    if (!persona) return '';
    const cls = size === 'lg' ? 'avatar lg' : 'avatar';
    return `<div class="${cls}" style="--c1:${persona.c1};--c2:${persona.c2};" title="${persona.name}">${persona.initials}</div>`;
  }

  function badgeForBand(band) {
    const label = RiskEngine.bandLabel(band);
    return `<span class="badge badge-${band}"><span class="badge-dot" style="background:${RiskEngine.bandColor(band)}"></span>${label}</span>`;
  }

  function badgeSeverity(sev) {
    const map = { critical: 'critical', high: 'high', medium: 'elevated', low: 'stable' };
    const cls = map[sev] || 'neutral';
    return `<span class="badge badge-${cls}">${sev.toUpperCase()}</span>`;
  }

  function badgeChangeType(t) {
    const map = {
      add:        ['badge-stable',   'NEW'],
      modify:     ['badge-elevated', 'MODIFIED'],
      remove:     ['badge-critical', 'REMOVED'],
      'new-guidance': ['badge-info', 'GUIDANCE'],
      guidance:   ['badge-info',     'GUIDANCE'],
      amendment:  ['badge-elevated', 'AMENDMENT'],
      rts:        ['badge-info',     'RTS'],
      advisory:   ['badge-info',     'ADVISORY'],
      'edpb-opinion': ['badge-info', 'EDPB OPINION']
    };
    const [cls, label] = map[t] || ['badge-neutral', t.toUpperCase()];
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function card({ title, subtitle, right = '', body, classes = '', titleIcon = '' }) {
    return `
      <div class="gr-card ${classes} p-5">
        ${title ? `
          <div class="flex items-start justify-between mb-4 gap-3">
            <div>
              <h3 class="font-bold tracking-tight text-[15px] flex items-center gap-2">
                ${titleIcon ? `<i data-lucide="${titleIcon}" class="w-4 h-4 text-babcom-400"></i>` : ''}
                ${title}
              </h3>
              ${subtitle ? `<p class="text-xs text-white/40 mt-1">${subtitle}</p>` : ''}
            </div>
            <div>${right}</div>
          </div>` : ''}
        ${body}
      </div>`;
  }

  function kpiTile({ label, value, delta, deltaPositive, icon, color }) {
    const deltaColor = deltaPositive ? 'text-accent-emerald' : 'text-accent-rose';
    return `
      <div class="gr-card gr-card-hover p-5 fade-up">
        <div class="flex items-start justify-between">
          <div class="kpi-label">${label}</div>
          <div class="h-8 w-8 rounded-lg flex items-center justify-center" style="background:${color}20;color:${color};">
            <i data-lucide="${icon}" class="w-4 h-4"></i>
          </div>
        </div>
        <div class="kpi-number mt-3">${value}</div>
        ${delta != null ? `<div class="text-[11px] mt-1 ${deltaColor} flex items-center gap-1">
          <i data-lucide="${deltaPositive ? 'arrow-down-right' : 'arrow-up-right'}" class="w-3 h-3"></i>
          ${delta}
        </div>` : ''}
      </div>`;
  }

  function sourcePill(source) {
    return `<span class="source-pill"><span class="dot"></span>${source.name}</span>`;
  }

  function chip(text, icon) {
    return `<span class="chip">${icon ? `<i data-lucide="${icon}" class="w-3 h-3"></i>` : ''}${text}</span>`;
  }

  function regulationCard(reg, drift) {
    const source = DATA.indexes.sources[reg.sourceId];
    return `
      <div class="gr-card gr-card-hover p-5 cursor-pointer fade-up" data-route="regulation/${reg.id}">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              ${source ? sourcePill(source) : ''}
              ${reg.celex ? `<span class="chip" title="CELEX">${reg.celex}</span>` : ''}
              <span class="chip">${reg.jurisdiction}</span>
            </div>
            <h3 class="font-bold tracking-tight text-[15px] mb-1">${reg.shortTitle}</h3>
            <p class="text-xs text-white/55 line-clamp-2">${reg.title}</p>
          </div>
          ${drift ? badgeForBand(drift.band) : ''}
        </div>
        <div class="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
          <div>
            <div class="text-[10px] uppercase tracking-widest text-white/40">Drift</div>
            <div class="font-bold text-lg" style="color:${drift ? RiskEngine.bandColor(drift.band) : '#fff'}">${drift ? fmt.score(drift.score) : '—'}</div>
          </div>
          <div>
            <div class="text-[10px] uppercase tracking-widest text-white/40">Last change</div>
            <div class="font-semibold text-sm">${fmt.relTime(reg.lastChange)}</div>
          </div>
          <div>
            <div class="text-[10px] uppercase tracking-widest text-white/40">Effective</div>
            <div class="font-semibold text-sm">${fmt.date(reg.effectiveDate)}</div>
          </div>
        </div>
      </div>`;
  }

  function timelineRow(change) {
    const reg = DATA.indexes.regulations[change.regId];
    return `
      <div class="flex items-start gap-3 py-3 border-b border-white/5 last:border-none group cursor-pointer" data-route="regulation/${reg.id}">
        <div class="mt-1 h-2 w-2 rounded-full" style="background:${change.impact === 'critical' ? '#fb7185' : change.impact === 'high' ? '#fbbf24' : change.impact === 'medium' ? '#ff7a3d' : '#34d399'}"></div>
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span class="font-semibold text-sm">${reg.shortTitle}</span>
            ${badgeChangeType(change.changeType)}
            <span class="text-[11px] text-white/40">${fmt.relTime(change.detectedAt)}</span>
          </div>
          <div class="text-xs text-white/65">${change.summary}</div>
        </div>
        ${badgeSeverity(change.impact)}
      </div>`;
  }

  /* ---------------- Drift Gauge (canvas-free, pure SVG) ------------------- */
  function driftGauge(score, band, size = 180) {
    const color = RiskEngine.bandColor(band);
    const C = size / 2;
    const R = size / 2 - 10;
    const circumference = 2 * Math.PI * R;
    const offset = circumference - (score / 100) * circumference;
    return `
      <div class="drift-ring" style="width:${size}px;height:${size}px;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
          <defs>
            <linearGradient id="grad-${band}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stop-color="${color}" />
              <stop offset="100%" stop-color="#ff5a1f" />
            </linearGradient>
          </defs>
          <circle cx="${C}" cy="${C}" r="${R}" stroke="rgba(255,255,255,0.06)" stroke-width="10" fill="none" />
          <circle cx="${C}" cy="${C}" r="${R}" stroke="url(#grad-${band})" stroke-width="10" fill="none"
                  stroke-linecap="round"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${offset}" />
        </svg>
        <div class="center">
          <div class="text-[10px] uppercase tracking-[0.25em] text-white/40">Risk drift</div>
          <div class="text-4xl font-extrabold mt-1" style="color:${color};">${fmt.score(score)}</div>
          <div class="text-[11px] uppercase tracking-widest mt-1" style="color:${color};">${RiskEngine.bandLabel(band)}</div>
        </div>
      </div>`;
  }

  /* -------------------------- Modal ---------------------------------------*/
  function openModal(html) {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `<div class="modal-backdrop" id="modalBackdrop">
      <div class="modal-card p-6 fade-up" onclick="event.stopPropagation()">${html}</div>
    </div>`;
    document.getElementById('modalBackdrop').addEventListener('click', closeModal);
    if (window.lucide) lucide.createIcons();
  }
  function closeModal() {
    document.getElementById('modalRoot').innerHTML = '';
  }

  return {
    fmt, avatar, badgeForBand, badgeSeverity, badgeChangeType,
    card, kpiTile, sourcePill, chip, regulationCard, timelineRow,
    driftGauge, openModal, closeModal
  };
})();
