import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDataStore } from './data'

export const usePersonaStore = defineStore('persona', () => {
  const data = useDataStore()
  const currentId = ref<string>('aarav')   // default: CCO

  const current = computed(() => data.personaById[currentId.value] ?? data.personas[0])

  function switchTo(id: string): void {
    if (data.personaById[id]) currentId.value = id
  }

  return { currentId, current, switchTo }
})
