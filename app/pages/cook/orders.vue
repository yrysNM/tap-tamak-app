<script setup lang="ts">
import type { Order, OrderItem } from '~/types'
import { usePageToast } from '~/composables/usePageToast'
import { apiMessage } from '~/utils/apiMessage'
import { dishImageSrc } from '~/utils/dishApi'
import {
  acceptOrderByCook,
  fetchOrders,
  isOrderAwaitingCookAcceptance,
  ORDER_COOK_ACCEPTANCE_TIMEOUT_MS,
  rejectOrderByCook,
} from '~/utils/ordersApi'
import { useOrderStatusLabel } from '~/composables/useOrderStatusLabel'

const AWAITING = 'AWAITING_COOK_ACCEPTANCE'

const VISIBLE_STATUSES = new Set([
  AWAITING,
  'COOKING',
  'PREPARING',
  'CONFIRMED',
  'ON_THE_WAY',
  'COURIER_NEARBY',
  'READY',
  'DELIVERED',
  'COMPLETED',
])

const toast = usePageToast()
const { t } = useI18n()
const COOK_ACCEPT_TIMEOUT_REASON = computed(() => t('l_Cook_accept_timeout_reason'))
const orderStatusLabel = useOrderStatusLabel()
const { $api } = useNuxtApp()
const config = useRuntimeConfig()

const api = $api as (url: string, opts?: object) => Promise<unknown>
const apiBase = computed(() => config.public.apiBaseUrl as string)

const {
  data: ordersRaw,
  pending,
  error,
  refresh,
} = useAsyncData<Order[]>(
  'cook-orders-all',
  async () =>
    await fetchOrders(api, {
      page: 1,
      limit: 50,
    }),
  { default: () => [], immediate: true },
)

function normStatus(status: string | undefined): string {
  return (status ?? '').toString().toUpperCase()
}

function isListedCookStatus(status: string | undefined): boolean {
  return VISIBLE_STATUSES.has(normStatus(status))
}

const orders = computed(() => {
  const list = (ordersRaw.value ?? []).filter((o) => isListedCookStatus(o.status))
  return [...list].sort((a, b) => {
    const awaitingA = normStatus(a.status) === AWAITING ? 0 : 1
    const awaitingB = normStatus(b.status) === AWAITING ? 0 : 1
    if (awaitingA !== awaitingB) return awaitingA - awaitingB
    const av = a.createdAt ? Date.parse(a.createdAt) : 0
    const bv = b.createdAt ? Date.parse(b.createdAt) : 0
    return bv - av
  })
})

const isEmpty = computed(
  () => !pending.value && !error.value && orders.value.length === 0,
)

type ModalKind = 'accept' | 'reject' | null
const modal = ref<ModalKind>(null)
const modalOrder = ref<Order | null>(null)
const acceptMinutesStr = ref('30')
const rejectReason = ref('')
const acceptError = ref('')
const rejectError = ref('')
const submitting = ref(false)
const acceptanceSecondsByOrderId = ref<Record<string, number>>({})
const acceptanceAutoRejectTriggered = ref<Set<string>>(new Set())
let acceptanceCountdownTimer: ReturnType<typeof setInterval> | null = null

function acceptanceDeadlineStorageKey(orderId: string): string {
  return `tap-tamak-cook-accept-deadline-${orderId}`
}

function readAcceptanceDeadline(order: Order): number {
  const anchorIso = order.updatedAt ?? order.createdAt
  const anchorMs = anchorIso ? Date.parse(anchorIso) : NaN
  if (Number.isFinite(anchorMs)) {
    return anchorMs + ORDER_COOK_ACCEPTANCE_TIMEOUT_MS
  }
  if (!import.meta.client) return Date.now() + ORDER_COOK_ACCEPTANCE_TIMEOUT_MS
  const key = acceptanceDeadlineStorageKey(order.id)
  const stored = sessionStorage.getItem(key)
  const parsed = stored ? Number(stored) : NaN
  if (Number.isFinite(parsed)) return parsed
  const deadline = Date.now() + ORDER_COOK_ACCEPTANCE_TIMEOUT_MS
  sessionStorage.setItem(key, String(deadline))
  return deadline
}

