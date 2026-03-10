<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="mb-1 block text-sm font-medium text-[#1A1A1A]"
    >
      {{ label }}
    </label>
    <div class="relative">
      <span v-if="$slots.icon" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
        <slot name="icon" />
      </span>
      <input
        :id="inputId"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[
          'w-full rounded-xl border bg-white py-3 text-[#1A1A1A] placeholder:text-[#666666] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F47B20] focus:ring-offset-0 disabled:opacity-60',
          $slots.icon ? 'pl-10 pr-4' : 'px-4',
          error
            ? 'border-[#EF4444] focus:ring-[#EF4444]'
            : 'border-[#E8E8E8] hover:border-[#666666]',
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <p v-if="error" class="mt-1 text-sm text-[#EF4444]">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    error?: string
    type?: string
    modelValue?: string
    disabled?: boolean
  }>(),
  {
    type: 'text',
    modelValue: '',
    disabled: false,
  }
)

defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = useId()
</script>
