<template>
  <div
    :class="[
      'animate-pulse bg-[#E8E8E8]',
      rounded ? 'rounded-xl' : 'rounded',
      heightClass,
      widthClass,
    ]"
    aria-hidden
  />
</template>

<script setup lang="ts">
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'full'

const props = withDefaults(
  defineProps<{
    width?: Size
    height?: Size
    rounded?: boolean
  }>(),
  {
    width: 'full',
    height: 'md',
    rounded: true,
  }
)

const widthClass = computed(() => {
  const map: Record<Size, string> = {
    xs: 'w-8',
    sm: 'w-16',
    md: 'w-24',
    lg: 'w-32',
    full: 'w-full',
  }
  return map[props.width]
})

const heightClass = computed(() => {
  const map: Record<Size, string> = {
    xs: 'h-2',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    full: 'h-full',
  }
  return map[props.height]
})
</script>
