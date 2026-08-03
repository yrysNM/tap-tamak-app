<script setup lang="ts">
import type { ReportReason, ReportTargetType } from '~/types/moderation'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  targetType: ReportTargetType
  targetId: string
  targetLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  submitted: []
}>()

const moderation = useModerationStore()
const toast = usePageToast()

const reason = ref<ReportReason>('OFFENSIVE_CONTENT')
const details = ref('')
const submitting = ref(false)

const reasonOptions = computed(() => [
  { value: 'OFFENSIVE_CONTENT' as const, label: t('l_Report_reason_offensive') },
  { value: 'HARASSMENT' as const, label: t('l_Report_reason_harassment') },
  { value: 'HATE' as const, label: t('l_Report_reason_hate') },
  { value: 'SPAM' as const, label: t('l_Report_reason_spam') },
  { value: 'FRAUD' as const, label: t('l_Report_reason_fraud') },
  { value: 'OTHER' as const, label: t('l_Report_reason_other') },
])

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  submitting.value = true
  try {
    await moderation.reportContent({
      targetType: props.targetType,
      targetId: props.targetId,
      reason: reason.value,
      details: details.value.trim() || undefined,
    })
    toast.show(t('l_Report_submitted'), 'success')
    emit('submitted')
    close()
  } catch {
    toast.show(t('l_Report_failed'), 'error')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    reason.value = 'OFFENSIVE_CONTENT'
    details.value = ''
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
  },
)

watch(
  () => props.modelValue,
  (open) => {
    if (!open && typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-10000 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" @click="close" />
      <div class="safe-sheet relative w-full max-w-md rounded-t-3xl border border-border bg-white shadow-elevated sm:rounded-3xl">
        <header class="border-b border-border px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-dark">{{ t('l_Report_content_title') }}</h2>
              <p v-if="targetLabel" class="mt-1 text-xs text-muted">{{ targetLabel }}</p>
            </div>
            <button type="button" class="flex size-10 items-center justify-center rounded-xl text-caption"
              :aria-label="t('l_Close')" @click="close">
              <Icon name="material-symbols:close-rounded" class="size-6" />
            </button>
          </div>
        </header>

        <div class="space-y-4 px-5 py-5">
          <p class="text-sm text-body">{{ t('l_Report_content_hint') }}</p>

          <UiSelect v-model="reason" :label="t('l_Report_reason_label')" :options="reasonOptions" />

          <label class="block">
            <span class="mb-1 block text-sm font-semibold text-dark">{{ t('l_Report_details_label') }}</span>
            <textarea v-model.trim="details" rows="3"
              class="w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-dark outline-none"
              :placeholder="t('l_Report_details_placeholder')" />
          </label>

          <UiButton variant="primary" size="md" fullWidth :disabled="submitting" @click="submit">
            {{ submitting ? t('l_Loading') : t('l_Report_submit') }}
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
