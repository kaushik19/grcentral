<script setup lang="ts">
import type { Severity } from '@/types'
import { severityColour } from '@/utils/fmt'

const props = defineProps<{ severity: Severity }>()
const c = () => severityColour(props.severity)
</script>

<template>
  <span
    class="chip capitalize"
    :class="[c().bg, c().text, c().border]"
  >{{ severity }}</span>
</template>
