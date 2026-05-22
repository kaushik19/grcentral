<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, RadialLinearScale, BarElement,
  Filler, Tooltip, Legend, Title,
} from 'chart.js'
import { Line, Doughnut, Radar, Bar } from 'vue-chartjs'

import { useDataStore }   from '@/stores/data'
import { usePolicyStore } from '@/stores/policies'
import { usePersonaStore } from '@/stores/persona'
import { useLiveFeed }    from '@/composables/useLiveFeed'
import { driftBandColour, driftBandLabel, fmtDate, fmtAgo } from '@/utils/fmt'
import KpiTile       from '@/components/KpiTile.vue'
import SeverityBadge from '@/components/SeverityBadge.vue'
import PersonaAvatar from '@/components/PersonaAvatar.vue'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, RadialLinearScale, BarElement,
  Filler, Tooltip, Legend, Title,
)

const router  = useRouter()
const data    = useDataStore()
const pol     = usePolicyStore()
const persona = usePersonaStore()
const live    = useLiveFeed()

const drift      = computed(() => data.driftResult)
const openRisks  = computed(() => data.openRisks.slice(0, 5))
const nextAction = computed(() => data.nextBest)
const hasPolicies = computed(() => pol.policies.length > 0)

const kpis = computed(() => [
  { label: 'Risk Drift Score',   value: drift.value.score,                                    color: driftBandColour(drift.value.score), route: '/drift'   },
  { label: 'Open Risks',         value: data.openRisks.length,                                color: '#fb7185',                          route: '/gaps'    },
  { label: 'Policies',           value: pol.policies.length,                                  color: '#a78bfa',                          route: '/policies'},
  { label: 'Frameworks',         value: data.frameworks.length,                               color: '#22d3ee',                          route: '/radar'   },
  { label: 'Critical Risks',     value: data.criticalRisks.length,                            color: '#ff5a1f',                          route: '/gaps'    },
  { label: 'Pending Actions',    value: data.actions.filter(a => a.status !== 'done').length, color: '#fbbf24',                          route: '/actions' },
])

// ── Chart shared options ────────────────────────────────────────────────────
const CHART_FONT = { family: "'Montserrat', sans-serif", size: 11 }
const GRID_COLOR  = 'rgba(255,255,255,0.05)'
const LABEL_COLOR = 'rgba(255,255,255,0.45)'

// ── 1. Drift Trend (line) — 30 simulated days ──────────────────────────────
const driftTrendData = computed(() => {
  const base  = drift.value.score
  const days  = 30
  const labels: string[] = []
  const values: number[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }))
    // Simulate a slight upward drift trend ending at current score
    const jitter = (Math.sin(i * 0.4) * 3) + (Math.random() * 2 - 1)
    const trend  = base - ((days - 1 - i) * 0.35)
    values.push(Math.max(0, Math.min(100, Math.round(trend + jitter))))
  }
  // Ensure last value matches current score
  values[values.length - 1] = base

  const gradient = 'rgba(255,90,31,0.25)'
  return {
    labels,
    datasets: [{
      label: 'Risk Drift',
      data: values,
      fill: true,
      borderColor: '#ff5a1f',
      backgroundColor: gradient,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: '#ff5a1f',
      tension: 0.4,
    }],
  }
})

const driftTrendOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0d0d0f',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleFont: CHART_FONT,
      bodyFont: CHART_FONT,
      callbacks: {
        label: (ctx: any) => ` Drift: ${ctx.raw}`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: GRID_COLOR },
      ticks: { color: LABEL_COLOR, font: CHART_FONT, maxTicksLimit: 6, maxRotation: 0 },
      border: { color: GRID_COLOR },
    },
    y: {
      min: 0, max: 100,
      grid: { color: GRID_COLOR },
      ticks: { color: LABEL_COLOR, font: CHART_FONT, stepSize: 25 },
      border: { color: GRID_COLOR },
    },
  },
}

// ── 2. Risk by Severity (doughnut) ─────────────────────────────────────────
const donutData = computed(() => {
  const risks = data.openRisks
  const counts = {
    critical: risks.filter(r => r.severity === 'critical').length,
    high:     risks.filter(r => r.severity === 'high').length,
    medium:   risks.filter(r => r.severity === 'medium').length,
    low:      risks.filter(r => r.severity === 'low').length,
  }
  return {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [counts.critical, counts.high, counts.medium, counts.low],
      backgroundColor: ['#ff5a1f', '#fb7185', '#fbbf24', '#34d399'],
      borderColor: '#070707',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  }
})

const donutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  animation: { duration: 800 },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: LABEL_COLOR, font: CHART_FONT, boxWidth: 10, padding: 14, usePointStyle: true },
    },
    tooltip: {
      backgroundColor: '#0d0d0f',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleFont: CHART_FONT,
      bodyFont: CHART_FONT,
    },
  },
}

