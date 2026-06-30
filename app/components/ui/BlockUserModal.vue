<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  blockedUserId?: string
  cookId?: string
  targetLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  blocked: []
}>()

const moderation = useModerationStore()
const toast = usePageToast()
const submitting = ref(false)

function close() {
  emit('update:modelValue', false)
}

async function confirmBlock() {
  if (!props.blockedUserId && !props.cookId) return
  submitting.value = true
  try {
    await moderation.blockUser({
      blockedUserId: props.blockedUserId,
      cookId: props.cookId,
    })
    toast.show(t('l_Block_success'), 'success')
    emit('blocked')
    close()
  } catch {
    toast.show(t('l_Block_failed'), 'error')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = open ? 'hidden' : ''
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-10000 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" @click="close" />
      <div class="relative w-full max-w-md rounded-t-3xl border border-border bg-white shadow-elevated sm:rounded-3xl">
        <header class="border-b border-border px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-dark">{{ t('l_Block_user_title') }}</h2>
              <p v-if="targetLabel" class="mt-1 text-xs text-muted">{{ targetLabel }}</p>
            </div>
            <button type="button" class="flex size-10 items-center justify-center rounded-xl text-caption"
              :aria-label="t('l_Close')" @click="close">
              <Icon name="material-symbols:close-rounded" class="size-6" />
            </button>
          </div>
        </header>

        <div class="space-y-4 px-5 py-5">
          <p class="text-sm leading-relaxed text-body">{{ t('l_Block_user_hint') }}</p>

          <UiButton variant="primary" size="md" fullWidth :disabled="submitting" @click="confirmBlock">
            {{ submitting ? t('l_Loading') : t('l_Block_confirm') }}
          </UiButton>

          <UiButton variant="outline" size="md" fullWidth :disabled="submitting" @click="close">
            {{ t('l_Cancel') }}
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
