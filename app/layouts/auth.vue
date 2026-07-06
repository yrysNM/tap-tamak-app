<template>
  <div class="safe-x safe-b flex min-h-dvh flex-col bg-primary-light">
    <header class="safe-app-header flex shrink-0 items-center justify-between px-4 pb-3">
      <button type="button" v-if="showBackButton"
        class="flex size-11 items-center justify-center rounded-[14px] border border-black/6 bg-white/96 shadow-[0_8px_10px_rgba(0,0,0,0.1)]"
        :aria-label="$t('l_Back')" @click="onBack">
        <Icon name="material-symbols:chevron-left-rounded" class="size-5 text-icon-secondary" />
      </button>
      <button type="button"
        class="flex size-10 ml-auto items-center justify-center rounded-xl border border-black/5 bg-white/90 text-primary shadow-card transition hover:bg-white"
        :aria-label="t('l_Choose_language')" @click="languagePickerOpen = true">
        <Icon name="mdi:language" class="size-6" />
      </button>
    </header>

    <div class="flex min-h-0 flex-1 px-4 pb-4"
      :class="isLegalDocPage ? 'items-start pt-1' : 'items-center justify-center'">
      <div class="flex w-full max-w-md min-h-0 flex-col" :class="isLegalDocPage ? 'flex-1' : ''">
        <slot />
      </div>
    </div>

    <UiLanguagePickerModal v-model="languagePickerOpen" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const languagePickerOpen = ref(false)

const router = useRouter();

function onBack() {
  router.back();
}

const isRolePage = computed(() => router.currentRoute.value.path.includes('/role'))
const isLegalDocPage = computed(() => {
  const path = router.currentRoute.value.path
  return path.includes('/legal/offer') || path.includes('/legal/privacy') || path.includes('/legal/terms')
})
const isRegisterPage = computed(() => router.currentRoute.value.path.includes('/register'))
const showBackButton = computed(() => isRolePage.value || isLegalDocPage.value || isRegisterPage.value)
</script>
