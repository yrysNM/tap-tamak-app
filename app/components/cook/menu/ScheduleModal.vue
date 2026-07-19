<script setup lang="ts">
const { t } = useI18n()
import type { CookSchedulePatchPayload } from "~/types";
import {
  buildSchedulePatchPayload,
  toLocalDateYmd,
  toLocalDateYmdFromIso,
  toLocalTimeFromIso,
} from "~/utils/scheduleApi";

const props = defineProps<{
  modelValue: boolean;
  initialStartAt: string | null;
  initialEndAt: string | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
  submit: [payload: CookSchedulePatchPayload];
}>();

const dateYmd = ref("");
const startHm = ref("");
const endHm = ref("");
const formError = ref("");

function close() {
  if (props.saving) return;
  emit("update:modelValue", false);
}

function resetForm() {
  dateYmd.value =
    toLocalDateYmdFromIso(props.initialStartAt) ?? toLocalDateYmd();
  startHm.value = toLocalTimeFromIso(props.initialStartAt) || "08:00";
  endHm.value = toLocalTimeFromIso(props.initialEndAt) || "18:00";
  formError.value = "";
}

watch(
  () => props.modelValue,
  (open) => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = open ? "hidden" : "";
    }
    if (open) resetForm();
  },
);

onBeforeUnmount(() => {
  if (typeof document !== "undefined") document.body.style.overflow = "";
});

function submit() {
  formError.value = "";
  if (!dateYmd.value || !startHm.value || !endHm.value) {
    formError.value = t("l_Fill_date_and_times");
    return;
  }
  if (endHm.value <= startHm.value) {
    formError.value = t("l_End_after_start");
    return;
  }
  emit("submit", buildSchedulePatchPayload(dateYmd.value, startHm.value, endHm.value));
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
    >
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" @click="close" />
      <div
        class="safe-sheet relative w-full max-w-md rounded-t-3xl border border-border bg-white shadow-elevated sm:rounded-3xl"
      >
        <header class="border-b border-border px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 id="schedule-modal-title" class="text-lg font-bold text-dark">
                {{ t("l_Work_schedule_modal") }}
              </h2>
              <p class="mt-1 text-[13px] text-caption">{{ t("l_Schedule_local_hint") }}</p>
            </div>
            <button
              type="button"
              class="flex size-10 items-center justify-center rounded-xl text-caption transition hover:bg-surface-muted hover:text-dark"
              :disabled="saving"
              :aria-label="t('l_Close')"
              @click="close"
            >
              <Icon name="material-symbols:close-rounded" class="size-6" />
            </button>
          </div>
        </header>

        <div class="space-y-4 px-5 py-4">
          <UiInput v-model="dateYmd" type="date" :label="t('l_Date')" />

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UiInput v-model="startHm" type="time" :label="t('l_Start')" />
            <UiInput v-model="endHm" type="time" :label="t('l_End')" />
          </div>

          <p v-if="formError" class="text-[13px] text-error">
            {{ formError }}
          </p>
        </div>

        <footer class="border-t border-border px-5 py-4">
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="h-11 rounded-xl border border-border px-6 text-sm font-semibold text-dark transition hover:bg-surface-muted/50 disabled:opacity-45"
              :disabled="saving"
              @click="close"
            >
              {{ t("l_Cancel") }}
            </button>
            <button
              type="button"
              class="flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-primary-cta transition hover:bg-primary-hover disabled:opacity-45"
              :disabled="saving"
              @click="submit"
            >
              {{ saving ? t("l_Saving") : t("l_Save") }}
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
