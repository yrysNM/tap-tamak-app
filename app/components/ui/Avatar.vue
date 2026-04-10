<template>
  <div
    :class="[
      'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-white',
      sizeClasses,
    ]"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name"
      class="size-full object-cover"
      @error="showFallback = true"
    >
    <span v-else-if="showFallback || !src" class="select-none">
      {{ initials }}
    </span>
  </div>
</template>

<script setup lang="ts">
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    src?: string
    name: string
    size?: Size
  }>(),
  {
    size: 'md',
  }
)

const showFallback = ref(!props.src)

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return props.name.slice(0, 2).toUpperCase()
})

const sizeClasses = computed(() => {
  const map: Record<Size, string> = {
    sm: 'size-8 text-xs',
    md: 'size-12 text-base',
    lg: 'size-16 text-lg',
  }
  return map[props.size]
})
</script>
