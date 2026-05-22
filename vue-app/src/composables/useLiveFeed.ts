import { ref, onUnmounted } from 'vue'
import { fmtAgo } from '@/utils/fmt'

export interface LiveEvent {
  id:     string
  at:     number
  srcId:  string
  label:  string
  detail: string
  tone:   'soft' | 'good' | 'warn' | 'hot'
  regId:  string | null
  impact: string | null
}

const MAX_LOG = 40

const TEMPLATES = [
  { srcId: 'eur-lex', label: 'EUR-Lex delta poll',        detail: 'No changes since last poll',         tone: 'soft' as const },
  { srcId: 'edpb',    label: 'EDPB feed polled',          detail: 'Parsed 3 new opinion pages',          tone: 'soft' as const },
  { srcId: 'nist',    label: 'NIST REST sync complete',   detail: 'CSF 2.0 mappings refreshed',          tone: 'soft' as const },
  { srcId: 'cisa',    label: 'CISA advisory fetched',     detail: 'Advisory #AA26-140A — no EU impact',  tone: 'soft' as const },
  { srcId: 'certin',  label: 'CERT-In scrape complete',   detail: '2 new advisories parsed',             tone: 'soft' as const },
  { srcId: 'cis',     label: 'CIS Benchmarks polled',     detail: 'Benchmark catalogue up to date',      tone: 'soft' as const },
  { srcId: 'owasp',   label: 'OWASP GitHub polled',       detail: 'Top-10 2025 release candidate draft', tone: 'warn' as const, regId: 'reg-nist-csf', impact: 'medium' },
  { srcId: 'eur-lex', label: 'EUR-Lex hot change detected', detail: 'Draft RTS for AI Act Art. 53 scope — high impact', tone: 'hot' as const, regId: 'reg-ai-act', impact: 'high' },
]

// Singleton log shared across all consumers
const log = ref<LiveEvent[]>([])
let _started = false
let _timer: ReturnType<typeof setInterval> | null = null

function _pick(): typeof TEMPLATES[number] {
  return TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
}

function _seedHistory() {
  log.value = []
  const now = Date.now()
  for (let i = 0; i < 6; i++) {
    const t = _pick()
    log.value.push({
      id:     `lv-seed-${i}-${Math.random().toString(36).slice(2, 7)}`,
      at:     now - (i + 1) * (20_000 + Math.floor(Math.random() * 50_000)),
      srcId:  t.srcId,
      label:  t.label,
      detail: t.detail,
      tone:   t.tone === 'hot' ? 'soft' : t.tone,
      regId:  null,
      impact: null,
    })
  }
  log.value.sort((a, b) => b.at - a.at)
}

export function injectLiveEvent(opts: Partial<LiveEvent> & Pick<LiveEvent, 'label'>): LiveEvent {
  const ev: LiveEvent = {
    id:     `lv-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    at:     Date.now(),
    srcId:  'system',
    detail: '',
    tone:   'soft',
    regId:  null,
    impact: null,
    ...opts,
  }
  log.value.unshift(ev)
  if (log.value.length > MAX_LOG) log.value.length = MAX_LOG
  return ev
}

export function useLiveFeed() {
  if (!_started) {
    _started = true
    _seedHistory()
    _timer = setInterval(() => {
      const t = _pick()
      injectLiveEvent({ srcId: t.srcId, label: t.label, detail: t.detail, tone: t.tone })
    }, 8_000)
  }

  onUnmounted(() => {
    // Don't clear the singleton timer — other components still use the feed
  })

  return {
    log,
    recent: (n = 4) => log.value.slice(0, n),
    fmtAgo,
  }
}
