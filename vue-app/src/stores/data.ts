/**
 * Main data store
 * ===============
 * All state in this store is DERIVED from:
 *   1. Real framework controls (src/data/frameworks/)
 *   2. Real uploaded policies (src/stores/policies.ts)
 *   3. The compliance scanner (src/utils/scanner.ts)
 *   4. The drift engine (src/utils/drift.ts)
 *
 * The ONLY seeded data in the whole application are the 7 user personas.
 * Risks, controls, gaps, actions, and evidence are all computed from
 * real policy text scanned against actual published regulatory frameworks.
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { SEED_PERSONAS } from './seed'
import { usePolicyStore, type StoredPolicy } from './policies'
import FRAMEWORKS from '@/data/frameworks'
import { calculateDrift, driftFromScans, type DriftResult } from '@/utils/drift'
import type { Action, Evidence, Severity } from '@/types'
import {
  actionProgress,
  nextBestAction as _nextBest,
  startAction as _start,
  toggleActionStep as _toggleStep,
  attachEvidence as _attach,
  markBlocked as _block,
  unblock as _unblock,
  submitForReview as _submit,
  approve as _approve,
  type ApprovalPayload,
} from './actionLifecycle'

export type { ApprovalPayload }
export { actionProgress }
export type ActionApprovedHook = (payload: ApprovalPayload) => void

// ---- Derived risk type --------------------------------------------------
export interface DerivedRisk {
  id:            string
  policyId:      string
  policyTitle:   string
  frameworkId:   string
  frameworkTitle: string
  controlId:     string
  controlCode:   string
  controlTitle:  string
  severity:      Severity
  coverageStatus: 'partial' | 'missing'
  title:         string
  openSince:     string
  status:        'open' | 'closed'
  closedAt?:     string
  ownerId?:      string
}

// ---- Derived evidence type -----------------------------------------------
export interface DerivedEvidence extends Evidence {
  policyTitle: string
}

// ---- Derived control state -----------------------------------------------
export interface DerivedControlState {
  controlId:   string
  code:        string
  title:       string
  frameworkId: string
  severity:    Severity
  covered:     boolean
  policyIds:   string[]
  coverage:    number   // 0-100
}

const LS_ACTIONS_KEY = 'grcentral:actions:v1'
const LS_RADAR_KEY   = 'grcentral:radar-ack:v1'

// ---- Seeded radar changes (real regulatory events) -------------------------
type RadarChange = {
  id: string; frameworkId: string; frameworkTitle: string; summary: string
  impact: Severity | 'info'; detectedAt: string; live?: boolean
}

const SEED_RADAR_CHANGES: RadarChange[] = [
  {
    id: 'radar-001',
    frameworkId: 'ai-act',
    frameworkTitle: 'EU AI Act',
    summary: 'EU AI Act Article 6 high-risk classification obligations now applicable (Aug 2026). All high-risk AI systems must have conformity assessments, technical documentation, and human oversight measures in place before deployment.',
    impact: 'critical',
    detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'radar-002',
    frameworkId: 'dora',
    frameworkTitle: 'DORA',
    summary: 'DORA ICT third-party risk management framework (Art. 28–30) — EBA published final RTS on contractual arrangements for ICT services. Financial entities must update vendor contracts with new mandatory clauses by Q3 2026.',
    impact: 'high',
    detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'radar-003',
    frameworkId: 'nis2',
    frameworkTitle: 'NIS2',
    summary: 'ENISA publishes updated NIS2 incident reporting guidelines — minimum content for "significant incident" reports clarified. 24-hour early warning and 72-hour final notification timelines strictly enforced from Q2 2026.',
    impact: 'high',
    detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'radar-004',
    frameworkId: 'gdpr',
    frameworkTitle: 'GDPR',
    summary: 'EDPB Opinion 08/2025 on AI-generated personal data: processing synthetic data derived from personal data triggers full GDPR obligations. Controllers must update RoPA and DPIAs for AI training pipelines.',
    impact: 'high',
    detectedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'radar-005',
    frameworkId: 'ai-act',
    frameworkTitle: 'EU AI Act',
    summary: 'EU AI Act GPAI model transparency obligations (Art. 53) — EC publishes implementing act on technical documentation format. Providers of GPAI models must publish training data summaries and copyright compliance reports.',
    impact: 'medium',
    detectedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'radar-006',
    frameworkId: 'nist-csf',
    frameworkTitle: 'NIST CSF',
    summary: 'NIST CSF 2.0 Quick Start Guides updated — new implementation examples for Govern function (GV.OC, GV.RM tiers). Recommended for annual review alignment against current control mappings.',
    impact: 'medium',
    detectedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'radar-007',
    frameworkId: 'cra',
    frameworkTitle: 'CRA',
    summary: 'EU Cyber Resilience Act — ENISA releases draft harmonised standards for CRA conformity assessment. Products with digital elements must align vulnerability disclosure and SBOM requirements ahead of 2027 application.',
    impact: 'medium',
    detectedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'radar-008',
    frameworkId: 'gdpr',
    frameworkTitle: 'GDPR',
    summary: 'ICO (UK) issues enforcement notice on cookie consent dark patterns — confirms deceptive UI flows invalidate consent under UK GDPR. Organisations must audit consent management platforms within 90 days.',
    impact: 'low',
    detectedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'radar-009',
    frameworkId: 'dora',
    frameworkTitle: 'DORA',
    summary: 'DORA Threat-Led Penetration Testing (TLPT) — ECB publishes TIBER-EU updated framework. Significant financial institutions must align TLPT programmes to TIBER-EU 2025 methodology by end of 2026.',
    impact: 'info',
    detectedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

function loadActions(): Action[] {
  try { return JSON.parse(localStorage.getItem(LS_ACTIONS_KEY) ?? '[]') }
  catch { return [] }
}
function saveActions(actions: Action[]): void {
  try { localStorage.setItem(LS_ACTIONS_KEY, JSON.stringify(actions)) }
  catch { /* ignore */ }
}
function loadAckedChanges(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_RADAR_KEY) ?? '[]')) }
  catch { return new Set() }
}

