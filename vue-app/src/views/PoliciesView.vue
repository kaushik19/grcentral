<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePolicyStore } from '@/stores/policies'
import { useDataStore } from '@/stores/data'
import { usePersonaStore } from '@/stores/persona'
import { useToast } from '@/composables/useToast'
import SeverityBadge from '@/components/SeverityBadge.vue'
import PersonaAvatar from '@/components/PersonaAvatar.vue'
import type { StoredPolicy } from '@/stores/policies'

const pol     = usePolicyStore()
const data    = useDataStore()
const persona = usePersonaStore()
const toast   = useToast()

// Upload modal state
const showUpload  = ref(false)
const uploading   = ref(false)
const uploadStep  = ref<'form' | 'scanning' | 'result'>('form')
const lastUpload  = ref<StoredPolicy | null>(null)

const form = ref({
  title: '', version: '1.0', status: 'published' as const,
  format: 'text' as const, description: '', tags: '',
})
const fileRef   = ref<HTMLInputElement | null>(null)
const pickedFile = ref<File | null>(null)
const fileText  = ref('')

// View policy modal
const viewingPolicy = ref<StoredPolicy | null>(null)
const viewingScanned = ref<'overview' | string>('overview') // 'overview' or frameworkId

// Filter
const filterQ = ref('')
const filtered = computed(() =>
  pol.policies.filter(p =>
    !filterQ.value ||
    p.title.toLowerCase().includes(filterQ.value.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(filterQ.value.toLowerCase())),
  ),
)

onMounted(() => {
  pol.fetchServerPolicies()
})

async function pickFile(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  pickedFile.value = f
  form.value.title  = form.value.title || f.name.replace(/\.[^.]+$/, '')
  const ext = f.name.split('.').pop()?.toLowerCase()
  form.value.format = (ext === 'pdf' ? 'pdf' : ext === 'md' ? 'markdown' : ext === 'html' ? 'html' : 'text') as typeof form.value.format

  // Extract text for scanning
  if (f.type === 'application/pdf') {
    fileText.value = `[PDF] ${f.name} — full text extraction requires server-side processing.
    Policy: ${form.value.title}
    Format: PDF document
    Size: ${Math.round(f.size / 1024)} KB`
  } else {
    fileText.value = await f.text()
  }
}

async function submitUpload() {
  if (!form.value.title.trim()) { toast.push('Title required', 'Please enter a policy title'); return }
  if (!fileText.value && !pickedFile.value) { toast.push('No content', 'Pick a file or paste policy text below'); return }

  uploading.value  = true
  uploadStep.value = 'scanning'

  const policy = await pol.addPolicy({
    title:       form.value.title.trim(),
    version:     form.value.version,
    status:      form.value.status,
    format:      form.value.format,
    description: form.value.description,
    tags:        form.value.tags.split(',').map(t => t.trim()).filter(Boolean),
    uploadedBy:  persona.currentId,
    textContent: fileText.value,
    file:        pickedFile.value,
  })

  lastUpload.value = policy
  uploadStep.value = 'result'
  uploading.value  = false
  toast.push('Policy uploaded ✓', `Scanned against ${data.frameworks.length} frameworks`)
}

function resetUpload() {
  uploadStep.value = 'form'
  lastUpload.value = null
  form.value = { title: '', version: '1.0', status: 'published', format: 'text', description: '', tags: '' }
  pickedFile.value = null
  fileText.value   = ''
  if (fileRef.value) fileRef.value.value = ''
}

function closeUpload() {
  showUpload.value = false
  resetUpload()
}

async function deletePolicy(id: string) {
  if (!confirm('Delete this policy? This cannot be undone.')) return
  await pol.deletePolicy(id)
  toast.push('Policy deleted')
}

function openPolicy(p: StoredPolicy) {
  viewingPolicy.value  = p
  viewingScanned.value = 'overview'
}

function frameworkScan(fwId: string) {
  return viewingPolicy.value?.scan?.byFramework.find(f => f.frameworkId === fwId)
}

const SWATCH: Record<string, string> = {
  compliant: 'text-emerald-300',
  partial:   'text-amber-300',
  missing:   'text-rose-400',
}
function swatchClass(s: string) { return SWATCH[s] ?? 'text-white/50' }
</script>

