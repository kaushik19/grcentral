/**
 * Compliance Scanner
 * ==================
 * Given the text of an uploaded policy document, scans it against every
 * control in every loaded framework and classifies each control as:
 *
 *   compliant  — policy text has strong, explicit coverage
 *   partial    — some matching keywords but coverage is thin
 *   missing    — no meaningful coverage found
 *
 * This is a heuristic lexical approach (no LLM required), robust enough for
 * a GRC demo and production-pilot phase. The scoring logic can be swapped for
 * an embeddings-based approach without changing the public API.
 *
 * Public API
 * ----------
 *   scanPolicy(policyText, policyId, policyTitle) → ScanResult
 */

import FRAMEWORKS, { type FrameworkControl, type Framework } from '@/data/frameworks'
import type { Severity } from '@/types'

// ---- types -----------------------------------------------------------------

export type CoverageStatus = 'compliant' | 'partial' | 'missing'

export interface ControlCoverage {
  controlId:   string
  code:        string
  title:       string
  severity:    Severity
  status:      CoverageStatus
  score:       number          // 0–100 raw match score
  matchedTerms: string[]
  snippets:    string[]        // up to 2 short excerpts from policy text
}

export interface FrameworkScan {
  frameworkId:   string
  frameworkTitle: string
  total:         number
  compliant:     number
  partial:       number
  missing:       number
  coveragePct:   number
  controls:      ControlCoverage[]
}

export interface ScanResult {
  policyId:    string
  policyTitle: string
  scannedAt:   string
  byFramework: FrameworkScan[]
  summary: {
    totalControls:     number
    compliantControls: number
    partialControls:   number
    missingControls:   number
    coveragePct:       number
  }
}

// ---- helpers ----------------------------------------------------------------

const SENTENCE_RE = /[^.!?\n]{20,200}[.!?\n]/g

/** Tokenise policy text into lowercase words for matching */
function tokenise(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ')
}

/** Normalise a keyword the same way we normalise the text */
function normaliseKw(kw: string): string {
  return kw.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Extract up to 2 sentences that contain any of the matched terms */
function extractSnippets(text: string, terms: string[], max = 2): string[] {
  const sentences = text.match(SENTENCE_RE) ?? []
  const found: string[] = []
  for (const sent of sentences) {
    if (found.length >= max) break
    const low = sent.toLowerCase()
    if (terms.some(t => low.includes(t.toLowerCase()))) {
      found.push(sent.trim().slice(0, 200))
    }
  }
  return found
}

/**
 * Score a single control against the policy text.
 *
 * Scoring rubric:
 *  - Each keyword hit contributes (15 / keywordCount) points
 *  - Control title words found add up to 20 points
 *  - Control code (e.g. "Art. 32") found in text adds 25 points
 *  - Maximum possible: 100
 */
function scoreControl(
  control: FrameworkControl,
  tokenisedText: string,
  rawText: string,
): { score: number; matchedTerms: string[] } {
  const matched: string[] = []
  let score = 0

  const perKw = Math.min(15, Math.round(60 / Math.max(control.keywords.length, 1)))

  // Keyword matches — normalise the keyword the same way as the text
  for (const kw of control.keywords) {
    const normKw = normaliseKw(kw)
    const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp('\\b' + escaped + '\\b')
    if (re.test(tokenisedText)) {
      score += perKw
      matched.push(kw)
    }
  }

  // Title word matches (bonus)
  const titleWords = control.title
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 4)
  const titleHits = titleWords.filter(w => tokenisedText.includes(w)).length
  score += Math.round((titleHits / Math.max(titleWords.length, 1)) * 20)

  // Article/code reference
  const codeSearch = control.code.toLowerCase().replace('.', '\\.')
  if (new RegExp(codeSearch).test(rawText.toLowerCase())) {
    score += 25
    if (!matched.includes(control.code)) matched.push(control.code)
  }

  return { score: Math.min(100, score), matchedTerms: matched }
}

function classify(score: number): CoverageStatus {
  if (score >= 55) return 'compliant'
  if (score >= 22) return 'partial'
  return 'missing'
}

// ---- main export -----------------------------------------------------------

export function scanPolicy(
  policyText: string,
  policyId: string,
  policyTitle: string,
): ScanResult {
  const tokenised = tokenise(policyText)
  const now = new Date().toISOString()

  let totalControls = 0
  let compliantControls = 0
  let partialControls = 0
  let missingControls = 0

  const byFramework: FrameworkScan[] = FRAMEWORKS.map((fw: Framework) => {
    const controls: ControlCoverage[] = fw.controls.map(ctrl => {
      const { score, matchedTerms } = scoreControl(ctrl, tokenised, policyText)
      const status = classify(score)
      const snippets = status !== 'missing'
        ? extractSnippets(policyText, matchedTerms)
        : []

      totalControls++
      if      (status === 'compliant') compliantControls++
      else if (status === 'partial')   partialControls++
      else                             missingControls++

      return { controlId: ctrl.id, code: ctrl.code, title: ctrl.title, severity: ctrl.severity, status, score, matchedTerms, snippets }
    })

    const compliant = controls.filter(c => c.status === 'compliant').length
    const partial   = controls.filter(c => c.status === 'partial').length
    const missing   = controls.filter(c => c.status === 'missing').length
    const coveragePct = Math.round(((compliant + partial * 0.5) / Math.max(controls.length, 1)) * 100)

    return {
      frameworkId:    fw.id,
      frameworkTitle: fw.shortTitle,
      total:          controls.length,
      compliant, partial, missing,
      coveragePct,
      controls,
    }
  })

  return {
    policyId,
    policyTitle,
    scannedAt: now,
    byFramework,
    summary: {
      totalControls,
      compliantControls,
      partialControls,
      missingControls,
      coveragePct: Math.round(
        ((compliantControls + partialControls * 0.5) / Math.max(totalControls, 1)) * 100,
      ),
    },
  }
}

/**
 * Derive the risk score contribution from a scan result.
 * Used by the drift engine.
 */
export function scanToRiskScore(scan: ScanResult): number {
  const { missingControls, partialControls, totalControls } = scan.summary
  if (totalControls === 0) return 0
  return Math.round(((missingControls + partialControls * 0.5) / totalControls) * 100)
}
