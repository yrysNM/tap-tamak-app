<template>
  <div
    :class="[
      'inline-flex items-center gap-0.5 text-[#F47B20]',
      size === 'sm' ? 'text-sm' : 'text-base',
    ]"
    role="img"
    :aria-label="`Rating: ${value} out of 5`"
  >
    <span
      v-for="i in 5"
      :key="i"
      class="inline-block shrink-0"
      :class="readonly ? 'pointer-events-none' : 'cursor-pointer'"
      @click="!readonly && $emit('update:value', i)"
    >
      <Icon
        :name="starIcon(i)"
        class="size-full"
        aria-hidden
      />
    </span>
    <span v-if="showValue" class="ml-1 font-medium text-[#1A1A1A]">
      {{ displayValue }}
    </span>
  </div>
</template>

<script setup lang="ts">
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    value: number
    readonly?: boolean
    size?: Size
    showValue?: boolean
  }>(),
  {
    readonly: true,
    size: 'md',
    showValue: false,
  }
)

defineEmits<{
  'update:value': [value: number]
}>()

function starIcon(index: number): string {
  const v = props.value
  if (v >= index) return 'material-symbols:star'
  if (v >= index - 0.5) return 'material-symbols:star-half-rounded'
  return 'material-symbols:star-outline-rounded'
}

const displayValue = computed(() =>
  Number.isInteger(props.value) ? props.value.toFixed(1) : props.value.toFixed(1)
)
</script>
