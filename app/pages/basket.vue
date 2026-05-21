<script setup lang="ts">
definePageMeta({
  hideBottomNav: true,
});

import type { BasketCookSummary, BasketLineItem, Order } from "~/types";
import { usePageToast } from "~/composables/usePageToast";
import { apiMessage } from "~/utils/apiMessage";
import { fetchBasket, updateBasketItemQuantity } from "~/utils/basketApi";
import { dishImageSrc } from "~/utils/dishApi";
import {
  ORDER_PAYMENT_TIMEOUT_MS,
  cancelOrderById,
  fetchOrderById,
  fetchOrders,
  isOrderAwaitingPayment,
  isOrderPaymentComplete,
  orderStatusLabel,
} from "~/utils/ordersApi";

const PAYMENT_CANCEL_REASON = "Заказ отменён из-за отсутствия оплаты";

const router = useRouter();
const route = useRoute();
const toast = usePageToast();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const api = $api as (url: string, opts?: object) => Promise<unknown>;
const apiBase = computed(() => config.public.apiBaseUrl as string);
const kaspiPaymentNumber = computed(
  () => (config.public.kaspiPaymentNumber as string) || "+7 (700) 000-00-00",
);
const updatingLineIds = ref<Set<string>>(new Set());

const paymentOrder = ref<Order | null>(null);
const paymentOrderPending = ref(false);
const paymentOrderError = ref(false);
const checkingPayment = ref(false);
const paymentCancelled = ref(false);
const paymentDeadlineMs = ref<number | null>(null);
const paymentSecondsLeft = ref(0);
let paymentCountdownTimer: ReturnType<typeof setInterval> | null = null;
let paymentAutoCancelTriggered = false;

const {
  data: basket,
  pending,
  error,
  refresh,
} = useAsyncData("basket", async () => await fetchBasket(api), {
  immediate: true,
});

const lines = computed<Array<{ cook: BasketCookSummary; item: BasketLineItem }>>(() => {
  const b = basket.value;
  const cook = b?.cook;
  if (!b?.items.length || !cook) return [];
  return b.items.map((item: BasketLineItem) => ({ cook, item }));
});

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
    ?? dishImageSrc(cook.kitchenPhotoUrls[0], apiBase.value)
  );
}

function dishPhoto(line: BasketLineItem): string | undefined {
  return dishImageSrc(line.dish.imageUrl, apiBase.value);
}

