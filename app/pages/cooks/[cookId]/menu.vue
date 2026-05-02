<script setup lang="ts">
definePageMeta({
  hideBottomNav: true,
});

import { utcTodayYmd } from "~/composables/useUtcMenuDates";
import type { PublicCookMenuDish } from "~/types";
import { fetchPublicCookMenuInformation } from "~/utils/cookApi";
import { dishImageSrc } from "~/utils/dishApi";

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

const {
  data: menuInfo,
  pending,
  error,
  refresh,
} = useAsyncData(
  () => `public-cook-menu:${cookId.value}:${todayYmd}`,
  async () => {
    if (!cookId.value) throw new Error("Некорректный идентификатор повара.");
    return await fetchPublicCookMenuInformation(api, cookId.value, todayYmd);
  },
  { watch: [cookId] },
);

const dishQty = ref<Record<string, number>>({});

const dishes = computed(() => menuInfo.value?.dishes ?? []);
const cook = computed(() => menuInfo.value?.cook ?? null);
const cookPhoto = computed(() =>
  dishImageSrc(cook.value?.kitchenPhotoUrls?.[0], apiBase.value),
);

const cookingWindow = computed(() => {
  const mins = dishes.value
    .map((d) => d.cookingTime)
    .filter((v): v is number => Number.isFinite(v));
  if (!mins.length) return "—";
  const min = Math.min(...mins);
  const max = Math.max(...mins);
  return min === max ? `${min} мин` : `${min}-${max} мин`;
});

const totalItems = computed(() =>
  Object.values(dishQty.value).reduce((sum, qty) => sum + qty, 0),
);

const totalAmount = computed(() =>
  dishes.value.reduce(
    (sum, d) => sum + d.price * (dishQty.value[d.id] ?? 0),
    0,
  ),
);

function qtyOf(dishId: string): number {
  return dishQty.value[dishId] ?? 0;
}

function addToCart(dishId: string): void {
  dishQty.value[dishId] = qtyOf(dishId) + 1;
}

function decrementFromCart(dishId: string): void {
  const next = qtyOf(dishId) - 1;
  if (next <= 0) {
    delete dishQty.value[dishId];
    return;
  }
  dishQty.value[dishId] = next;
}

