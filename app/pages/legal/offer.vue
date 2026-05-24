<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <h1 class="text-center text-lg font-bold text-dark">
      {{ t('l_Offer_agreement_title') }}
    </h1>

    <p v-if="loading" class="mt-6 text-center text-sm text-muted" role="status">
      {{ t('l_Loading') }}
    </p>

    <p v-else-if="error" class="mt-6 text-center text-sm text-red-500">
      {{ error }}
    </p>

    <div v-show="!loading && !error" ref="docContainer"
      class="offer-doc mt-4 max-h-[calc(100dvh-11rem)] min-h-[50dvh] flex-1 overflow-y-auto rounded-2xl border border-black/5 bg-white p-3 shadow-card" />
  </div>
</template>

<script setup lang="ts">
import { renderAsync } from 'docx-preview'

definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const { t } = useI18n()

const role = computed(() => parseRegistrationRole(route.query.role))
const docUrl = computed(() => getOfferAgreementUrl(role.value))

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
    const response = await fetch(docUrl.value)
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
    error.value = t('l_Offer_agreement_load_error')
  } finally {
    loading.value = false
  }
}

onMounted(loadDocument)
watch(docUrl, loadDocument)
</script>

<style scoped>
.offer-doc :deep(.docx-wrapper) {
  background: transparent;
  padding: 0;
}

.offer-doc :deep(.docx) {
  max-width: 100%;
  box-shadow: none;
}

.offer-doc :deep(.docx) {
  padding: 4px !important;
}
</style>
