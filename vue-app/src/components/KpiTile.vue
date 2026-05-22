<script setup lang="ts">
defineProps<{
  label:  string
  value:  string | number
  icon?:  string
  color?: string
  route?: string
}>()
</script>

<template>
  <component
    :is="route ? 'router-link' : 'div'"
    :to="route"
    class="gr-card p-4 block"
    :class="route ? 'hover:border-babcom-500/30 cursor-pointer transition-colors' : ''"
  >
    <div class="flex items-start justify-between">
      <div class="text-[10px] uppercase tracking-[0.22em] text-white/40">{{ label }}</div>
    </div>
    <div class="text-3xl font-extrabold mt-2 tabular-nums" :style="color ? `color: ${color}` : ''">
      {{ value }}
    </div>
  </component>
</template>
