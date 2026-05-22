<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDataStore } from '@/stores/data'
import { usePolicyStore } from '@/stores/policies'
import SeverityBadge from '@/components/SeverityBadge.vue'

const data = useDataStore()
const pol  = usePolicyStore()

const filterFw = ref('')
const states   = computed(() => {
  let list = data.controlStates
  if (filterFw.value) list = list.filter(c => c.frameworkId === filterFw.value)
  return list
})

const covered   = computed(() => states.value.filter(c => c.covered))
const uncovered = computed(() => states.value.filter(c => !c.covered))
</script>

<template>
  <div class="space-y-6 fade-up">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-xl font-extrabold">Controls</h1>
        <p class="text-xs text-white/40 mt-1">Real framework controls — derived from GDPR, AI Act, NIS2, DORA, NIST CSF, CRA</p>
      </div>
      <div class="text-right text-xs text-white/40">
        <div>{{ covered.length }} covered · {{ uncovered.length }} uncovered</div>
        <div>out of {{ states.length }} total controls</div>
      </div>
    </div>

    <!-- Filter -->
    <select v-model="filterFw" class="filter-select">
      <option value="">All frameworks</option>
      <option v-for="fw in data.frameworks" :key="fw.id" :value="fw.id">{{ fw.shortTitle }} ({{ fw.controls.length }})</option>
    </select>

    <!-- No policies -->
    <div v-if="!pol.policies.length" class="gr-card p-8 text-center border-dashed border-white/10 border-2">
      <p class="text-sm text-white/45">Upload a policy to see which controls are covered.</p>
    </div>

    <template v-else>
      <!-- Per framework -->
      <div v-for="fw in data.frameworks.filter(f => !filterFw || f.id === filterFw)" :key="fw.id" class="space-y-2">
        <div class="text-[10px] uppercase tracking-widest text-white/40 font-semibold flex items-center gap-2">
          {{ fw.shortTitle }}
          <span class="text-white/25">— {{ fw.title }}</span>
        </div>
        <table class="gr-table">
          <thead>
            <tr><th>Code</th><th>Control</th><th>Severity</th><th>Coverage</th><th>Policy</th></tr>
          </thead>
          <tbody>
            <tr v-for="ctrl in fw.controls" :key="ctrl.id">
              <td>
                <span class="font-mono text-[11px] text-babcom-300 font-semibold">{{ ctrl.code }}</span>
              </td>
              <td class="max-w-xs">
                <div class="text-xs font-medium">{{ ctrl.title }}</div>
                <div class="text-[10px] text-white/40 mt-0.5 line-clamp-2">{{ ctrl.summary }}</div>
              </td>
              <td><SeverityBadge :severity="ctrl.severity" /></td>
              <td>
                <div class="w-20">
                  <div
                    v-if="data.controlStates.find(c => c.controlId === ctrl.id) as any"
                    class="flex items-center gap-2"
                  >
                    <div class="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        class="h-full rounded-full"
                        :style="`width:${data.controlStates.find(c => c.controlId === ctrl.id)?.coverage ?? 0}%; background: ${data.controlStates.find(c => c.controlId === ctrl.id)?.covered ? '#34d399' : '#fb7185'}`"
                      ></div>
                    </div>
                    <span class="text-[9px] tabular-nums text-white/45">{{ data.controlStates.find(c => c.controlId === ctrl.id)?.coverage ?? 0 }}%</span>
                  </div>
                </div>
              </td>
              <td>
                <div v-if="data.controlStates.find(c => c.controlId === ctrl.id)?.policyIds?.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="pid in data.controlStates.find(c => c.controlId === ctrl.id)?.policyIds ?? []"
                    :key="pid"
                    class="chip text-[9px]"
                  >{{ pol.policies.find(p => p.id === pid)?.title?.slice(0, 20) ?? pid }}</span>
                </div>
                <span v-else class="text-[10px] text-rose-400/70">Not covered</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

  </div>
</template>

<style scoped>
@reference "../style.css";
.filter-select {
  @apply bg-ink-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70
         focus:outline-none focus:border-babcom-500/40;
}
</style>
