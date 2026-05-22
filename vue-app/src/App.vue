<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar  from '@/components/AppTopbar.vue'
import ToastStack from '@/components/ToastStack.vue'
import { useDataStore } from '@/stores/data'
import { injectLiveEvent } from '@/composables/useLiveFeed'
import { useToast } from '@/composables/useToast'

const data  = useDataStore()
const toast = useToast()
const ready   = ref(false)

onMounted(() => {
  // Wire action-approved hook: push to live feed + toast
  data.onActionApproved((payload) => {
    const r = payload.risk
    injectLiveEvent({
      srcId:  'system',
      label:  'Risk closed via Preventive Action',
      detail: `${payload.action.id} approved — closed ${r?.id ?? 'risk'}${payload.driftDropped ? ` (-${payload.driftDropped} drift)` : ''}`,
      tone:   (r?.severity === 'critical' || r?.severity === 'high') ? 'good' : 'soft',
    })
    toast.push(
      'Risk closed ✓',
      `${r?.id ?? ''} closed · Drift −${payload.driftDropped}`,
    )
  })

  // Short splash then reveal
  setTimeout(() => { ready.value = true }, 320)
})
</script>

<template>
  <!-- Splash -->
  <transition name="splash">
    <div
      v-if="!ready"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950"
    >
      <div class="text-center">
        <img src="/babcom-logo.png" alt="BABCOM" class="w-36 h-auto mx-auto mb-4 select-none" draggable="false" />
        <div class="font-extrabold text-xl tracking-tight text-white">GRCentral</div>
        <div class="text-[9px] uppercase tracking-[0.4em] text-white/35 mt-1.5">GRC Platform</div>
        <div class="text-[9px] uppercase tracking-[0.4em] text-white/25 mt-6">Loading…</div>
      </div>
    </div>
  </transition>

  <!-- App shell -->
  <div
    v-if="ready"
    class="min-h-screen grid bg-ink-950 text-white font-sans antialiased"
    style="grid-template-columns: 260px 1fr"
  >
    <AppSidebar />

    <main class="min-w-0 flex flex-col">
      <AppTopbar />
      <section class="flex-1 p-6 max-w-[1400px] w-full mx-auto">
        <router-view />
      </section>
      <footer class="px-6 py-6 text-[11px] text-white/30 text-center border-t border-white/5 mt-8">
        GRCentral · powered by EUR-Lex · EDPB · ENISA · NIST · CISA · CERT-In · ICO · OWASP · CIS
      </footer>
    </main>
  </div>

  <ToastStack />
</template>

<style>
/* Not scoped — transition classes are applied to child route components
   which don't carry this component's scoped data attribute */
.splash-leave-active { transition: opacity .35s ease; }
.splash-leave-to     { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity .15s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
