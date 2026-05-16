import { ref, watch, onUnmounted, computed, isRef, type Ref } from 'vue'

export function useCountUp(
  target: number | Ref<number> | (() => number),
  duration = 600
) {
  const display = ref(0)
  let animId: number | null = null
  let startTime = 0

  const targetRef: Ref<number> = isRef(target)
    ? (target as Ref<number>)
    : typeof target === 'function'
      ? computed(target as () => number)
      : ref(target)

  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    display.value = Math.round(eased * targetRef.value)
    if (progress < 1) {
      animId = requestAnimationFrame(animate)
    }
  }

  const start = () => {
    stop()
    if (targetRef.value === 0) {
      display.value = 0
      return
    }
    startTime = 0
    animId = requestAnimationFrame(animate)
  }

  const stop = () => {
    if (animId !== null) {
      cancelAnimationFrame(animId)
      animId = null
    }
  }

  watch(targetRef, start, { immediate: true })

  onUnmounted(stop)

  return { display, start, stop }
}