// ── 3. Framework Coverage (radar) ──────────────────────────────────────────
const radarData = computed(() => {
  const fw = pol.aggregateCoverage ?? []
  return {
    labels: fw.map(f => f.title),
    datasets: [{
      label: 'Coverage %',
      data: fw.map(f => f.coveragePct),
      backgroundColor: 'rgba(255,90,31,0.15)',
      borderColor: '#ff5a1f',
      borderWidth: 2,
      pointBackgroundColor: '#ff5a1f',
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  }
})

const radarOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800 },
  scales: {
    r: {
      min: 0, max: 100,
      grid:       { color: GRID_COLOR },
      angleLines: { color: GRID_COLOR },
      pointLabels:{ color: LABEL_COLOR, font: { ...CHART_FONT, size: 10 } },
      ticks:      { display: false, stepSize: 25 },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0d0d0f',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleFont: CHART_FONT,
      bodyFont: CHART_FONT,
      callbacks: { label: (ctx: any) => ` ${ctx.raw}% covered` },
    },
  },
}

// ── 4. Controls: compliant vs partial vs missing (bar) ────────────────────
const barData = computed(() => {
  const fw = pol.aggregateCoverage ?? []
  return {
    labels: fw.map(f => f.title),
    datasets: [
      {
        label: 'Compliant',
        data: fw.map(f => f.compliant),
        backgroundColor: '#34d399',
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: 'Partial',
        data: fw.map(f => f.partial),
        backgroundColor: '#fbbf24',
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: 'Missing',
        data: fw.map(f => f.missing),
        backgroundColor: '#fb7185',
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  }
})

const barOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800 },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: LABEL_COLOR, font: CHART_FONT, boxWidth: 10, padding: 14, usePointStyle: true },
    },
    tooltip: {
      backgroundColor: '#0d0d0f',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleFont: CHART_FONT,
      bodyFont: CHART_FONT,
    },
  },
  scales: {
    x: {
      stacked: false,
      grid: { color: GRID_COLOR },
      ticks: { color: LABEL_COLOR, font: CHART_FONT, maxRotation: 30 },
      border: { color: GRID_COLOR },
    },
    y: {
      grid: { color: GRID_COLOR },
      ticks: { color: LABEL_COLOR, font: CHART_FONT },
      border: { color: GRID_COLOR },
    },
  },
}

// Greeting
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
})
</script>

