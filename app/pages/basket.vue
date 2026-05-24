<script setup lang="ts">
definePageMeta({
  hideBottomNav: true,
});

import type { BasketCookGroup, BasketCookSummary, BasketLineItem } from "~/types";
import { usePageToast } from "~/composables/usePageToast";
import { apiMessage } from "~/utils/apiMessage";
import { fetchBasket, updateBasketItemQuantity } from "~/utils/basketApi";
import { dishImageSrc } from "~/utils/dishApi";

const router = useRouter();
const toast = usePageToast();
const { t } = useI18n();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const api = $api as (url: string, opts?: object) => Promise<unknown>;
const apiBase = computed(() => config.public.apiBaseUrl as string);
const updatingLineIds = ref<Set<string>>(new Set());

const {
  data: basket,
  pending,
  error,
  refresh,
} = useAsyncData("basket", async () => await fetchBasket(api), {
  immediate: true,
});

const cookGroups = computed<BasketCookGroup[]>(() => basket.value?.groups ?? []);

const isEmpty = computed(
  () =>
    !pending.value
    && !error.value
    && (basket.value?.items.length ?? 0) === 0,
);

function formatPrice(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₸`;
}

function cookPhoto(cook: BasketCookSummary): string | undefined {
  return (
    dishImageSrc(cook.profileImageUrl, apiBase.value)
  );
}

function dishPhoto(line: BasketLineItem): string | undefined {
  return dishImageSrc(line.dish.imageUrl, apiBase.value);
}

function dishSubtitle(line: BasketLineItem): string {
  const parts: string[] = [];
  const desc = line.dish.description?.trim();
  if (desc) parts.push(desc);
  return parts.join(" • ") || t("l_Homemade_dish");
}

function filledStars(rating: number): number {
  const n = Math.round(rating);
  return Math.min(5, Math.max(0, n));
}

function maxPortions(line: BasketLineItem): number {
  const raw = line.dish.portionCount;
  if (raw == null || !Number.isFinite(raw)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.trunc(raw));
}

function isUpdatingLine(lineId: string): boolean {
  return updatingLineIds.value.has(lineId);
}

function setUpdatingLine(lineId: string, value: boolean): void {
  const next = new Set(updatingLineIds.value);
  if (value) next.add(lineId);
  else next.delete(lineId);
  updatingLineIds.value = next;
}

async function updateQuantity(line: BasketLineItem, quantity: number): Promise<void> {
  if (isUpdatingLine(line.id)) return;

  const nextQuantity = Math.max(0, Math.trunc(quantity));
  if (nextQuantity > maxPortions(line)) return;

  setUpdatingLine(line.id, true);
  try {
    await updateBasketItemQuantity(api, line.id, nextQuantity);
    await refresh();
  } catch (err: unknown) {
    toast.show(apiMessage(err, 'l_Failed_update_cart'), "error");
  } finally {
    setUpdatingLine(line.id, false);
  }
}

function increment(line: BasketLineItem): void {
  void updateQuantity(line, line.quantity + 1);
}

function decrement(line: BasketLineItem): void {
  void updateQuantity(line, line.quantity - 1);
}

function remove(line: BasketLineItem): void {
  void updateQuantity(line, 0);
}

function goPay(): void {
  navigateTo("/prepare-order");
}

function retryLoad(): void {
  void refresh();
}
</script>

<template>
  <div class="relative mx-auto min-h-screen pb-[160px] w-full max-w-md bg-page-cream">
    <header
      class="sticky top-0 z-30 border-b border-soft-border/80 bg-page-cream/90 px-4 pb-2.5 pt-3.5 backdrop-blur-[5px]">
      <div class="flex items-center gap-3">
        <button type="button"
          class="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-black/6 bg-white/96 shadow-[0_8px_10px_rgba(0,0,0,0.1)]"
          :aria-label="$t('l_Back')" @click="router.back()">
          <Icon name="material-symbols:chevron-left-rounded" class="size-5 text-icon-secondary" />
        </button>
        <h1 class="min-w-0 flex-1 text-center text-[23px] font-bold leading-[26px] text-heading">
          {{ $t('l_Basket') }}
        </h1>
        <div class="size-11 shrink-0" aria-hidden="true" />
      </div>
    </header>

    <div class="px-4 pb-[calc(13rem+var(--safe-area-bottom))] pt-6">
      <div v-if="pending"
        class="rounded-[22px] border border-soft-border bg-white/92 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
        <div class="flex items-center gap-3">
          <div class="size-14 animate-pulse rounded-2xl bg-black/10" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-4 w-40 animate-pulse rounded bg-black/10" />
            <div class="h-3 w-32 animate-pulse rounded bg-black/10" />
            <div class="h-20 w-full animate-pulse rounded-xl bg-black/10" />
          </div>
        </div>
      </div>

      <div v-else-if="error"
        class="rounded-[22px] border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
        <p>{{ $t('l_Failed_load_cart') }}</p>
        <button type="button" class="mt-3 rounded-xl bg-white px-4 py-2 font-semibold text-dark shadow-sm"
          @click="retryLoad">
          {{ $t('l_Retry') }}
        </button>
      </div>

      <div v-else-if="isEmpty"
        class="rounded-[22px] border border-soft-border bg-white/92 p-8 text-center shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
        <p class="text-base font-bold text-body">{{ $t('l_Basket_empty') }}</p>
        <p class="mt-2 text-xs font-semibold text-subtle">
          {{ $t('l_Basket_empty_hint') }}
        </p>
        <NuxtLink to="/cooks"
          class="mt-6 inline-flex h-11 items-center justify-center rounded-[18px] bg-[#FF7A00] px-6 text-sm font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)]">
          {{ $t('l_To_cooks') }}
        </NuxtLink>
      </div>

      <div v-else class="flex flex-col gap-2.5">
        <div v-for="group in cookGroups" :key="group.cookId"
          class="overflow-hidden rounded-[22px] bg-white/92 p-3 shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
          <div class="mb-4 flex gap-2.5">
            <div
              class="size-[70px] shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-[0_10px_18px_rgba(0,0,0,0.1)]">
              <img v-if="cookPhoto(group.cook)" :src="cookPhoto(group.cook)" :alt="group.cook.businessName"
                class="size-full object-cover" />
              <div v-else
                class="flex size-full items-center justify-center bg-surface-muted text-[10px] font-bold text-subtle">
                {{ $t('l_Photo') }}
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-end gap-2">
                <p class="text-[15.6px] font-bold leading-tight text-heading">
                  {{ group.cook.businessName }}
                </p>
                <div class="flex items-center gap-0.5 pb-px">
                  <Icon v-for="i in filledStars(group.cook.rating)" :key="`${group.cookId}-star-${i}`"
                    name="material-symbols:star-rounded" class="size-4 text-[#FF7A00]" />
                </div>
              </div>
              <div class="mt-1.5 flex items-center gap-1.5 text-[11px] text-subtle">
                <Icon name="material-symbols:shopping-bag-outline" class="size-3.5 shrink-0 text-icon-muted" />
                <span class="font-normal leading-normal">
                  {{ $t('l_Items_count', { count: group.itemsCount }) }}
                </span>
              </div>
            </div>
          </div>
          <article v-for="item in group.items" :key="item.id" class="border-b-[0.5px] border-black/20 last:border-b-0">
            <div class="flex flex-col gap-6 py-3.5">
              <div class="flex gap-3">
                <div class="size-[76px] shrink-0 overflow-hidden rounded-[14px] border border-black/6">
                  <img v-if="dishPhoto(item)" :src="dishPhoto(item)" :alt="item.dish.name"
                    class="size-full object-cover" />
                  <div v-else
                    class="flex size-full items-center justify-center bg-surface-muted text-[10px] text-subtle">
                    {{ $t('l_No_photo') }}
                  </div>
                </div>

                <div class="min-w-0 flex-1">

                  <div class="pr-2">
                    <p class="text-[15.5px] font-bold leading-5 text-body line-clamp-2">
                      {{ item.dish.name }}
                    </p>
                    <p class="mt-1 text-[10.9px] leading-relaxed text-subtle">
                      {{ dishSubtitle(item) }}
                    </p>
                  </div>
                  <p class="w-auto shrink-0 mt-4 text-left text-xl font-bold leading-tight text-[#FF7A00]">
                    {{ formatPrice(item.lineSubtotal) }}
                  </p>

                  <div class="mt-2.5 flex flex-nowrap items-center justify-between gap-2">
                    <div
                      class="flex h-10 items-center gap-2 rounded-[14px] border border-soft-border bg-white px-2 py-1.5">
                      <button type="button"
                        class="flex size-7 items-center justify-center rounded-[10px] border border-soft-border bg-white text-[13px] font-bold text-black disabled:opacity-40"
                        :aria-label="$t('l_Less')" :disabled="isUpdatingLine(item.id)" @click="decrement(item)">
                        −
                      </button>
                      <span class="min-w-6 text-center text-sm font-bold text-body">{{ item.quantity }}</span>
                      <button type="button"
                        class="flex size-7 items-center justify-center rounded-[10px] border border-soft-border bg-white text-[13px] font-bold text-black disabled:opacity-40"
                        :aria-label="$t('l_More')" :disabled="isUpdatingLine(item.id) || item.quantity >= maxPortions(item)"
                        @click="increment(item)">
                        +
                      </button>
                    </div>
                    <button type="button"
                      class="h-[34px] rounded-xl border border-[#b0002040] bg-[#b000200f] px-3 text-[13px] font-bold text-danger-foreground disabled:opacity-40"
                      :disabled="isUpdatingLine(item.id)" @click="remove(item)">
                      {{ $t('l_Delete') }}
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <div v-if="!pending && !error && basket && basket.items.length > 0"
      class="safe-fixed-bottom-bar pointer-events-none fixed inset-x-0 bottom-10 mx-4 z-20 bg-linear-to-t from-page-cream from-65% to-transparent pt-3">
      <div class="pointer-events-auto mx-auto w-full max-w-md">
        <button type="button"
          class="flex h-12 w-full items-center justify-center rounded-[18px] bg-[#FF7A00] text-base font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)]"
          @click="goPay">
          {{ $t('l_Proceed_to_payment', { amount: formatPrice(basket.itemsTotal) }) }}
        </button>
        <p class="mt-2.5 text-[11.3px] leading-relaxed text-subtle">
          {{ $t('l_Proceed_to_payment_disclaimer') }}
        </p>
      </div>
    </div>
  </div>
</template>
