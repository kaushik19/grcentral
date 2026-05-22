<script setup lang="ts">
import { useToast } from '@/composables/useToast'
const { toasts, dismiss } = useToast()
</script>

<template>
  <teleport to="body">
    <div class="toast-stack">
      <transition-group name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast cursor-pointer"
          @click="dismiss(t.id)"
        >
          <div v-if="t.title" class="toast-title">{{ t.title }}</div>
          <div v-if="t.body"  class="toast-body">{{ t.body }}</div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: opacity .2s, transform .2s; }
.toast-enter-from  { opacity: 0; transform: translateY(-8px); }
.toast-leave-to    { opacity: 0; transform: translateY(-8px); }
</style>
