<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { usePolicyStore } from '@/stores/policies'
import { fmtDate } from '@/utils/fmt'
import SeverityBadge from '@/components/SeverityBadge.vue'

const data = useDataStore()
const pol  = usePolicyStore()

const evidence = computed(() => data.derivedEvidence)
const byFramework = computed(() => {
  const map = new Map<string, typeof evidence.value>()
  for (const e of evidence.value) {
    const key = e.frameworkControlId?.split('-').slice(0, 1).join('-') ?? 'other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return [...map.entries()]
})
</script>

<template>
  <div class="space-y-6 fade-up">
    <div>
      <h1 class="text-xl font-extrabold">Evidence Vault</h1>
      <p class="text-xs text-white/40 mt-1">Auto-derived evidence from policy scan snippets — ready for auditors</p>
    </div>

    <div v-if="!pol.policies.length" class="gr-card p-10 text-center border-dashed border-white/10 border-2">
      <div class="text-3xl mb-3">🗄️</div>
      <p class="text-sm text-white/45">Upload policies to auto-generate evidence entries from matching control sections.</p>
    </div>

    <template v-else>
      <div class="text-xs text-white/40">{{ evidence.length }} evidence items auto-derived from policy scans</div>

      <table class="gr-table">
        <thead>
          <tr>
            <th>Control</th>
            <th>Policy</th>
            <th>Snippet (excerpt)</th>
            <th>Collected</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in evidence" :key="e.id">
            <td>
              <div class="font-mono text-[11px] text-babcom-300">{{ data.controlStates.find(c => c.controlId === e.frameworkControlId)?.code ?? e.controlId }}</div>
              <div class="text-[10px] text-white/40 mt-0.5 max-w-[180px]">{{ (data.controlStates.find(c => c.controlId === e.frameworkControlId)?.title) ?? e.name }}</div>
            </td>
            <td>
              <div class="text-xs text-white/70 max-w-[120px] truncate">{{ e.policyTitle || (pol.policies.find(p => p.id === e.policyId)?.title ?? '—') }}</div>
            </td>
            <td class="max-w-xs">
              <div v-if="e.snippet" class="text-[10px] text-white/50 italic border-l-2 border-white/10 pl-2 line-clamp-2">
                "{{ e.snippet }}"
              </div>
              <span v-else class="text-[10px] text-white/25">—</span>
            </td>
            <td>
              <div class="text-[10px] text-white/50">{{ fmtDate(e.collectedAt) }}</div>
            </td>
            <td>
              <div class="text-[10px] text-white/50 max-w-[120px] truncate">{{ e.source }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>
