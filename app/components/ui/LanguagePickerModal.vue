<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [open: boolean]
}>()

const availableLocales = computed(() =>
  locales.value.filter((l: any): l is (typeof l & { code: string }) => typeof l.code === "string"),
)

function close() {
  emit("update:modelValue", false)
}

async function selectLocale(code: string) {
  if (code === locale.value) {
    close()
    return
  }
  await setLocale(code as any)
  close()
}

watch(
  () => props.modelValue,
  (open) => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = open ? "hidden" : ""
    }
  },
)

onBeforeUnmount(() => {
  if (typeof document !== "undefined") document.body.style.overflow = ""
})
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-10000 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog" aria-modal="true" aria-labelledby="language-picker-title">
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" @click="close" />
      <div class="safe-sheet relative w-full max-w-md rounded-t-3xl border border-border bg-white shadow-elevated sm:rounded-3xl">
        <header class="border-b border-border px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <h2 id="language-picker-title" class="text-lg font-bold text-dark">
              {{ t("l_Choose_language") }}
            </h2>
            <button type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-xl text-caption transition hover:bg-surface-muted hover:text-dark"
              :aria-label="t('l_Close')" @click="close">
              <Icon name="material-symbols:close-rounded" class="size-6" />
            </button>
          </div>
        </header>

        <ul class="divide-y divide-border px-2 py-2" role="listbox" :aria-label="t('l_Choose_language')">
          <li v-for="loc in availableLocales" :key="loc.code">
            <button type="button" role="option"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left transition hover:bg-surface-muted/60"
              :class="loc.code === locale ? 'bg-primary/8' : ''" :aria-selected="loc.code === locale"
              @click="selectLocale(loc.code)">
              <span class="min-w-0 flex-1 text-[15px] font-semibold text-dark">
                {{ loc.name }}
              </span>
              <Icon v-if="loc.code === locale" name="material-symbols:check-circle-rounded"
                class="size-6 shrink-0 text-primary" />
            </button>
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>
