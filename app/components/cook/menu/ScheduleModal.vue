<script setup lang="ts">
import type { CookSchedulePatchPayload } from "~/types";
import {
  buildSchedulePatchPayload,
  toUtcTimeFromIso,
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
  const now = new Date();
  dateYmd.value = now.toISOString().slice(0, 10);
  startHm.value = toUtcTimeFromIso(props.initialStartAt) || "08:00";
  endHm.value = toUtcTimeFromIso(props.initialEndAt) || "18:00";
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
    formError.value = "Заполните дату и оба времени.";
    return;
  }
  if (endHm.value <= startHm.value) {
    formError.value = "Время окончания должно быть позже времени начала.";
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
        class="relative w-full max-w-md rounded-t-3xl border border-border bg-white shadow-elevated sm:rounded-3xl"
      >
        <header class="border-b border-border px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 id="schedule-modal-title" class="text-lg font-bold text-dark">
                Расписание работы
              </h2>
              <p class="mt-1 text-[13px] text-caption">Время сохраняется в UTC.</p>
            </div>
            <button
              type="button"
              class="flex size-10 items-center justify-center rounded-xl text-caption transition hover:bg-surface-muted hover:text-dark"
              :disabled="saving"
              aria-label="Закрыть"
              @click="close"
            >
              <Icon name="material-symbols:close-rounded" class="size-6" />
            </button>
          </div>
        </header>

        <div class="space-y-4 px-5 py-4">
          <label class="block">
            <span class="text-[13px] font-medium text-dark">Дата (UTC)</span>
            <input
              v-model="dateYmd"
              type="date"
              class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
            />
          </label>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-[13px] font-medium text-dark">Начало</span>
              <input
                v-model="startHm"
                type="time"
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
              />
            </label>
            <label class="block">
              <span class="text-[13px] font-medium text-dark">Окончание</span>
              <input
                v-model="endHm"
                type="time"
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
              />
            </label>
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
              Отмена
            </button>
            <button
              type="button"
              class="flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-primary-cta transition hover:bg-primary-hover disabled:opacity-45"
              :disabled="saving"
              @click="submit"
            >
              {{ saving ? "Сохранение…" : "Сохранить" }}
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
