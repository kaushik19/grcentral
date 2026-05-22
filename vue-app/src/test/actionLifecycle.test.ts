/**
 * Vitest – Action lifecycle unit tests
 * These test the pure functions in actionLifecycle.ts with zero DOM/Vue deps.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  actionProgress, nextBestAction,
  startAction, toggleActionStep, attachEvidence,
  markBlocked, unblock, submitForReview, approve,
} from '../stores/actionLifecycle'
import type { Action, Risk, Control } from '../types'

function makeAction(overrides: Partial<Action> = {}): Action {
  return {
    id: 'A-TEST', riskId: 'R-TEST',
    title: 'Test action', summary: 'Test',
    ownerId: 'priya', approverId: 'aarav',
    dueInDays: 7, status: 'planned', effort: 'M',
    expectedDriftReduction: 10,
    steps: [
      { id: 's1', label: 'Step one', done: false },
      { id: 's2', label: 'Step two', done: false },
    ],
    evidenceRequirements: [
      { id: 'e1', kind: 'document',     label: 'Upload doc',    fulfilled: false },
      { id: 'e2', kind: 'confirmation', label: 'Confirm it',    fulfilled: false },
    ],
    history: [],
    ...overrides,
  }
}

function makeRisk(): Risk {
  return {
    id: 'R-TEST', regId: 'reg-gdpr', controlId: 'C-DP-014',
    title: 'Test risk', severity: 'high',
    businessUnitId: 'bu-cloud', ownerId: 'vikram',
    openSince: '2026-05-01', remediationDueDays: 10, status: 'open',
  }
}

function makeControl(): Control {
  return { id: 'C-DP-014', name: 'Encryption at rest', framework: 'GDPR', owner: 'vikram', maturity: 64, drift: 14 }
}

describe('actionProgress', () => {
  it('returns 0% when nothing is done', () => {
    const p = actionProgress(makeAction())
    expect(p.percent).toBe(0)
    expect(p.complete).toBe(false)
  })

  it('returns 50% when half done', () => {
    const a = makeAction()
    a.steps[0].done = true
    a.evidenceRequirements[0].fulfilled = true
    const p = actionProgress(a)
    expect(p.percent).toBe(50)
  })

  it('returns complete=true when all done', () => {
    const a = makeAction()
    a.steps.forEach(s => { s.done = true })
    a.evidenceRequirements.forEach(r => { r.fulfilled = true })
    expect(actionProgress(a).complete).toBe(true)
  })
})

describe('nextBestAction', () => {
  it('returns null for empty list', () => {
    expect(nextBestAction([], () => undefined)).toBeNull()
  })

  it('ranks by expectedDriftReduction × severityWeight', () => {
    const a1 = makeAction({ id: 'A1', riskId: 'R1', expectedDriftReduction: 5 })
    const a2 = makeAction({ id: 'A2', riskId: 'R2', expectedDriftReduction: 18 })
    const a3 = makeAction({ id: 'A3', riskId: 'R3', expectedDriftReduction: 10 })
    const nb = nextBestAction([a1, a2, a3], () => 'medium')
    expect(nb?.id).toBe('A2')
  })

  it('ignores done actions', () => {
    const a1 = makeAction({ id: 'A1', expectedDriftReduction: 100, status: 'done' })
    const a2 = makeAction({ id: 'A2', expectedDriftReduction: 5 })
    expect(nextBestAction([a1, a2], () => 'low')?.id).toBe('A2')
  })
})

describe('startAction', () => {
  it('transitions planned → in-progress', () => {
    const a = makeAction()
    const r = startAction(a, 'priya')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.action.status).toBe('in-progress')
    expect(r.action.startedAt).toBeTruthy()
    expect(r.action.history.some(h => /started/.test(h.what))).toBe(true)
  })

  it('rejects if already done', () => {
    const a = makeAction({ status: 'done' })
    expect(startAction(a, 'priya').ok).toBe(false)
  })
})

describe('toggleActionStep', () => {
  it('marks step done and auto-starts planned action', () => {
    const a = makeAction()
    const r = toggleActionStep(a, 's1', 'priya')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.step?.done).toBe(true)
    expect(a.status).toBe('in-progress')
  })

  it('can toggle off again', () => {
    const a = makeAction({ status: 'in-progress' })
    toggleActionStep(a, 's1', 'priya')
    const r = toggleActionStep(a, 's1', 'priya')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.step?.done).toBe(false)
    expect(r.step?.doneAt).toBeUndefined()
  })
})

describe('attachEvidence', () => {
  it('accepts a document payload', () => {
    const a = makeAction({ status: 'in-progress' })
    const r = attachEvidence(a, 'e1', { fileName: 'audit.pdf', fileSize: 1234 }, 'priya')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.req?.fulfilled).toBe(true)
  })

  it('accepts a confirmation payload', () => {
    const a = makeAction({ status: 'in-progress' })
    const r = attachEvidence(a, 'e2', { text: 'confirmed it is done' }, 'priya')
    expect(r.ok).toBe(true)
  })

  it('rejects short confirmation text', () => {
    const a = makeAction({ status: 'in-progress' })
    expect(attachEvidence(a, 'e2', { text: 'ok' }, 'priya').ok).toBe(false)
  })

  it('rejects non-http link', () => {
    const a = makeAction({ status: 'in-progress', evidenceRequirements: [{ id: 'e1', kind: 'link', label: 'URL', fulfilled: false }] })
    expect(attachEvidence(a, 'e1', { url: 'javascript:alert(1)' }, 'priya').ok).toBe(false)
  })

  it('accepts a valid https link', () => {
    const a = makeAction({ status: 'in-progress', evidenceRequirements: [{ id: 'e1', kind: 'link', label: 'URL', fulfilled: false }] })
    expect(attachEvidence(a, 'e1', { url: 'https://pagerduty.example/team' }, 'priya').ok).toBe(true)
  })
})

describe('markBlocked + unblock', () => {
  it('sets status to blocked with reason', () => {
    const a = makeAction({ status: 'in-progress' })
    const r = markBlocked(a, 'Waiting on legal', 'priya')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.action.status).toBe('blocked')
    expect(r.action.blockedReason).toMatch(/legal/)
  })

  it('rejects empty reason', () => {
    const a = makeAction()
    expect(markBlocked(a, '', 'priya').ok).toBe(false)
  })

  it('unblock returns to in-progress', () => {
    const a = makeAction({ status: 'blocked', blockedReason: 'reason' })
    const r = unblock(a, 'priya')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.action.status).toBe('in-progress')
    expect(r.action.blockedReason).toBeUndefined()
  })
})

describe('submitForReview + approve end-to-end', () => {
  let a: Action

  beforeEach(() => {
    a = makeAction({ status: 'in-progress' })
    // Complete everything
    a.steps.forEach(s => { s.done = true })
    a.evidenceRequirements.forEach(r => {
      r.fulfilled   = true
      r.fulfilledAt = '2026-05-20'
      r.fulfilledBy = 'priya'
      r.payload     = { fileName: 'proof.pdf', fileSize: 100 }
    })
  })

  it('submit refused when not complete', () => {
    const incomplete = makeAction({ status: 'in-progress' })
    expect(submitForReview(incomplete, 'priya').ok).toBe(false)
  })

  it('submit succeeds at 100%', () => {
    const r = submitForReview(a, 'priya')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.action.status).toBe('review')
    expect(r.action.submittedAt).toBeTruthy()
  })

  it('approve closes risk + drops drift + writes evidence', () => {
    submitForReview(a, 'priya')
    const risk    = makeRisk()
    const control = makeControl()
    const beforeDrift = control.drift

    const res = approve(
      a, 'aarav',
      id => id === 'R-TEST' ? risk    : undefined,
      id => id === 'C-DP-014' ? control : undefined,
    )

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(a.status).toBe('done')
    expect(risk.status).toBe('closed')
    expect(control.drift).toBeLessThan(beforeDrift)
    expect(res.payload.evidence.length).toBeGreaterThan(0)
    expect(res.payload.evidence[0].actionId).toBe('A-TEST')
    expect(res.payload.driftDropped).toBe(10)
  })

  it('re-approval is rejected', () => {
    submitForReview(a, 'priya')
    approve(a, 'aarav', () => undefined, () => undefined)
    expect(approve(a, 'aarav', () => undefined, () => undefined).ok).toBe(false)
  })
})
