import { ref, watch, onUnmounted, computed, isRef, type Ref } from 'vue'

type ActiveCounter = {
  display: Ref<number>
  targetRef: Ref<number>
  duration: number
  startTime: number
}

let activeCounters: ActiveCounter[] = []
let globalRafId: number | null = null

function globalTick(timestamp: number): void {
  const remaining: ActiveCounter[] = []
  for (const c of activeCounters) {
    if (!c.startTime) c.startTime = timestamp
    const elapsed = timestamp - c.startTime
    const progress = Math.min(elapsed / c.duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    c.display.value = Math.round(eased * c.targetRef.value)
    if (progress < 1) {
      remaining.push(c)
    }
  }
  activeCounters = remaining
  if (activeCounters.length > 0) {
    globalRafId = requestAnimationFrame(globalTick)
  } else {
    globalRafId = null
  }
}

function registerCounter(c: ActiveCounter): void {
  activeCounters.push(c)
  if (!globalRafId) {
    globalRafId = requestAnimationFrame(globalTick)
  }
}

function unregisterCounter(c: ActiveCounter): void {
  activeCounters = activeCounters.filter((x) => x !== c)
  if (activeCounters.length === 0 && globalRafId !== null) {
    cancelAnimationFrame(globalRafId)
    globalRafId = null
  }
}

export function useCountUp(target: number | Ref<number> | (() => number), duration = 600) {
  const display = ref(0)

  const targetRef: Ref<number> = isRef(target)
    ? (target as Ref<number>)
    : typeof target === 'function'
      ? computed(target as () => number)
      : ref(target)

  let counter: ActiveCounter | null = null

  const start = () => {
    stop()
    if (targetRef.value === 0) {
      display.value = 0
      return
    }
    counter = { display, targetRef, duration, startTime: 0 }
    registerCounter(counter)
  }

  const stop = () => {
    if (counter) {
      unregisterCounter(counter)
      counter = null
    }
  }

  watch(targetRef, start, { immediate: true })

  onUnmounted(stop)

  return { display, start, stop }
}