<template>
  <div class="space-y-5 fade-up">

    <!-- Welcome bar -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">
          Good {{ greeting }}, {{ persona.current.name.split(' ')[0] }}
        </h1>
        <p class="text-sm text-white/40 mt-0.5">{{ persona.current.role }}</p>
      </div>
      <div class="text-right shrink-0">
        <div class="text-[9px] uppercase tracking-[0.3em] text-white/35">Overall Drift</div>
        <div class="text-4xl font-black tabular-nums leading-none mt-1"
             :style="`color: ${driftBandColour(drift.score)}`">
          {{ drift.score }}
        </div>
        <div class="text-xs font-semibold mt-1" :style="`color: ${driftBandColour(drift.score)}`">
          {{ driftBandLabel(drift.score) }}
        </div>
      </div>
    </div>

    <!-- KPI tiles -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiTile
        v-for="k in kpis" :key="k.label"
        :label="k.label" :value="k.value" :color="k.color" :route="k.route"
      />
    </div>

    <!-- Empty state -->
    <div v-if="!hasPolicies" class="gr-card p-10 text-center border-dashed border-2 border-babcom-500/20">
      <div class="text-4xl mb-4">📋</div>
      <h2 class="text-lg font-bold mb-2">Upload your first policy to get started</h2>
      <p class="text-sm text-white/50 max-w-md mx-auto mb-6">
        GRCentral will instantly scan it against {{ data.frameworks.length }} real regulatory frameworks
        and show you which controls are covered, partial, or missing.
      </p>
      <button class="btn btn-primary text-sm" @click="router.push('/policies')">Upload a Policy →</button>
    </div>

    <template v-else>

      <!-- Row 1: Drift trend (wide) + Severity donut -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- Drift trend line -->
        <div class="gr-card p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-[10px] uppercase tracking-widest text-white/40">Risk Drift — Last 30 Days</div>
              <div class="text-xs text-white/30 mt-0.5">Weighted score across all frameworks &amp; policies</div>
            </div>
            <button class="text-xs text-babcom-400 hover:text-babcom-300" @click="router.push('/drift')">Full report →</button>
          </div>
          <div class="h-44">
            <Line :data="driftTrendData" :options="driftTrendOpts" />
          </div>
          <div class="mt-3 flex items-center gap-4 text-[10px] text-white/35">
            <span>Trend ×{{ drift.multiplier.toFixed(2) }}</span>
            <span class="text-white/15">·</span>
            <span>{{ data.radarChanges.filter(c => !data.ackedChanges.has(c.id)).length }} unacknowledged changes</span>
          </div>
        </div>

        <!-- Risk by severity donut -->
        <div class="gr-card p-5 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <div class="text-[10px] uppercase tracking-widest text-white/40">Risks by Severity</div>
            <button class="text-xs text-babcom-400 hover:text-babcom-300" @click="router.push('/gaps')">All →</button>
          </div>
          <div class="flex-1 flex items-center justify-center min-h-0 h-44">
            <template v-if="data.openRisks.length">
              <Doughnut :data="donutData" :options="donutOpts" />
            </template>
            <div v-else class="text-xs text-white/30 text-center">No open risks</div>
          </div>
        </div>
      </div>

      <!-- Row 2: Framework radar + Controls bar -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- Radar: framework coverage -->
        <div class="gr-card p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-[10px] uppercase tracking-widest text-white/40">Framework Coverage</div>
              <div class="text-xs text-white/30 mt-0.5">Avg across {{ pol.policies.length }} polic{{ pol.policies.length === 1 ? 'y' : 'ies' }}</div>
            </div>
            <button class="text-xs text-babcom-400 hover:text-babcom-300" @click="router.push('/controls')">Details →</button>
          </div>
          <div class="h-56">
            <template v-if="(pol.aggregateCoverage ?? []).length">
              <Radar :data="radarData" :options="radarOpts" />
            </template>
            <div v-else class="flex items-center justify-center h-full text-xs text-white/30">
              Scan a policy to see coverage
            </div>
          </div>
        </div>

        <!-- Bar: compliant / partial / missing per framework -->
        <div class="gr-card p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-[10px] uppercase tracking-widest text-white/40">Controls Status</div>
              <div class="text-xs text-white/30 mt-0.5">Compliant · Partial · Missing per framework</div>
            </div>
            <button class="text-xs text-babcom-400 hover:text-babcom-300" @click="router.push('/gaps')">Gaps →</button>
          </div>
          <div class="h-56">
            <template v-if="(pol.aggregateCoverage ?? []).length">
              <Bar :data="barData" :options="barOpts" />
            </template>
            <div v-else class="flex items-center justify-center h-full text-xs text-white/30">
              No data yet
            </div>
          </div>
        </div>
      </div>

      <!-- Row 3: Next best action + Top risks -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- Next best action -->
        <div class="gr-card p-5">
          <div class="text-[10px] uppercase tracking-widest text-white/40 mb-4">Next Best Action</div>
          <template v-if="nextAction">
            <div class="space-y-3">
              <div class="text-sm font-semibold leading-snug">{{ nextAction.title }}</div>
              <div class="text-xs text-white/50 leading-relaxed">{{ nextAction.summary }}</div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="chip">{{ nextAction.effort }} effort</span>
                <span class="chip text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
                  −{{ nextAction.expectedDriftReduction }} drift
                </span>
                <span class="chip">Due {{ nextAction.dueInDays }}d</span>
              </div>
              <div class="flex items-center gap-2">
                <PersonaAvatar :persona="data.personaById[nextAction.ownerId] ?? data.personas[0]" size="sm" />
                <span class="text-xs text-white/50">{{ data.personaById[nextAction.ownerId]?.name ?? 'Unassigned' }}</span>
              </div>
              <button class="btn btn-primary w-full text-xs justify-center mt-1" @click="router.push('/actions')">
                Open Action →
              </button>
            </div>
          </template>
          <div v-else class="text-sm text-white/40 py-6 text-center">
            No pending actions.
            <button class="block text-babcom-400 text-xs mt-2 mx-auto" @click="router.push('/gaps')">Generate from gaps →</button>
          </div>
        </div>

        <!-- Top open risks -->
        <div class="gr-card p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="text-[10px] uppercase tracking-widest text-white/40">Top Open Risks</div>
            <button class="text-xs text-babcom-400 hover:text-babcom-300" @click="router.push('/gaps')">View all →</button>
          </div>
          <div class="space-y-0.5">
            <div
              v-for="r in openRisks" :key="r.id"
              class="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.025] rounded-lg px-2 -mx-2 transition-colors"
              @click="router.push('/gaps')"
            >
              <SeverityBadge :severity="r.severity" class="mt-0.5 shrink-0" />
              <div class="min-w-0">
                <div class="text-[12px] font-medium leading-snug line-clamp-1">{{ r.title }}</div>
                <div class="text-[10px] text-white/35 mt-0.5">{{ r.frameworkTitle }} · {{ fmtDate(r.openSince) }}</div>
              </div>
            </div>
            <div v-if="!openRisks.length" class="text-xs text-white/35 py-6 text-center">No open risks — great work!</div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>
