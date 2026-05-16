import { ref } from 'vue'

export function useToast() {
  const show = ref(false)
  const message = ref('')
  const type = ref<'success' | 'error'>('success')

  const showToast = (msg: string, t: 'success' | 'error' = 'success'): void => {
    message.value = msg
    type.value = t
    show.value = true
  }

  const hideToast = (): void => {
    show.value = false
  }

  return { show, message, type, showToast, hideToast }
}
