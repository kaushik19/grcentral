<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDataStore } from '@/stores/data'
import { useLiveFeed } from '@/composables/useLiveFeed'
import { fmtDate, fmtAgo } from '@/utils/fmt'

const data = useDataStore()
const live = useLiveFeed()

const fetchError = ref<string | null>(null)
const fetching   = ref(false)

const changes = computed(() => data.radarChanges)
const unacked = computed(() => changes.value.filter(c => !data.ackedChanges.has(c.id)).length)

onMounted(async () => {
  fetching.value = true
  try {
    const res = await fetch('/api/radar')
    if (res.ok) {
      const json = await res.json()
      for (const c of json.changes ?? []) data.injectRadarChange(c)
    }
  } catch {
    fetchError.value = 'Unable to reach regulatory feed endpoints (expected in local dev — data will populate in production)'
  } finally {
    fetching.value = false
  }
})

const IMPACT_COLOUR: Record<string, string> = {
  critical: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
  high:     'text-amber-300 border-amber-500/30 bg-amber-500/10',
  medium:   'text-violet-300 border-violet-500/30 bg-violet-500/10',
  low:      'text-white/50 border-white/10 bg-white/5',
  info:     'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
}

const SOURCES = [
  { id: 'eur-lex', name: 'EUR-Lex',               url: 'https://eur-lex.europa.eu/',       jurisdiction: 'EU',     status: 'healthy', desc: 'EU Official Journal · CELEX/ELI versioning · daily delta poll' },
  { id: 'edpb',    name: 'EDPB',                   url: 'https://www.edpb.europa.eu/',      jurisdiction: 'EU',     status: 'healthy', desc: 'Data Protection Board opinions and guidelines' },
  { id: 'ec-dig',  name: 'EC Digital Strategy',    url: 'https://digital-strategy.ec.europa.eu/', jurisdiction: 'EU', status: 'healthy', desc: 'AI Act, Data Act, GDPR-adjacent policy' },
  { id: 'enisa',   name: 'ENISA',                  url: 'https://www.enisa.europa.eu/',     jurisdiction: 'EU',     status: 'healthy', desc: 'EU cybersecurity agency advisories' },
  { id: 'nist',    name: 'NIST CSRC',              url: 'https://www.nist.gov/',            jurisdiction: 'US',     status: 'healthy', desc: 'CSF 2.0 · SP 800-series publications API' },
  { id: 'cisa',    name: 'CISA',                   url: 'https://www.cisa.gov/',            jurisdiction: 'US',     status: 'healthy', desc: 'US Cybersecurity advisory feed' },
  { id: 'certin',  name: 'CERT-In',                url: 'https://www.cert-in.org.in/',      jurisdiction: 'IN',     status: 'healthy', desc: 'Indian CERT advisories' },
  { id: 'ico',     name: 'UK ICO',                 url: 'https://ico.org.uk/',              jurisdiction: 'UK',     status: 'healthy', desc: 'Post-Brexit UK privacy guidance' },
  { id: 'owasp',   name: 'OWASP',                  url: 'https://owasp.org/',               jurisdiction: 'Global', status: 'healthy', desc: 'Top-10, ASVS, SAMM release monitoring' },
  { id: 'cis',     name: 'CIS Benchmarks',         url: 'https://www.cisecurity.org/',      jurisdiction: 'Global', status: 'healthy', desc: 'CIS Benchmarks version releases' },
  { id: 'gdpr-eu', name: 'GDPR.eu',                url: 'https://gdpr.eu/',                 jurisdiction: 'EU',     status: 'healthy', desc: 'Crosswalk hints and summaries' },
]
</script>

<template>
  <div class="space-y-6 fade-up">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-xl font-extrabold">Regulatory Radar</h1>
        <p class="text-xs text-white/40 mt-1">Live changes detected across {{ SOURCES.length }} real regulatory sources</p>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="fetching" class="flex items-center gap-1.5 text-[10px] text-white/35">
          <span class="pulse-dot"></span> Polling feeds…
        </div>
        <div v-if="unacked > 0" class="chip chip-active">{{ unacked }} unacknowledged</div>
      </div>
    </div>

    <!-- Dev notice — subtle, not alarming -->
    <div v-if="fetchError" class="flex items-center gap-2 text-[10px] text-white/30 border border-white/5 rounded-lg px-3 py-2 bg-white/[0.02]">
      <span>ℹ</span>
      <span>Live polling unavailable in local dev — showing seeded regulatory changes. Vercel deployment enables real-time EUR-Lex · NIST · CISA · EDPB feeds.</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

      <!-- Changes -->
      <div class="lg:col-span-2 space-y-3">
        <div class="text-[10px] uppercase tracking-widest text-white/40">Detected Changes</div>

        <div v-if="fetching && !changes.length" class="text-sm text-white/40 py-6 text-center animate-pulse">
          Polling regulatory feeds…
        </div>

        <div v-else-if="!changes.length" class="gr-card p-8 text-center border-dashed border-2 border-white/10">
          <div class="text-2xl mb-3">📡</div>
          <div class="text-sm text-white/45">No changes detected yet. In production, EUR-Lex · NIST · CISA · EDPB feeds are polled every hour.</div>
        </div>

        <div
          v-for="c in changes" :key="c.id"
          class="gr-card p-4 flex items-start gap-4"
          :class="!data.ackedChanges.has(c.id) ? 'border-babcom-500/15' : 'opacity-60'"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="chip text-[10px] font-semibold" :class="IMPACT_COLOUR[c.impact]">{{ c.impact }}</span>
              <span class="chip text-[10px]">{{ c.frameworkTitle }}</span>
              <span class="text-[10px] text-white/30">{{ fmtDate(c.detectedAt) }}</span>
            </div>
            <div class="text-sm font-medium leading-snug">{{ c.summary }}</div>
          </div>
          <button
            v-if="!data.ackedChanges.has(c.id)"
            class="btn btn-ghost text-[10px] px-2 py-1 shrink-0"
            @click="data.acknowledgeChange(c.id)"
          >Ack</button>
        </div>

        <!-- Live feed supplement -->
        <div class="text-[10px] uppercase tracking-widest text-white/40 mt-4">Live Feed</div>
        <div class="space-y-2">
          <div v-for="ev in live.log.value.slice(0, 6)" :key="ev.id"
               class="gr-card p-3 text-[11px] flex items-start gap-3">
            <span class="pulse-dot mt-1 shrink-0"></span>
            <div>
              <div class="font-semibold text-white/75">{{ ev.label }}</div>
              <div class="text-white/45">{{ ev.detail }}</div>
              <div class="text-white/25 text-[9px] mt-1">{{ fmtAgo(ev.at) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sources panel -->
      <div class="space-y-3">
        <div class="text-[10px] uppercase tracking-widest text-white/40">Monitored Sources</div>
        <div v-for="s in SOURCES" :key="s.id" class="gr-card p-3">
          <div class="flex items-center justify-between mb-1">
            <div class="text-xs font-semibold">{{ s.name }}</div>
            <span class="chip text-[9px] text-emerald-300 border-emerald-500/30 bg-emerald-500/10">{{ s.status }}</span>
          </div>
          <div class="text-[10px] text-white/45">{{ s.desc }}</div>
          <a :href="s.url" target="_blank" rel="noopener noreferrer"
             class="text-[9px] text-babcom-400 hover:underline mt-1 block truncate">{{ s.url }}</a>
        </div>
      </div>

    </div>
  </div>
</template>