function dishSubtitle(line: BasketLineItem): string {
  const parts: string[] = [];
  const desc = line.dish.description?.trim();
  if (desc) parts.push(desc);
  return parts.join(" • ") || "Домашнее блюдо";
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
    toast.show(apiMessage(err, "Не удалось обновить корзину."), "error");
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

const routeOrderId = computed(() => {
  const raw = route.query.orderId;
  return typeof raw === "string" && raw.trim() ? raw.trim() : "";
});

const showPaymentView = computed(
  () =>
    !!paymentOrder.value
    && isOrderAwaitingPayment(paymentOrder.value)
    && !paymentCancelled.value,
);

const paymentTimerLabel = computed(() => {
  const sec = Math.max(0, paymentSecondsLeft.value);
  const mm = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const ss = (sec % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
});

function paymentDeadlineStorageKey(orderId: string): string {
  return `tap-tamak-payment-deadline-${orderId}`;
}

function readPaymentDeadline(orderId: string): number {
  if (!import.meta.client) return Date.now() + ORDER_PAYMENT_TIMEOUT_MS;
  const key = paymentDeadlineStorageKey(orderId);
  const stored = sessionStorage.getItem(key);
  const parsed = stored ? Number(stored) : NaN;
  if (Number.isFinite(parsed) && parsed > Date.now()) return parsed;
  const deadline = Date.now() + ORDER_PAYMENT_TIMEOUT_MS;
  sessionStorage.setItem(key, String(deadline));
  return deadline;
}

function clearPaymentDeadline(orderId: string): void {
  if (!import.meta.client) return;
  sessionStorage.removeItem(paymentDeadlineStorageKey(orderId));
}

function stopPaymentCountdown(): void {
  if (paymentCountdownTimer) {
    clearInterval(paymentCountdownTimer);
    paymentCountdownTimer = null;
  }
}

function syncPaymentCountdown(): void {
  if (!paymentDeadlineMs.value) {
    paymentSecondsLeft.value = 0;
    return;
  }
  paymentSecondsLeft.value = Math.max(
    0,
    Math.ceil((paymentDeadlineMs.value - Date.now()) / 1000),
  );
}

function startPaymentCountdown(orderId: string): void {
  stopPaymentCountdown();
  paymentDeadlineMs.value = readPaymentDeadline(orderId);
  syncPaymentCountdown();
  paymentCountdownTimer = setInterval(() => {
    syncPaymentCountdown();
    if (paymentSecondsLeft.value <= 0) {
      stopPaymentCountdown();
      void onPaymentTimeout();
    }
  }, 1000);
}

async function loadPaymentOrder(orderId: string): Promise<void> {
  paymentOrderPending.value = true;
  paymentOrderError.value = false;
  paymentCancelled.value = false;
  paymentAutoCancelTriggered = false;
  try {
    const order = await fetchOrderById(api, orderId);
    paymentOrder.value = order;
    if (isOrderPaymentComplete(order)) {
      clearPaymentDeadline(orderId);
      stopPaymentCountdown();
      await navigateTo({ path: "/orders", query: { orderId } });
      return;
    }
    if (!isOrderAwaitingPayment(order)) {
      stopPaymentCountdown();
      return;
    }
    startPaymentCountdown(orderId);
  } catch {
    paymentOrderError.value = true;
    paymentOrder.value = null;
    stopPaymentCountdown();
  } finally {
    paymentOrderPending.value = false;
  }
}

async function resolvePaymentOrderId(): Promise<string | null> {
  if (routeOrderId.value) return routeOrderId.value;
  try {
    const awaiting = await fetchOrders(api, {
      status: "AWAITING_PAYMENT",
      limit: 1,
    });
    return awaiting.find((o) => isOrderAwaitingPayment(o))?.id ?? null;
  } catch {
    return null;
  }
}

async function initPaymentFlow(): Promise<void> {
  const orderId = await resolvePaymentOrderId();
  if (!orderId) {
    paymentOrder.value = null;
    stopPaymentCountdown();
    return;
  }
  await loadPaymentOrder(orderId);
}

async function onPaymentTimeout(): Promise<void> {
  const order = paymentOrder.value;
  if (!order || paymentAutoCancelTriggered || !isOrderAwaitingPayment(order)) return;
  paymentAutoCancelTriggered = true;
  try {
    await cancelOrderById(api, order.id);
    paymentCancelled.value = true;
    clearPaymentDeadline(order.id);
    toast.show(PAYMENT_CANCEL_REASON, "error");
  } catch (err: unknown) {
    paymentAutoCancelTriggered = false;
    toast.show(apiMessage(err, "Не удалось отменить заказ."), "error");
  }
}

async function checkPaymentStatus(): Promise<void> {
  const order = paymentOrder.value;
  if (!order || checkingPayment.value) return;
  checkingPayment.value = true;
  try {
    const fresh = await fetchOrderById(api, order.id);
    paymentOrder.value = fresh;
    if (isOrderPaymentComplete(fresh)) {
      clearPaymentDeadline(fresh.id);
      stopPaymentCountdown();
      toast.show("Оплата получена.", "success");
      await navigateTo({ path: "/orders", query: { orderId: fresh.id } });
      return;
    }
    if (!isOrderAwaitingPayment(fresh)) {
      stopPaymentCountdown();
      return;
    }
    toast.show("Оплата пока не поступила. Переведите на номер Kaspi и проверьте снова.", "info");
  } catch (err: unknown) {
    toast.show(apiMessage(err, "Не удалось проверить статус оплаты."), "error");
  } finally {
    checkingPayment.value = false;
  }
}

async function copyKaspiNumber(): Promise<void> {
  const digits = kaspiPaymentNumber.value.replace(/\D/g, "");
  const text = digits || kaspiPaymentNumber.value;
  try {
    await navigator.clipboard.writeText(text);
    toast.show("Номер скопирован.", "success");
  } catch {
    toast.show("Не удалось скопировать номер.", "error");
  }
}

function dismissPaymentCancelled(): void {
  paymentCancelled.value = false;
  paymentOrder.value = null;
  void router.replace({ path: "/basket", query: {} });
}

watch(
  () => routeOrderId.value,
  () => {
    void initPaymentFlow();
  },
);

onMounted(() => {
  void initPaymentFlow();
});

onBeforeUnmount(() => {
  stopPaymentCountdown();
});
</script>

<template>
  <div class="relative mx-auto min-h-screen w-full max-w-md bg-page-cream">
    <header
      class="sticky top-0 z-30 border-b border-soft-border/80 bg-page-cream/90 px-4 pb-2.5 pt-3.5 backdrop-blur-[5px]">
      <div class="flex items-center gap-3">
        <button type="button"
          class="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-black/6 bg-white/96 shadow-[0_8px_10px_rgba(0,0,0,0.1)]"
          aria-label="Назад" @click="router.back()">
          <Icon name="material-symbols:chevron-left-rounded" class="size-5 text-icon-secondary" />
        </button>
        <h1 class="min-w-0 flex-1 text-center text-[23px] font-bold leading-[26px] text-heading">
          {{ showPaymentView ? "Оплата Kaspi" : "Корзина" }}
        </h1>
        <div class="size-11 shrink-0" aria-hidden="true" />
      </div>
    </header>

    <div class="px-4 pb-[calc(13rem+var(--safe-area-bottom))] pt-6">
      <div v-if="paymentOrderPending"
        class="rounded-[22px] border border-soft-border bg-white/92 p-6 shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
        <div class="h-4 w-40 animate-pulse rounded bg-black/10" />
        <div class="mt-4 h-16 w-full animate-pulse rounded-xl bg-black/10" />
      </div>

      <div v-else-if="paymentOrderError"
        class="rounded-[22px] border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
        <p>Не удалось загрузить заказ для оплаты.</p>
        <button type="button" class="mt-3 rounded-xl bg-white px-4 py-2 font-semibold text-dark shadow-sm"
          @click="initPaymentFlow">
          Повторить
        </button>
      </div>

      <div v-else-if="paymentCancelled"
        class="rounded-[22px] border border-red-200 bg-red-50/90 p-6 text-center shadow-[0_14px_34px_rgba(0,0,0,0.08)]">
        <Icon name="material-symbols:cancel-outline-rounded" class="mx-auto size-10 text-danger-foreground" />
        <p class="mt-3 text-base font-bold text-danger-foreground">
          {{ PAYMENT_CANCEL_REASON }}
        </p>
        <p class="mt-2 text-xs font-semibold text-subtle">
          Время на оплату истекло (5 минут).
        </p>
        <button type="button"
          class="mt-5 h-11 w-full rounded-[18px] bg-[#FF7A00] text-sm font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)]"
          @click="dismissPaymentCancelled">
          Вернуться в корзину
        </button>
      </div>

      <div v-else-if="showPaymentView && paymentOrder"
        class="flex flex-col gap-3">
        <section
          class="rounded-[22px] border border-[#FF7A00]/25 bg-white/92 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
          <div class="flex items-center justify-between gap-3">
            <p class="text-[15px] font-bold text-heading">
              Ожидаем оплату
            </p>
            <span
              class="inline-flex items-center gap-1 rounded-full border border-[#FF7A00]/30 bg-[#FF7A00]/10 px-2.5 py-1 text-[12px] font-bold text-[#FF7A00]">
              <Icon name="material-symbols:timer-outline" class="size-3.5" />
              {{ paymentTimerLabel }}
            </span>
          </div>
          <p class="mt-2 text-[12px] leading-relaxed text-subtle">
            Переведите сумму на Kaspi в течение 5 минут. После перевода нажмите «Проверить статус оплаты».
          </p>
          <p class="mt-3 text-[13px] font-semibold text-body">
            К оплате: <span class="text-[#FF7A00]">{{ formatPrice(paymentOrder.totalAmount) }}</span>
          </p>
          <p v-if="paymentOrder.orderNumber" class="mt-1 text-[11px] text-caption">
            Заказ {{ paymentOrder.orderNumber }}
          </p>
        </section>

        <section
          class="rounded-[22px] border border-soft-border bg-white/92 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
          <p class="text-[13px] font-bold text-section">
            Номер Kaspi для оплаты
          </p>
          <div class="mt-3 flex items-center gap-2 rounded-[16px] border border-black/8 bg-page-cream px-3 py-3">
            <p class="min-w-0 flex-1 text-[18px] font-bold tracking-wide text-heading">
              {{ kaspiPaymentNumber }}
            </p>
            <button type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-black/8 bg-white"
              aria-label="Скопировать номер" @click="copyKaspiNumber">
              <Icon name="material-symbols:content-copy-outline" class="size-5 text-icon-secondary" />
            </button>
          </div>
          <p class="mt-3 text-[11.5px] leading-relaxed text-subtle">
            Проверьте статус оплаты после перевода. Если оплата не поступила, номер Kaspi останется на экране.
          </p>
        </section>

        <button type="button"
          class="flex h-12 w-full items-center justify-center rounded-[18px] bg-[#FF7A00] text-base font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)] disabled:opacity-60"
          :disabled="checkingPayment" @click="checkPaymentStatus">
          {{ checkingPayment ? "Проверяем…" : "Проверить статус оплаты" }}
        </button>

        <NuxtLink :to="`/orders?orderId=${paymentOrder.id}`"
          class="text-center text-[12px] font-semibold text-subtle underline-offset-2 hover:underline">
          Перейти к заказу
        </NuxtLink>
      </div>

      <div v-else-if="paymentOrder && !showPaymentView && !paymentCancelled"
        class="rounded-[22px] border border-soft-border bg-white/92 p-5 text-center shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
        <p class="text-base font-bold text-body">
          {{ orderStatusLabel(paymentOrder.status) }}
        </p>
        <p class="mt-2 text-xs font-semibold text-subtle">
          Оплата через Kaspi откроется, когда заказ перейдёт в статус «Ждём оплаты».
        </p>
        <NuxtLink :to="`/orders?orderId=${paymentOrder.id}`"
          class="mt-4 inline-flex h-11 items-center justify-center rounded-[18px] bg-[#FF7A00] px-6 text-sm font-bold text-white">
          К заказу
        </NuxtLink>
      </div>

      <div v-else-if="pending"
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
        <p>Не удалось загрузить корзину.</p>
        <button type="button" class="mt-3 rounded-xl bg-white px-4 py-2 font-semibold text-dark shadow-sm"
          @click="retryLoad">
          Повторить
        </button>
      </div>

      <div v-else-if="isEmpty"
        class="rounded-[22px] border border-soft-border bg-white/92 p-8 text-center shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
        <p class="text-base font-bold text-body">Корзина пуста</p>
        <p class="mt-2 text-xs font-semibold text-subtle">
          Добавьте блюда из меню повара.
        </p>
        <NuxtLink to="/cooks"
          class="mt-6 inline-flex h-11 items-center justify-center rounded-[18px] bg-[#FF7A00] px-6 text-sm font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)]">
          К поварам
        </NuxtLink>
      </div>

      <div v-else class="flex flex-col gap-2.5">
        <div class="overflow-hidden p-3 rounded-[22px]  bg-white/92 shadow-[0_14px_34px_rgba(0,0,0,0.1)]">

          <div class="flex gap-2.5 mb-4">
            <div v-if="basket?.cook"
              class="size-[70px] shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-[0_10px_18px_rgba(0,0,0,0.1)]">
              <img v-if="cookPhoto(basket?.cook)" :src="cookPhoto(basket?.cook)" :alt="basket?.cook?.businessName"
                class="size-full object-cover" />
              <div v-else
                class="flex size-full items-center justify-center bg-surface-muted text-[10px] font-bold text-subtle">
                Фото
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-end gap-2">
                <p class="text-[15.6px] font-bold leading-tight text-heading">
                  {{ basket?.cook?.businessName }}
                </p>
                <div class="flex items-center gap-0.5 pb-px">
                  <Icon v-for="i in filledStars(basket?.cook?.rating ?? 0)" :key="`star-${i}`"
                    name="material-symbols:star-rounded" class="size-4 text-[#FF7A00]" />
                </div>
              </div>
              <div v-if="(basket?.itemsCount || 0) > 0"
                class="mt-1.5 flex items-center gap-1.5 text-[11px] text-subtle">
                <Icon name="material-symbols:shopping-bag-outline" class="size-3.5 shrink-0 text-icon-muted" />
                <span class="font-normal leading-normal">
                  Позиций: {{ basket?.itemsCount ?? 0 }}
                </span>
              </div>
            </div>
          </div>
          <article v-for="({ item }) in lines" :key="item.id" class=" border-black/20 border-b-[0.5px] last:border-b-0">
            <div class="flex flex-col gap-6 py-3.5">
              <div class="flex gap-3">
                <div class="size-[76px] shrink-0 overflow-hidden rounded-[14px] border border-black/6">
                  <img v-if="dishPhoto(item)" :src="dishPhoto(item)" :alt="item.dish.name"
                    class="size-full object-cover" />
                  <div v-else
                    class="flex size-full items-center justify-center bg-surface-muted text-[10px] text-subtle">
                    Нет фото
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
                        aria-label="Меньше" :disabled="isUpdatingLine(item.id)" @click="decrement(item)">
                        −
                      </button>
                      <span class="min-w-6 text-center text-sm font-bold text-body">{{ item.quantity }}</span>
                      <button type="button"
                        class="flex size-7 items-center justify-center rounded-[10px] border border-soft-border bg-white text-[13px] font-bold text-black disabled:opacity-40"
                        aria-label="Больше" :disabled="isUpdatingLine(item.id) || item.quantity >= maxPortions(item)"
                        @click="increment(item)">
                        +
                      </button>
                    </div>
                    <button type="button"
                      class="h-[34px] rounded-xl border border-[#b0002040] bg-[#b000200f] px-3 text-[13px] font-bold text-danger-foreground disabled:opacity-40"
                      :disabled="isUpdatingLine(item.id)" @click="remove(item)">
                      Удалить
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <div
      v-if="!showPaymentView && !paymentOrderPending && !paymentCancelled && !pending && !error && basket && basket.items.length > 0"
      class="safe-fixed-bottom-bar pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-linear-to-t from-page-cream from-65% to-transparent pt-3">
      <div class="pointer-events-auto mx-auto w-full max-w-md">
        <button type="button"
          class="flex h-12 w-full items-center justify-center rounded-[18px] bg-[#FF7A00] text-base font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)]"
          @click="goPay">
          Перейти к оплате · {{ formatPrice(basket.itemsTotal) }}
        </button>
        <p class="mt-2.5 text-[11.3px] leading-relaxed text-subtle">
          Нажимая «Перейти к оплате», вы подтверждаете заказ и переходите к
          выбору адреса и способа оплаты.
        </p>
      </div>
    </div>
  </div>
</template>
