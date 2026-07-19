<script setup lang="ts">
import type { Order, OrderItem } from "~/types";
import { usePageToast } from "~/composables/usePageToast";
import { apiMessage } from "~/utils/apiMessage";
import { dishImageSrc } from "~/utils/dishApi";
import {
  ORDER_PAYMENT_TIMEOUT_MS,
  acceptDeliveredOrder,
  cancelOrderById,
  fetchOrders,
  isOrderAwaitingPayment,
  isOrderCancellable,
  isOrderDelivered,
  orderStatusTone,
  rejectDeliveredOrder,
} from "~/utils/ordersApi";
import { useOrderStatusLabel } from "~/composables/useOrderStatusLabel";
import { VueEasyPullRefresh } from "vue-easy-pull-refresh";

const toast = usePageToast();
const { t } = useI18n();
const orderStatusLabel = useOrderStatusLabel();
const PAYMENT_CANCEL_REASON = computed(() => t("l_Payment_cancel_reason"));
const { $api } = useNuxtApp();
const config = useRuntimeConfig();
const kaspiPaymentNumber = useKaspiPaymentNumber();

const api = $api as (url: string, opts?: object) => Promise<unknown>;
const apiBase = computed(() => config.public.apiBaseUrl as string);
const cancellingOrderIds = ref<Set<string>>(new Set());
const paymentSecondsByOrderId = ref<Record<string, number>>({});
const paymentAutoCancelTriggered = ref<Set<string>>(new Set());
let paymentCountdownTimer: ReturnType<typeof setInterval> | null = null;
const respondedOrderIds = ref<Set<string>>(new Set());

type DeliveryModalKind = "accepting" | "accept" | "reject" | null;
const deliveryModal = ref<DeliveryModalKind>(null);
const deliveryModalOrder = ref<Order | null>(null);
const rejectDishesReason = ref("");
const rejectDishesError = ref("");
const deliverySubmitting = ref(false);

const {
  data: orders,
  pending,
  error,
  refresh,
} = useAsyncData<Order[]>("orders", async () => await fetchOrders(api), {
  default: () => [],
  immediate: true,
});

const isEmpty = computed(
  () => !pending.value && !error.value && (orders.value?.length ?? 0) === 0,
);

const initialLoadDone = ref(false);
watch(
  pending,
  (isPending) => {
    if (!isPending) initialLoadDone.value = true;
  },
  { immediate: true },
);
const isInitialLoad = computed(() => pending.value && !initialLoadDone.value);

function refreshOrdersQueue() {
  return refresh();
}

const localizedMonths = useLocalizedMonths();

function formatPrice(value: number): string {
  return Math.round(value).toLocaleString("ru-RU");
}

function formatOrderDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const month = localizedMonths.value[d.getMonth()] ?? "";
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${d.getDate()} ${month} • ${hh}:${mm}`;
}

function cookPhotoSrc(cook: Order["cook"]): string | undefined {
  if (!cook) return undefined;
  return dishImageSrc(cook.profileImageUrl, apiBase.value);
}

function itemPhotoSrc(item: OrderItem): string | undefined {
  return dishImageSrc(item.dish?.imageUrl, apiBase.value);
}

function filledStars(rating: number | undefined): number {
  if (!rating || !Number.isFinite(rating)) return 0;
  return Math.min(5, Math.max(0, Math.round(rating)));
}

function cookInitials(name?: string): string {
  if (!name) return t("l_Initial_fallback");
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return t("l_Initial_fallback");
  const initials = words.slice(0, 2).map((w) => w[0] ?? "").join("");
  return (initials || words[0]?.[0] || t("l_Initial_fallback")).toUpperCase();
}

function itemName(item: OrderItem): string {
  return item.dish?.name?.trim() || item.name?.trim() || t("l_Dish");
}

function itemSubtotal(item: OrderItem): number {
  return item.price * item.quantity;
}

function orderDeliveryFee(order: Order): number {
  return Math.max(0, Math.round(order.deliveryFee ?? 0));
}

function orderDishesSubtotal(order: Order): number {
  const fromItems = order.items.reduce((sum, item) => sum + itemSubtotal(item), 0);
  const delivery = orderDeliveryFee(order);
  if (delivery > 0 && order.totalAmount >= delivery) {
    return order.totalAmount - delivery;
  }
  return fromItems;
}

function showHero(order: Order): OrderItem | undefined {
  return order.items[0];
}

function paymentDeadlineStorageKey(orderId: string): string {
  return `tap-tamak-payment-deadline-${orderId}`;
}

function readPaymentDeadline(order: Order): number {
  const createdMs = order.createdAt ? Date.parse(order.createdAt) : NaN;
  if (Number.isFinite(createdMs)) {
    return createdMs + ORDER_PAYMENT_TIMEOUT_MS;
  }
  if (!import.meta.client) return Date.now() + ORDER_PAYMENT_TIMEOUT_MS;
  const key = paymentDeadlineStorageKey(order.id);
  const stored = sessionStorage.getItem(key);
  const parsed = stored ? Number(stored) : NaN;
  if (Number.isFinite(parsed)) return parsed;
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

function paymentTimerLabel(orderId: string): string {
  const sec = Math.max(0, paymentSecondsByOrderId.value[orderId] ?? 0);
  const mm = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const ss = (sec % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function syncPaymentCountdowns(): void {
  const next: Record<string, number> = { ...paymentSecondsByOrderId.value };
  for (const order of orders.value ?? []) {
    if (!isOrderAwaitingPayment(order)) {
      clearPaymentDeadline(order.id);
      delete next[order.id];
      continue;
    }
    const deadline = readPaymentDeadline(order);
    const secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    next[order.id] = secondsLeft;
    if (secondsLeft <= 0) {
      void onPaymentTimeout(order);
    }
  }
  paymentSecondsByOrderId.value = next;
}

function startPaymentCountdown(): void {
  stopPaymentCountdown();
  syncPaymentCountdowns();
  const hasAwaiting = (orders.value ?? []).some((o) => isOrderAwaitingPayment(o));
  if (!hasAwaiting) return;
  paymentCountdownTimer = setInterval(() => {
    syncPaymentCountdowns();
  }, 1000);
}

async function onPaymentTimeout(order: Order): Promise<void> {
  if (paymentAutoCancelTriggered.value.has(order.id) || !isOrderAwaitingPayment(order)) return;
  paymentAutoCancelTriggered.value = new Set(paymentAutoCancelTriggered.value).add(order.id);
  try {
    await cancelOrderById(api, order.id);
    clearPaymentDeadline(order.id);
    toast.show(PAYMENT_CANCEL_REASON.value, "error");
    await refresh();
  } catch (err: unknown) {
    const next = new Set(paymentAutoCancelTriggered.value);
    next.delete(order.id);
    paymentAutoCancelTriggered.value = next;
    toast.show(apiMessage(err, 'l_Failed_cancel_order'), "error");
  }
}

function isCancelling(orderId: string): boolean {
  return cancellingOrderIds.value.has(orderId);
}

function setCancelling(orderId: string, value: boolean): void {
  const next = new Set(cancellingOrderIds.value);
  if (value) next.add(orderId);
  else next.delete(orderId);
  cancellingOrderIds.value = next;
}

async function onCancel(order: Order): Promise<void> {
  if (!isOrderCancellable(order.status) || isCancelling(order.id)) return;
  setCancelling(order.id, true);
  try {
    await cancelOrderById(api, order.id);
    await refresh();
    toast.show(t("l_Order_cancelled"), "success");
  } catch (err: unknown) {
    toast.show(apiMessage(err, 'l_Failed_cancel_order'), "error");
  } finally {
    setCancelling(order.id, false);
  }
}

function onMessage(_order: Order): void {
  toast.show(t("l_Chat_with_cook_soon"), "info");
}

function hasDeliveryResponse(orderId: string): boolean {
  return respondedOrderIds.value.has(orderId);
}

function markDeliveryResponded(orderId: string): void {
  respondedOrderIds.value = new Set(respondedOrderIds.value).add(orderId);
}

function showDeliveryActions(order: Order): boolean {
  return isOrderDelivered(order.status) && !hasDeliveryResponse(order.id);
}

function openDeliveryAccept(order: Order): void {
  deliveryModalOrder.value = order;
  deliveryModal.value = "accepting";
  void submitDeliveryAccept();
}

function openDeliveryReject(order: Order): void {
  deliveryModalOrder.value = order;
  deliveryModal.value = "reject";
  rejectDishesReason.value = "";
  rejectDishesError.value = "";
}

function closeDeliveryModal(): void {
  if (deliverySubmitting.value) return;
  deliveryModal.value = null;
  deliveryModalOrder.value = null;
  rejectDishesReason.value = "";
  rejectDishesError.value = "";
}

async function submitDeliveryAccept(): Promise<void> {
  const order = deliveryModalOrder.value;
  if (!order || deliverySubmitting.value) return;
  deliverySubmitting.value = true;
  try {
    await acceptDeliveredOrder(api, order.id);
    markDeliveryResponded(order.id);
    await refresh();
    deliveryModal.value = "accept";
  } catch (err: unknown) {
    toast.show(apiMessage(err, 'l_Failed_confirm_delivery'), "error");
    closeDeliveryModal();
  } finally {
    deliverySubmitting.value = false;
  }
}

function closeDeliveryThankYou(): void {
  closeDeliveryModal();
}

watch(
  orders,
  () => {
    startPaymentCountdown();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopPaymentCountdown();
});

async function confirmDeliveryReject(): Promise<void> {
  const order = deliveryModalOrder.value;
  if (!order || deliverySubmitting.value) return;
  const reason = rejectDishesReason.value.trim();
  if (reason.length < 3) {
    rejectDishesError.value = t("l_Reject_reason_min_length");
    return;
  }
  rejectDishesError.value = "";
  deliverySubmitting.value = true;
  try {
    await rejectDeliveredOrder(api, order.id, { reason });
    markDeliveryResponded(order.id);
    await refresh();
    closeDeliveryModal();
    toast.show(t("l_Feedback_received"), "info");
  } catch (err: unknown) {
    toast.show(apiMessage(err, 'l_Failed_send_feedback'), "error");
  } finally {
    deliverySubmitting.value = false;
  }
}
</script>

<template>
  <VueEasyPullRefresh class="h-full min-h-full w-full" :is-disabled="deliveryModal !== null" :is-refresh-content="false"
    :is-appear-animation="false" :initial-queue="refreshOrdersQueue" :pull-down-threshold="64">
    <template #loader>
      <div class="flex items-center justify-center gap-2 py-2 text-[#FF7A00]">
        <Icon name="material-symbols:refresh-rounded" class="size-5 shrink-0 animate-spin" />
        <span class="text-[11px] font-semibold text-subtle">{{ t("l_Loading") }}</span>
      </div>
    </template>

    <div class="relative mx-auto min-h-screen w-full max-w-md bg-page-cream">
      <header class="sticky top-0 z-30 bg-page-cream/92 px-4 py-4 backdrop-blur-[6px]">
        <h1 class="text-2xl font-bold text-heading">
          {{ t("l_My_orders") }}
        </h1>
      </header>

      <div class="px-4 pb-28 pt-4">
        <div v-if="isInitialLoad" class="flex flex-col gap-3">
          <div v-for="n in 2" :key="`sk-${n}`"
            class="rounded-[22px] border border-black/6 bg-white/92 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
            <div class="flex items-center gap-3">
              <div class="size-11 animate-pulse rounded-2xl bg-black/10" />
              <div class="min-w-0 flex-1 space-y-2">
                <div class="h-4 w-32 animate-pulse rounded bg-black/10" />
                <div class="h-3 w-24 animate-pulse rounded bg-black/10" />
              </div>
            </div>
            <div class="mt-4 h-[92px] animate-pulse rounded-[18px] bg-black/10" />
            <div class="mt-4 flex gap-2.5">
              <div class="h-10 flex-1 animate-pulse rounded-[16px] bg-black/10" />
              <div class="h-10 flex-1 animate-pulse rounded-[16px] bg-black/5" />
            </div>
          </div>
        </div>

        <div v-else-if="error"
          class="rounded-[22px] border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
          <p>{{ t("l_Failed_load_orders") }}</p>
          <button type="button" class="mt-3 rounded-xl bg-white px-4 py-2 font-semibold text-dark shadow-sm"
            @click="refresh()">
            {{ t("l_Retry") }}
          </button>
        </div>

        <div v-else-if="isEmpty"
          class="rounded-[22px] border border-black/6 bg-white/92 p-8 text-center shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
          <p class="text-base font-bold text-body">{{ t("l_Orders_empty_title") }}</p>
          <p class="mt-2 text-xs font-semibold text-subtle">
            {{ t("l_Orders_empty_hint") }}
          </p>
          <NuxtLink to="/cooks"
            class="mt-6 inline-flex h-11 items-center justify-center rounded-[18px] bg-[#FF7A00] px-6 text-sm font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)]">
            {{ t("l_To_cooks") }}
          </NuxtLink>
        </div>

        <div v-else class="flex flex-col gap-3">
          <article v-for="order in orders" :key="order.id"
            class="overflow-hidden rounded-[22px] border border-black/6 bg-white/92 shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
            <div class="flex flex-col gap-2.5 p-3.5">
              <div class="flex items-start gap-2.5">
                <div class="flex min-w-0 flex-1 items-center gap-2.5">
                  <div
                    class="size-11 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-surface-muted shadow-[0_10px_18px_rgba(0,0,0,0.1)]">
                    <img v-if="cookPhotoSrc(order.cook)" :src="cookPhotoSrc(order.cook)" :alt="order.cook?.businessName"
                      class="size-full object-cover" />
                    <div v-else class="flex size-full items-center justify-center text-[12px] font-bold text-subtle">
                      {{ cookInitials(order.cook?.businessName) }}
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="truncate text-[15.4px] font-bold leading-[18.4px] text-heading">
                        {{ order.cook?.businessName || t("l_Cook") }}
                      </p>
                      <div v-if="filledStars(order.cook?.rating) > 0" class="flex items-center gap-0.5">
                        <Icon v-for="i in filledStars(order.cook?.rating)" :key="`star-${order.id}-${i}`"
                          name="material-symbols:star-rounded" class="size-4 text-[#FF7A00]" />
                      </div>
                    </div>
                    <div class="mt-1.5 flex items-center gap-1.5 text-subtle">
                      <Icon name="material-symbols:schedule-outline-rounded"
                        class="size-3.5 shrink-0 text-icon-muted" />
                      <span class="text-[11.1px] font-normal leading-none">
                        {{ formatOrderDate(order.createdAt) || t("l_Date_pending") }}
                      </span>
                    </div>
                  </div>
                </div>
                <!-- <button type="button"
                class="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-black/6 bg-white"
                :aria-label="t('l_Order_menu')">
                <Icon name="material-symbols:more-horiz" class="size-[18px] text-icon-secondary" />
              </button> -->
              </div>

              <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span
                  class="inline-flex items-center gap-2 rounded-full border px-[11px] py-[9px] text-[11.6px] font-bold leading-none tracking-[-0.1px] text-[#2A2A2A]"
                  :class="orderStatusTone(order.status) === 'success'
                    ? 'border-[#6B8E23]/22 bg-[#6B8E23]/10'
                    : orderStatusTone(order.status) === 'danger'
                      ? 'border-[#B00020]/22 bg-[#B00020]/10'
                      : 'border-[#FF7A00]/22 bg-[#FF7A00]/10'">
                  <span
                    class="flex size-[18px] shrink-0 items-center justify-center rounded-[10px] text-[12px] font-bold leading-none text-white"
                    :class="orderStatusTone(order.status) === 'success'
                      ? 'bg-[#6B8E23]'
                      : orderStatusTone(order.status) === 'danger'
                        ? 'bg-[#B00020]'
                        : 'bg-[#FF7A00]'">
                    <Icon v-if="orderStatusTone(order.status) === 'success'" name="material-symbols:check-rounded"
                      class="size-3" />
                    <Icon v-else-if="orderStatusTone(order.status) === 'danger'" name="material-symbols:close-rounded"
                      class="size-3" />
                    <span v-else>!</span>
                  </span>
                  <span>{{ orderStatusLabel(order.status) }}</span>
                </span>
                <span v-if="isOrderAwaitingPayment(order)"
                  class="inline-flex items-center gap-1 rounded-full border border-[#FF7A00]/30 bg-[#FF7A00]/10 px-2.5 py-1 text-[11.6px] font-bold leading-none text-[#FF7A00]">
                  <Icon name="material-symbols:timer-outline" class="size-3.5" />
                  {{ paymentTimerLabel(order.id) }}
                </span>
                <span v-else-if="order.estimatedMinutes && orderStatusTone(order.status) === 'warning'"
                  class="text-[11.8px] font-bold leading-none text-subtle">
                  {{ t("l_Minutes_left", { minutes: order.estimatedMinutes }) }}
                </span>
              </div>

              <div v-if="isOrderAwaitingPayment(order)"
                class="rounded-[14px] border border-[#FF7A00]/22 bg-[#FF7A00]/6 px-3 py-2.5">
                <p v-if="orderDeliveryFee(order) > 0"
                  class="text-[11.5px] font-semibold leading-relaxed text-[#FF7A00]">
                  {{ t("l_Order_awaiting_payment_delivery_warning", { amount: formatPrice(orderDeliveryFee(order)) }) }}
                </p>
                <p class="text-[11.5px] leading-relaxed text-subtle"
                  :class="orderDeliveryFee(order) > 0 ? 'mt-1.5' : ''">
                  {{ t("l_Transfer_to_kaspi") }}
                  <span class="font-bold text-[#FF7A00]">{{ formatPrice(order.totalAmount) }} ₸</span>
                  {{ t("l_Kaspi_payment_hint") }}
                </p>
                <p v-if="orderDeliveryFee(order) > 0" class="mt-1 text-[11px] leading-relaxed text-subtle">
                  {{ t("l_Order_awaiting_payment_breakdown", {
                    dishes: formatPrice(orderDishesSubtotal(order)),
                    delivery: formatPrice(orderDeliveryFee(order)),
                  }) }}
                </p>
                <p class="mt-1 text-[11.5px] leading-relaxed text-subtle">
                  {{ t("l_Payment_number") }}
                  <span class="font-bold text-heading">{{ kaspiPaymentNumber }}</span>
                </p>
              </div>

              <div v-if="showHero(order)" class="flex gap-3 pt-0.5">
                <div class="size-[92px] shrink-0 overflow-hidden rounded-[18px] border border-black/6 bg-surface-muted">
                  <img v-if="itemPhotoSrc(showHero(order)!)" :src="itemPhotoSrc(showHero(order)!)"
                    :alt="itemName(showHero(order)!)" class="size-full object-cover" />
                  <div v-else class="flex size-full items-center justify-center text-[10px] font-semibold text-subtle">
                    {{ t("l_No_photo") }}
                  </div>
                </div>

                <div class="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div v-for="(item, idx) in order.items" :key="item.id || `${order.id}-${idx}`"
                    class="flex items-start justify-between gap-2">
                    <p class="line-clamp-2 max-w-[160px] text-[13px] font-bold leading-tight text-[#444]">
                      {{ itemName(item) }}
                    </p>
                    <div class="flex shrink-0 flex-col items-end gap-0.5">
                      <p class="text-[16px] font-bold leading-none text-[#555]">
                        ×{{ item.quantity }}
                      </p>
                      <p class="text-[15px] font-bold leading-none tracking-[-0.3px] text-heading">
                        {{ formatPrice(itemSubtotal(item)) }}
                        <span class="text-[11.5px] font-normal text-[#333]">₸</span>
                      </p>
                    </div>
                  </div>

                  <p v-if="order.totalAmount > 0"
                    class="mt-auto pt-1.5 text-right text-[20.1px] font-bold leading-none tracking-[-0.3px] text-heading">
                    {{ formatPrice(order.totalAmount) }}
                    <span class="text-[12.1px] font-normal text-[#333]">₸</span>
                  </p>
                </div>
              </div>

              <div class="mt-1 flex items-center justify-center gap-2.5">
                <template v-if="showDeliveryActions(order)">
                  <button type="button"
                    class="h-[42px] flex-1 rounded-[16px] bg-[#FF7A00] text-[13.6px] font-bold text-white shadow-[0_12px_11px_rgba(255,122,0,0.22)] disabled:opacity-60"
                    :disabled="deliverySubmitting" @click="openDeliveryAccept(order)">
                    {{ deliverySubmitting && deliveryModalOrder?.id === order.id ? t("l_Submitting") : t("l_Accept") }}
                  </button>
                  <button type="button"
                    class="h-[42px] flex-1 rounded-[16px] border border-black/12 bg-white text-[13.7px] font-bold text-[#222]"
                    @click="openDeliveryReject(order)">
                    {{ t("l_Reject") }}
                  </button>
                </template>
                <button v-else-if="isOrderCancellable(order.status)" type="button"
                  class="h-[42px] flex-1 rounded-[16px] bg-[#FF7A00] text-[13.6px] font-bold text-white shadow-[0_12px_11px_rgba(255,122,0,0.22)] disabled:opacity-60"
                  :disabled="isCancelling(order.id)" @click="onCancel(order)">
                  {{ isCancelling(order.id) ? t("l_Cancelling") : t("l_Cancel_order") }}
                </button>
                <!-- <button type="button"
                class="h-[42px] flex-1 rounded-[16px] border border-black/12 bg-white text-[13.7px] font-bold text-[#222]"
                @click="onMessage(order)">
                Написать
              </button> -->
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </VueEasyPullRefresh>

  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="deliveryModal && deliveryModalOrder"
        class="safe-sheet-inset fixed inset-0 z-100 flex items-end justify-center bg-black/45 px-4 pt-4 sm:items-center sm:p-4"
        role="dialog" aria-modal="true" @click.self="closeDeliveryModal">
        <div
          class="w-full max-w-md rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          @click.stop>
          <template v-if="deliveryModal === 'accepting'">
            <p class="text-center text-sm font-semibold text-subtle">
              {{ t("l_Confirming_delivery") }}
            </p>
          </template>

          <template v-else-if="deliveryModal === 'accept'">
            <p class="text-center text-lg font-bold text-heading">
              {{ t("l_Thank_you") }}
            </p>
            <p class="mt-2 text-center text-sm font-semibold text-subtle">
              {{ t("l_Thanks_for_order") }}
            </p>
            <button type="button"
              class="mt-5 h-[42px] w-full rounded-[16px] bg-[#FF7A00] text-[13.6px] font-bold text-white shadow-[0_12px_11px_rgba(255,122,0,0.22)]"
              @click="closeDeliveryThankYou">
              OK
            </button>
          </template>

          <template v-else-if="deliveryModal === 'reject'">
            <p class="text-lg font-bold text-heading">
              {{ t("l_Reject_dishes_title") }}
            </p>
            <p class="mt-1 text-xs font-semibold text-subtle">
              {{ t("l_Reject_dishes_hint") }}
            </p>
            <div class="mt-4">
              <label for="delivery-reject-reason" class="mb-1 block text-sm font-medium text-dark">
                {{ t("l_Reason") }}
              </label>
              <textarea id="delivery-reject-reason" v-model="rejectDishesReason" rows="4"
                :placeholder="t('l_Reject_reason_placeholder')"
                class="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm text-dark placeholder:text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                :class="rejectDishesError ? 'border-error focus:ring-error' : ''" />
              <p v-if="rejectDishesError" class="mt-1 text-sm text-error">
                {{ rejectDishesError }}
              </p>
            </div>
            <div class="mt-5 flex gap-2.5">
              <button type="button"
                class="h-[42px] flex-1 rounded-[16px] border border-black/12 bg-white text-[13.6px] font-bold text-[#222] disabled:opacity-60"
                :disabled="deliverySubmitting" @click="closeDeliveryModal">
                {{ t("l_Cancel") }}
              </button>
              <button type="button"
                class="h-[42px] flex-1 rounded-[16px] bg-[#FF7A00] text-[13.6px] font-bold text-white shadow-[0_12px_11px_rgba(255,122,0,0.22)] disabled:opacity-60"
                :disabled="deliverySubmitting" @click="confirmDeliveryReject">
                {{ deliverySubmitting ? t("l_Submitting") : t("l_Submit") }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-2 opacity-0">
      <div v-if="toast.open"
        class="safe-bottom-toast fixed left-1/2 z-80 w-[min(calc(100vw-2rem),420px)] -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-floating backdrop-blur-sm md:bottom-6"
        :class="toast.kind === 'success'
          ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
          : toast.kind === 'error'
            ? 'border-red-200 bg-red-50/95 text-red-900'
            : 'border-border bg-white/95 text-dark'" role="alert">
        {{ toast.message }}
      </div>
    </Transition>
  </Teleport>
</template>
