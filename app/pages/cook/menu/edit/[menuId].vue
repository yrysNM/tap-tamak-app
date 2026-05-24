<script setup lang="ts">
const { t } = useI18n()
import { useDebounceFn } from "@vueuse/core";
import type { CookDish } from "~/types";
import { apiMessage } from "~/utils/apiMessage";
import { dishImageSrc, unwrapDishesList } from "~/utils/dishApi";
import type { CookMenuPayload } from "~/utils/menuApi";
import {
  deleteMenuById,
  unwrapMenuPayload,
  updateMenuById,
} from "~/utils/menuApi";
import { formatMenuDateLabel } from "~/composables/useUtcMenuDates";
import { usePageToast } from "~/composables/usePageToast";

definePageMeta({
  layout: "cook",
});

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();
const toast = usePageToast();
const config = useRuntimeConfig();
const apiBase = computed(() => config.public.apiBaseUrl as string);

const api = $api as (url: string, opts?: object) => Promise<unknown>;

const pathMenuKey = computed(() => {
  const p = route.params.menuId;
  const s = Array.isArray(p) ? p[0] : p;
  return s ? decodeURIComponent(String(s)) : "";
});

const loading = ref(true);
const error = ref("");
const menu = ref<CookMenuPayload | null>(null);
const menuDateInput = ref("");
const selected = ref<Set<string>>(new Set());

const search = ref("");
const debouncedSearch = ref("");
const updateSearchDebounced = useDebounceFn((q: string) => {
  debouncedSearch.value = q;
}, 280);

const dishes = ref<CookDish[]>([]);
const listLoading = ref(false);
const listError = ref("");
const saving = ref(false);
const deleting = ref(false);
const formError = ref("");

/** Prefer server id after load so PATCH/DELETE match the API. */
const resolvedPathForApi = computed(() => menu.value?.id ?? pathMenuKey.value);

function imageSrc(url: string | undefined) {
  return dishImageSrc(url, apiBase.value);
}

function isSelected(id: string) {
  return selected.value.has(id);
}

