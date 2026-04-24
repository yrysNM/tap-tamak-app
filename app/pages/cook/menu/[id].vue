<template>
  <div class="min-h-screen bg-page-cream pb-10 pt-4 sm:pt-8">
    <div class="mx-auto max-w-lg px-4">
      <NuxtLink
        to="/cook/menu?tab=dishes"
        class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        ← К меню
      </NuxtLink>

      <div
        v-if="loading"
        class="h-64 animate-pulse rounded-[20px] bg-surface-muted"
      />

      <div
        v-else-if="error"
        class="rounded-[20px] border border-border bg-white p-6 text-[13px] text-error shadow-soft"
      >
        {{ error }}
      </div>

      <article
        v-else-if="dish && !editing"
        class="overflow-hidden rounded-[20px] border border-border bg-white shadow-soft"
      >
        <div class="aspect-4/3 bg-primary-light">
          <img
            v-if="heroSrc"
            :src="heroSrc"
            :alt="dish.name"
            class="size-full object-cover"
          />
          <div
            v-else
            class="flex size-full items-center justify-center text-icon-muted"
          >
            <Icon name="material-symbols:restaurant-outline" class="size-16" />
          </div>
        </div>
        <div class="p-5">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-xl font-bold text-dark">{{ dish.name }}</h1>
            <Icon
              v-if="dish.preparationType === 'FAST'"
              name="material-symbols:bolt"
              class="size-7 text-primary"
              aria-label="Быстрое приготовление"
            />
          </div>
          <p class="mt-2 text-2xl font-bold text-primary">{{ dish.price }} ₸</p>
          <p class="mt-3 text-sm text-muted">
            {{ dish.cookingTime }} мин ·
            {{ dish.preparationType === "FAST" ? "быстрое" : "долгое" }}
            приготовление
          </p>
          <p
            v-if="dish.description"
            class="mt-4 text-[15px] leading-relaxed text-body"
          >
            {{ dish.description }}
          </p>
          <dl class="mt-4 space-y-2 text-sm text-muted">
            <div v-if="dish.category" class="flex gap-2">
              <dt class="shrink-0 font-medium text-dark">Категория</dt>
              <dd>{{ dish.category }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="shrink-0 font-medium text-dark">В наличии</dt>
              <dd>{{ dish.isAvailable !== false ? "да" : "нет" }}</dd>
            </div>
          </dl>

          <div class="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              class="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border text-sm font-semibold text-dark transition hover:border-primary/40 hover:text-primary"
              @click="startEdit"
            >
              Редактировать
            </button>
            <button
              type="button"
              class="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-error/30 text-sm font-semibold text-error transition hover:bg-error/5 disabled:opacity-45"
              :disabled="deleting"
              @click="onDelete"
            >
              {{ deleting ? "Удаление…" : "Удалить" }}
            </button>
          </div>
        </div>
      </article>

      <div
        v-else-if="dish && editing"
        class="overflow-hidden rounded-[20px] border border-border bg-white p-5 shadow-soft"
      >
        <h2 class="text-lg font-bold text-dark">Редактирование</h2>
        <form class="mt-4 space-y-4" @submit.prevent="onSave">
          <div>
            <span class="text-[13px] font-medium text-dark">Новое фото</span>
            <p class="mt-0.5 text-[12px] text-caption">
              Необязательно — оставьте пустым, чтобы сохранить текущее
              изображение.
            </p>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
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
          <label class="block">
            <span class="text-[13px] font-medium text-dark">Название *</span>
            <input
              v-model="form.name"
              type="text"
              required
              class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
            />
          </label>
          <label class="block">
            <span class="text-[13px] font-medium text-dark">Описание *</span>
            <textarea
              v-model="form.description"
              required
              rows="3"
              class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
            />
          </label>
          <div class="grid gap-4 sm:grid-cols-2">
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
            <label class="block">
              <span class="text-[13px] font-medium text-dark">Тип *</span>
              <select
                v-model="form.preparationType"
                required
                class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
              >
                <option value="FAST">Быстрое</option>
                <option value="LOGN">Долгое</option>
              </select>
            </label>
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
          </div>
          <label class="flex items-center gap-3">
            <input
              v-model="form.isAvailable"
              type="checkbox"
              class="size-4 rounded border-border text-primary focus:ring-primary"
            />
            <span class="text-[13px] font-medium text-dark">В наличии</span>
          </label>

          <p v-if="formError" class="text-[13px] text-error">
            {{ formError }}
          </p>

          <div
            class="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              class="h-11 rounded-xl border border-border px-6 text-sm font-semibold text-dark disabled:opacity-45"
              :disabled="saving"
              @click="cancelEdit"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-primary-cta disabled:opacity-45"
              :disabled="saving"
            >
              {{ saving ? "Сохранение…" : "Сохранить" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div
          v-if="toast.open"
          class="fixed bottom-6 left-1/2 z-80 w-[min(calc(100vw-2rem),420px)] -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-floating backdrop-blur-sm"
          :class="
            toast.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
              : toast.kind === 'error'
                ? 'border-red-200 bg-red-50/95 text-red-900'
                : 'border-border bg-white/95 text-dark'
          "
          role="status"
        >
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { CookDish, PreparationType } from "~/types";
import { usePageToast } from "~/composables/usePageToast";
import { apiMessage } from "~/utils/apiMessage";
import {
  deleteDishById,
  dishImageSrc,
  unwrapDishPayload,
  updateDishById,
  type UpdateDishBody,
} from "~/utils/dishApi";

definePageMeta({
  layout: "cook",
});

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();
const apiBase = computed(() => config.public.apiBaseUrl as string);
const toast = usePageToast();

const api = $api as (url: string, opts?: object) => Promise<unknown>;

const dish = ref<CookDish | null>(null);
const loading = ref(true);
const error = ref("");
const editing = ref(false);
const deleting = ref(false);
const saving = ref(false);
const formError = ref("");

const form = reactive({
  name: "",
  description: "",
  cookingTime: 30 as number,
  preparationType: "FAST" as PreparationType,
  price: 0 as number,
  calories: "" as string,
  isAvailable: true,
});

const imageFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
let editBaseline = "";

const heroSrc = computed(() =>
  dishImageSrc(dish.value?.imageUrl, apiBase.value),
);

function normPrep(
  v: CookDish["preparationType"] | string | undefined,
): PreparationType {
  if (v === "FAST" || v === "Fast") return "FAST";
  return "LOGN";
}

function snapshotForm(): string {
  return JSON.stringify({
    name: form.name.trim(),
    description: form.description.trim(),
    cookingTime: form.cookingTime,
    preparationType: form.preparationType,
    price: form.price,
    calories: form.calories.trim(),
    isAvailable: form.isAvailable,
    hasNewImage: imageFile.value != null,
  });
}

function clearImagePick() {
  imageFile.value = null;
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
    imagePreviewUrl.value = null;
  }
  if (fileInputRef.value) fileInputRef.value.value = "";
}

function fillFormFromDish(d: CookDish) {
  form.name = d.name;
  form.description = d.description ?? "";
  form.cookingTime = d.cookingTime;
  form.preparationType = normPrep(d.preparationType);
  form.price = d.price;
  form.calories =
    typeof d.calories === "number" && Number.isFinite(d.calories)
      ? String(d.calories)
      : "";
  form.isAvailable = d.isAvailable !== false;
  clearImagePick();
}

function startEdit() {
  if (!dish.value) return;
  fillFormFromDish(dish.value);
  editBaseline = snapshotForm();
  formError.value = "";
  editing.value = true;
}

function isDirty(): boolean {
  return snapshotForm() !== editBaseline;
}

function cancelEdit() {
  if (saving.value) return;
  if (isDirty() && !confirm("Отменить изменения?")) return;
  editing.value = false;
  formError.value = "";
  clearImagePick();
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

async function onSave() {
  if (!dish.value) return;
  formError.value = "";
  if (!form.name.trim()) {
    formError.value = "Укажите название.";
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

  saving.value = true;
  try {
    if (imageFile.value) {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("cookingTime", String(form.cookingTime));
      fd.append("preparationType", form.preparationType);
      fd.append("price", String(form.price));
      fd.append("isAvailable", form.isAvailable ? "true" : "false");
      const cal = form.calories.trim();
      if (cal !== "") fd.append("calories", cal);
      fd.append("image", imageFile.value);
      await updateDishById(api, dish.value.id, fd);
    } else {
      const body: UpdateDishBody = {
        name: form.name.trim(),
        description: form.description.trim(),
        cookingTime: form.cookingTime,
        preparationType: form.preparationType,
        price: form.price,
        isAvailable: form.isAvailable,
      };
      const cal = form.calories.trim();
      if (cal !== "") {
        const n = Number(cal);
        if (Number.isFinite(n)) body.calories = n;
      }
      await updateDishById(api, dish.value.id, body);
    }
    toast.show("Блюдо обновлено.", "success");
    editing.value = false;
    clearImagePick();
    await load();
  } catch (err) {
    formError.value = apiMessage(err, "Не удалось сохранить изменения.");
  } finally {
    saving.value = false;
  }
}

async function onDelete() {
  if (!dish.value) return;
  if (!confirm(`Удалить «${dish.value.name}»? Действие необратимо.`)) return;
  deleting.value = true;
  try {
    await deleteDishById(api, dish.value.id);
    toast.show("Блюдо удалено.", "success");
    await router.push({ path: "/cook/menu", query: { tab: "dishes" } });
  } catch (err) {
    toast.show(apiMessage(err, "Не удалось удалить блюдо."), "error");
  } finally {
    deleting.value = false;
  }
}

async function load() {
  const id = route.params.id;
  const idStr = Array.isArray(id) ? id[0] : id;
  if (!idStr) {
    error.value = "Некорректная ссылка.";
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const raw = await api(`/dishes/${idStr}`, { method: "GET" });
    const parsed = unwrapDishPayload(raw);
    if (!parsed) {
      error.value = "Блюдо не найдено.";
      dish.value = null;
    } else {
      dish.value = parsed;
    }
  } catch (err) {
    error.value = apiMessage(err, "Не удалось загрузить блюдо.");
    dish.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void load();
});

watch(
  () => route.params.id,
  () => {
    editing.value = false;
    clearImagePick();
    void load();
  },
);

onBeforeUnmount(() => {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value);
});
</script>
