<script setup lang="ts">
import { useDataStore } from '@/stores/data'
const data = useDataStore()
</script>

<template>
  <div class="space-y-6 fade-up">
    <h1 class="text-xl font-extrabold">About GRCentral</h1>
    <div class="gr-card p-6 space-y-4">
      <div class="flex items-center gap-4">
        <div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-babcom-500 to-babcom-700 flex items-center justify-center shadow-[0_0_30px_rgba(255,90,31,0.4)]">
          <span class="font-black text-xl">GR</span>
        </div>
        <div>
          <div class="font-extrabold text-lg">GRCentral</div>
          <div class="text-xs text-white/40">Continuous Governance, Risk &amp; Compliance · by babcom</div>
        </div>
      </div>
      <p class="text-sm text-white/60 leading-relaxed">
        GRCentral automatically scans your internal policies against <strong class="text-white">{{ data.frameworks.length }} real regulatory frameworks</strong>
        (GDPR, AI Act, NIS2, DORA, NIST CSF 2.0, CRA) and shows you exactly which controls are compliant, partial, or missing —
        with no manual configuration required.
      </p>
      <div class="grid grid-cols-2 gap-4 text-xs text-white/50">
        <div><span class="text-white font-semibold">{{ data.frameworks.reduce((s, f) => s + f.controls.length, 0) }}</span> real framework controls tracked</div>
        <div><span class="text-white font-semibold">11</span> regulatory feeds monitored</div>
        <div><span class="text-white font-semibold">6</span> frameworks: GDPR · AI Act · NIS2 · DORA · NIST CSF · CRA</div>
        <div><span class="text-white font-semibold">Real-time</span> drift calculation engine</div>
      </div>
    </div>
    <div class="gr-card p-5">
      <div class="text-[10px] uppercase tracking-widest text-white/40 mb-3">Tech Stack</div>
      <div class="grid grid-cols-2 gap-2 text-xs text-white/60">
        <div>Vue 3 + TypeScript + Vite</div>
        <div>Pinia reactive stores</div>
        <div>Tailwind CSS v4</div>
        <div>Vue Router 4</div>
        <div>Vercel Blob (policy storage)</div>
        <div>Vitest (40 unit tests)</div>
        <div>EUR-Lex / NIST / CISA / EDPB APIs</div>
        <div>Zero mock data (except personas)</div>
      </div>
    </div>
  </div>
</template>