function toggle(id: string) {
  const next = new Set(selected.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selected.value = next;
}

function caloriesOf(d: CookDish) {
  const c = d.calories;
  return typeof c === "number" && Number.isFinite(c) ? c : undefined;
}

async function loadDishes() {
  listLoading.value = true;
  listError.value = "";
  try {
    const q = debouncedSearch.value.trim();
    const raw = await api("/dishes", {
      method: "GET",
      query: {
        page: 1,
        limit: 80,
        ...(q ? { search: q } : {}),
      },
    });
    const { items } = unwrapDishesList(
      (raw as { data?: unknown }).data ?? raw,
    );
    dishes.value = items;
  } catch (err) {
    listError.value = apiMessage(err, 'l_Failed_load_dishes');
    dishes.value = [];
  } finally {
    listLoading.value = false;
  }
}

async function loadMenu() {
  const key = pathMenuKey.value;
  if (!key) {
    error.value = t("l_Invalid_link");
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = "";
  menu.value = null;
  try {
    const raw = await api(`/menus/${encodeURIComponent(key)}`, {
      method: "GET",
    });
    const m = unwrapMenuPayload(raw);
    if (!m) {
      error.value = t("l_Menu_not_found");
    } else {
      menu.value = m;
      menuDateInput.value = m.date;
      selected.value = new Set(m.dishIds);
    }
  } catch (err) {
    error.value = apiMessage(err, 'l_Failed_load_menu');
  } finally {
    loading.value = false;
  }
}

watch(debouncedSearch, () => {
  void loadDishes();
});

watch(search, (q) => {
  updateSearchDebounced(q);
});

async function onSave() {
  formError.value = "";
  const dishIds = [...selected.value];
  if (dishIds.length === 0) {
    formError.value = t("l_Select_at_least_one_dish");
    return;
  }
  const ymd = menuDateInput.value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    formError.value = t("l_Enter_date_yyyy_mm_dd");
    return;
  }
  const patchId = resolvedPathForApi.value;
  if (!patchId) return;

  saving.value = true;
  try {
    await updateMenuById(api, patchId, { date: ymd, dishIds });
    toast.show(t("l_Menu_updated"), "success");
    await loadMenu();
    await loadDishes();
  } catch (err) {
    formError.value = apiMessage(err, 'l_Failed_save_changes');
  } finally {
    saving.value = false;
  }
}

async function onDelete() {
  const patchId = resolvedPathForApi.value;
  if (!patchId) return;
  if (!confirm(t("l_Delete_menu_confirm"))) return;
  deleting.value = true;
  try {
    await deleteMenuById(api, patchId);
    toast.show(t("l_Menu_deleted"), "success");
    await router.push({ path: "/cook/menu" });
  } catch (err) {
    toast.show(apiMessage(err, 'l_Failed_delete_menu'), "error");
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  void loadMenu();
  void loadDishes();
});

watch(
  () => route.params.menuId,
  () => {
    search.value = "";
    debouncedSearch.value = "";
    void loadMenu();
    void loadDishes();
  },
);
</script>

<template>
  <div class="min-h-screen bg-page-cream pb-10 pt-4 sm:pt-8">
    <div class="mx-auto max-w-lg px-4">
      <NuxtLink
        to="/cook/menu"
        class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {{ t("l_Back_to_menu_list") }}
      </NuxtLink>

      <div
        v-if="loading"
        class="h-48 animate-pulse rounded-[20px] bg-surface-muted"
      />

      <div
        v-else-if="error"
        class="rounded-[20px] border border-border bg-white p-6 text-[13px] text-error shadow-soft"
      >
        {{ error }}
      </div>

      <template v-else-if="menu">
        <div
          class="mb-4 overflow-hidden rounded-[20px] border border-border bg-white p-5 shadow-soft"
        >
          <h1 class="text-lg font-bold text-dark">
            {{ t("l_Edit_menu") }}
          </h1>
          <p class="mt-1 text-sm text-muted">
            {{ formatMenuDateLabel(menu.date) }}
            <span class="text-caption"> {{ t("l_UTC_on_load") }}</span>
          </p>
          <label class="mt-4 block">
            <span class="text-[13px] font-medium text-dark">{{ t("l_Menu_date_field") }}</span>
            <input
              v-model="menuDateInput"
              type="date"
              class="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
            >
          </label>
        </div>

        <div class="overflow-hidden rounded-[20px] border border-border bg-white shadow-soft">
          <div class="border-b border-border px-5 py-4">
            <label class="block">
              <span class="text-[13px] font-medium text-dark">{{ t("l_Search_dishes") }}</span>
              <div class="relative mt-1.5">
                <Icon
                  name="material-symbols:search-rounded"
                  class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-caption"
                />
                <input
                  v-model="search"
                  type="search"
                  autocomplete="off"
                  :placeholder="t('l_Search_name_ingredient')"
                  class="w-full rounded-xl border border-border py-2.5 pl-10 pr-3 text-sm outline-none ring-primary focus:ring-2"
                >
              </div>
            </label>
            <p v-if="listError" class="mt-3 text-[13px] text-error">
              {{ listError }}
            </p>
          </div>

          <div class="max-h-[min(52vh,420px)] overflow-y-auto px-5 py-4">
            <div v-if="listLoading" class="space-y-3">
              <div
                v-for="n in 5"
                :key="n"
                class="flex gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm"
              >
                <div class="size-16 shrink-0 animate-pulse rounded-xl bg-surface-muted" />
                <div class="min-w-0 flex-1 space-y-2 py-0.5">
                  <div class="h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
                  <div class="h-3 w-full animate-pulse rounded bg-surface-muted" />
                </div>
              </div>
            </div>
            <ul v-else class="space-y-3">
              <li
                v-for="dish in dishes"
                :key="dish.id"
                class="flex gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <button
                  type="button"
                  class="relative size-16 shrink-0 overflow-hidden rounded-xl bg-primary-light text-left outline-none ring-primary focus-visible:ring-2"
                  @click="toggle(dish.id)"
                >
                  <img
                    v-if="imageSrc(dish.imageUrl)"
                    :src="imageSrc(dish.imageUrl)"
                    :alt="dish.name"
                    class="size-full object-cover"
                  >
                  <div
                    v-else
                    class="flex size-full items-center justify-center text-icon-muted"
                  >
                    <Icon name="material-symbols:restaurant-outline" class="size-8" />
                  </div>
                  <span
                    class="absolute right-1 top-1 flex size-5 items-center justify-center rounded-md border border-white/80 bg-white/95 shadow-sm"
                  >
                    <Icon
                      v-if="isSelected(dish.id)"
                      name="material-symbols:check-box-rounded"
                      class="size-5 text-primary"
                    />
                    <Icon
                      v-else
                      name="material-symbols:check-box-outline-blank-rounded"
                      class="size-5 text-caption"
                    />
                  </span>
                </button>
                <button
                  type="button"
                  class="min-w-0 flex-1 text-left outline-none"
                  @click="toggle(dish.id)"
                >
                  <p class="font-semibold text-dark">
                    {{ dish.name }}
                  </p>
                  <p
                    v-if="dish.description"
                    class="mt-0.5 line-clamp-2 text-[12px] text-caption"
                  >
                    {{ dish.description }}
                  </p>
                  <p class="mt-1 text-[12px] text-muted">
                    {{ t("l_Cooking_time_single", { min: dish.cookingTime }) }}
                    <template v-if="caloriesOf(dish) != null">
                      {{ t("l_Calories_kcal", { calories: caloriesOf(dish) }) }}
                    </template>
                  </p>
                </button>
              </li>
            </ul>
          </div>

          <p v-if="formError" class="border-t border-border px-5 py-3 text-[13px] text-error">
            {{ formError }}
          </p>

          <footer
            class="flex flex-col gap-2 border-t border-border bg-white/95 px-5 py-4 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:justify-between"
          >
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center rounded-xl border border-error/30 px-5 text-sm font-semibold text-error transition hover:bg-error/5 disabled:opacity-45"
              :disabled="deleting || saving"
              @click="onDelete"
            >
              {{ deleting ? t("l_Deleting") : t("l_Delete_menu_btn") }}
            </button>
            <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="h-11 rounded-xl border border-border px-6 text-sm font-semibold text-dark transition hover:bg-surface-muted/50 disabled:opacity-45"
                :disabled="saving || deleting"
                @click="router.push({ path: '/cook/menu' })"
              >
                {{ t("l_Cancel") }}
              </button>
              <button
                type="button"
                class="flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-primary-cta transition hover:bg-primary-hover disabled:opacity-45"
                :disabled="saving || deleting || listLoading"
                @click="onSave"
              >
                {{ saving ? t("l_Saving") : t("l_Save") }}
              </button>
            </div>
          </footer>
        </div>
      </template>
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
          class="safe-bottom-floating-sm fixed left-1/2 z-80 w-[min(calc(100vw-2rem),420px)] -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-floating backdrop-blur-sm"
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
