<template>
  <div
    :class="[
      'rounded-xl bg-white shadow-[0_2px_12px_0_rgba(0,0,0,0.06)]',
      paddingClasses,
      hover ? 'transition-transform duration-200 hover:-translate-y-0.5' : '',
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
type Padding = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    padding?: Padding
    hover?: boolean
  }>(),
  {
    padding: 'md',
    hover: false,
  }
)

const paddingClasses = computed(() => {
  const map: Record<Padding, string> = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }
  return map[props.padding]
})
</script>