function formatPrice(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₸`;
}

function dishImage(dish: PublicCookMenuDish): string | undefined {
  return dishImageSrc(dish.imageUrl, apiBase.value);
}
</script>

<template>
  <section
    class="mx-auto min-h-screen w-full max-w-md bg-page-cream px-4 pb-28 pt-4"
  >
    <div class="mb-5 flex items-center">
      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-dark shadow-sm"
        aria-label="Назад"
        @click="navigateTo('/')"
      >
        <Icon name="material-symbols:chevron-left-rounded" class="size-6" />
      </button>
    </div>

    <div
      v-if="pending"
      class="rounded-[22px] border border-black/6 bg-white/90 p-4 shadow-elevated"
    >
      <div class="flex items-center gap-3">
        <div class="size-14 animate-pulse rounded-2xl bg-black/10" />
        <div class="min-w-0 flex-1 space-y-2">
          <div class="h-4 w-40 animate-pulse rounded bg-black/10" />
          <div class="h-3 w-32 animate-pulse rounded bg-black/10" />
          <div class="h-8 w-24 animate-pulse rounded-full bg-black/10" />
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="rounded-[22px] border border-red-200 bg-red-50/80 p-4 text-sm text-red-700"
    >
      <p>Не удалось загрузить меню повара.</p>
      <button
        type="button"
        class="mt-3 rounded-xl bg-white px-4 py-2 font-semibold text-dark"
        @click="refresh()"
      >
        Повторить
      </button>
    </div>

    <div
      v-else-if="cook"
      class="rounded-[22px] border border-black/6 bg-white/90 p-4 shadow-elevated"
    >
      <div class="flex items-center gap-3">
        <div
          class="size-14 overflow-hidden rounded-2xl border border-white/70 bg-surface-muted"
        >
          <img
            v-if="cookPhoto"
            :src="cookPhoto"
            :alt="cook.businessName"
            class="size-full object-cover"
          />
          <div
            v-else
            class="flex size-full items-center justify-center text-xs font-semibold text-muted"
          >
            Фото
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="truncate text-base font-bold text-dark">
              {{ cook.businessName }}
            </p>
            <span class="size-1.5 rounded-full bg-black/25" />
            <p
              class="text-xs font-bold"
              :class="cook.isAvailable ? 'text-[#6B8E23]' : 'text-muted'"
            >
              {{ cook.isAvailable ? "Онлайн" : "Оффлайн" }}
            </p>
          </div>
          <div
            class="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-dark"
          >
            <!-- <span class="rounded-full border border-[#ff7a0038] bg-[#ff7a0018] px-3 py-1.5">
              ⭐ {{ cook.rating.toFixed(1) }}
            </span> -->
            <!-- <span class="rounded-full border border-black/10 bg-white px-3 py-1.5"> -->
            <!-- {{ cook.totalReviews }} отзывов -->
            <!-- </span>   -->
            <!-- <span class="rounded-full border border-black/10 bg-white px-3 py-1.5"> -->
            <!-- {{ cookingWindow }} -->
            <!-- </span> -->
          </div>
        </div>
      </div>
    </div>

    <h2 class="mt-7 text-[28px] font-bold text-dark">
      Как {{ cook?.businessName || "повар" }} готовит?
    </h2>
    <div
      class="mt-3 rounded-[22px] border border-black/6 bg-white/90 p-4 shadow-elevated"
    >
      <div class="space-y-3">
        <div class="rounded-2xl border border-black/10 bg-black/2 p-3">
          <p class="text-sm font-bold text-dark">
            Свежие продукты - только под заказ
          </p>
          <p class="mt-1 text-xs font-semibold leading-5 text-[#6B6B6B]">
            Готовка начинается только после подтверждения заказа.
          </p>
        </div>
        <div class="rounded-2xl border border-black/10 bg-black/2 p-3">
          <p class="text-sm font-bold text-dark">Тайминг: готовка + доставка</p>
          <p class="mt-1 text-xs font-semibold leading-5 text-[#6B6B6B]">
            В карточке блюда указан срок готовки; доставка считается отдельно.
          </p>
        </div>
        <div class="rounded-2xl border border-black/10 bg-black/2 p-3">
          <p class="text-sm font-bold text-dark">Упаковка как в кафе</p>
          <p class="mt-1 text-xs font-semibold leading-5 text-[#6B6B6B]">
            Плотные контейнеры и соусы отдельно для аккуратной доставки.
          </p>
        </div>
      </div>
    </div>

    <h2 class="mt-7 text-[28px] font-bold text-dark">Меню</h2>
    <p class="mt-1 text-xs font-semibold text-muted">Дата: {{ todayYmd }}</p>

    <div
      v-if="!dishes.length"
      class="mt-4 rounded-2xl border border-dashed border-black/15 bg-white/90 p-6 text-center"
    >
      <p class="text-sm font-semibold text-dark">На сегодня блюд нет</p>
      <p class="mt-1 text-xs text-muted">Попробуйте открыть меню позже.</p>
    </div>

    <div v-else class="mt-3 grid grid-cols-2 gap-3">
      <article
        v-for="dish in dishes"
        :key="dish.id"
        class="overflow-hidden rounded-[22px] border border-black/8 bg-white/95 shadow-md"
      >
        <div class="relative h-28 bg-surface-muted">
          <img
            v-if="dishImage(dish)"
            :src="dishImage(dish)"
            :alt="dish.name"
            class="size-full object-cover"
          />
          <div
            class="absolute right-2 top-2 rounded-full bg-[#ff7a008f] px-2.5 py-1 text-[10px] font-bold text-dark"
          >
            ⏱ {{ dish.cookingTime }} мин
          </div>
        </div>
        <div class="p-2.5">
          <p
            class="line-clamp-2 min-h-[36px] text-[13px] font-bold leading-[1.15] text-dark"
          >
            {{ dish.name }}
          </p>
          <p class="mt-1 line-clamp-2 text-[10px] font-semibold text-[#6B6B6B]">
            {{ dish.description || "Домашнее блюдо" }}
          </p>
          <div class="mt-3 flex items-center justify-between">
            <p class="text-[24px] font-bold leading-none text-[#FF7A00]">
              {{ formatPrice(dish.price) }}
            </p>
            <div class="flex items-center gap-1.5">
              <button
                v-if="qtyOf(dish.id) > 0"
                type="button"
                class="flex size-8 items-center justify-center rounded-xl border border-black/10 bg-white text-base font-bold text-dark"
                @click="decrementFromCart(dish.id)"
              >
                -
              </button>
              <span
                v-if="qtyOf(dish.id) > 0"
                class="min-w-4 text-center text-xs font-bold text-dark"
              >
                {{ qtyOf(dish.id) }}
              </span>
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-xl bg-[#FF7A00] text-lg font-bold text-white shadow-[0_12px_11px_rgba(255,122,0,0.22)]"
                @click="addToCart(dish.id)"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div
      class="fixed inset-x-0 bottom-4 z-20 mx-auto w-[calc(100%-2rem)] max-w-md rounded-[22px] border border-black/8 bg-white p-3 shadow-elevated"
      v-show="cook?.isAvailable"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[13px] font-bold text-dark">
            Корзина: {{ totalItems }} шт
          </p>
          <p class="text-xs font-semibold text-[#6B6B6B]">
            Итого: {{ formatPrice(totalAmount) }}
          </p>
        </div>
        <button
          type="button"
          class="h-11 rounded-2xl px-4 text-sm font-bold text-white shadow-[0_12px_11px_rgba(255,122,0,0.22)] transition"
          :class="
            totalItems > 0
              ? 'bg-[#FF7A00]'
              : 'cursor-not-allowed bg-[#FF7A00]/45'
          "
          :disabled="totalItems === 0"
        >
          Оформить
        </button>
      </div>
    </div>
  </section>
</template>
