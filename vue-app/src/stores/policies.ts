/**
 * Policy store
 * ============
 * Manages uploaded policy documents.
 * - On the client: policy metadata is persisted to localStorage.
 * - File bodies: sent to /api/policies (Vercel Blob) when available,
 *   otherwise kept as a base64 data-URL in localStorage (dev mode).
 *
 * After a policy is saved, its text content is scanned by the compliance
 * scanner and the scan result is stored so the risk/gap engines can use it.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { scanPolicy, type ScanResult } from '@/utils/scanner'
import { SEED_POLICY_DOCS } from '@/stores/seedPolicies'

export type PolicyFormat = 'pdf' | 'markdown' | 'html' | 'text'
export type PolicyStatus = 'published' | 'draft' | 'under-review'

export interface StoredPolicy {
  id:          string
  title:       string
  version:     string
  status:      PolicyStatus
  format:      PolicyFormat
  description: string
  tags:        string[]
  uploadedAt:  string
  uploadedBy:  string    // personaId
  /** URL returned by Vercel Blob (or a local data: URL in dev) */
  fileUrl:     string | null
  /** Extracted plain text used for scanning */
  textContent: string
  /** Scan result — computed once on upload and cached */
  scan:        ScanResult | null
  /** Was this persisted to the server? */
  serverSide:  boolean
}

const LS_KEY = 'grcentral:policies:v3'

