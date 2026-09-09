<template>
  <span>{{ label }}</span>
</template>

<script setup lang="ts">
const props = defineProps<{
  deadlineMs: number
}>()

const emit = defineEmits<{
  timeout: []
}>()

const nowMs = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
let timedOut = false

const secondsLeft = computed(() =>
  Math.max(0, Math.ceil((props.deadlineMs - nowMs.value) / 1000)),
)

const label = computed(() => {
  const sec = secondsLeft.value
  const mm = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0')
  const ss = (sec % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
})

function tick() {
  nowMs.value = Date.now()
  if (!timedOut && secondsLeft.value <= 0) {
    timedOut = true
    emit('timeout')
  }
}

watch(
  () => props.deadlineMs,
  () => {
    timedOut = false
    tick()
  },
)

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>
