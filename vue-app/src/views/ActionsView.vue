<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDataStore } from '@/stores/data'
import { usePersonaStore } from '@/stores/persona'
import { useToast } from '@/composables/useToast'
import { actionProgress } from '@/stores/actionLifecycle'
import SeverityBadge from '@/components/SeverityBadge.vue'
import PersonaAvatar from '@/components/PersonaAvatar.vue'
import type { Action } from '@/types'

const data    = useDataStore()
const persona = usePersonaStore()
const toast   = useToast()

const filterStatus = ref<'all' | 'planned' | 'in-progress' | 'review' | 'done' | 'blocked'>('all')
const selectedAction = ref<Action | null>(null)
const blockReason = ref('')
const confirmText = ref('')

const filtered = computed(() => {
  const list = filterStatus.value === 'all'
    ? data.actions
    : data.actions.filter(a => a.status === filterStatus.value)
  return [...list].sort((a, b) => {
    const order = { 'in-progress': 0, review: 1, planned: 2, blocked: 3, done: 4 }
    return (order[a.status as keyof typeof order] ?? 5) - (order[b.status as keyof typeof order] ?? 5)
  })
})

const next = computed(() => data.nextBest)

const counts = computed(() => {
  const c = { all: data.actions.length, planned: 0, 'in-progress': 0, review: 0, done: 0, blocked: 0 }
  data.actions.forEach(a => { (c as any)[a.status] = ((c as any)[a.status] ?? 0) + 1 })
  return c
})

function riskFor(a: Action) {
  return data.derivedRisks.find(r => r.id === a.riskId)
}

function open(a: Action) { selectedAction.value = { ...a } }
function close()          { selectedAction.value = null; blockReason.value = ''; confirmText.value = '' }

// Lifecycle wrappers
function startAction(a: Action) {
  const r = data.startAct(a.id, persona.currentId)
  if (!r.ok) { toast.push('Error', r.error); return }
  toast.push('Action started')
  selectedAction.value = data.actionById[a.id] ?? null
}

function toggleStep(a: Action, stepId: string) {
  const r = data.toggleStep(a.id, stepId, persona.currentId)
  if (!r.ok) { toast.push('Error', r.error); return }
  selectedAction.value = data.actionById[a.id] ?? null
}

function attachLink(a: Action, reqId: string) {
  const url = prompt('Paste the https:// URL:')
  if (!url) return
  const r = data.attachActionEvidence(a.id, reqId, { url }, persona.currentId)
  if (!r.ok) { toast.push('Error', r.error); return }
  toast.push('Evidence attached')
  selectedAction.value = data.actionById[a.id] ?? null
}

function attachConfirm(a: Action, reqId: string) {
  const text = prompt('Describe what you confirmed:')
  if (!text) return
  const r = data.attachActionEvidence(a.id, reqId, { text }, persona.currentId)
  if (!r.ok) { toast.push('Error', r.error); return }
  toast.push('Evidence attached')
  selectedAction.value = data.actionById[a.id] ?? null
}

function attachFile(a: Action, reqId: string, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const r = data.attachActionEvidence(a.id, reqId, { fileName: file.name, fileSize: file.size }, persona.currentId)
  if (!r.ok) { toast.push('Error', r.error); return }
  toast.push('Evidence attached')
  selectedAction.value = data.actionById[a.id] ?? null
}

function blockAction(a: Action) {
  if (!blockReason.value.trim()) { toast.push('Reason required'); return }
  const r = data.blockAction(a.id, blockReason.value, persona.currentId)
  if (!r.ok) { toast.push('Error', r.error); return }
  blockReason.value = ''
  toast.push('Action blocked')
  selectedAction.value = data.actionById[a.id] ?? null
}

function unblockAction(a: Action) {
  const r = data.unblockAction(a.id, persona.currentId)
  if (!r.ok) { toast.push('Error', r.error); return }
  toast.push('Action unblocked')
  selectedAction.value = data.actionById[a.id] ?? null
}

function submitAction(a: Action) {
  const r = data.submitAction(a.id, persona.currentId)
  if (!r.ok) { toast.push('Cannot submit', r.error); return }
  toast.push('Submitted for review ✓')
  selectedAction.value = data.actionById[a.id] ?? null
}

function approveAction(a: Action) {
  const r = data.approveAction(a.id, persona.currentId)
  if (!r.ok) { toast.push('Cannot approve', r.error); return }
  toast.push('Action approved ✓', `Risk closed · Drift −${(r as any).payload?.driftDropped ?? 0}`)
  close()
}

const STATUS_COLOUR: Record<string, string> = {
  'planned':     'text-white/50 border-white/10 bg-white/5',
  'in-progress': 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
  'review':      'text-violet-300 border-violet-500/30 bg-violet-500/10',
  'done':        'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  'blocked':     'text-rose-300 border-rose-500/30 bg-rose-500/10',
}
</script>

