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
    success: 'bg-[#22C55E]/15 text-[#22C55E]',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B]',
    error: 'bg-[#EF4444]/15 text-[#EF4444]',
    info: 'bg-[#F47B20]/15 text-[#F47B20]',
    default: 'bg-[#E8E8E8] text-[#666666]',
  }
  return map[props.variant]
})
</script>
