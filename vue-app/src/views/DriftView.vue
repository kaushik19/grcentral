<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { usePolicyStore } from '@/stores/policies'
import { driftBandColour, driftBandLabel } from '@/utils/fmt'

const data = useDataStore()
const pol  = usePolicyStore()

const drift = computed(() => data.driftResult)

const WEIGHTS: Record<string, number> = {
  regulationImpact: 0.30, coverageGap: 0.25, controlDrift: 0.20,
  evidenceAging: 0.10, remediationDelay: 0.10, businessCriticality: 0.05,
}
const LABELS: Record<string, string> = {
  regulationImpact: 'Regulation Impact',
  coverageGap: 'Coverage Gap',
  controlDrift: 'Control Drift',
  evidenceAging: 'Evidence Aging',
  remediationDelay: 'Remediation Delay',
  businessCriticality: 'Business Criticality',
}
</script>

<template>
  <div class="space-y-6 fade-up">
    <div>
      <h1 class="text-xl font-extrabold">Risk Drift</h1>
      <p class="text-xs text-white/40 mt-1">Weighted composite score derived from real compliance gaps and unacknowledged regulatory changes</p>
    </div>

    <!-- Score card -->
    <div class="gr-card p-8 text-center">
      <div class="text-[10px] uppercase tracking-widest text-white/40 mb-2">Current Drift Score</div>
      <div class="text-8xl font-black tabular-nums" :style="`color: ${driftBandColour(drift.score)}`">
        {{ drift.score }}
      </div>
      <div class="text-lg font-bold mt-2" :style="`color: ${driftBandColour(drift.score)}`">
        {{ driftBandLabel(drift.score) }}
      </div>
      <div class="text-xs text-white/40 mt-3">
        Trend multiplier: ×{{ drift.multiplier.toFixed(2) }}
        · {{ data.radarChanges.filter(c => !data.ackedChanges.has(c.id)).length }} unacknowledged changes
      </div>
    </div>

    <!-- Breakdown -->
    <div class="gr-card p-5">
      <div class="text-[10px] uppercase tracking-widest text-white/40 mb-5">Drift Formula Breakdown</div>
      <div class="space-y-4">
        <div v-for="[key, label] in Object.entries(LABELS)" :key="key">
          <div class="flex items-center justify-between mb-1.5">
            <div class="text-xs text-white/65">{{ label }}</div>
            <div class="flex items-center gap-3 text-xs">
              <span class="text-white/35">weight {{ Math.round((WEIGHTS[key] ?? 0) * 100) }}%</span>
              <span class="font-bold tabular-nums" :style="`color: ${driftBandColour((drift.breakdown as any)[key])}`">
                {{ (drift.breakdown as any)[key] }}
              </span>
            </div>
          </div>
          <div class="bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="`width: ${(drift.breakdown as any)[key]}%; background: ${driftBandColour((drift.breakdown as any)[key])}`"
            ></div>
          </div>
        </div>
      </div>
      <div class="mt-6 pt-4 border-t border-white/5 text-xs text-white/40 font-mono">
        Score = (0.30×RI + 0.25×CG + 0.20×CD + 0.10×EA + 0.10×RD + 0.05×BC) × {{ drift.multiplier.toFixed(2) }} = <span class="text-white font-bold">{{ drift.score }}</span>
      </div>
    </div>

    <!-- Per-policy coverage -->
    <div v-if="pol.policies.length" class="gr-card p-5">
      <div class="text-[10px] uppercase tracking-widest text-white/40 mb-4">Coverage Gap by Policy</div>
      <div class="space-y-3">
        <div v-for="p in pol.policies.filter(p => p.scan)" :key="p.id" class="flex items-center gap-3">
          <div class="text-xs text-white/70 w-48 truncate">{{ p.title }}</div>
          <div class="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              class="h-full rounded-full"
              :style="`width:${100 - p.scan!.summary.coveragePct}%; background: ${driftBandColour(100 - p.scan!.summary.coveragePct)}`"
            ></div>
          </div>
          <div class="text-xs tabular-nums w-16 text-right text-white/50">{{ 100 - p.scan!.summary.coveragePct }}% gap</div>
        </div>
      </div>
    </div>
    <div v-else class="gr-card p-8 text-center border-dashed border-white/10 border-2">
      <p class="text-sm text-white/40">Upload a policy to see drift contribution per document.</p>
    </div>
  </div>
</template>
