<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="mb-1 block text-sm font-medium text-dark">
      {{ label }}
    </label>
    <div class="relative">
      <span v-if="$slots.icon" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
        <slot name="icon" />
      </span>
      <input :id="inputId" :value="modelValue" :type="type" :placeholder="placeholder" :disabled="disabled"
        :autocomplete="autocomplete" :class="[
          'w-full rounded-xl border bg-white py-3 text-dark placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 disabled:opacity-60',
          $slots.icon ? 'pl-10' : 'pl-4',
          $slots.suffix ? 'pr-10' : 'pr-4',
          error
            ? 'border-error focus:ring-error'
            : 'border-border hover:border-muted',
        ]" @input="onInput" @focus="onFocus" @keydown="onKeydown" @click="onCaretGuard" />
      <span v-if="$slots.suffix" class="absolute right-3 top-1/2 -translate-y-1/2">
        <slot name="suffix" />
      </span>
    </div>
    <p v-if="error" class="mt-1 text-sm text-error">
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
    phoneMask?: boolean
    autocomplete?: string
  }>(),
  {
    type: 'text',
    modelValue: '',
    disabled: false,
    phoneMask: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = useId()
const PHONE_PREFIX = '+7'
const PHONE_PREFIX_LEN = PHONE_PREFIX.length

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^7/, '').slice(0, 10)

  let result = PHONE_PREFIX

  if (digits.length > 0) {
    result += ' (' + digits.slice(0, 3)
  }

  if (digits.length >= 3) {
    result += ')'
  }

  if (digits.length >= 4) {
    result += ' ' + digits.slice(3, 6)
  }

  if (digits.length >= 7) {
    result += '-' + digits.slice(6, 8)
  }

  if (digits.length >= 9) {
    result += '-' + digits.slice(8, 10)
  }

  return result
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const inputEvent = event as InputEvent

  let value = target.value
  const prevFormatted = String(props.modelValue ?? '')

  if (props.phoneMask) {
    const digitsBefore = value.replace(/\D/g, '').replace(/^7/, '').slice(0, 10)

    // If user backspaces a formatting char (like ')'), browsers often leave digits unchanged.
    // To make backspace on formatting feel natural, delete one digit at/left of the caret
    // when a non-digit was removed.
    if (
      inputEvent?.inputType === 'deleteContentBackward' &&
      prevFormatted.length === value.length + 1 &&
      /\D/.test(prevFormatted.charAt((target.selectionStart ?? value.length) /* after deletion */))
    ) {
      const caret = target.selectionStart ?? value.length
      const prevChar = prevFormatted.charAt(caret) // char that was removed from prev -> current

      const digitsTrimmed = digitsBefore.slice(0, Math.max(0, digitsBefore.length - 1))
      value = `${PHONE_PREFIX}${digitsTrimmed}`
    }

    value = formatPhone(value)
    target.value = value
  }

  emit('update:modelValue', value)
}

function onFocus(event: Event) {
  if (!props.phoneMask) return

  const target = event.target as HTMLInputElement
  const current = String(props.modelValue ?? '')

  if (!current.startsWith(PHONE_PREFIX)) {
    const next = formatPhone(current)
    emit('update:modelValue', next)
    target.value = next
  }

  requestAnimationFrame(() => guardPhoneCaret(target))
}

function onKeydown(event: KeyboardEvent) {
  if (!props.phoneMask) return

  const target = event.target as HTMLInputElement
  const start = target.selectionStart ?? 0
  const end = target.selectionEnd ?? 0

  if (
    (event.key === 'Backspace' && start <= PHONE_PREFIX_LEN && end <= PHONE_PREFIX_LEN) ||
    (event.key === 'Delete' && start < PHONE_PREFIX_LEN && end <= PHONE_PREFIX_LEN)
  ) {
    event.preventDefault()
  }
}

function guardPhoneCaret(target: HTMLInputElement) {
  if (!props.phoneMask) return

  const start = target.selectionStart ?? 0
  const end = target.selectionEnd ?? 0

  if (start < PHONE_PREFIX_LEN || end < PHONE_PREFIX_LEN) {
    target.setSelectionRange(
      Math.max(start, PHONE_PREFIX_LEN),
      Math.max(end, PHONE_PREFIX_LEN),
    )
  }
}

function onCaretGuard(event: Event) {
  if (!props.phoneMask) return
  guardPhoneCaret(event.target as HTMLInputElement)
}
</script>
