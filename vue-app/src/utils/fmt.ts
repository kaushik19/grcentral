import type { Severity } from '@/types'

/** Format a UTC ISO string as a relative "2h ago" label. */
export function fmtAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts)
  if (diff < 60_000)  return 'just now'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago'
  return Math.floor(diff / 86_400_000) + 'd ago'
}

/** Return a Tailwind colour token pair for a severity band. */
export function severityColour(s: Severity): { bg: string; text: string; border: string } {
  switch (s) {
    case 'critical': return { bg: 'bg-rose-500/15',   text: 'text-rose-300',    border: 'border-rose-500/40' }
    case 'high':     return { bg: 'bg-amber-500/15',  text: 'text-amber-300',   border: 'border-amber-500/40' }
    case 'medium':   return { bg: 'bg-violet-500/15', text: 'text-violet-300',  border: 'border-violet-500/40' }
    default:         return { bg: 'bg-white/5',       text: 'text-white/60',    border: 'border-white/10' }
  }
}

/** Drift score → colour token. */
export function driftBandColour(score: number): string {
  if (score >= 80) return '#fb7185'
  if (score >= 60) return '#fbbf24'
  if (score >= 40) return '#a78bfa'
  return '#34d399'
}

/** Drift score → label */
export function driftBandLabel(score: number): string {
  if (score >= 80) return 'Critical'
  if (score >= 60) return 'High'
  if (score >= 40) return 'Elevated'
  return 'Managed'
}

/** ISO date → "12 May 2026" */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
