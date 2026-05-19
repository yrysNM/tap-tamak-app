<script setup lang="ts">
import type { PreparationType } from "~/types";
import { apiMessage } from "~/utils/apiMessage";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
  success: [];
}>();

const { $api } = useNuxtApp();

const form = reactive({
  name: "",
  description: "",
  cookingTime: 30 as number,
  preparationType: "FAST" as PreparationType,
  price: 0 as number,
  portionCount: 1 as number,
  calories: "" as string,
  isAvailable: true,
});

const imageFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const formError = ref("");
const submitting = ref(false);

const prepOptions: Array<{ value: PreparationType; label: string }> = [
  { value: "FAST", label: "Быстрое" },
  { value: "LONG", label: "Долгое" },
];

function resetForm() {
  form.name = "";
  form.description = "";
  form.cookingTime = 30;
  form.preparationType = "FAST";
  form.price = 0;
  form.portionCount = 1;
  form.calories = "";
  form.isAvailable = true;
  imageFile.value = null;
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value);
  imagePreviewUrl.value = null;
  if (fileInputRef.value) fileInputRef.value.value = "";
}

watch(
  () => props.modelValue,
  (open) => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = open ? "hidden" : "";
    }
    if (open) {
      formError.value = "";
      resetForm();
    }
  },
);

onBeforeUnmount(() => {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value);
  if (typeof document !== "undefined") document.body.style.overflow = "";
});

function close(force = false) {
  if (submitting.value) return;
  if (
    !force &&
    (form.name.trim() || form.description.trim() || imageFile.value != null)
  ) {
    if (!confirm("Отменить несохранённые изменения?")) return;
  }
  emit("update:modelValue", false);
}

function onImageChange(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
    imagePreviewUrl.value = null;
  }
  imageFile.value = file ?? null;
  if (file) imagePreviewUrl.value = URL.createObjectURL(file);
}

async function onSubmit() {
  formError.value = "";
  if (!form.name.trim()) {
    formError.value = "Укажите название блюда.";
    return;
  }
  if (!form.description.trim()) {
    formError.value = "Укажите описание.";
    return;
  }
  if (!Number.isFinite(form.cookingTime) || form.cookingTime < 1) {
    formError.value = "Время приготовления — не менее 1 минуты.";
    return;
  }
  if (!Number.isFinite(form.price) || form.price < 0) {
    formError.value = "Цена не может быть отрицательной.";
    return;
  }
  const portions = Math.trunc(form.portionCount);
  if (!Number.isFinite(form.portionCount) || portions < 1) {
    formError.value = "Количество порций — не менее 1.";
    return;
  }
  if (!imageFile.value) {
    formError.value = "Загрузите изображение.";
    return;
  }

  submitting.value = true;
  try {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("description", form.description.trim());
    fd.append("cookingTime", String(form.cookingTime));
    fd.append("preparationType", form.preparationType);
    fd.append("price", String(form.price));
    fd.append("portionCount", String(portions));
    fd.append("isAvailable", form.isAvailable ? "true" : "false");
    const cal = form.calories.trim();
    if (cal !== "") fd.append("calories", cal);
    fd.append("image", imageFile.value);

    await ($api as (url: string, opts: object) => Promise<unknown>)("/dishes", {
      method: "POST",
      body: fd,
    });
    emit("success");
    emit("update:modelValue", false);
  } catch (err) {
    formError.value = apiMessage(err, "Не удалось создать блюдо.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-dish-title"
    >
      <div
        class="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-hidden="true"
        @click="close(false)"
      />
      <div
        class="relative flex max-h-[min(92vh,760px)] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-white shadow-elevated sm:rounded-3xl"
      >
        <header
          class="flex shrink-0 items-center justify-between border-b border-border px-5 py-4"
        >
          <h2 id="create-dish-title" class="text-lg font-bold text-dark">
            Создать блюдо
          </h2>
          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-xl text-caption hover:bg-surface-muted hover:text-dark"
            :disabled="submitting"
            aria-label="Закрыть"
            @click="close(false)"
          >
            <Icon name="material-symbols:close-rounded" class="size-6" />
          </button>
        </header>

        <form
          class="min-h-0 flex-1 overflow-y-auto px-5 py-4"
          @submit.prevent="onSubmit"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <span class="text-[13px] font-medium text-dark">Фото *</span>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                required
                class="mt-1.5 block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-primary-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                @change="onImageChange"
              />
              <div
                v-if="imagePreviewUrl"
                class="mt-3 overflow-hidden rounded-xl border border-border"
              >
                <img
                  :src="imagePreviewUrl"
                  alt=""
                  class="max-h-48 w-full object-cover"
                />
              </div>
            </div>
            <label class="block sm:col-span-2">
              <span class="text-[13px] font-medium text-dark">Название *</span>
              <input
                v-model="form.name"
                type="text"
                required
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
              />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-[13px] font-medium text-dark">Описание *</span>
              <textarea
                v-model="form.description"
                required
                rows="3"
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
              />
            </label>
            <label class="block">
              <span class="text-[13px] font-medium text-dark"
                >Время (мин) *</span
              >
              <input
                v-model.number="form.cookingTime"
                type="number"
                min="1"
                required
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
              />
            </label>
            <div class="block">
              <UiSelect
                v-model="form.preparationType"
                label="Тип *"
                :options="prepOptions"
                :disabled="submitting"
                required
              />
            </div>
            <label class="block">
              <span class="text-[13px] font-medium text-dark">Калории</span>
              <input
                v-model="form.calories"
                type="number"
                min="0"
                placeholder="Необязательно"
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
              />
            </label>
            <label class="block">
              <span class="text-[13px] font-medium text-dark">Цена *</span>
              <input
                v-model.number="form.price"
                type="number"
                min="0"
                step="0.01"
                required
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
              />
            </label>
            <label class="block">
              <span class="text-[13px] font-medium text-dark"
                >Количество порций *</span
              >
              <input
                v-model.number="form.portionCount"
                type="number"
                min="1"
                step="1"
                required
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
              />
            </label>
            <label class="flex items-center gap-3 sm:col-span-2">
              <input
                v-model="form.isAvailable"
                type="checkbox"
                class="size-4 rounded border-border text-primary focus:ring-primary"
              />
              <span class="text-[13px] font-medium text-dark">В наличии</span>
            </label>
          </div>

          <p v-if="formError" class="mt-4 text-[13px] text-error">
            {{ formError }}
          </p>

          <div
            class="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              class="h-11 rounded-xl border border-border px-6 text-sm font-semibold text-dark disabled:opacity-45"
              :disabled="submitting"
              @click="close(false)"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-primary-cta disabled:opacity-45"
              :disabled="submitting"
            >
              {{ submitting ? "Создание…" : "Создать блюдо" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