<template>
  <div class="space-y-6 fade-up">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-extrabold tracking-tight">Internal Policies</h1>
        <p class="text-xs text-white/40 mt-1">Upload policies → instantly see GDPR / AI Act / NIS2 / DORA / NIST compliance gaps</p>
      </div>
      <button class="btn btn-primary" @click="showUpload = true">+ Upload Policy</button>
    </div>

    <!-- Filter -->
    <input
      v-model="filterQ"
      placeholder="Search policies…"
      class="w-full max-w-sm px-3 py-2 rounded-lg bg-ink-800 border border-white/5 text-sm placeholder:text-white/30 focus:outline-none focus:border-babcom-500/40"
    />

    <!-- Policy list -->
    <div v-if="filtered.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="p in filtered" :key="p.id"
        class="gr-card p-4 flex flex-col gap-3 hover:border-babcom-500/20 transition-colors"
      >
        <!-- Title row -->
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="font-semibold text-sm leading-snug">{{ p.title }}</div>
            <div class="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider">v{{ p.version }} · {{ p.format }} · {{ p.status }}</div>
          </div>
          <div class="flex gap-1.5 shrink-0">
            <button class="btn btn-ghost text-[10px] px-2 py-1" @click="openPolicy(p)">View</button>
            <button class="btn text-[10px] px-2 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg" @click="deletePolicy(p.id)">Del</button>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="p.tags.length" class="flex flex-wrap gap-1">
          <span v-for="t in p.tags" :key="t" class="chip text-[9px]">{{ t }}</span>
        </div>

        <!-- Scan summary bar -->
        <template v-if="p.scan">
          <div class="border-t border-white/5 pt-3 space-y-2">
            <div class="text-[9px] uppercase tracking-widest text-white/30 mb-2">Coverage</div>
            <div v-for="fw in p.scan.byFramework" :key="fw.frameworkId" class="flex items-center gap-2">
              <div class="text-[10px] text-white/55 w-16 truncate">{{ fw.frameworkTitle }}</div>
              <div class="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :style="`width:${fw.coveragePct}%; background: ${fw.coveragePct >= 60 ? '#34d399' : fw.coveragePct >= 35 ? '#fbbf24' : '#fb7185'}`"
                ></div>
              </div>
              <div class="text-[10px] tabular-nums w-8 text-right text-white/50">{{ fw.coveragePct }}%</div>
            </div>
          </div>
          <div class="text-[10px] text-white/35 border-t border-white/5 pt-2">
            {{ p.scan.summary.missingControls }} missing · {{ p.scan.summary.partialControls }} partial · {{ p.scan.summary.compliantControls }} compliant
          </div>
        </template>
        <div v-else class="text-[10px] text-white/35 italic">Not yet scanned</div>

        <!-- Uploader -->
        <div class="flex items-center gap-2 mt-auto">
          <PersonaAvatar :persona="data.personaById[p.uploadedBy] ?? data.personas[0]" size="sm" />
          <span class="text-[10px] text-white/40">{{ data.personaById[p.uploadedBy]?.name ?? p.uploadedBy }} · {{ new Date(p.uploadedAt).toLocaleDateString('en-GB') }}</span>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!pol.policies.length" class="gr-card p-12 text-center border-dashed border-2 border-white/10">
      <div class="text-4xl mb-4">📄</div>
      <h3 class="font-bold text-lg mb-2">No policies yet</h3>
      <p class="text-sm text-white/45 max-w-sm mx-auto mb-5">
        Upload a data protection policy, AI governance policy, or security policy — GRCentral will instantly map it against
        GDPR, AI Act, NIS2, DORA, NIST CSF, and CRA controls.
      </p>
      <button class="btn btn-primary" @click="showUpload = true">Upload first policy</button>
    </div>
    <div v-else class="text-sm text-white/40 py-6 text-center">No policies match your search.</div>

  </div>

  <!-- ============ Upload Modal ============ -->
  <teleport to="body">
    <div v-if="showUpload" class="modal-backdrop" @click.self="closeUpload">
      <div class="modal-card" :class="uploadStep === 'result' ? 'flex flex-col' : ''">

        <!-- Step: form -->
        <div v-if="uploadStep === 'form'" class="p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">Upload Policy</h2>
            <button class="text-white/40 hover:text-white text-xl leading-none" @click="closeUpload">×</button>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-xs text-white/50 mb-1">Policy Title *</label>
              <input v-model="form.title" placeholder="e.g. Data Protection Policy" class="w-full input" />
            </div>
            <div>
              <label class="block text-xs text-white/50 mb-1">Version</label>
              <input v-model="form.version" placeholder="1.0" class="w-full input" />
            </div>
            <div>
              <label class="block text-xs text-white/50 mb-1">Status</label>
              <select v-model="form.status" class="w-full input">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="under-review">Under Review</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-xs text-white/50 mb-1">Description</label>
              <input v-model="form.description" placeholder="Brief description…" class="w-full input" />
            </div>
            <div class="col-span-2">
              <label class="block text-xs text-white/50 mb-1">Tags (comma-separated)</label>
              <input v-model="form.tags" placeholder="gdpr, privacy, data protection" class="w-full input" />
            </div>
          </div>

          <!-- File picker -->
          <div>
            <label class="block text-xs text-white/50 mb-2">Upload File (PDF, TXT, MD, HTML)</label>
            <label class="flex flex-col items-center gap-2 border-2 border-dashed border-white/15 rounded-xl p-6 cursor-pointer hover:border-babcom-500/40 transition-colors">
              <span class="text-2xl">{{ pickedFile ? '📄' : '☁️' }}</span>
              <span class="text-sm text-white/60">{{ pickedFile ? pickedFile.name : 'Click to pick a file' }}</span>
              <input ref="fileRef" type="file" accept=".pdf,.txt,.md,.html,.docx" class="hidden" @change="pickFile" />
            </label>
          </div>

          <!-- Or paste text -->
          <div>
            <label class="block text-xs text-white/50 mb-1">Or paste policy text directly</label>
            <textarea
              v-model="fileText"
              rows="5"
              placeholder="Paste full policy content here…"
              class="w-full input resize-none font-mono text-xs"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button class="btn btn-ghost" @click="closeUpload">Cancel</button>
            <button class="btn btn-primary" @click="submitUpload">Upload & Scan →</button>
          </div>
        </div>

        <!-- Step: scanning -->
        <div v-else-if="uploadStep === 'scanning'" class="p-12 text-center space-y-4">
          <div class="text-4xl animate-spin">⚙️</div>
          <h3 class="font-bold text-lg">Scanning against {{ data.frameworks.length }} frameworks…</h3>
          <p class="text-sm text-white/45">Matching policy sections against GDPR · AI Act · NIS2 · DORA · NIST CSF · CRA controls</p>
        </div>

        <!-- Step: result -->
        <div v-else-if="uploadStep === 'result' && lastUpload" class="flex flex-col max-h-[90vh]">

          <!-- Fixed header -->
          <div class="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 text-lg">✓</span>
                <h2 class="text-base font-bold">Scan Complete</h2>
              </div>
              <p class="text-xs text-white/50 mt-0.5">
                <span class="text-white font-medium">{{ lastUpload.title }}</span> scanned against {{ data.frameworks.length }} frameworks
              </p>
            </div>
            <button class="text-white/40 hover:text-white text-xl shrink-0" @click="closeUpload">×</button>
          </div>

          <!-- Summary stat bar (fixed) -->
          <div v-if="lastUpload.scan" class="px-5 py-3 grid grid-cols-3 divide-x divide-white/5 border-b border-white/5 shrink-0">
            <div class="text-center pr-4">
              <div class="text-2xl font-black text-emerald-300">{{ lastUpload.scan.summary.compliantControls }}</div>
              <div class="text-[9px] uppercase tracking-widest text-white/35 mt-0.5">Compliant</div>
            </div>
            <div class="text-center px-4">
              <div class="text-2xl font-black text-amber-300">{{ lastUpload.scan.summary.partialControls }}</div>
              <div class="text-[9px] uppercase tracking-widest text-white/35 mt-0.5">Partial</div>
            </div>
            <div class="text-center pl-4">
              <div class="text-2xl font-black text-rose-400">{{ lastUpload.scan.summary.missingControls }}</div>
              <div class="text-[9px] uppercase tracking-widest text-white/35 mt-0.5">Missing</div>
            </div>
          </div>

          <!-- Scrollable per-framework results -->
          <div v-if="lastUpload.scan" class="overflow-y-auto flex-1 px-5 py-4 space-y-3">
            <div v-for="fw in lastUpload.scan.byFramework" :key="fw.frameworkId"
                 class="rounded-xl border bg-white/[0.02]"
                 :class="fw.missing > 0 ? 'border-white/10' : 'border-emerald-500/15'">

              <!-- Framework header row -->
              <div class="flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="font-semibold text-sm">{{ fw.frameworkTitle }}</div>
                  <span class="chip text-[9px]">{{ fw.total }} controls</span>
                </div>
                <div class="text-sm font-black tabular-nums"
                     :style="`color: ${fw.coveragePct >= 60 ? '#34d399' : fw.coveragePct >= 35 ? '#fbbf24' : '#fb7185'}`">
                  {{ fw.coveragePct }}%
                </div>
              </div>

              <!-- Coverage bar -->
              <div class="px-4 pb-2">
                <div class="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-700"
                       :style="`width:${fw.coveragePct}%; background: ${fw.coveragePct >= 60 ? '#34d399' : fw.coveragePct >= 35 ? '#fbbf24' : '#fb7185'}`"></div>
                </div>
                <div class="flex gap-4 mt-1.5 text-[10px]">
                  <span class="text-emerald-300">✓ {{ fw.compliant }} compliant</span>
                  <span class="text-amber-300">~ {{ fw.partial }} partial</span>
                  <span class="text-rose-400">✗ {{ fw.missing }} missing</span>
                </div>
              </div>

              <!-- Missing controls — ALL shown, scrollable if many -->
              <div v-if="fw.missing > 0" class="border-t border-white/5 px-4 py-3">
                <div class="text-[9px] uppercase tracking-widest text-white/30 mb-2 flex items-center justify-between">
                  <span>Missing controls</span>
                  <span class="text-rose-400/70">{{ fw.missing }} gap{{ fw.missing !== 1 ? 's' : '' }}</span>
                </div>
                <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  <div
                    v-for="ctrl in fw.controls.filter(c => c.status === 'missing')"
                    :key="ctrl.controlId"
                    class="flex items-start gap-2 text-[10px] py-1 border-b border-white/[0.04] last:border-0"
                  >
                    <span class="text-rose-400 shrink-0 mt-0.5">✗</span>
                    <div>
                      <span class="font-semibold text-rose-300/90">{{ ctrl.code }}</span>
                      <span class="text-white/50 ml-1">{{ ctrl.title }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Partial controls (collapsed summary) -->
              <div v-if="fw.partial > 0" class="border-t border-white/5 px-4 py-2">
                <div class="text-[9px] text-amber-300/70">
                  ~ {{ fw.partial }} partial control{{ fw.partial !== 1 ? 's' : '' }} need additional evidence
                </div>
              </div>
            </div>
          </div>

          <!-- Fixed footer with actions -->
          <div class="px-5 py-4 border-t border-white/10 shrink-0 space-y-3">
            <!-- Risk impact callout -->
            <div v-if="lastUpload.scan && lastUpload.scan.summary.missingControls > 0"
                 class="flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
              <div class="text-xs text-white/70">
                <span class="text-amber-200 font-semibold">{{ lastUpload.scan.summary.missingControls }} gaps</span>
                across {{ data.frameworks.length }} frameworks have been added as risks.
              </div>
              <button
                class="text-xs text-amber-300 hover:text-amber-200 font-semibold shrink-0 ml-3 transition-colors"
                @click="closeUpload(); $router.push('/gaps')"
              >View Gaps →</button>
            </div>
            <div v-else-if="lastUpload.scan"
                 class="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-300">
              <span>✓</span>
              <span>Excellent coverage — no critical gaps found.</span>
            </div>

            <div class="flex gap-3">
              <button class="btn btn-ghost flex-1 text-xs justify-center" @click="resetUpload">Upload another</button>
              <button class="btn btn-ghost flex-1 text-xs justify-center" @click="closeUpload(); $router.push('/gaps')">
                View Compliance Gaps
              </button>
              <button class="btn btn-primary flex-1 text-xs justify-center" @click="closeUpload">Done</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </teleport>

  <!-- ============ Policy Viewer Modal ============ -->
  <teleport to="body">
    <div v-if="viewingPolicy" class="modal-backdrop" @click.self="viewingPolicy = null">
      <div class="modal-card">
        <div class="p-5 border-b border-white/10 flex items-start justify-between">
          <div>
            <h2 class="font-bold text-base">{{ viewingPolicy.title }}</h2>
            <div class="text-xs text-white/40 mt-0.5">v{{ viewingPolicy.version }} · {{ viewingPolicy.format }} · {{ viewingPolicy.status }}</div>
          </div>
          <button class="text-white/40 hover:text-white text-xl ml-4" @click="viewingPolicy = null">×</button>
        </div>

        <!-- Tab bar -->
        <div class="flex gap-1 px-5 pt-3 border-b border-white/5">
          <button
            v-for="tab in [{ id: 'overview', label: 'Overview' }, ...data.frameworks.map(f => ({ id: f.id, label: f.shortTitle }))]"
            :key="tab.id"
            class="px-3 py-1.5 text-xs rounded-t-lg transition-colors"
            :class="viewingScanned === tab.id ? 'bg-babcom-500/15 text-babcom-300 font-semibold' : 'text-white/40 hover:text-white'"
            @click="viewingScanned = tab.id"
          >{{ tab.label }}</button>
        </div>

        <div class="p-5 overflow-y-auto max-h-[60vh]">

          <!-- Overview tab -->
          <div v-if="viewingScanned === 'overview' && viewingPolicy.scan">
            <div class="grid grid-cols-3 gap-3 mb-5">
              <div class="gr-card p-3 text-center">
                <div class="text-2xl font-black text-emerald-300">{{ viewingPolicy.scan.summary.compliantControls }}</div>
                <div class="text-[9px] uppercase tracking-widest text-white/40 mt-1">Compliant</div>
              </div>
              <div class="gr-card p-3 text-center">
                <div class="text-2xl font-black text-amber-300">{{ viewingPolicy.scan.summary.partialControls }}</div>
                <div class="text-[9px] uppercase tracking-widest text-white/40 mt-1">Partial</div>
              </div>
              <div class="gr-card p-3 text-center">
                <div class="text-2xl font-black text-rose-400">{{ viewingPolicy.scan.summary.missingControls }}</div>
                <div class="text-[9px] uppercase tracking-widest text-white/40 mt-1">Missing</div>
              </div>
            </div>
            <div class="space-y-2">
              <div v-for="fw in viewingPolicy.scan.byFramework" :key="fw.frameworkId" class="flex items-center gap-3">
                <div class="text-xs text-white/65 w-20">{{ fw.frameworkTitle }}</div>
                <div class="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                  <div class="h-full rounded-full" :style="`width:${fw.coveragePct}%; background: ${fw.coveragePct >= 60 ? '#34d399' : fw.coveragePct >= 35 ? '#fbbf24' : '#fb7185'}`"></div>
                </div>
                <div class="text-xs tabular-nums w-10 text-right" :style="`color: ${fw.coveragePct >= 60 ? '#34d399' : fw.coveragePct >= 35 ? '#fbbf24' : '#fb7185'}`">{{ fw.coveragePct }}%</div>
              </div>
            </div>
          </div>

          <!-- Framework tab -->
          <div v-else-if="viewingScanned !== 'overview'">
            <div v-if="frameworkScan(viewingScanned)" class="space-y-2">
              <div
                v-for="ctrl in frameworkScan(viewingScanned)!.controls"
                :key="ctrl.controlId"
                class="gr-card p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="text-xs font-semibold">{{ ctrl.code }}: {{ ctrl.title }}</div>
                  <span :class="['text-[10px] font-bold uppercase', swatchClass(ctrl.status)]">{{ ctrl.status }}</span>
                </div>
                <div v-if="ctrl.snippets.length" class="mt-2 space-y-1">
                  <div v-for="(s, i) in ctrl.snippets" :key="i" class="text-[10px] text-white/50 italic border-l-2 border-white/10 pl-2">
                    "{{ s }}"
                  </div>
                </div>
                <div v-if="ctrl.matchedTerms.length" class="mt-1.5 flex flex-wrap gap-1">
                  <span v-for="t in ctrl.matchedTerms.slice(0, 5)" :key="t" class="chip text-[9px]">{{ t }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
@reference "../style.css";
.input {
  @apply bg-ink-800/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30
         focus:outline-none focus:border-babcom-500/40 w-full;
}
</style>
