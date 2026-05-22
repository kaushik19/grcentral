<script setup lang="ts">
import { useDataStore } from '@/stores/data'
import PersonaAvatar from '@/components/PersonaAvatar.vue'

const data = useDataStore()
</script>

<template>
  <div class="space-y-6 fade-up">
    <div>
      <h1 class="text-xl font-extrabold">Team</h1>
      <p class="text-xs text-white/40 mt-1">Personas using this GRC platform</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="p in data.personas" :key="p.id" class="gr-card p-5 flex items-center gap-4">
        <PersonaAvatar :persona="p" size="lg" />
        <div>
          <div class="font-semibold">{{ p.name }}</div>
          <div class="text-xs text-white/45 mt-0.5">{{ p.role }}</div>
          <div class="text-[10px] text-babcom-400 mt-1">{{ p.email }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
