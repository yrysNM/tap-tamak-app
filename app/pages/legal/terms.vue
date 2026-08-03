<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <h1 class="text-center text-lg font-bold text-dark">
      {{ t('l_Terms_of_use_title') }}
    </h1>

    <p v-if="loading" class="mt-6 text-center text-sm text-muted" role="status">
      {{ t('l_Loading') }}
    </p>

    <p v-else-if="error" class="mt-6 text-center text-sm text-red-500">
      {{ error }}
    </p>

    <div v-show="!loading && !error" ref="docContainer"
      class="terms-doc mt-4 max-h-[calc(100dvh-11rem)] min-h-[50dvh] flex-1 overflow-y-auto rounded-2xl border border-black/5 bg-white p-3 shadow-card" />
  </div>
</template>

<script setup lang="ts">
import { renderAsync } from 'docx-preview'

definePageMeta({
  layout: 'auth',
})

const { t } = useI18n()

const docUrl = '/legal/terms-of-use.docx'

const docContainer = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref('')

async function loadDocument() {
  loading.value = true
  error.value = ''
  if (docContainer.value) {
    docContainer.value.innerHTML = ''
  }

  try {
    const response = await fetch(docUrl)
    if (!response.ok) {
      throw new Error('fetch failed')
    }
    const blob = await response.blob()
    if (!docContainer.value) return
    await renderAsync(blob, docContainer.value, undefined, {
      className: 'docx',
      inWrapper: true,
    })
  } catch {
    error.value = t('l_Terms_of_use_load_error')
  } finally {
    loading.value = false
  }
}

onMounted(loadDocument)
</script>

<style scoped>
.terms-doc :deep(.docx-wrapper) {
  background: transparent;
  padding: 0;
}

.terms-doc :deep(.docx) {
  max-width: 100%;
  box-shadow: none;
}

.terms-doc :deep(.docx) {
  padding: 4px !important;
}
</style>
