<script setup lang="ts">
const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
}>();

const config = useRuntimeConfig();

const supportPhoneE164 = computed(
  () => (config.public.supportPhone as string) || "+77777799197",
);

const supportPhoneDisplay = computed(() => {
  const raw = supportPhoneE164.value.replace(/\D/g, "");
  if (raw.length === 11 && raw.startsWith("7")) {
    return `+7 (${raw.slice(1, 4)}) ${raw.slice(4, 7)}-${raw.slice(7, 9)}-${raw.slice(9, 11)}`;
  }
  return supportPhoneE164.value;
});

const telHref = computed(() => {
  const digits = supportPhoneE164.value.replace(/\D/g, "");
  return digits ? `tel:+${digits}` : undefined;
});

function close() {
  emit("update:modelValue", false);
}

watch(
  () => props.modelValue,
  (open) => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = open ? "hidden" : "";
    }
  },
);

onBeforeUnmount(() => {
  if (typeof document !== "undefined") document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-10000 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" @click="close" />
      <div class="safe-sheet relative w-full max-w-md rounded-t-3xl border border-border bg-white shadow-elevated sm:rounded-3xl">
        <header class="border-b border-border px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <h2 id="support-modal-title" class="text-lg font-bold text-dark">
              {{ t("l_Support") }}
            </h2>
            <button type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-xl text-caption transition hover:bg-surface-muted hover:text-dark"
              :aria-label="t('l_Close')" @click="close">
              <Icon name="material-symbols:close-rounded" class="size-6" />
            </button>
          </div>
        </header>

        <div class="space-y-4 px-5 py-5">
          <p class="text-[14px] leading-relaxed text-body">
            {{ t("l_Support_feedback_text") }}
          </p>

          <div class="rounded-2xl border border-soft-border bg-page-cream/60 px-4 py-3.5">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-subtle">
              {{ t("l_Support_phone_label") }}
            </p>
            <a v-if="telHref" :href="telHref" class="mt-1.5 block text-[17px] font-bold text-primary">
              {{ supportPhoneDisplay }}
            </a>
            <p v-else class="mt-1.5 text-[17px] font-bold text-body">
              {{ supportPhoneDisplay }}
            </p>
          </div>

          <a v-if="telHref" :href="telHref"
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-[15px] font-bold text-white transition hover:bg-primary/90">
            <i class="fi fi-rr-phone-call text-[15px]" aria-hidden />
            {{ t("l_Call_support") }}
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>
