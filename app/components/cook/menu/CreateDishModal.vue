<script setup lang="ts">
const { t } = useI18n()
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
  { value: "FAST", label: t("l_Fast_prep") },
  { value: "LONG", label: t("l_Long_prep") },
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
  (open: boolean) => {
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
    if (!confirm(t("l_Discard_unsaved_confirm"))) return;
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
    formError.value = t("l_Enter_dish_title");
    return;
  }
  if (!form.description.trim()) {
    formError.value = t("l_Enter_description");
    return;
  }
  if (!Number.isFinite(form.cookingTime) || form.cookingTime < 1) {
    formError.value = t("l_Cooking_time_min_1");
    return;
  }
  if (!Number.isFinite(form.price) || form.price < 0) {
    formError.value = t("l_Price_non_negative");
    return;
  }
  const portions = Math.trunc(form.portionCount);
  if (!Number.isFinite(form.portionCount) || portions < 1) {
    formError.value = t("l_Portion_min_1");
    return;
  }
  if (!imageFile.value) {
    formError.value = t("l_Upload_image");
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
    const cal = form.calories;
    if (cal !== "") fd.append("calories", cal);
    fd.append("image", imageFile.value);

    await ($api as (url: string, opts: object) => Promise<unknown>)("/dishes", {
      method: "POST",
      body: fd,
    });
    emit("success");
    emit("update:modelValue", false);
  } catch (err) {
    formError.value = apiMessage(err, 'l_Failed_create_dish');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog"
      aria-modal="true" aria-labelledby="create-dish-title">
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden="true" @click="close(false)" />
      <div
        class="relative flex max-h-[min(92vh,760px)] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-white shadow-elevated sm:rounded-3xl">
        <header class="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 id="create-dish-title" class="text-lg font-bold text-dark">
            {{ t("l_Create_dish") }}
          </h2>
          <button type="button"
            class="flex size-10 items-center justify-center rounded-xl text-caption hover:bg-surface-muted hover:text-dark"
            :disabled="submitting" :aria-label="t('l_Close')" @click="close(false)">
            <Icon name="material-symbols:close-rounded" class="size-6" />
          </button>
        </header>

        <form class="min-h-0 flex-1 overflow-y-auto px-5 py-4" @submit.prevent="onSubmit">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <span class="text-[13px] font-medium text-dark">{{ t("l_Photo_required") }}</span>
              <input ref="fileInputRef" type="file" accept="image/*" required
                class="mt-1.5 block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-primary-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                @change="onImageChange" />
              <div v-if="imagePreviewUrl" class="mt-3 overflow-hidden rounded-xl border border-border">
                <img :src="imagePreviewUrl" alt="" class="max-h-48 w-full object-cover" />
              </div>
            </div>
            <label class="block sm:col-span-2">
              <span class="text-[13px] font-medium text-dark">{{ t("l_Title_required") }}</span>
              <input v-model="form.name" type="text" required
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2" />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-[13px] font-medium text-dark">{{ t("l_Description_required") }}</span>
              <textarea v-model="form.description" required rows="3"
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2" />
            </label>
            <label class="block">
              <span class="text-[13px] font-medium text-dark">{{ t("l_Time_min_required") }}</span>
              <input v-model.number="form.cookingTime" type="number" min="1" required
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2" />
            </label>
            <div class="block">
              <UiSelect v-model="form.preparationType" :label="t('l_Type_required')" :options="prepOptions"
                :disabled="submitting" required />
            </div>
            <label class="block">
              <span class="text-[13px] font-medium text-dark">{{ t("l_Calories") }}</span>
              <input v-model="form.calories" type="number" min="0" :placeholder="t('l_Optional')"
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2" />
            </label>
            <label class="block">
              <span class="text-[13px] font-medium text-dark">{{ t("l_Price_required") }}</span>
              <input v-model.number="form.price" type="number" min="0" step="0.01" required
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2" />
            </label>
            <label class="block">
              <span class="text-[13px] font-medium text-dark">{{ t("l_Portion_count_required") }}</span>
              <input v-model.number="form.portionCount" type="number" min="1" step="1" required
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2" />
            </label>
            <label class="flex items-center gap-3 sm:col-span-2">
              <input v-model="form.isAvailable" type="checkbox"
                class="size-4 rounded border-border text-primary focus:ring-primary" />
              <span class="text-[13px] font-medium text-dark">{{ t("l_In_stock") }}</span>
            </label>
          </div>

          <p v-if="formError" class="mt-4 text-[13px] text-error">
            {{ formError }}
          </p>

          <div class="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button type="button"
              class="h-11 rounded-xl border border-border px-6 text-sm font-semibold text-dark disabled:opacity-45"
              :disabled="submitting" @click="close(false)">
              {{ t("l_Cancel") }}
            </button>
            <button type="submit"
              class="flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-primary-cta disabled:opacity-45"
              :disabled="submitting">
              {{ submitting ? t("l_Creating") : t("l_Create_dish") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
