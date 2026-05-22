import { ref } from 'vue'

export interface Toast {
  id:    string
  title: string
  body?: string
  ttl:   number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function push(title: string, body?: string, ttl = 5000): void {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    toasts.value.push({ id, title, body, ttl })
    setTimeout(() => dismiss(id), ttl)
  }

  function dismiss(id: string): void {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx >= 0) toasts.value.splice(idx, 1)
  }

  return { toasts, push, dismiss }
}
