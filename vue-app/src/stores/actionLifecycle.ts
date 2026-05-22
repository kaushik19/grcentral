/**
 * Pure action-lifecycle functions.
 * These operate on plain object references and emit an `ApprovalPayload` via
 * a returned value — no side-effects, no imports from Vue or Pinia.
 * The store wraps them and handles reactivity + toasts.
 */
import type {
  Action, ActionProgress, ActionStatus, Evidence,
  Control, Risk, EvidenceKind, Severity,
} from '@/types'

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 1.6, high: 1.3, medium: 1.0, low: 0.7,
}

export function actionProgress(a: Action): ActionProgress {
  const sDone = a.steps.filter(s => s.done).length
  const eDone = a.evidenceRequirements.filter(r => r.fulfilled).length
  const total = a.steps.length + a.evidenceRequirements.length
  const done  = sDone + eDone
  return {
    stepsDone:     sDone,
    stepsTotal:    a.steps.length,
    evidenceDone:  eDone,
    evidenceTotal: a.evidenceRequirements.length,
    percent:       total === 0 ? 0 : Math.round((done / total) * 100),
    complete:      total > 0 && done === total,
  }
}

export function nextBestAction(
  actions: Action[],
  riskBySeverity: (riskId: string) => Severity | undefined,
): Action | null {
  const open = actions.filter(a =>
    a.status === 'planned' || a.status === 'in-progress' || a.status === 'blocked',
  )
  if (!open.length) return null
  return [...open].sort((a, b) => {
    const wa = SEVERITY_WEIGHT[riskBySeverity(a.riskId) ?? 'medium']
    const wb = SEVERITY_WEIGHT[riskBySeverity(b.riskId) ?? 'medium']
    const sa = (a.expectedDriftReduction ?? 0) * wa
    const sb = (b.expectedDriftReduction ?? 0) * wb
    return sb !== sa ? sb - sa : (a.dueInDays ?? 999) - (b.dueInDays ?? 999)
  })[0]
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
function logHistory(a: Action, who: string, what: string): void {
  a.history.push({ at: today(), who, what })
}

export type LifecycleResult<T = Action> =
  | { ok: true; action: T }
  | { ok: false; error: string }

export function startAction(a: Action, who: string): LifecycleResult {
  if (a.status === 'done') return { ok: false, error: 'Action already done' }
  if (a.status === 'planned' || a.status === 'blocked') {
    a.status = 'in-progress'
    delete (a as Partial<Action>).blockedReason
    a.startedAt = a.startedAt ?? today()
    logHistory(a, who, 'started the action')
  }
  return { ok: true, action: a }
}

export function toggleActionStep(
  a: Action, stepId: string, who: string,
): { ok: boolean; error?: string; step?: Action['steps'][number] } {
  if (a.status === 'done') return { ok: false, error: 'Cannot edit a completed action' }
  const step = a.steps.find(s => s.id === stepId)
  if (!step) return { ok: false, error: 'Step not found' }
  step.done = !step.done
  if (step.done) {
    step.doneAt = today()
    step.doneBy = who
    logHistory(a, who, `completed step "${step.label}"`)
    if (a.status === 'planned') {
      a.status = 'in-progress'
      a.startedAt = a.startedAt ?? today()
      logHistory(a, who, 'started the action')
    }
  } else {
    delete step.doneAt
    delete step.doneBy
    logHistory(a, who, `re-opened step "${step.label}"`)
  }
  return { ok: true, step }
}

type AttachPayload = Record<string, string | number | boolean>

export function attachEvidence(
  a: Action, reqId: string, payload: AttachPayload, who: string,
): { ok: boolean; error?: string; req?: Action['evidenceRequirements'][number] } {
  if (a.status === 'done') return { ok: false, error: 'Cannot edit a completed action' }
  const req = a.evidenceRequirements.find(r => r.id === reqId)
  if (!req) return { ok: false, error: 'Evidence requirement not found' }

  const kind: EvidenceKind = req.kind
  if (kind === 'link' && (!payload.url || !/^https?:\/\//i.test(String(payload.url))))
    return { ok: false, error: 'A http(s) URL is required' }
  if (kind === 'confirmation' && (!payload.text || String(payload.text).trim().length < 3))
    return { ok: false, error: 'Type at least a few words to confirm' }
  if (kind === 'policy-section' && !payload.policyId)
    return { ok: false, error: 'Pick a policy section' }
  if (kind === 'document' && !payload.fileName)
    return { ok: false, error: 'Attach a file' }

  req.fulfilled = true
  req.fulfilledAt = today()
  req.fulfilledBy = who
  req.payload = { ...payload }
  logHistory(a, who, `attached evidence for "${req.label}"`)
  if (a.status === 'planned') {
    a.status = 'in-progress'
    a.startedAt = a.startedAt ?? today()
    logHistory(a, who, 'started the action')
  }
  return { ok: true, req }
}

export function markBlocked(
  a: Action, reason: string, who: string,
): LifecycleResult {
  if (a.status === 'done') return { ok: false, error: 'Action already done' }
  if (!reason?.trim() || reason.trim().length < 3)
    return { ok: false, error: 'Tell us why this is blocked' }
  a.status = 'blocked'
  a.blockedReason = reason.trim()
  logHistory(a, who, `marked the action blocked: ${a.blockedReason}`)
  return { ok: true, action: a }
}

export function unblock(a: Action, who: string): LifecycleResult {
  if (a.status !== 'blocked') return { ok: false, error: 'Action is not blocked' }
  a.status = 'in-progress'
  delete (a as Partial<Action>).blockedReason
  logHistory(a, who, 'un-blocked the action')
  return { ok: true, action: a }
}

export function submitForReview(a: Action, who: string): LifecycleResult {
  if (a.status === 'done')   return { ok: false, error: 'Action already done' }
  if (a.status === 'review') return { ok: false, error: 'Action already in review' }
  const prog = actionProgress(a)
  if (!prog.complete) {
    return {
      ok: false,
      error: `Finish ${prog.stepsTotal - prog.stepsDone} step(s) and ${prog.evidenceTotal - prog.evidenceDone} evidence requirement(s) before submitting`,
    }
  }
  a.status = 'review'
  a.submittedAt = today()
  logHistory(a, who, 'submitted the action for approval')
  return { ok: true, action: a }
}

export interface ApprovalPayload {
  action:       Action
  risk:         Risk | null
  control:      Control | null
  evidence:     Evidence[]
  driftDropped: number
}

export function approve(
  a: Action,
  who: string,
  findRisk:    (id: string) => Risk    | undefined,
  findControl: (id: string) => Control | undefined,
): { ok: true; payload: ApprovalPayload } | { ok: false; error: string } {
  if (a.status === 'done')   return { ok: false, error: 'Action already done' }
  if (a.status !== 'review') return { ok: false, error: 'Only actions in review can be approved' }

  a.status      = 'done'
  a.completedAt = today()
  a.approvedAt  = a.completedAt
  logHistory(a, who, 'approved the action')

  // Close the linked risk
  const risk = findRisk(a.riskId) ?? null
  if (risk) {
    risk.status     = 'closed'
    risk.closedAt   = a.completedAt
    risk.closedById = a.id
  }

  // Drop control drift
  const drop    = a.expectedDriftReduction ?? 0
  const control = risk?.controlId ? (findControl(risk.controlId) ?? null) : null
  if (control) {
    control.drift    = Math.max(0, (control.drift ?? 0) - drop)
    control.maturity = Math.min(100, (control.maturity ?? 0) + Math.round(drop / 2))
  }

  // Write evidence rows
  const writtenEvidence: Evidence[] = []
  const t = today()
  a.evidenceRequirements.forEach((req, idx) => {
    if (!req.fulfilled) return
    const evId = `EV-A-${a.id.replace(/^A-/, '')}-${idx + 1}`
    const row: Evidence = {
      id:           evId,
      controlId:    risk?.controlId ?? null,
      name:         req.label,
      collectedAt:  t,
      expiresInDays: 365,
      source:       `Preventive Action ${a.id}`,
      actionId:     a.id,
      policyId:     req.payload?.policyId ? String(req.payload.policyId) : undefined,
      url:          req.payload?.url      ? String(req.payload.url)      : null,
      note:         req.payload?.text     ? String(req.payload.text)     : (req.payload?.fileName ? String(req.payload.fileName) : null),
      autoDerived:  false,
    }
    writtenEvidence.push(row)
  })

  return { ok: true, payload: { action: a, risk, control, evidence: writtenEvidence, driftDropped: drop } }
}
