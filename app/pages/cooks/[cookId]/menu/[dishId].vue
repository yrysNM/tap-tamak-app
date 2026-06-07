<script setup lang="ts">
const { t } = useI18n()
definePageMeta({
  hideBottomNav: true,
});

import { utcTodayYmd } from "~/composables/useUtcMenuDates";
import type { PublicCookMenuDish } from "~/types";
import { useCartStore } from "~/stores/cart";
import { fetchPublicCookMenuInformation } from "~/utils/cookApi";
import { dishImageSrc } from "~/utils/dishApi";

const router = useRouter();
const cartStore = useCartStore();
const route = useRoute();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const api = $api as (url: string, opts?: object) => Promise<unknown>;
const apiBase = computed(() => config.public.apiBaseUrl as string);

const todayYmd = utcTodayYmd();
const cookId = computed(() => {
  const value = route.params.cookId;
  return (Array.isArray(value) ? value[0] : value) ?? "";
});
const dishId = computed(() => {
  const value = route.params.dishId;
  return (Array.isArray(value) ? value[0] : value) ?? "";
});

const {
  data: menuInfo,
  pending,
  error,
  refresh,
} = useAsyncData(
  () => `public-cook-menu:${cookId.value}:${todayYmd}`,
  async () => {
    if (!cookId.value) throw new Error(t("l_Invalid_cook_id"));
    return await fetchPublicCookMenuInformation(api, cookId.value, todayYmd);
  },
  { watch: [cookId] },
);

const cook = computed(() => menuInfo.value?.cook ?? null);
const dish = computed(() =>
  menuInfo.value?.dishes.find((d) => d.id === dishId.value) ?? null,
);

function maxPortionsFor(d: PublicCookMenuDish): number {
  const raw = d.portionCount;
  if (raw == null || !Number.isFinite(raw)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.trunc(raw));
}

watch(
  [dish, cookId],
  () => {
    const cid = cookId.value;
    const d = dish.value;
    if (!cid || !d) return;
    const cap = maxPortionsFor(d);
    const q = cartStore.quantityFor(cid, d.id);
    if (q > cap) cartStore.setQuantity(cid, d.id, cap);
  },
  { immediate: true },
);

const cookTotals = computed(() => cartStore.totalsForCook(cookId.value));
const totalItems = computed(() => cookTotals.value.items);
const totalAmount = computed(() => cookTotals.value.amount);

function qtyOf(id: string): number {
  return cartStore.quantityFor(cookId.value, id);
}

function addToCart(): void {
  if (!cook.value || !dish.value) return;
  const cap = maxPortionsFor(dish.value);
  const current = qtyOf(dish.value.id);
  if (current >= cap) return;
  cartStore.addOrIncrement(cook.value, dish.value);
}

function atMaxPortions(): boolean {
  if (!dish.value) return true;
  return qtyOf(dish.value.id) >= maxPortionsFor(dish.value);
}

function hasFinitePortionCap(): boolean {
  if (!dish.value) return false;
  return Number.isFinite(maxPortionsFor(dish.value));
}

function decrementFromCart(): void {
  if (!dish.value) return;
  cartStore.decrement(cookId.value, dish.value.id);
}

