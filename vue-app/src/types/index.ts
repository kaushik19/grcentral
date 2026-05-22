/* ============================================================================
   GRCentral – shared domain types
   ============================================================================ */

export type Severity  = 'critical' | 'high' | 'medium' | 'low'
export type Format    = 'pdf' | 'markdown' | 'html' | 'text' | 'link'
export type PolicyStatus  = 'published' | 'draft' | 'under-review'
export type ActionStatus  = 'planned' | 'in-progress' | 'review' | 'done' | 'blocked'
export type EvidenceKind  = 'document' | 'policy-section' | 'link' | 'confirmation'
export type GapType       = 'missing' | 'partial'

// ---- Persona ---------------------------------------------------------------
export interface Persona {
  id: string
  name: string
  role: string
  email: string
  avatar: string        // initials or URL
  primaryView: string
  businessUnitId: string
}

// ---- Regulation / Framework ------------------------------------------------
export interface RegulationArticle {
  id: string
  num: string
  title: string
  status: 'keep' | 'modify' | 'add' | 'remove'
  change?: string
}

export interface Regulation {
  id: string
  title: string
  shortTitle: string
  celex?: string
  jurisdiction: string
  topics: string[]
  articles: RegulationArticle[]
  lastChange?: string
  eli?: string
}

// ---- Framework Control (clause inside a regulation) -----------------------
export interface FrameworkControl {
  id: string
  regId: string       // added on retrieval
  code: string        // e.g. "Art. 32"
  title: string
  severity: Severity
  summary: string
  keywords: string[]
}

// ---- Regulatory Source -----------------------------------------------------
export interface RegSource {
  id: string
  name: string
  url: string
  jurisdiction: string
  type: string
  outputFormat: string
  ingestion: string
  pollInterval: string
  status: 'healthy' | 'degraded' | 'down'
  lastSyncMin: number
  documentsTracked: number
  description: string
}

// ---- Regulatory Change (Radar) ---------------------------------------------
export interface RegChange {
  id: string
  regId: string
  detectedAt: string
  summary: string
  impact: Severity | 'info'
  articleId: string | null
  changeType: 'add' | 'modify' | 'remove'
  live?: boolean
}

// ---- Business Unit ---------------------------------------------------------
export interface BusinessUnit {
  id: string
  name: string
  riskScore: number
  controlMaturity: number
}

// ---- Operational Control ---------------------------------------------------
export interface Control {
  id: string
  name: string
  framework: string
  owner: string         // personaId
  maturity: number      // 0..100
  drift: number         // 0..100
}

// ---- Risk ------------------------------------------------------------------
export interface Risk {
  id: string
  regId: string
  controlId?: string
  frameworkControlId?: string
  title: string
  severity: Severity
  businessUnitId: string
  ownerId: string
  openSince: string
  remediationDueDays: number
  status?: 'open' | 'closed'
  closedAt?: string
  closedById?: string   // action id that closed this risk
  sourcePolicyId?: string
  policyId?: string
  gapType?: GapType
}

// ---- Evidence --------------------------------------------------------------
export interface Evidence {
  id: string
  controlId: string | null
  name: string
  collectedAt: string | null
  expiresInDays: number | null
  source: string
  auto?: boolean
  policyId?: string
  frameworkControlId?: string
  sectionRef?: string
  snippet?: string
  actionId?: string
  url?: string | null
  note?: string | null
  autoDerived?: boolean
}

// ---- Internal Policy -------------------------------------------------------
export interface PolicySection {
  id: string
  num: string
  title: string
  body: string
}

export interface Policy {
  id: string
  title: string
  version: string
  status: PolicyStatus
  format: Format
  ownerId?: string
  approverId?: string
  description?: string
  mapsToRegulations: string[]
  implementedByControls: string[]
  tags: string[]
  reviewDate?: string
  nextReviewDate?: string
  source: 'seeded' | 'uploaded' | 'server'
  hasFile?: boolean
  fileUrl?: string
  uploadedAt?: string
  sections?: PolicySection[]
}

// ---- Preventive Action -----------------------------------------------------
export interface ActionStep {
  id: string
  label: string
  done: boolean
  doneAt?: string
  doneBy?: string
}

export interface EvidenceRequirement {
  id: string
  kind: EvidenceKind
  label: string
  fulfilled: boolean
  fulfilledAt?: string
  fulfilledBy?: string
  payload?: Record<string, string | number | boolean>
}

export interface ActionHistoryEntry {
  at: string
  who: string
  what: string
}

export interface Action {
  id: string
  riskId: string
  title: string
  summary: string
  ownerId: string
  approverId: string
  dueInDays: number
  status: ActionStatus
  effort: 'S' | 'M' | 'L'
  expectedDriftReduction: number
  steps: ActionStep[]
  evidenceRequirements: EvidenceRequirement[]
  history: ActionHistoryEntry[]
  blockedReason?: string
  startedAt?: string
  submittedAt?: string
  completedAt?: string
  approvedAt?: string
}

export interface ActionProgress {
  stepsDone: number
  stepsTotal: number
  evidenceDone: number
  evidenceTotal: number
  percent: number
  complete: boolean
}

// ---- Compliance Scan -------------------------------------------------------
export interface FrameworkControlCoverage {
  fcId: string
  code: string
  title: string
  severity: Severity
  summary: string
  status: 'compliant' | 'partial' | 'missing'
  evidenceRefs: string[]
  evidenceSnippets: string[]
}

export interface FrameworkScanBlock {
  regId: string
  name: string
  total: number
  compliant: number
  partial: number
  missing: number
  coveragePct: number
  controls: FrameworkControlCoverage[]
}

export interface ComplianceScan {
  byFramework: FrameworkScanBlock[]
  summary: {
    totalControls: number
    compliantControls: number
    partialControls: number
    missingControls: number
    coveragePct: number
  }
  evidenceItems: Omit<Evidence, 'id'>[]
}

// ---- Drift history ---------------------------------------------------------
export interface DriftPoint {
  date: string    // YYYY-MM-DD
  score: number
}
