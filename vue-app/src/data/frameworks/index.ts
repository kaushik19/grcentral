/**
 * Aggregates all framework JSON files into a single typed collection.
 * This is NOT mock data — it is the actual text of public EU/NIST law,
 * used as the reference corpus against which uploaded policies are scanned.
 */
import gdpr    from './gdpr.json'
import aiAct   from './ai-act.json'
import nis2    from './nis2.json'
import dora    from './dora.json'
import nistCsf from './nist-csf.json'
import cra     from './cra.json'
import type { Severity } from '@/types'

export interface FrameworkControl {
  id:       string
  code:     string
  title:    string
  severity: Severity
  summary:  string
  keywords: string[]
}

export interface Framework {
  id:            string
  title:         string
  shortTitle:    string
  celex:         string | null
  eli:           string | null
  jurisdiction:  string
  enactedDate:   string
  effectiveDate: string
  sourceUrl:     string
  topics:        string[]
  controls:      FrameworkControl[]
}

// Cast raw JSON — severities are typed strings in the JSON
const FRAMEWORKS: Framework[] = [
  gdpr, aiAct, nis2, dora, nistCsf, cra,
].map(f => ({
  ...f,
  controls: f.controls.map(c => ({
    ...c,
    severity: c.severity as Severity,
  })),
}))

export default FRAMEWORKS

/** Look up a single framework by id */
export function getFramework(id: string): Framework | undefined {
  return FRAMEWORKS.find(f => f.id === id)
}

/** Flat list of all controls across all frameworks, each annotated with regId */
export function allControls(): Array<FrameworkControl & { regId: string }> {
  return FRAMEWORKS.flatMap(f =>
    f.controls.map(c => ({ ...c, regId: f.id })),
  )
}

/** Total control count */
export const TOTAL_CONTROLS = FRAMEWORKS.reduce((s, f) => s + f.controls.length, 0)