function formatPrice(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₸`;
}

function dishImage(d: PublicCookMenuDish): string | undefined {
  return dishImageSrc(d.imageUrl, apiBase.value);
}

function prepLabel(type: PublicCookMenuDish["preparationType"]): string {
  if (type === "FAST") return t("l_Fast_prep");
  if (type === "LONG") return t("l_Long_prep");
  return "—";
}

function goBack(): void {
  router.push(`/cooks/${cookId.value}/menu`);
}
</script>

<template>
  <section
    class="mx-auto min-h-dvh w-full max-w-md bg-page-cream px-4 pb-[calc(13rem+var(--safe-area-bottom))] pt-4 mb-20">
    <div class="mb-5 flex items-center">
      <button type="button"
        class="flex size-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-dark shadow-sm"
        :aria-label="t('l_Back')" @click="goBack">
        <Icon name="material-symbols:chevron-left-rounded" class="size-6" />
      </button>
    </div>

    <div v-if="pending" class="space-y-4">
      <div class="h-56 animate-pulse rounded-[22px] bg-black/10" />
      <div class="h-6 w-3/4 animate-pulse rounded bg-black/10" />
      <div class="h-4 w-full animate-pulse rounded bg-black/10" />
      <div class="h-4 w-2/3 animate-pulse rounded bg-black/10" />
    </div>

    <div v-else-if="error" class="rounded-[22px] border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
      <p>{{ t("l_Failed_load_cook_menu") }}</p>
      <button type="button" class="mt-3 rounded-xl bg-white px-4 py-2 font-semibold text-dark" @click="refresh()">
        {{ t("l_Retry") }}
      </button>
    </div>

    <div v-else-if="!dish" class="rounded-[22px] border border-dashed border-black/15 bg-white/90 p-6 text-center">
      <p class="text-sm font-semibold text-dark">{{ t("l_Dish_not_found") }}</p>
      <button type="button" class="mt-4 rounded-xl bg-[#FF7A00] px-5 py-2.5 text-sm font-bold text-white"
        @click="goBack">
        {{ t("l_Back_to_menu") }}
      </button>
    </div>

    <template v-else>
      <div class="overflow-hidden rounded-[22px] border border-black/8 bg-white/95 shadow-md">
        <div class="relative h-56 bg-surface-muted">
          <img v-if="dishImage(dish)" :src="dishImage(dish)" :alt="dish.name" class="size-full object-cover" />
          <div class="absolute right-3 top-3 rounded-full bg-[#ff7a008f] px-3 py-1.5 text-xs font-bold text-dark">
            ⏱ {{ t("l_Cooking_time_single", { min: dish.cookingTime }) }}
          </div>
        </div>

        <div class="p-4">
          <p v-if="cook" class="text-xs font-semibold text-muted">
            {{ cook.businessName }}
          </p>
          <h1 class="mt-1 text-2xl font-bold leading-tight text-dark">
            {{ dish.name }}
          </h1>
          <p class="mt-3 text-sm font-semibold leading-6 text-[#6B6B6B]">
            {{ dish.description || t("l_Homemade_dish") }}
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <span class="rounded-full border border-black/10 bg-black/2 px-3 py-1.5 text-xs font-bold text-dark">
              {{ t("l_Prep_type") }}: {{ prepLabel(dish.preparationType) }}
            </span>
            <span v-if="dish.calories != null && Number.isFinite(dish.calories)"
              class="rounded-full border border-black/10 bg-black/2 px-3 py-1.5 text-xs font-bold text-dark">
              {{ t("l_Calories_kcal", { calories: dish.calories }) }}
            </span>
            <span v-if="hasFinitePortionCap()"
              class="rounded-full border border-black/10 bg-black/2 px-3 py-1.5 text-xs font-bold text-dark">
              <template v-if="maxPortionsFor(dish) === 0">
                {{ t("l_No_portions_zero") }}
              </template>
              <template v-else>
                {{ t("l_Max_portions", { count: maxPortionsFor(dish) }) }}
              </template>
            </span>
          </div>

          <div class="mt-6 flex items-center justify-between gap-3 border-t border-black/8 pt-4">
            <p class="text-xl font-bold text-[#FF7A00]">
              {{ formatPrice(dish.price) }}
            </p>
            <div class="flex items-center gap-2">
              <button v-if="qtyOf(dish.id) > 0" type="button"
                class="flex size-10 items-center justify-center rounded-xl border border-black/10 bg-white text-lg font-bold text-dark"
                @click="decrementFromCart">
                -
              </button>
              <span v-if="qtyOf(dish.id) > 0" class="min-w-5 text-center text-sm font-bold text-dark">
                {{ qtyOf(dish.id) }}
              </span>
              <button type="button"
                class="flex h-10 min-w-10 items-center justify-center rounded-xl px-4 text-base font-bold shadow-[0_12px_11px_rgba(255,122,0,0.22)] transition"
                :class="atMaxPortions()
                  ? 'cursor-not-allowed bg-[#FF7A00]/40 text-white'
                  : 'bg-[#FF7A00] text-white'
                  " :disabled="atMaxPortions()" :aria-disabled="atMaxPortions()" @click="addToCart">
                {{ qtyOf(dish.id) > 0 ? "+" : t("l_Add") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div
      v-if="cook?.isAvailable && dish"
      class="safe-fixed-bottom-bar fixed inset-x-0 bottom-4 z-20 mx-auto w-[calc(100%-2rem)] max-w-md rounded-[22px] border border-black/8 bg-white p-3 shadow-elevated">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[13px] font-bold text-dark">
            {{ t("l_Cart_summary", { count: totalItems }) }}
          </p>
          <p class="text-xs font-semibold text-[#6B6B6B]">
            {{ t("l_Total_amount", { amount: formatPrice(totalAmount) }) }}
          </p>
        </div>
        <NuxtLink :to="`/cooks/${cookId}/menu`"
          class="inline-flex h-11 min-w-29 items-center justify-center rounded-2xl bg-[#FF7A00] px-4 text-sm font-bold text-white shadow-[0_12px_11px_rgba(255,122,0,0.22)]">
          {{ t("l_Menu") }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