function clearAcceptanceDeadline(orderId: string): void {
  if (!import.meta.client) return
  sessionStorage.removeItem(acceptanceDeadlineStorageKey(orderId))
}

function stopAcceptanceCountdown(): void {
  if (acceptanceCountdownTimer) {
    clearInterval(acceptanceCountdownTimer)
    acceptanceCountdownTimer = null
  }
}

function acceptanceTimerLabel(orderId: string): string {
  const sec = Math.max(0, acceptanceSecondsByOrderId.value[orderId] ?? 0)
  const mm = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0')
  const ss = (sec % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

function syncAcceptanceCountdowns(): void {
  const next: Record<string, number> = { ...acceptanceSecondsByOrderId.value }
  for (const order of orders.value ?? []) {
    if (!isOrderAwaitingCookAcceptance(order)) {
      clearAcceptanceDeadline(order.id)
      delete next[order.id]
      continue
    }
    const deadline = readAcceptanceDeadline(order)
    const secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    next[order.id] = secondsLeft
    if (secondsLeft <= 0) {
      void onAcceptanceTimeout(order)
    }
  }
  acceptanceSecondsByOrderId.value = next
}

function startAcceptanceCountdown(): void {
  stopAcceptanceCountdown()
  syncAcceptanceCountdowns()
  const hasAwaiting = (orders.value ?? []).some((o) => isOrderAwaitingCookAcceptance(o))
  if (!hasAwaiting) return
  acceptanceCountdownTimer = setInterval(() => {
    syncAcceptanceCountdowns()
  }, 1000)
}

async function onAcceptanceTimeout(order: Order): Promise<void> {
  if (acceptanceAutoRejectTriggered.value.has(order.id) || !isOrderAwaitingCookAcceptance(order)) {
    return
  }
  acceptanceAutoRejectTriggered.value = new Set(acceptanceAutoRejectTriggered.value).add(order.id)
  try {
    await rejectOrderByCook(api, order.id, { reason: COOK_ACCEPT_TIMEOUT_REASON.value })
    clearAcceptanceDeadline(order.id)
    toast.show(COOK_ACCEPT_TIMEOUT_REASON.value, 'error')
    await refresh()
  } catch (err: unknown) {
    const next = new Set(acceptanceAutoRejectTriggered.value)
    next.delete(order.id)
    acceptanceAutoRejectTriggered.value = next
    toast.show(apiMessage(err, 'l_Failed_reject_order'), 'error')
  }
}

watch(
  orders,
  () => {
    startAcceptanceCountdown()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopAcceptanceCountdown()
})

function openAccept(order: Order): void {
  modalOrder.value = order
  modal.value = 'accept'
  acceptMinutesStr.value = '30'
  acceptError.value = ''
}

function openReject(order: Order): void {
  modalOrder.value = order
  modal.value = 'reject'
  rejectReason.value = ''
  rejectError.value = ''
}

function closeModal(): void {
  modal.value = null
  modalOrder.value = null
  acceptError.value = ''
  rejectError.value = ''
}

function isAwaitingCook(status: string | undefined): boolean {
  return normStatus(status) === AWAITING
}

function statusPillClass(status: string | undefined): string {
  const s = normStatus(status)
  if (s === AWAITING) {
    return 'border-[#FF7A00]/22 bg-[#FF7A00]/10 text-[#2A2A2A]'
  }
  if (s === 'COOKING' || s === 'PREPARING') {
    return 'border-sky-400/28 bg-sky-400/12 text-heading'
  }
  if (s === 'CONFIRMED') {
    return 'border-violet-400/28 bg-violet-400/10 text-heading'
  }
  if (s === 'ON_THE_WAY' || s === 'COURIER_NEARBY' || s === 'READY') {
    return 'border-[#6B8E23]/22 bg-[#6B8E23]/10 text-[#2A2A2A]'
  }
  if (s === 'DELIVERED' || s === 'COMPLETED') {
    return 'border-emerald-600/22 bg-emerald-50/95 text-heading'
  }
  return 'border-black/10 bg-black/5 text-subtle'
}

function statusFootnote(status: string | undefined): string | null {
  const s = normStatus(status)
  if (s === 'COOKING' || s === 'PREPARING') {
    return t('l_Order_in_kitchen')
  }
  if (s === 'CONFIRMED') {
    return t('l_Order_awaiting_prep')
  }
  if (s === 'ON_THE_WAY' || s === 'COURIER_NEARBY') {
    return t('l_Order_in_progress_client')
  }
  if (s === 'READY') {
    return t('l_Ready_for_courier')
  }
  if (s === 'DELIVERED' || s === 'COMPLETED') {
    return t('l_Order_awaiting_accept')
  }
  return null
}

const localizedMonths = useLocalizedMonths()

function formatPrice(value: number): string {
  return Math.round(value).toLocaleString('ru-RU')
}

function formatOrderDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const month = localizedMonths.value[d.getMonth()] ?? ''
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${d.getDate()} ${month} • ${hh}:${mm}`
}

function itemPhotoSrc(item: OrderItem): string | undefined {
  return dishImageSrc(item.dish?.imageUrl, apiBase.value)
}

function itemName(item: OrderItem): string {
  return item.dish?.name?.trim() || item.name?.trim() || t('l_Dish')
}

function itemSubtotal(item: OrderItem): number {
  return item.price * item.quantity
}

async function submitAccept(): Promise<void> {
  const order = modalOrder.value
  if (!order) return
  const raw = acceptMinutesStr.value.trim()
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1 || n > 24 * 60) {
    acceptError.value = t('l_Accept_time_range')
    return
  }
  acceptError.value = ''
  submitting.value = true
  try {
    await acceptOrderByCook(api, order.id, {
      preparationTimeMinutes: Math.round(n),
    })
    clearAcceptanceDeadline(order.id)
    closeModal()
    await refresh()
    toast.show(t('l_Order_accepted'), 'success')
  } catch (err: unknown) {
    toast.show(apiMessage(err, 'l_Failed_accept_order'), 'error')
  } finally {
    submitting.value = false
  }
}

async function submitReject(): Promise<void> {
  const order = modalOrder.value
  if (!order) return
  const reason = rejectReason.value.trim()
  if (reason.length < 3) {
    rejectError.value = t('l_Reject_reason_min_length')
    return
  }
  rejectError.value = ''
  submitting.value = true
  try {
    await rejectOrderByCook(api, order.id, { reason })
    clearAcceptanceDeadline(order.id)
    closeModal()
    await refresh()
    toast.show(t('l_Order_rejected'), 'info')
  } catch (err: unknown) {
    toast.show(apiMessage(err, 'l_Failed_reject_order'), 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="relative mx-auto min-h-screen w-full max-w-md bg-page-cream">
    <header class="sticky top-0 z-10 border-b border-black/5 bg-page-cream/92 px-4 pb-3 pt-3.5 backdrop-blur-[6px]">
      <h1 class="text-[23.1px] font-bold leading-none -tracking-[0.2px] text-heading">
        {{ t("l_Orders") }}
      </h1>
      <p class="mt-1.5 text-xs font-semibold text-subtle">
        {{ t("l_Cook_orders_subtitle") }}
      </p>
    </header>

    <div class="px-4 pb-28 pt-4">
      <div v-if="pending" class="flex flex-col gap-3">
        <div v-for="n in 2" :key="`sk-${n}`"
          class="rounded-[22px] border border-black/6 bg-white/92 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
          <div class="h-4 w-40 animate-pulse rounded bg-black/10" />
          <div class="mt-3 h-3 w-28 animate-pulse rounded bg-black/10" />
          <div class="mt-4 h-[72px] animate-pulse rounded-[18px] bg-black/10" />
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
        <p class="text-base font-bold text-body">{{ t("l_No_orders_in_progress") }}</p>
        <p class="mt-2 text-xs font-semibold text-subtle">
          {{ t("l_Cook_orders_empty_hint") }}
        </p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <article v-for="order in orders" :key="order.id"
          class="overflow-hidden rounded-[22px] border border-black/6 bg-white/92 shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
          <div class="flex flex-col gap-3 p-3.5">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wide text-subtle">
                  {{ order.orderNumber }}
                </p>
                <p class="mt-0.5 text-[15px] font-bold text-heading">
                  {{ formatOrderDate(order.createdAt) || t("l_Date_pending") }}
                </p>
              </div>
              <div class="flex flex-wrap items-center justify-end gap-2">
                <span v-if="isAwaitingCook(order.status)"
                  class="inline-flex items-center gap-1 rounded-full border border-[#FF7A00]/30 bg-[#FF7A00]/10 px-2.5 py-1 text-[11px] font-bold leading-none text-[#FF7A00]">
                  <Icon name="material-symbols:timer-outline" class="size-3.5" />
                  {{ acceptanceTimerLabel(order.id) }}
                </span>
                <span class="inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-[11px] font-bold"
                  :class="statusPillClass(order.status)">
                  {{ orderStatusLabel(order.status) }}
                </span>
              </div>
            </div>

            <p v-if="statusFootnote(order.status)"
              class="rounded-[14px] border border-black/5 bg-surface-muted/50 px-3 py-2 text-[12px] font-semibold leading-snug text-body">
              {{ statusFootnote(order.status) }}
            </p>

            <div v-if="order.estimatedMinutes != null && order.estimatedMinutes > 0 && !isAwaitingCook(order.status)"
              class="text-[12px] font-semibold text-subtle">
              {{ t("l_Estimated_minutes", { minutes: order.estimatedMinutes }) }}
            </div>

            <!-- <div class="space-y-1.5 rounded-[16px] border border-black/6 bg-surface-muted/60 px-3 py-2.5 text-sm">
                <p v-if="order.deliveryAddress" class="font-semibold text-heading">
                  {{ order.deliveryAddress }}
                </p>
                <p v-if="order.contactPhone" class="text-subtle">
                  <span class="font-semibold text-body">Телефон:</span>
                  {{ order.contactPhone }}
                </p>
              </div> -->

            <div class="flex flex-col gap-2.5">
              <div v-for="(item, idx) in order.items" :key="item.id || `${order.id}-${idx}`" class="flex gap-3">
                <div class="size-14 shrink-0 overflow-hidden rounded-[14px] border border-black/6 bg-surface-muted">
                  <img v-if="itemPhotoSrc(item)" :src="itemPhotoSrc(item)" :alt="itemName(item)"
                    class="size-full object-cover" />
                  <div v-else class="flex size-full items-center justify-center text-[9px] font-semibold text-subtle">
                    {{ t("l_No_photo") }}
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[13px] font-bold leading-tight text-[#444]">
                    {{ itemName(item) }}
                  </p>
                  <p class="mt-1 text-[12px] text-subtle">
                    {{ formatPrice(item.price) }} ₸ × {{ item.quantity }}
                  </p>
                  <p class="mt-0.5 text-[14px] font-bold text-heading">
                    {{ formatPrice(itemSubtotal(item)) }} ₸
                  </p>
                </div>
              </div>
            </div>

            <div v-if="order.deliveryFee > 0" class="flex justify-between text-xs font-semibold text-subtle">
              <span>{{ t("l_Delivery") }}</span>
              <span>{{ formatPrice(order.deliveryFee) }} ₸</span>
            </div>

            <div class="border-t border-black/6 pt-3 text-right">
              <p class="text-[20px] font-bold leading-none text-heading">
                {{ formatPrice(order.totalAmount) }}
                <span class="text-[12px] font-normal text-[#333]">₸</span>
              </p>
              <p v-if="order.commission != null && order.commission > 0" class="mt-2 text-[11px] font-semibold text-subtle">
                {{ t('l_Order_commission') }}: −{{ formatPrice(order.commission) }} ₸
              </p>
              <p v-if="order.cookPayout != null && order.cookPayout > 0" class="mt-0.5 text-[13px] font-bold text-primary">
                {{ t('l_Order_net_payout') }}: {{ formatPrice(order.cookPayout) }} ₸
              </p>
            </div>

            <div v-if="isAwaitingCook(order.status)" class="flex gap-2.5 border-t border-black/6 pt-3">
              <UiButton class="flex-1 rounded-[16px]! py-2.5! text-sm!" variant="primary" @click="openAccept(order)">
                {{ t("l_Accept") }}
              </UiButton>
              <UiButton class="flex-1 rounded-[16px]! py-2.5! text-sm!" variant="outline" @click="openReject(order)">
                {{ t("l_Reject") }}
              </UiButton>
            </div>
          </div>
        </article>
      </div>
    </div>

    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="modal && modalOrder"
          class="fixed inset-0 z-100 flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog"
          aria-modal="true" @click.self="closeModal">
          <div
            class="w-full max-w-md rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            @click.stop>
            <template v-if="modal === 'accept'">
              <p class="text-lg font-bold text-heading">{{ t("l_Cooking_time_modal") }}</p>
              <p class="mt-1 text-xs font-semibold text-subtle">
                {{ t("l_Accept_order_minutes_prompt", { orderNumber: modalOrder.orderNumber }) }}
              </p>
              <div class="mt-4">
                <UiInput v-model="acceptMinutesStr" type="number" :label="t('l_Minutes')" :placeholder="t('l_Minutes_example')"
                  :error="acceptError" autocomplete="off" />
              </div>
              <div class="mt-5 flex gap-2.5">
                <UiButton variant="outline" class="flex-1 rounded-[16px]!" :disabled="submitting" @click="closeModal">
                  {{ t("l_Cancel") }}
                </UiButton>
                <UiButton class="flex-1 rounded-[16px]!" :loading="submitting" @click="submitAccept">
                  {{ t("l_Confirm") }}
                </UiButton>
              </div>
            </template>

            <template v-else-if="modal === 'reject'">
              <p class="text-lg font-bold text-heading">{{ t("l_Reject_order") }}</p>
              <p class="mt-1 text-xs font-semibold text-subtle">
                {{ t("l_Reject_order_reason_prompt", { orderNumber: modalOrder.orderNumber }) }}
              </p>
              <div class="mt-4">
                <label for="cook-reject-reason" class="mb-1 block text-sm font-medium text-dark">
                  {{ t("l_Reason") }}
                </label>
                <textarea id="cook-reject-reason" v-model="rejectReason" rows="4"
                  :placeholder="t('l_Reject_reason_example')"
                  class="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm text-dark placeholder:text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  :class="rejectError ? 'border-error focus:ring-error' : ''" />
                <p v-if="rejectError" class="mt-1 text-sm text-error">
                  {{ rejectError }}
                </p>
              </div>
              <div class="mt-5 flex gap-2.5">
                <UiButton variant="outline" class="flex-1 rounded-[16px]!" :disabled="submitting" @click="closeModal">
                  {{ t("l_Cancel") }}
                </UiButton>
                <UiButton class="flex-1 rounded-[16px]!" variant="primary" :loading="submitting" @click="submitReject">
                  {{ t("l_Reject") }}
                </UiButton>
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
          class="safe-bottom-floating fixed left-1/2 z-110 w-[min(calc(100vw-2rem),420px)] -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-floating backdrop-blur-sm md:bottom-6"
          :class="toast.kind === 'success'
            ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
            : toast.kind === 'error'
              ? 'border-red-200 bg-red-50/95 text-red-900'
              : 'border-border bg-white/95 text-dark'
            " role="alert">
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
