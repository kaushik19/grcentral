<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { useLiveFeed, type LiveEvent } from '@/composables/useLiveFeed'
import { fmtAgo } from '@/utils/fmt'

const route  = useRoute()
const router = useRouter()
const data   = useDataStore()
const live   = useLiveFeed()

// ---- Clock ---------------------------------------------------------------
const now = ref(new Date())
const clockTimer = setInterval(() => { now.value = new Date() }, 1000)
onUnmounted(() => clearInterval(clockTimer))
const clock = computed(() => now.value.toLocaleTimeString('en-IN', { hour12: false }))

// ---- Breadcrumb ----------------------------------------------------------
const section = computed(() => (route.meta.section as string) ?? 'Workspace')
const page    = computed(() => route.path.startsWith('/regulation/') ? 'Regulation Detail' : (route.meta.page as string) ?? '')

// ---- Search --------------------------------------------------------------
const q = ref('')

// ---- Notification panel --------------------------------------------------
const notifOpen  = ref(false)
// Track count of events seen when panel was last opened
const seenCount  = ref(0)

const allEvents  = computed(() => live.log.value)
const unreadCount = computed(() => Math.max(0, allEvents.value.length - seenCount.value))

function toggleNotif() {
  notifOpen.value = !notifOpen.value
  if (notifOpen.value) seenCount.value = allEvents.value.length
}

// Close on outside click
function handleOutside(e: MouseEvent) {
  const el = document.getElementById('notif-panel')
  const btn = document.getElementById('notif-btn')
  if (notifOpen.value && el && !el.contains(e.target as Node) && !btn?.contains(e.target as Node)) {
    notifOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', handleOutside, true))
onUnmounted(() => document.removeEventListener('click', handleOutside, true))

// Tone → colour mapping
const TONE_CLASS: Record<string, string> = {
  good: 'text-emerald-300',
  warn: 'text-amber-300',
  hot:  'text-rose-300',
  soft: 'text-white/60',
}
function toneClass(ev: LiveEvent) { return TONE_CLASS[ev.tone] ?? 'text-white/60' }

// Badge colour
const badgeColour = computed(() => {
  if (allEvents.value.some(e => e.tone === 'hot'))   return 'bg-rose-500'
  if (allEvents.value.some(e => e.tone === 'warn'))  return 'bg-amber-500'
  if (allEvents.value.some(e => e.tone === 'good'))  return 'bg-emerald-500'
  return 'bg-babcom-500'
})
</script>

<template>
  <header class="sticky top-0 z-30 bg-ink-950/80 backdrop-blur-xl border-b border-white/5">
    <div class="flex items-center gap-3 px-6 py-3">

      <!-- Breadcrumb -->
      <div class="flex items-center gap-1.5 text-xs text-white/45 shrink-0 select-none">
        <span>{{ section }}</span>
        <span class="text-white/20">›</span>
        <span class="text-white/80 font-medium">{{ page }}</span>
      </div>

      <!-- Search (grows) -->
      <div class="flex-1 max-w-sm ml-4">
        <div class="relative">
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35 pointer-events-none"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="q"
            placeholder="Search…"
            class="w-full pl-8 pr-3 py-1.5 rounded-lg bg-ink-800 border border-white/5 text-xs placeholder:text-white/25 focus:outline-none focus:border-babcom-500/40"
          />
        </div>
      </div>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Live clock -->
      <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-ink-800/70 select-none">
        <span class="pulse-dot"></span>
        <span class="text-[10px] uppercase tracking-[0.22em] text-white/50">Live</span>
        <span class="font-mono text-[12px] tabular-nums text-white/80">{{ clock }}</span>
        <span class="text-[9px] text-white/30">IST</span>
      </div>

      <!-- Notification Bell -->
      <div class="relative">
        <button
          id="notif-btn"
          class="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/5 transition-colors"
          :class="notifOpen ? 'bg-white/5' : ''"
          @click="toggleNotif"
        >
          <!-- Bell SVG -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"
               class="w-4.5 h-4.5 text-white/70">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>

          <!-- Unread badge -->
          <transition name="badge">
            <span
              v-if="unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center text-white leading-none"
              :class="badgeColour"
            >{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </transition>
        </button>

        <!-- Dropdown panel -->
        <transition name="panel">
          <div
            v-if="notifOpen"
            id="notif-panel"
            class="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-ink-800/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden z-50"
          >
            <!-- Panel header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div class="flex items-center gap-2">
                <span class="pulse-dot"></span>
                <span class="text-xs font-semibold text-white/80">Live Activity</span>
                <span class="text-[9px] text-white/35">11 feeds</span>
              </div>
              <span class="text-[10px] text-white/35 tabular-nums">{{ allEvents.length }} events</span>
            </div>

            <!-- Event list -->
            <div class="overflow-y-auto max-h-[420px]">
              <div v-if="!allEvents.length" class="px-4 py-8 text-center text-xs text-white/30 italic">
                Listening to regulatory feeds…
              </div>
              <div
                v-for="(ev, idx) in allEvents.slice(0, 25)"
                :key="ev.id"
                class="flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                :class="idx < unreadCount ? 'bg-white/[0.015]' : ''"
              >
                <!-- Tone indicator -->
                <div
                  class="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                  :class="{
                    'bg-emerald-400': ev.tone === 'good',
                    'bg-amber-400':   ev.tone === 'warn',
                    'bg-rose-400':    ev.tone === 'hot',
                    'bg-white/20':    ev.tone === 'soft',
                  }"
                ></div>
                <div class="flex-1 min-w-0">
                  <div class="text-[11px] font-semibold leading-snug" :class="toneClass(ev)">
                    {{ ev.label }}
                  </div>
                  <div class="text-[10px] text-white/40 leading-snug mt-0.5">{{ ev.detail }}</div>
                  <div class="text-[9px] text-white/25 mt-1 tabular-nums">{{ fmtAgo(ev.at) }}</div>
                </div>
                <!-- "New" pill for unseen -->
                <span
                  v-if="idx < unreadCount"
                  class="shrink-0 mt-0.5 text-[8px] font-black uppercase bg-babcom-500/20 text-babcom-300 border border-babcom-500/30 rounded-full px-1.5 py-0.5 leading-none"
                >new</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
              <button
                class="text-[10px] text-white/40 hover:text-white transition-colors"
                @click="seenCount = allEvents.length; notifOpen = false"
              >Mark all read</button>
              <button
                class="text-[10px] text-babcom-400 hover:text-babcom-300 transition-colors"
                @click="notifOpen = false; router.push('/radar')"
              >View Radar →</button>
            </div>
          </div>
        </transition>
      </div>

    </div>
  </header>
</template>

<style scoped>
.badge-enter-active, .badge-leave-active { transition: transform .15s, opacity .15s; }
.badge-enter-from  { transform: scale(0); opacity: 0; }
.badge-leave-to    { transform: scale(0); opacity: 0; }

.panel-enter-active { transition: opacity .15s, transform .15s; }
.panel-leave-active { transition: opacity .1s, transform .1s; }
.panel-enter-from   { opacity: 0; transform: translateY(-6px) scale(0.97); }
.panel-leave-to     { opacity: 0; transform: translateY(-4px) scale(0.97); }
</style>
