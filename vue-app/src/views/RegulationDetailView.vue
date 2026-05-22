<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import SeverityBadge from '@/components/SeverityBadge.vue'

const route  = useRoute()
const router = useRouter()
const data   = useDataStore()

const fwId = computed(() => route.params.id as string)
const fw   = computed(() => data.frameworkById[fwId.value])
const risks = computed(() => data.openRisks.filter(r => r.frameworkId === fwId.value))
</script>

<template>
  <div v-if="fw" class="space-y-6 fade-up">
    <div class="flex items-start gap-4">
      <button class="btn btn-ghost text-xs" @click="router.push('/radar')">← Back</button>
      <div>
        <h1 class="text-xl font-extrabold">{{ fw.title }}</h1>
        <div class="text-xs text-white/40 mt-1">{{ fw.jurisdiction }} · In force: {{ fw.effectiveDate }} · {{ fw.controls.length }} controls</div>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <span v-for="t in fw.topics" :key="t" class="chip text-[10px]">{{ t }}</span>
    </div>
    <div class="gr-card p-5">
      <div class="text-[10px] uppercase tracking-widest text-white/40 mb-4">Controls ({{ fw.controls.length }})</div>
      <div class="space-y-3">
        <div v-for="ctrl in fw.controls" :key="ctrl.id" class="border-b border-white/5 pb-3 last:border-0 last:pb-0">
          <div class="flex items-start gap-3">
            <span class="font-mono text-[11px] text-babcom-300 font-bold shrink-0">{{ ctrl.code }}</span>
            <div>
              <div class="text-sm font-semibold">{{ ctrl.title }}</div>
              <div class="text-xs text-white/50 mt-1 leading-relaxed">{{ ctrl.summary }}</div>
              <div class="flex flex-wrap gap-1 mt-2">
                <SeverityBadge :severity="ctrl.severity" />
                <span v-for="kw in ctrl.keywords.slice(0, 4)" :key="kw" class="chip text-[9px]">{{ kw }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="risks.length" class="gr-card p-5">
      <div class="text-[10px] uppercase tracking-widest text-white/40 mb-4">Open Risks ({{ risks.length }})</div>
      <div class="space-y-2">
        <div v-for="r in risks" :key="r.id" class="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
          <SeverityBadge :severity="r.severity" />
          <div class="min-w-0">
            <div class="text-xs font-medium">{{ r.title }}</div>
            <div class="text-[10px] text-white/35 mt-0.5">{{ r.controlCode }} · {{ r.policyTitle }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex gap-3">
      <a :href="fw.sourceUrl" target="_blank" rel="noopener noreferrer" class="btn btn-ghost text-xs">Official Source ↗</a>
    </div>
  </div>
  <div v-else class="text-center py-20 text-white/40">Framework not found · <button class="text-babcom-400" @click="router.push('/radar')">Back to Radar</button></div>
</template>
