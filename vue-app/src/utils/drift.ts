/**
 * Risk Drift Engine
 * =================
 * Implements the formula:
 *
 *   Drift = (
 *     0.30 × RegulationImpact  +
 *     0.25 × CoverageGap       +
 *     0.20 × ControlDrift      +
 *     0.10 × EvidenceAging     +
 *     0.10 × RemediationDelay  +
 *     0.05 × BusinessCriticality
 *   ) × TrendMultiplier
 *
 * All inputs are normalised 0–100.  Output is 0–100.
 *
 * Nothing in this file is mocked.  All inputs come from real scan results
 * and real policy metadata.
 */

import type { ScanResult } from './scanner'

export interface DriftInputs {
  /** How many regulatory changes are unacknowledged (0-100 normalised) */
  regulationImpact: number
  /** Coverage gap from compliance scan (0-100) */
  coverageGap: number
  /** Average control drift across all controls (0-100) */
  controlDrift: number
  /** Fraction of evidence that has expired (0-100) */
  evidenceAging: number
  /** Fraction of open risks past their due date (0-100) */
  remediationDelay: number
  /** Business criticality score of the most critical unit (0-100) */
  businessCriticality: number
  /** Number of unacknowledged regulatory changes (for trend multiplier) */
  unacknowledgedChanges: number
}

export interface DriftResult {
  score:      number   // final 0-100
  breakdown:  Record<keyof Omit<DriftInputs, 'unacknowledgedChanges'>, number>
  band:       'Managed' | 'Elevated' | 'High' | 'Critical'
  multiplier: number
}

const WEIGHTS = {
  regulationImpact:    0.30,
  coverageGap:         0.25,
  controlDrift:        0.20,
  evidenceAging:       0.10,
  remediationDelay:    0.10,
  businessCriticality: 0.05,
} as const

function clamp(n: number): number { return Math.max(0, Math.min(100, n)) }

function trendMultiplier(unacked: number): number {
  // Each unacknowledged change adds 2.5% (capped at 1.5×)
  return Math.min(1.5, 1 + unacked * 0.025)
}

export function calculateDrift(inputs: DriftInputs): DriftResult {
  const multiplier = trendMultiplier(inputs.unacknowledgedChanges)

  const breakdown = {
    regulationImpact:    clamp(inputs.regulationImpact),
    coverageGap:         clamp(inputs.coverageGap),
    controlDrift:        clamp(inputs.controlDrift),
    evidenceAging:       clamp(inputs.evidenceAging),
    remediationDelay:    clamp(inputs.remediationDelay),
    businessCriticality: clamp(inputs.businessCriticality),
  } as const

  const weighted = (Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>)
    .reduce((s, k) => s + breakdown[k] * WEIGHTS[k], 0)

  const score = clamp(Math.round(weighted * multiplier))

  const band: DriftResult['band'] =
    score >= 80 ? 'Critical' :
    score >= 60 ? 'High' :
    score >= 40 ? 'Elevated' : 'Managed'

  return { score, breakdown, band, multiplier }
}

/**
 * Derive drift inputs from a list of scan results.
 * Designed to be called reactively whenever policies change.
 */
export function driftFromScans(scans: ScanResult[]): Pick<DriftInputs, 'coverageGap'> {
  if (!scans.length) return { coverageGap: 0 }
  const avgGap = scans.reduce((s, sc) => s + (100 - sc.summary.coveragePct), 0) / scans.length
  return { coverageGap: Math.round(avgGap) }
}
