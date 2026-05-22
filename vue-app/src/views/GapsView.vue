<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { usePolicyStore } from '@/stores/policies'
import SeverityBadge from '@/components/SeverityBadge.vue'

const router = useRouter()
const data   = useDataStore()
const pol    = usePolicyStore()

const filterFw  = ref('')
const filterSev = ref('')
const filterStatus = ref('open')

const risks = computed(() => {
  let list = filterStatus.value === 'all'
    ? data.derivedRisks
    : filterStatus.value === 'closed'
    ? data.derivedRisks.filter(r => r.status === 'closed')
    : data.openRisks

  if (filterFw.value)  list = list.filter(r => r.frameworkId === filterFw.value)
  if (filterSev.value) list = list.filter(r => r.severity === filterSev.value)
  return list
})

const groupedByFramework = computed(() => {
  const map = new Map<string, typeof risks.value>()
  for (const r of risks.value) {
    if (!map.has(r.frameworkId)) map.set(r.frameworkId, [])
    map.get(r.frameworkId)!.push(r)
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
})

const frameworks = computed(() => data.frameworks)

function actionForRisk(riskId: string) {
  return data.actions.find(a => a.riskId === riskId)
}

function generateActions(riskIds: string[]) {
  const result = data.generateActionsFromRisks(riskIds)
  if (result.ok && result.created.length) {
    router.push('/actions')
  }
}
</script>

<template>
  <div class="space-y-6 fade-up">

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-xl font-extrabold">Compliance Gaps</h1>
        <p class="text-xs text-white/40 mt-1">Controls that are missing or only partially covered by your uploaded policies</p>
      </div>
      <button
        v-if="data.openRisks.length"
        class="btn btn-primary text-xs"
        @click="generateActions(data.openRisks.map(r => r.id))"
      >
        ⚡ Generate Preventive Actions
      </button>
    </div>

    <!-- No policies state -->
    <div v-if="!pol.policies.length" class="gr-card p-10 text-center border-dashed border-2 border-white/10">
      <div class="text-3xl mb-3">🔍</div>
      <h3 class="font-bold mb-2">No gaps to show yet</h3>
      <p class="text-sm text-white/45 max-w-sm mx-auto mb-4">
        Upload a policy and GRCentral will automatically map every section against real GDPR, AI Act, NIS2, DORA, NIST CSF, and CRA controls.
      </p>
      <button class="btn btn-primary" @click="router.push('/policies')">Upload a Policy</button>
    </div>

    <template v-else>
      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <select v-model="filterStatus" class="filter-select">
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
        </select>
        <select v-model="filterFw" class="filter-select">
          <option value="">All frameworks</option>
          <option v-for="fw in frameworks" :key="fw.id" :value="fw.id">{{ fw.shortTitle }}</option>
        </select>
        <select v-model="filterSev" class="filter-select">
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <div class="ml-auto text-xs text-white/40 self-center">
          {{ risks.length }} gap{{ risks.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Empty filtered -->
      <div v-if="!risks.length" class="text-sm text-white/40 py-8 text-center">
        No gaps match the current filters.
      </div>

      <!-- Grouped by framework -->
      <div v-for="[fwId, fwRisks] in groupedByFramework" :key="fwId" class="space-y-2">
        <div class="flex items-center justify-between">
          <div class="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
            {{ data.frameworkById[fwId]?.shortTitle ?? fwId }}
            <span class="ml-2 text-white/25">{{ fwRisks.length }}</span>
          </div>
          <button
            class="text-xs text-babcom-400 hover:text-babcom-300"
            @click="generateActions(fwRisks.filter(r => r.status === 'open').map(r => r.id))"
          >+ Actions</button>
        </div>

        <table class="gr-table">
          <thead>
            <tr>
              <th>Control</th>
              <th>Policy</th>
              <th>Gap</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in fwRisks" :key="r.id">
              <td>
                <div class="font-mono text-[11px] text-babcom-300 font-semibold">{{ r.controlCode }}</div>
                <div class="text-xs text-white/65 mt-0.5 max-w-xs">{{ r.controlTitle }}</div>
              </td>
              <td>
                <div class="text-xs text-white/70 max-w-[140px] truncate">{{ r.policyTitle }}</div>
              </td>
              <td>
                <span
                  class="chip text-[10px] font-semibold"
                  :class="r.coverageStatus === 'missing' ? 'text-rose-300 border-rose-500/30 bg-rose-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'"
                >{{ r.coverageStatus }}</span>
              </td>
              <td><SeverityBadge :severity="r.severity" /></td>
              <td>
                <span class="chip text-[10px]" :class="r.status === 'closed' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-white/50'">
                  {{ r.status }}
                </span>
              </td>
              <td>
                <template v-if="actionForRisk(r.id)">
                  <button class="btn btn-ghost text-[10px] px-2 py-1" @click="router.push('/actions')">
                    {{ actionForRisk(r.id)!.status }}
                  </button>
                </template>
                <button
                  v-else-if="r.status === 'open'"
                  class="btn btn-ghost text-[10px] px-2 py-1"
                  @click="generateActions([r.id])"
                >+ Action</button>
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
