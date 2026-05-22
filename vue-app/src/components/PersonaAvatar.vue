<script setup lang="ts">
import type { Persona } from '@/types'
const COLOURS = ['#ff5a1f', '#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#60a5fa']
defineProps<{ persona: Persona; size?: 'sm' | 'md' | 'lg' }>()
function bg(p: Persona): string {
  const idx = p.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % COLOURS.length
  return COLOURS[idx]
}
</script>

<template>
  <span
    class="inline-flex items-center justify-center rounded-full font-bold select-none shrink-0"
    :class="{
      'w-6 h-6 text-[10px]': size === 'sm',
      'w-8 h-8 text-[11px]': !size || size === 'md',
      'w-10 h-10 text-sm':   size === 'lg',
    }"
    :style="`background: ${bg(persona)}`"
  >{{ persona.avatar }}</span>
</template>