function loadFromLS(): StoredPolicy[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveToLS(policies: StoredPolicy[]): void {
  try {
    // Don't store large text content or base64 blobs in LS — just metadata + scan
    const slim = policies.map(p => ({
      ...p,
      textContent: p.textContent.slice(0, 4000),   // cap at 4 KB for LS
      fileUrl: p.serverSide ? p.fileUrl : null,     // drop local data-URLs
    }))
    localStorage.setItem(LS_KEY, JSON.stringify(slim))
  } catch { /* storage full — silently ignore */ }
}

/** Build seeded policy entries (scanned eagerly once, cached) */
function buildSeedPolicies(): StoredPolicy[] {
  return SEED_POLICY_DOCS.map(seed => {
    const scan = scanPolicy(seed.textContent, seed.id, seed.title)
    return {
      ...seed,
      fileUrl:    null,
      scan,
      serverSide: false,
    } satisfies StoredPolicy
  })
}

/** Merge LS policies on top of seeds — LS wins for the same id */
function mergeWithSeeds(ls: StoredPolicy[]): StoredPolicy[] {
  const seeds  = buildSeedPolicies()
  const lsIds  = new Set(ls.map(p => p.id))
  const merged = seeds.filter(s => !lsIds.has(s.id))
  return [...merged, ...ls]
}

export const usePolicyStore = defineStore('policies', () => {
  const _ls      = loadFromLS()
  const policies = ref<StoredPolicy[]>(mergeWithSeeds(_ls))
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  // ---- Computed -------------------------------------------------------
  const publishedPolicies = computed(() =>
    policies.value.filter(p => p.status === 'published'),
  )

  const allScans = computed((): ScanResult[] =>
    policies.value.flatMap(p => p.scan ? [p.scan] : []),
  )

  /** Coverage summary across all scanned policies, keyed by framework */
  const aggregateCoverage = computed(() => {
    if (!allScans.value.length) return null
    type FwAcc = { title: string; scores: number[]; compliant: number; partial: number; missing: number }
    const frameworks = new Map<string, FwAcc>()
    for (const scan of allScans.value) {
      for (const fw of scan.byFramework) {
        if (!frameworks.has(fw.frameworkId)) {
          frameworks.set(fw.frameworkId, { title: fw.frameworkTitle, scores: [], compliant: 0, partial: 0, missing: 0 })
        }
        const acc = frameworks.get(fw.frameworkId)!
        acc.scores.push(fw.coveragePct)
        acc.compliant = Math.max(acc.compliant, fw.compliant)
        acc.partial   = Math.max(acc.partial,   fw.partial)
        acc.missing   = Math.max(acc.missing,   fw.missing)
      }
    }
    return Array.from(frameworks.entries()).map(([id, acc]) => ({
      frameworkId: id,
      title:       acc.title,
      coveragePct: Math.round(acc.scores.reduce((s, n) => s + n, 0) / acc.scores.length),
      compliant:   acc.compliant,
      partial:     acc.partial,
      missing:     acc.missing,
    }))
  })

  // ---- Actions --------------------------------------------------------

  /**
   * Add a policy from an uploaded file.
   * `textContent` should be pre-extracted by the caller (FileReader / pdfjs).
   */
  async function addPolicy(opts: {
    title:       string
    version:     string
    status:      PolicyStatus
    format:      PolicyFormat
    description: string
    tags:        string[]
    uploadedBy:  string
    textContent: string
    file:        File | null
  }): Promise<StoredPolicy> {
    const id = `pol-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

    // Run the real compliance scan immediately
    const scan = scanPolicy(opts.textContent, id, opts.title)

    let fileUrl: string | null = null
    let serverSide = false

    // Try to upload to Vercel Blob
    if (opts.file) {
      try {
        const form = new FormData()
        form.append('file', opts.file)
        form.append('policyId', id)
        const res = await fetch('/api/policies', { method: 'POST', body: form })
        if (res.ok) {
          const json = await res.json()
          fileUrl    = json.url ?? null
          serverSide = true
        }
      } catch { /* API not available (local dev) — skip */ }

      // Fallback: small files get base64-encoded for in-browser preview
      if (!serverSide && opts.file.size < 1_500_000) {
        fileUrl = await readAsDataUrl(opts.file)
      }
    }

    const policy: StoredPolicy = {
      id,
      title:       opts.title,
      version:     opts.version,
      status:      opts.status,
      format:      opts.format,
      description: opts.description,
      tags:        opts.tags,
      uploadedAt:  new Date().toISOString(),
      uploadedBy:  opts.uploadedBy,
      fileUrl,
      textContent: opts.textContent,
      scan,
      serverSide,
    }

    policies.value.push(policy)
    saveToLS(policies.value)
    return policy
  }

  async function deletePolicy(id: string): Promise<void> {
    const idx = policies.value.findIndex(p => p.id === id)
    if (idx < 0) return

    const p = policies.value[idx]
    if (p.serverSide && p.fileUrl) {
      try {
        await fetch('/api/policies', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: p.fileUrl }),
        })
      } catch { /* ignore */ }
    }

    policies.value.splice(idx, 1)
    saveToLS(policies.value)
  }

  async function fetchServerPolicies(): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res = await fetch('/api/policies')
      if (!res.ok) return
      const list: Array<{ url: string; pathname: string; uploadedAt: string; metadata?: Record<string, string> }> =
        (await res.json()).blobs ?? []

      for (const blob of list) {
        if (policies.value.some(p => p.fileUrl === blob.url)) continue
        const meta = blob.metadata ?? {}
        const stub: StoredPolicy = {
          id:          meta.policyId  ?? `srv-${Date.now().toString(36)}`,
          title:       meta.title     ?? blob.pathname.split('/').pop() ?? 'Untitled',
          version:     meta.version   ?? '1.0',
          status:      (meta.status   ?? 'published') as PolicyStatus,
          format:      (meta.format   ?? 'text')      as PolicyFormat,
          description: meta.description ?? '',
          tags:        meta.tags ? JSON.parse(meta.tags) : [],
          uploadedAt:  blob.uploadedAt,
          uploadedBy:  meta.uploadedBy ?? 'unknown',
          fileUrl:     blob.url,
          textContent: '',   // lazy-loaded on open
          scan:        null, // rescanned when text is loaded
          serverSide:  true,
        }
        policies.value.push(stub)
      }
      saveToLS(policies.value)
    } catch {
      error.value = 'Unable to reach the server policy store'
    } finally {
      loading.value = false
    }
  }

  return {
    policies,
    loading,
    error,
    publishedPolicies,
    allScans,
    aggregateCoverage,
    addPolicy,
    deletePolicy,
    fetchServerPolicies,
  }
})

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}
