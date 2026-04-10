<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
      variantClasses,
    ]"
  >
    {{ text }}
  </span>
</template>

<script setup lang="ts">
type Variant = 'success' | 'warning' | 'error' | 'info' | 'default'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    text: string
  }>(),
  {
    variant: 'default',
  }
)

const variantClasses = computed(() => {
  const map: Record<Variant, string> = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-error/15 text-error',
    info: 'bg-primary/15 text-primary',
    default: 'bg-border text-muted',
  }
  return map[props.variant]
})
</script>
