<script setup lang="ts">
const { t } = useI18n()
import type { CookDish, PreparationType } from "~/types";
import { dishImageSrc } from "~/utils/dishApi";

const search = defineModel<string>("search", { default: "" });

defineProps<{
  dishes: CookDish[];
  loading: boolean;
  listError: string;
  deletingId: string | null;
}>();

const emit = defineEmits<{
  "create-click": [];
  delete: [id: string];
}>();

const config = useRuntimeConfig();
const apiBase = computed(() => config.public.apiBaseUrl as string);

function imageSrc(url: string | undefined) {
  return dishImageSrc(url, apiBase.value);
}

function prepLabel(t: PreparationType | string | undefined) {
  if (t === "FAST" || t === "Fast") return appT("l_Fast_prep");
  if (t === "LONG" || t === "Long") return appT("l_Long_prep");
  return "—";
}

function isFast(t: PreparationType | string | undefined) {
  return t === "FAST" || t === "Fast";
}

async function onDelete(id: string, name: string) {
  if (!confirm(t("l_Delete_confirm", { name }))) return;
  emit("delete", id);
}

function caloriesOf(d: CookDish) {
  const c = d.calories;
  return typeof c === "number" && Number.isFinite(c) ? c : undefined;
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-lg font-bold text-dark">{{ t("l_Dishes") }}</h2>
      <button type="button"
        class="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-primary-cta transition hover:bg-primary-hover"
        @click="emit('create-click')">
        <Icon name="material-symbols:add-rounded" class="size-5" />
        {{ t("l_Create_dish") }}
      </button>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label class="block min-w-0 flex-1">
        <span class="text-[13px] font-medium text-dark">{{ t("l_Dish_search") }}</span>
        <div class="relative mt-1.5">
          <Icon name="material-symbols:search-rounded"
            class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-caption" />
          <input v-model="search" type="search" autocomplete="off" :placeholder="t('l_Dish_search_placeholder')"
            class="w-full rounded-xl border border-border py-2.5 pl-10 pr-3 text-sm outline-none ring-primary focus:ring-2" />
        </div>
      </label>
      <p class="text-[12px] text-caption sm:pb-2">
        {{ t("l_Filter_optional_hint") }}
      </p>
    </div>

    <p v-if="listError" class="text-[13px] text-error">
      {{ listError }}
    </p>

    <div v-if="loading" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="n in 6" :key="n" class="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div class="aspect-4/3 animate-pulse bg-surface-muted" />
        <div class="space-y-2 p-4">
          <div class="h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
          <div class="h-3 w-full animate-pulse rounded bg-surface-muted" />
        </div>
      </div>
    </div>
    <div v-else-if="dishes.length === 0"
      class="rounded-2xl border border-dashed border-border bg-white py-14 text-center shadow-sm">
      <Icon name="material-symbols:history-rounded" class="mx-auto size-12 text-caption" />
      <p class="mt-3 text-sm font-semibold text-dark">{{ t("l_No_dishes_yet") }}</p>
      <p class="mt-1 text-[13px] text-caption">
        {{ t("l_Create_first_dish_hint") }}
      </p>
    </div>
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="dish in dishes" :key="dish.id"
        class="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:border-primary/30 hover:shadow-md">
        <div class="relative aspect-4/3 bg-primary-light">
          <img v-if="imageSrc(dish.imageUrl)" :src="imageSrc(dish.imageUrl)" :alt="dish.name"
            class="size-full object-cover" />
          <div v-else class="flex size-full items-center justify-center text-icon-muted">
            <Icon name="material-symbols:restaurant-outline" class="size-14" />
          </div>
          <span
            class="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1"
            :class="isFast(dish.preparationType)
              ? 'bg-amber-50 text-amber-900 ring-amber-200'
              : 'bg-slate-100 text-slate-800 ring-slate-200'
              ">
            {{ prepLabel(dish.preparationType) }}
          </span>
        </div>
        <div class="flex flex-1 flex-col p-4">
          <h3 class="line-clamp-2 font-bold text-dark">
            {{ dish.name }}
          </h3>
          <p v-if="dish.description" class="mt-1 line-clamp-2 text-[13px] text-caption">
            {{ dish.description }}
          </p>
          <p class="mt-2 text-[13px] text-muted">
            {{ t("l_Cooking_time_single", { min: dish.cookingTime }) }}
            <template v-if="caloriesOf(dish) != null">
              {{ t("l_Calories_kcal", { calories: caloriesOf(dish) }) }}
            </template>
          </p>
          <p class="mt-1 text-sm font-semibold text-primary">
            <template v-if="dish.price != null && Number.isFinite(dish.price)">
              {{ dish.price }} ₸
            </template>
            <template v-else> — </template>
          </p>
          <div class="mt-4 flex gap-2">
            <NuxtLink :to="`/cook/menu/${dish.id}`"
              class="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border text-sm font-semibold text-dark transition hover:border-primary/40 hover:text-primary">
              {{ t("l_Change") }}
            </NuxtLink>
            <button type="button"
              class="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-error/30 text-sm font-semibold text-error transition hover:bg-error/5 disabled:opacity-45"
              :disabled="deletingId === dish.id" @click="onDelete(dish.id, dish.name)">
              {{ deletingId === dish.id ? "…" : t("l_Delete") }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
