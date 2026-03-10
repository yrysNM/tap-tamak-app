<template>
  <button
    type="button"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
      sizeClasses,
      variantClasses,
      fullWidth ? 'w-full' : '',
    ]"
    @click="$emit('click')"
  >
    <Icon
      v-if="loading"
      name="svg-spinners:90-ring-with-bg"
      class="size-5 shrink-0"
      aria-hidden
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    loading?: boolean
    disabled?: boolean
    fullWidth?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false,
  }
)

defineEmits<{
  click: []
}>()

const sizeClasses = computed(() => {
  const map: Record<Size, string> = {
    sm: 'rounded-3xl px-4 py-2 text-sm',
    md: 'rounded-3xl px-6 py-3 text-base',
    lg: 'rounded-3xl px-8 py-4 text-lg',
  }
  return map[props.size]
})

const variantClasses = computed(() => {
  const map: Record<Variant, string> = {
    primary:
      'bg-[#F47B20] text-white hover:bg-[#D4611A] active:bg-[#D4611A]',
    outline:
      'border-2 border-[#F47B20] bg-transparent text-[#F47B20] hover:bg-[#FFF8F3] active:bg-[#FFF8F3]',
    ghost:
      'bg-transparent text-[#1A1A1A] hover:bg-[#FFF8F3] active:bg-[#FFF8F3]',
  }
  return map[props.variant]
})
</script>
