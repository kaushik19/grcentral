<script setup lang="ts">
import { useRoute } from 'vue-router'
import { usePersonaStore } from '@/stores/persona'
import { useDataStore } from '@/stores/data'
import PersonaAvatar from '@/components/PersonaAvatar.vue'

const route   = useRoute()
const persona = usePersonaStore()
const data    = useDataStore()

// Icon map for nav items — SVG path data only
const ICONS: Record<string, string> = {
  '/dashboard': 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  '/radar':     'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 0v10m0 0l7-3',
  '/drift':     'M22 12h-4l-3 9L9 3l-3 9H2',
  '/gaps':      'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
  '/actions':   'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  '/controls':  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  '/policies':  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  '/evidence':  'M21 8v13H3V8 M1 3h22v5H1z M10 12h4',
  '/sources':   'M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  '/team':      'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  '/about':     'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
}

interface NavSection { section: string }
interface NavItem    { id: string; label: string }
type NavEntry = NavSection | NavItem
function isSection(e: NavEntry): e is NavSection { return 'section' in e }

const NAV: NavEntry[] = [
  { section: 'Workspace' },
  { id: '/dashboard', label: 'Dashboard' },
  { id: '/radar',     label: 'Regulatory Radar' },
  { id: '/drift',     label: 'Risk Drift' },
  { section: 'Compliance' },
  { id: '/gaps',     label: 'Compliance Gaps' },
  { id: '/actions',  label: 'Preventive Actions' },
  { id: '/controls', label: 'Controls' },
  { id: '/policies', label: 'Internal Policies' },
  { id: '/evidence', label: 'Evidence Vault' },
  { section: 'Configuration' },
  { id: '/sources', label: 'Sources' },
  { id: '/team',    label: 'Team' },
  { id: '/about',   label: 'About' },
]

function isActive(id: string): boolean {
  return route.path === id || (id === '/radar' && route.path.startsWith('/regulation/'))
}
</script>

<template>
  <aside class="border-r border-white/5 bg-ink-900/80 backdrop-blur-xl sticky top-0 h-screen flex flex-col overflow-hidden">

    <!-- Logo -->
    <div class="px-4 py-4 border-b border-white/5 shrink-0">
      <!-- BABCOM logo — landscape PNG, constrain width -->
      <img
        src="/babcom-logo.png"
        alt="BABCOM"
        class="w-[108px] h-auto select-none block"
        draggable="false"
      />
      <div class="mt-2 font-extrabold tracking-tight text-[13px] leading-none text-white/80">
        GRCentral
        <span class="ml-1.5 text-[8px] font-normal uppercase tracking-[0.25em] text-white/30">GRC</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 text-sm min-h-0">
      <template v-for="item in NAV" :key="isSection(item) ? item.section : (item as NavItem).id">
        <div v-if="isSection(item)" class="nav-section">{{ item.section }}</div>
        <router-link
          v-else
          :to="(item as NavItem).id"
          class="nav-item"
          :class="{ active: isActive((item as NavItem).id) }"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0">
            <path :d="ICONS[(item as NavItem).id] ?? 'M12 2l0 20'" />
          </svg>
          <span>{{ (item as NavItem).label }}</span>
          <!-- Unread badge on Gaps and Radar -->
          <span
            v-if="(item as NavItem).id === '/gaps' && data.openRisks.length"
            class="ml-auto text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full px-1.5 py-0.5 leading-none"
          >{{ data.openRisks.length }}</span>
          <span
            v-if="(item as NavItem).id === '/radar' && data.radarChanges.filter(c => !data.ackedChanges.has(c.id)).length"
            class="ml-auto text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-1.5 py-0.5 leading-none"
          >{{ data.radarChanges.filter(c => !data.ackedChanges.has(c.id)).length }}</span>
        </router-link>
      </template>
    </nav>

    <!-- Persona switcher -->
    <div class="px-3 pb-4 border-t border-white/5 pt-3 shrink-0">
      <div class="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
        <PersonaAvatar :persona="persona.current" />
        <div class="text-left leading-tight min-w-0">
          <div class="text-[12px] font-semibold truncate">{{ persona.current.name }}</div>
          <div class="text-[10px] text-white/45 truncate">{{ persona.current.role }}</div>
        </div>
      </div>
    </div>

  </aside>
</template>
