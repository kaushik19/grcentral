/* ============================================================================
   GRCentral · Risk Drift Engine
   ----------------------------------------------------------------------------
   Implements the formula:

     DriftScore = (
         0.30 · RegulationImpact
       + 0.25 · CoverageGap
       + 0.20 · ControlDrift
       + 0.10 · EvidenceAging
       + 0.10 · RemediationDelay
       + 0.05 · BusinessCriticality
     ) × TrendMultiplier

   Sub-scores are normalised to 0..100.
   TrendMultiplier = clamp(1 + slope_30d / 100, 0.7, 1.5).
   ============================================================================ */

window.RiskEngine = (() => {

  const WEIGHTS = {
    regulation:  0.30,
    coverage:    0.25,
    control:     0.20,
    evidence:    0.10,
    remediation: 0.10,
    criticality: 0.05
  };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ---- Sub-score computations -------------------------------------------- */

  /** Regulation Impact: severity & freshness of recent changes affecting reg. */
  function regulationImpactFor(reg, changes) {
    const relevant = changes.filter(c => c.regId === reg.id);
    if (!relevant.length) return 15;
    const sevMap = { critical: 95, high: 75, medium: 50, low: 25 };
    const recencyBoost = (c) => {
      const days = (Date.now() - new Date(c.detectedAt).getTime()) / 86400000;
      return Math.max(0, 20 - days);            // up to +20 for fresh changes
    };
    const peak = Math.max(...relevant.map(c => sevMap[c.impact] + recencyBoost(c)));
    return clamp(peak, 0, 100);
  }

  /** Coverage Gap: 100 - average control maturity for the linked controls. */
  function coverageGapFor(reg, controls, risks) {
    const linkedControlIds = new Set(
      risks.filter(r => r.regId === reg.id).map(r => r.controlId)
    );
    const linked = controls.filter(c => linkedControlIds.has(c.id));
    if (!linked.length) return 30;
    const avgMaturity = linked.reduce((s, c) => s + c.maturity, 0) / linked.length;
    return clamp(100 - avgMaturity, 0, 100);
  }

  /** Control Drift: average drift% of linked controls. */
  function controlDriftFor(reg, controls, risks) {
    const linkedControlIds = new Set(
      risks.filter(r => r.regId === reg.id).map(r => r.controlId)
    );
    const linked = controls.filter(c => linkedControlIds.has(c.id));
    if (!linked.length) return 10;
    const avgDrift = linked.reduce((s, c) => s + c.drift, 0) / linked.length;
    return clamp(avgDrift * 3.5, 0, 100);       // amplify into 0..100 band
  }

  /** Evidence Aging: % of evidence pieces for linked controls that are expired or expire in <30d. */
  function evidenceAgingFor(reg, evidence, controls, risks) {
    const linkedControlIds = new Set(
      risks.filter(r => r.regId === reg.id).map(r => r.controlId)
    );
    const linked = evidence.filter(e => linkedControlIds.has(e.controlId));
    if (!linked.length) return 25;
    const aged = linked.filter(e => e.expiresInDays == null || e.expiresInDays < 30).length;
    return clamp((aged / linked.length) * 100, 0, 100);
  }

  /** Remediation Delay: % of open risks past their due date, weighted by severity. */
  function remediationDelayFor(reg, risks) {
    const open = risks.filter(r => r.regId === reg.id);
    if (!open.length) return 5;
    const sevWeight = { critical: 1.0, high: 0.75, medium: 0.5, low: 0.25 };
    let weightedSum = 0, weightTotal = 0;
    open.forEach(r => {
      const w = sevWeight[r.severity] ?? 0.5;
      const overdueFactor = r.remediationDueDays < 0 ? 1 :
                            r.remediationDueDays < 7 ? 0.6 :
                            r.remediationDueDays < 21 ? 0.3 : 0.1;
      weightedSum += w * overdueFactor;
      weightTotal += w;
    });
    return clamp((weightedSum / weightTotal) * 100, 0, 100);
  }

  /** Business Criticality: max criticality across exposed BUs (0..100). */
  function businessCriticalityFor(reg, businessUnits) {
    if (!reg.buExposure || !reg.buExposure.length) return 50;
    const exposed = businessUnits.filter(b => reg.buExposure.includes(b.id));
    if (!exposed.length) return 50;
    return Math.max(...exposed.map(b => b.criticality));
  }

  /** Trend Multiplier: 1 + slope_30d/100, clamped [0.7, 1.5]. */
  function trendMultiplierFromHistory(history) {
    if (!history || history.length < 30) return 1;
    const last30 = history.slice(-30);
    const xs = last30.map((_, i) => i);
    const ys = last30.map(p => p.score);
    const n = xs.length;
    const meanX = xs.reduce((a,b) => a + b, 0) / n;
    const meanY = ys.reduce((a,b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - meanX) * (ys[i] - meanY);
      den += (xs[i] - meanX) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;     // score points per day
    const mult = 1 + (slope * 30) / 100;         // scaled to ~ monthly slope
    return clamp(mult, 0.7, 1.5);
  }

  /* ---- Public API -------------------------------------------------------- */

  function computeFor(reg, ctx) {
    const components = {
      regulation:  regulationImpactFor(reg, ctx.changes),
      coverage:    coverageGapFor(reg, ctx.controls, ctx.risks),
      control:     controlDriftFor(reg, ctx.controls, ctx.risks),
      evidence:    evidenceAgingFor(reg, ctx.evidence, ctx.controls, ctx.risks),
      remediation: remediationDelayFor(reg, ctx.risks),
      criticality: businessCriticalityFor(reg, ctx.businessUnits)
    };
    const weighted =
        WEIGHTS.regulation  * components.regulation
      + WEIGHTS.coverage    * components.coverage
      + WEIGHTS.control     * components.control
      + WEIGHTS.evidence    * components.evidence
      + WEIGHTS.remediation * components.remediation
      + WEIGHTS.criticality * components.criticality;

    const history = ctx.driftHistoryByReg?.[reg.id] || [];
    const trend = trendMultiplierFromHistory(history);
    const score = clamp(weighted * trend, 0, 100);

    return {
      regId:      reg.id,
      components,
      weighted:   Number(weighted.toFixed(2)),
      trend:      Number(trend.toFixed(3)),
      score:      Number(score.toFixed(1)),
      band:       bandFor(score)
    };
  }

  function computeAll(ctx) {
    return ctx.regulations.map(r => computeFor(r, ctx));
  }

  function rollUpEnterprise(scores) {
    if (!scores.length) return { score: 0, band: 'stable' };
    const arr = scores.map(s => s.score);
    const avg = arr.reduce((a,b) => a + b, 0) / arr.length;
    const max = Math.max(...arr);
    /* enterprise score weights worst regulation more heavily */
    const score = 0.6 * avg + 0.4 * max;
    return { score: Number(score.toFixed(1)), band: bandFor(score) };
  }

  function bandFor(score) {
    if (score >= 76) return 'critical';
    if (score >= 51) return 'high';
    if (score >= 26) return 'elevated';
    return 'stable';
  }

  function bandLabel(band) {
    return { critical: 'Critical', high: 'High', elevated: 'Elevated', stable: 'Stable' }[band];
  }

  function bandColor(band) {
    return { critical: '#fb7185', high: '#fbbf24', elevated: '#ff7a3d', stable: '#34d399' }[band];
  }

  return {
    WEIGHTS,
    computeFor,
    computeAll,
    rollUpEnterprise,
    bandFor,
    bandLabel,
    bandColor,
    trendMultiplierFromHistory
  };
})();