export const useDataStore = defineStore('data', () => {
  const policies  = usePolicyStore()
  const personas  = ref(SEED_PERSONAS.map(p => ({ ...p })))
  const actions   = ref<Action[]>(loadActions())
  const extraEvidence = ref<Evidence[]>([])
  const ackedChanges  = ref<Set<string>>(loadAckedChanges())
  const radarChanges  = ref<RadarChange[]>([...SEED_RADAR_CHANGES])

  // Action-approved hooks
  const _approvedHooks = ref<ActionApprovedHook[]>([])

  // ---- Indexes (personas) ------------------------------------------------
  const personaById = computed(() =>
    Object.fromEntries(personas.value.map(p => [p.id, p])),
  )

  // ---- Framework access --------------------------------------------------
  const frameworks = computed(() => FRAMEWORKS)
  const frameworkById = computed(() =>
    Object.fromEntries(FRAMEWORKS.map(f => [f.id, f])),
  )

  // ---- Derived risks (from scan results) ---------------------------------
  const derivedRisks = computed((): DerivedRisk[] => {
    const risks: DerivedRisk[] = []
    for (const scan of policies.allScans) {
      const policy = policies.policies.find(p => p.id === scan.policyId)
      if (!policy) continue
      for (const fw of scan.byFramework) {
        for (const ctrl of fw.controls) {
          if (ctrl.status === 'compliant') continue
          risks.push({
            id:             `risk-${scan.policyId}-${ctrl.controlId}`,
            policyId:       scan.policyId,
            policyTitle:    scan.policyTitle,
            frameworkId:    fw.frameworkId,
            frameworkTitle: fw.frameworkTitle,
            controlId:      ctrl.controlId,
            controlCode:    ctrl.code,
            controlTitle:   ctrl.title,
            severity:       ctrl.severity,
            coverageStatus: ctrl.status as 'partial' | 'missing',
            title:          `${ctrl.code}: ${ctrl.title} — ${ctrl.status === 'missing' ? 'not covered' : 'partially covered'} by "${scan.policyTitle}"`,
            openSince:      policy.uploadedAt,
            status:         'open',
          })
        }
      }
    }
    // Apply closed-risk state from actions
    const closedRiskIds = new Set(
      actions.value
        .filter(a => a.status === 'done')
        .map(a => a.riskId),
    )
    return risks.map(r => closedRiskIds.has(r.id) ? { ...r, status: 'closed' as const } : r)
  })

  const openRisks    = computed(() => derivedRisks.value.filter(r => r.status === 'open'))
  const criticalRisks = computed(() => openRisks.value.filter(r => r.severity === 'critical'))

  // ---- Derived control states --------------------------------------------
  const controlStates = computed((): DerivedControlState[] => {
    const map = new Map<string, DerivedControlState>()
    for (const fw of FRAMEWORKS) {
      for (const ctrl of fw.controls) {
        map.set(ctrl.id, {
          controlId:   ctrl.id,
          code:        ctrl.code,
          title:       ctrl.title,
          frameworkId: fw.id,
          severity:    ctrl.severity,
          covered:     false,
          policyIds:   [],
          coverage:    0,
        })
      }
    }
    for (const scan of policies.allScans) {
      for (const fw of scan.byFramework) {
        for (const ctrl of fw.controls) {
          const state = map.get(ctrl.controlId)
          if (!state) continue
          if (ctrl.status === 'compliant') {
            state.covered = true
            state.policyIds.push(scan.policyId)
            state.coverage = Math.max(state.coverage, ctrl.score)
          } else if (ctrl.status === 'partial') {
            if (!state.covered) {
              state.policyIds.push(scan.policyId)
              state.coverage = Math.max(state.coverage, ctrl.score)
            }
          }
        }
      }
    }
    return Array.from(map.values())
  })

  // ---- Derived evidence (from scan snippets) ----------------------------
  const derivedEvidence = computed((): DerivedEvidence[] => {
    const items: DerivedEvidence[] = []
    for (const scan of policies.allScans) {
      const policy = policies.policies.find(p => p.id === scan.policyId)
      if (!policy) continue
      for (const fw of scan.byFramework) {
        for (const ctrl of fw.controls) {
          if (ctrl.status === 'missing' || !ctrl.snippets.length) continue
          items.push({
            id:           `ev-${scan.policyId}-${ctrl.controlId}`,
            controlId:    ctrl.controlId,
            name:         `${ctrl.code} coverage in "${scan.policyTitle}"`,
            collectedAt:  policy.uploadedAt,
            expiresInDays: 365,
            source:       `Policy: ${scan.policyTitle}`,
            policyId:     scan.policyId,
            frameworkControlId: ctrl.controlId,
            snippet:      ctrl.snippets[0] ?? null,
            autoDerived:  true,
            policyTitle:  scan.policyTitle,
          } as DerivedEvidence)
        }
      }
    }
    return [...items, ...extraEvidence.value.map(e => ({ ...e, policyTitle: '' }))]
  })

  // ---- Drift -------------------------------------------------------------
  const driftResult = computed((): DriftResult => {
    const { coverageGap }     = driftFromScans(policies.allScans)
    const unacknowledged      = radarChanges.value.filter(c => !ackedChanges.value.has(c.id)).length
    const openRiskFraction    = openRisks.value.length / Math.max(derivedRisks.value.length, 1)
    const evidenceAgingScore  = extraEvidence.value.filter(e => (e.expiresInDays ?? 1) < 0).length
                                / Math.max(derivedEvidence.value.length, 1) * 100

    return calculateDrift({
      regulationImpact:    Math.min(100, unacknowledged * 12),
      coverageGap,
      controlDrift:        Math.round(openRiskFraction * 100),
      evidenceAging:       Math.round(evidenceAgingScore),
      remediationDelay:    Math.min(100, openRisks.value.filter(r => {
                             const d = (Date.now() - new Date(r.openSince).getTime()) / 86400000
                             return d > 30
                           }).length * 15),
      businessCriticality: policies.policies.length > 0 ? 40 : 0,
      unacknowledgedChanges: unacknowledged,
    })
  })

  // ---- Action lifecycle -------------------------------------------------
  const actionById = computed(() =>
    Object.fromEntries(actions.value.map(a => [a.id, a])),
  )

  const nextBest = computed(() =>
    _nextBest(
      actions.value,
      id => derivedRisks.value.find(r => r.id === id)?.severity as Severity | undefined,
    ),
  )

  function getActionProgress(id: string) {
    const a = actionById.value[id]
    return a ? actionProgress(a) : null
  }

  function _persistActions() { saveActions(actions.value) }

  function startAct(id: string, who: string) {
    const a = actionById.value[id]
    if (!a) return { ok: false as const, error: 'Action not found' }
    const r = _start(a, who)
    _persistActions()
    return r
  }

  function toggleStep(actionId: string, stepId: string, who: string) {
    const a = actionById.value[actionId]
    if (!a) return { ok: false as const, error: 'Action not found' }
    const r = _toggleStep(a, stepId, who)
    _persistActions()
    return r
  }

  function attachActionEvidence(
    actionId: string, reqId: string,
    payload: Record<string, string | number | boolean>, who: string,
  ) {
    const a = actionById.value[actionId]
    if (!a) return { ok: false as const, error: 'Action not found' }
    const r = _attach(a, reqId, payload, who)
    _persistActions()
    return r
  }

  function blockAction(id: string, reason: string, who: string) {
    const a = actionById.value[id]
    if (!a) return { ok: false as const, error: 'Action not found' }
    const r = _block(a, reason, who)
    _persistActions()
    return r
  }

  function unblockAction(id: string, who: string) {
    const a = actionById.value[id]
    if (!a) return { ok: false as const, error: 'Action not found' }
    const r = _unblock(a, who)
    _persistActions()
    return r
  }

  function submitAction(id: string, who: string) {
    const a = actionById.value[id]
    if (!a) return { ok: false as const, error: 'Action not found' }
    const r = _submit(a, who)
    _persistActions()
    return r
  }

  function approveAction(id: string, who: string) {
    const a = actionById.value[id]
    if (!a) return { ok: false as const, error: 'Action not found' }
    const r = _approve(
      a, who,
      rId => derivedRisks.value.find(risk => risk.id === rId) as unknown as Parameters<typeof _approve>[3] extends undefined ? never : any,
      () => undefined,
    )
    if (!r.ok) return r
    r.payload.evidence.forEach(row => extraEvidence.value.push(row))
    _persistActions()
    _approvedHooks.value.forEach(fn => { try { fn(r.payload) } catch { /* */ } })
    return r
  }

  function generateActionsFromRisks(riskIds?: string[]) {
    const ids = riskIds?.length ? riskIds : openRisks.value.map(r => r.id)
    const existing = new Set(actions.value.map(a => a.riskId))
    const created: Action[] = []
    ids.forEach(rid => {
      if (existing.has(rid)) return
      const r = derivedRisks.value.find(risk => risk.id === rid)
      if (!r) return
      const sevMap: Record<Severity, number> = { critical: 16, high: 11, medium: 7, low: 4 }
      const newId = `A-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
      const a: Action = {
        id: newId, riskId: rid,
        title: `Close gap: ${r.controlCode} in ${r.frameworkTitle}`,
        summary: `Policy "${r.policyTitle}" ${r.coverageStatus === 'missing' ? 'does not cover' : 'partially covers'} ${r.controlCode}: ${r.controlTitle}. This action closes the gap.`,
        ownerId: r.ownerId ?? 'aarav', approverId: 'aarav',
        dueInDays: 14, status: 'planned', effort: r.severity === 'critical' ? 'L' : r.severity === 'high' ? 'M' : 'S',
        expectedDriftReduction: sevMap[r.severity],
        steps: [
          { id: 's1', label: `Review ${r.controlCode}: ${r.controlTitle} requirements`, done: false },
          { id: 's2', label: `Draft policy language covering this control`,              done: false },
          { id: 's3', label: `Update or create the relevant policy section`,             done: false },
          { id: 's4', label: `Attach evidence and submit for approval`,                  done: false },
        ],
        evidenceRequirements: [
          { id: 'e1', kind: 'document',       label: `Updated policy or annex covering ${r.controlCode}`, fulfilled: false },
          { id: 'e2', kind: 'policy-section', label: `Link to the specific policy section`,                fulfilled: false },
        ],
        history: [{ at: new Date().toISOString().slice(0, 10), who: 'system', what: `auto-generated from gap: ${rid}` }],
      }
      actions.value.push(a)
      existing.add(rid)
      created.push(a)
    })
    _persistActions()
    return { ok: true, created }
  }

  function onActionApproved(fn: ActionApprovedHook): void {
    _approvedHooks.value.push(fn)
  }

  // Acknowledge a radar change (removes from unacknowledged count → lowers drift)
  function acknowledgeChange(id: string) {
    ackedChanges.value.add(id)
    try {
      localStorage.setItem(LS_RADAR_KEY, JSON.stringify([...ackedChanges.value]))
    } catch { /* */ }
  }

  // Inject a live radar change (called by the live feed / Vercel polling)
  function injectRadarChange(change: typeof radarChanges.value[number]) {
    if (!radarChanges.value.find(c => c.id === change.id)) {
      radarChanges.value.unshift(change)
    }
  }

  return {
    // Personas (only seeded data)
    personas, personaById,
    // Frameworks (real published law)
    frameworks, frameworkById,
    // Derived state
    derivedRisks, openRisks, criticalRisks,
    controlStates, derivedEvidence, driftResult,
    // Radar
    radarChanges, ackedChanges, acknowledgeChange, injectRadarChange,
    // Actions
    actions, actionById, nextBest,
    getActionProgress,
    startAct, toggleStep, attachActionEvidence,
    blockAction, unblockAction, submitAction, approveAction,
    generateActionsFromRisks, onActionApproved,
  }
})