<template>
  <div class="space-y-6 fade-up">

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-xl font-extrabold">Preventive Actions</h1>
        <p class="text-xs text-white/40 mt-1">Each action is a guided workflow that closes a risk and reduces drift</p>
      </div>
    </div>

    <!-- Next best action -->
    <div v-if="next" class="gr-card p-5 border-babcom-500/20 bg-babcom-500/5">
      <div class="text-[9px] uppercase tracking-widest text-babcom-400/80 mb-3">Next Best Action</div>
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="font-bold text-sm leading-snug mb-1">{{ next.title }}</div>
          <div class="text-xs text-white/50">{{ next.summary }}</div>
          <div class="flex gap-2 mt-3 flex-wrap">
            <span class="chip chip-active">−{{ next.expectedDriftReduction }} drift</span>
            <span class="chip">{{ next.effort }} effort</span>
            <span class="chip">Due in {{ next.dueInDays }}d</span>
          </div>
        </div>
        <button class="btn btn-primary shrink-0" @click="open(next!)">Open →</button>
      </div>
    </div>

    <!-- Status KPIs -->
    <div class="grid grid-cols-3 md:grid-cols-6 gap-2">
      <button
        v-for="[key, label] in [['all','All'],['in-progress','In Progress'],['review','Review'],['planned','Planned'],['blocked','Blocked'],['done','Done']]"
        :key="key"
        class="gr-card p-3 text-center cursor-pointer hover:border-babcom-500/30 transition-colors"
        :class="filterStatus === key ? 'border-babcom-500/40 bg-babcom-500/5' : ''"
        @click="filterStatus = key as any"
      >
        <div class="text-xl font-black tabular-nums">{{ (counts as any)[key] }}</div>
        <div class="text-[9px] uppercase tracking-wider text-white/40 mt-0.5">{{ label }}</div>
      </button>
    </div>

    <!-- Actions list -->
    <div v-if="!filtered.length" class="text-sm text-white/40 py-8 text-center">
      No actions in this state.
    </div>

    <div class="space-y-3">
      <div
        v-for="a in filtered" :key="a.id"
        class="gr-card p-4 cursor-pointer hover:border-babcom-500/20 transition-colors"
        @click="open(a)"
      >
        <div class="flex items-start gap-3">
          <!-- Progress ring placeholder -->
          <div class="shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-[11px] font-bold tabular-nums"
               :style="`border-color: ${data.getActionProgress(a.id)?.percent === 100 ? '#34d399' : '#ff5a1f'}`">
            {{ data.getActionProgress(a.id)?.percent ?? 0 }}%
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="chip text-[10px] font-semibold" :class="STATUS_COLOUR[a.status]">{{ a.status }}</span>
              <span class="chip text-[10px] text-amber-300 border-amber-500/30 bg-amber-500/10">−{{ a.expectedDriftReduction }} drift</span>
              <span class="chip text-[10px]">{{ a.effort }}</span>
            </div>
            <div class="font-semibold text-sm leading-snug">{{ a.title }}</div>
            <div class="text-xs text-white/45 mt-1 line-clamp-2">{{ a.summary }}</div>
          </div>
          <div class="shrink-0">
            <PersonaAvatar :persona="data.personaById[a.ownerId] ?? data.personas[0]" size="sm" />
          </div>
        </div>
        <!-- Risk tag -->
        <div v-if="riskFor(a)" class="mt-3 flex items-center gap-2">
          <span class="text-[9px] text-white/30">Risk:</span>
          <span class="text-[10px] text-white/55 truncate max-w-xs">{{ riskFor(a)!.controlCode }} · {{ riskFor(a)!.frameworkTitle }}</span>
          <SeverityBadge :severity="riskFor(a)!.severity" />
        </div>
      </div>
    </div>

  </div>

  <!-- ============ Action Detail Modal ============ -->
  <teleport to="body">
    <div v-if="selectedAction" class="modal-backdrop" @click.self="close">
      <div class="modal-card">

        <!-- Header -->
        <div class="p-5 border-b border-white/10">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="chip font-semibold" :class="STATUS_COLOUR[selectedAction.status]">{{ selectedAction.status }}</span>
                <span class="chip text-[10px] text-amber-300 border-amber-500/30 bg-amber-500/10">−{{ selectedAction.expectedDriftReduction }} drift</span>
              </div>
              <h2 class="font-bold text-base leading-snug">{{ selectedAction.title }}</h2>
              <p class="text-xs text-white/50 mt-1">{{ selectedAction.summary }}</p>
            </div>
            <button class="text-white/40 hover:text-white text-xl shrink-0" @click="close">×</button>
          </div>
        </div>

        <div class="p-5 space-y-6 overflow-y-auto max-h-[70vh]">

          <!-- Steps -->
          <div>
            <div class="text-[10px] uppercase tracking-widest text-white/40 mb-3">Steps ({{ selectedAction.steps.filter(s=>s.done).length }}/{{ selectedAction.steps.length }})</div>
            <div class="space-y-2">
              <label
                v-for="s in selectedAction.steps" :key="s.id"
                class="flex items-start gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                :class="selectedAction.status === 'done' ? 'opacity-60 cursor-default' : ''"
              >
                <input
                  type="checkbox"
                  :checked="s.done"
                  :disabled="selectedAction.status === 'done'"
                  class="mt-0.5 accent-[#ff5a1f]"
                  @change="toggleStep(selectedAction!, s.id)"
                />
                <div class="flex-1">
                  <div class="text-sm" :class="s.done ? 'line-through text-white/40' : ''">{{ s.label }}</div>
                  <div v-if="s.doneAt" class="text-[10px] text-white/35 mt-0.5">Done {{ s.doneAt }} by {{ data.personaById[s.doneBy ?? '']?.name ?? s.doneBy }}</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Evidence Requirements -->
          <div>
            <div class="text-[10px] uppercase tracking-widest text-white/40 mb-3">Evidence ({{ selectedAction.evidenceRequirements.filter(e=>e.fulfilled).length }}/{{ selectedAction.evidenceRequirements.length }})</div>
            <div class="space-y-2">
              <div
                v-for="req in selectedAction.evidenceRequirements" :key="req.id"
                class="p-3 rounded-lg border border-white/5"
                :class="req.fulfilled ? 'border-emerald-500/20 bg-emerald-500/5' : ''"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="chip text-[9px] mr-2">{{ req.kind }}</span>
                    <span class="text-xs">{{ req.label }}</span>
                  </div>
                  <span v-if="req.fulfilled" class="text-emerald-300 text-xs shrink-0">✓ Done</span>
                  <div v-else class="flex gap-1 shrink-0">
                    <button v-if="req.kind === 'link'" class="btn btn-ghost text-[10px] px-2 py-1" @click="attachLink(selectedAction!, req.id)">+ Link</button>
                    <button v-else-if="req.kind === 'confirmation'" class="btn btn-ghost text-[10px] px-2 py-1" @click="attachConfirm(selectedAction!, req.id)">+ Confirm</button>
                    <label v-else class="btn btn-ghost text-[10px] px-2 py-1 cursor-pointer">
                      + File
                      <input type="file" class="hidden" @change="attachFile(selectedAction!, req.id, $event)" />
                    </label>
                  </div>
                </div>
                <div v-if="req.payload" class="text-[10px] text-white/40 mt-1 font-mono truncate">
                  {{ Object.values(req.payload).join(' · ') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Blocked reason -->
          <div v-if="selectedAction.blockedReason" class="gr-card p-3 border-rose-500/20 bg-rose-500/5">
            <div class="text-xs font-semibold text-rose-300 mb-1">Blocked</div>
            <div class="text-xs text-white/60">{{ selectedAction.blockedReason }}</div>
          </div>

          <!-- History -->
          <div v-if="selectedAction.history.length">
            <div class="text-[10px] uppercase tracking-widest text-white/40 mb-3">History</div>
            <div class="space-y-1.5">
              <div v-for="(h, i) in [...selectedAction.history].reverse()" :key="i" class="flex gap-2 text-xs text-white/50">
                <span class="text-white/25 shrink-0">{{ h.at }}</span>
                <span class="font-medium text-white/65">{{ data.personaById[h.who]?.name ?? h.who }}</span>
                <span>{{ h.what }}</span>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            <button v-if="selectedAction.status === 'planned'" class="btn btn-primary text-xs" @click="startAction(selectedAction!)">Start Action</button>
            <button v-if="selectedAction.status === 'blocked'" class="btn btn-primary text-xs" @click="unblockAction(selectedAction!)">Unblock</button>
            <button
              v-if="selectedAction.status === 'in-progress'"
              class="btn btn-primary text-xs"
              :disabled="!data.getActionProgress(selectedAction.id)?.complete"
              :class="!data.getActionProgress(selectedAction.id)?.complete ? 'opacity-40 cursor-not-allowed' : ''"
              @click="submitAction(selectedAction!)"
            >Submit for Review</button>
            <button v-if="selectedAction.status === 'review'" class="btn btn-primary text-xs" @click="approveAction(selectedAction!)">Approve & Close Risk</button>
            <div v-if="selectedAction.status === 'in-progress'" class="flex gap-2 ml-auto">
              <input v-model="blockReason" placeholder="Blocker reason…" class="text-xs bg-ink-800 border border-white/10 rounded-lg px-2 py-1 w-44 focus:outline-none focus:border-rose-500/40" />
              <button class="btn text-xs px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20" @click="blockAction(selectedAction!)">Block</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </teleport>
</template>
