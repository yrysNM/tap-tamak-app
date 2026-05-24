<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import { usePageToast } from "~/composables/usePageToast";
import { apiMessage } from "~/utils/apiMessage";
import { fetchBasket, updateBasketItemQuantity } from "~/utils/basketApi";
import {
    createOrderFromCart,
    prepareOrderFromCart,
    type CheckoutOrderPayload,
    type PrepareOrderResponse,
} from "~/utils/ordersApi";

definePageMeta({
    hideBottomNav: true,
});

const router = useRouter();
const toast = usePageToast();
const { $api } = useNuxtApp();
const api = $api as (url: string, opts?: object) => Promise<unknown>;

const {
    data: basket,
    pending: basketPending,
    error: basketError,
    refresh: refreshBasket,
} = useAsyncData("basket", async () => await fetchBasket(api), { immediate: true });

const form = reactive({
    addressLine: "",
    entrance: "",
    intercom: "",
    floor: "",
    apartment: "",
    contactPhone: "+7",
    courierComment: "",
    saveAddress: false,
});

const promoInput = ref("");
const paymentMethod = ref<"card" | "cash">("card");
const prepareSnapshot = ref<PrepareOrderResponse | null>(null);
const preparePending = ref(false);
const submitting = ref(false);
const clearing = ref(false);
const manualDiscount = ref(0);
const phoneTouched = ref(false);

const paymentOptions = [
    { value: "card", label: "Банковская карта" },
    { value: "cash", label: "Наличные курьеру" },
];

function formatPrice(value: number): string {
    return `${Math.round(value).toLocaleString("ru-RU")} ₸`;
}

function digitsOnly(s: string): string {
    return s.replace(/\D/g, "");
}

function phoneLooksValid(phone: string): boolean {
    const d = digitsOnly(phone);
    return d.length === 11;
}

const phoneError = computed(() => {
    if (!phoneTouched.value) return "";
    if (phoneLooksValid(form.contactPhone)) return "";
    const d = digitsOnly(form.contactPhone);
    if (d.length <= 1) return "Укажите номер телефона.";
    return "Введите 10 цифр после +7.";
});

function onPhoneSectionFocusOut(ev: FocusEvent): void {
    const rel = ev.relatedTarget as Node | null;
    const el = ev.currentTarget;
    if (!(el instanceof HTMLElement)) return;
    if (rel && el.contains(rel)) return;
    phoneTouched.value = true;
}

function buildCheckoutPayload(): CheckoutOrderPayload {
    const discountAmount =
        prepareSnapshot.value != null
            ? prepareSnapshot.value.discountAmount
            : manualDiscount.value;
    return {
        addressLine: form.addressLine.trim(),
        entrance: form.entrance.trim() || undefined,
        intercom: form.intercom.trim() || undefined,
        floor: form.floor.trim() || undefined,
        apartment: form.apartment.trim() || undefined,
        contactPhone: form.contactPhone.trim(),
        courierComment: form.courierComment.trim() || undefined,
        saveAddress: form.saveAddress,
        discountAmount: Math.max(0, discountAmount),
    };
}

function canQuotePrepare(): boolean {
    return (
        form.addressLine.trim().length >= 4
        && phoneLooksValid(form.contactPhone)
        && (basket.value?.items.length ?? 0) > 0
    );
}

async function runPrepare(): Promise<void> {
    if (!canQuotePrepare()) {
        prepareSnapshot.value = null;
        return;
    }
    preparePending.value = true;
    try {
        const payload: CheckoutOrderPayload = {
            addressLine: form.addressLine.trim(),
            entrance: form.entrance.trim() || undefined,
            intercom: form.intercom.trim() || undefined,
            floor: form.floor.trim() || undefined,
            apartment: form.apartment.trim() || undefined,
            contactPhone: form.contactPhone.trim(),
            courierComment: form.courierComment.trim() || undefined,
            saveAddress: form.saveAddress,
            discountAmount: manualDiscount.value,
        };
        prepareSnapshot.value = await prepareOrderFromCart(api, payload);
    } catch (err: unknown) {
        prepareSnapshot.value = null;
        if (import.meta.dev) console.warn(err);
    } finally {
        preparePending.value = false;
    }
}

const debouncedPrepare = useDebounceFn(() => void runPrepare(), 650);

watch(
    () => [
        form.addressLine,
        form.entrance,
        form.intercom,
        form.floor,
        form.apartment,
        form.contactPhone,
        form.courierComment,
        form.saveAddress,
        manualDiscount.value,
    ],
    () => {
        void debouncedPrepare();
    },
);

watch(
    () => basket.value?.itemsTotal,
    () => {
        void debouncedPrepare();
    },
);

const dishesAmount = computed(() => {
    if (prepareSnapshot.value) return prepareSnapshot.value.itemsTotal;
    return basket.value?.itemsTotal ?? 0;
});

const deliveryAmount = computed(() => prepareSnapshot.value?.deliveryFee);
const discountShown = computed(() => {
    if (prepareSnapshot.value) return prepareSnapshot.value.discountAmount;
    return manualDiscount.value;
});
const totalAmount = computed(() => {
    if (prepareSnapshot.value) return prepareSnapshot.value.totalAmount;
    return basket.value?.itemsTotal ?? 0;
});

const isEmpty = computed(
    () =>
        !basketPending.value
        && !basketError.value
        && (basket.value?.items.length ?? 0) === 0,
);

function applyPromo(): void {
    const code = promoInput.value.trim().toUpperCase();
    if (!code) {
        toast.show("Введите промокод.", "error");
        return;
    }
    if (code === "FOOD10") {
        const base = basket.value?.itemsTotal ?? 0;
        manualDiscount.value = Math.min(base, Math.round(base * 0.1));
        toast.show("Промокод применён.", "success");
        void debouncedPrepare();
        return;
    }
    toast.show("Промокод не найден.", "error");
}

async function clearCart(): Promise<void> {
    const items = basket.value?.items ?? [];
    if (!items.length) return;
    clearing.value = true;
    try {
        for (const item of items) {
            await updateBasketItemQuantity(api, item.id, 0);
        }
        await refreshBasket();
        toast.show("Корзина очищена.", "success");
        await navigateTo("/basket");
    } catch (err: unknown) {
        toast.show(apiMessage(err, "Не удалось очистить корзину."), "error");
    } finally {
        clearing.value = false;
    }
}

async function submitOrder(): Promise<void> {
    if (isEmpty.value) {
        toast.show("Корзина пуста.", "error");
        return;
    }
    if (form.addressLine.trim().length < 4) {
        toast.show("Укажите адрес доставки.", "error");
        return;
    }
    if (!phoneLooksValid(form.contactPhone)) {
        phoneTouched.value = true;
        toast.show("Укажите корректный номер телефона.", "error");
        return;
    }
    submitting.value = true;
    try {
        const payload = buildCheckoutPayload();
        const { orderId, orderIds } = await createOrderFromCart(api, payload);
        const count = orderIds?.length ?? 1;
        toast.show(
            count > 1 ? `Оформлено заказов: ${count}.` : "Заказ оформлен.",
            "success",
        );
        await navigateTo({ path: "/orders", query: { orderId } });
    } catch (err: unknown) {
        toast.show(apiMessage(err, "Не удалось оформить заказ."), "error");
    } finally {
        submitting.value = false;
    }
}

function retryBasket(): void {
    void refreshBasket();
}
</script>

<template>
    <div class="relative mx-auto min-h-screen w-full max-w-md bg-page-cream pb-40">
        <header
            class="sticky top-0 z-30 border-b border-soft-border/80 bg-page-cream/90 px-4 pb-2.5 pt-3.5 backdrop-blur-[5px]">
            <div class="flex items-center gap-3">
                <button type="button"
                    class="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-black/6 bg-white/96 shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                    aria-label="Назад" @click="router.back()">
                    <Icon name="material-symbols:chevron-left-rounded" class="size-5 text-icon-secondary" />
                </button>
                <h1 class="min-w-0 flex-1 text-center text-[23px] font-bold leading-[26px] text-heading">
                    Оформление заказа
                </h1>
            </div>
        </header>

        <div class="space-y-3 px-[18px] pt-4">
            <div v-if="basketPending"
                class="rounded-2xl border border-soft-border bg-white p-4 shadow-[0_10px_12px_rgba(0,0,0,0.08)]">
                <div class="h-4 w-24 animate-pulse rounded bg-black/10" />
                <div class="mt-3 space-y-2">
                    <div class="h-3 w-full animate-pulse rounded bg-black/10" />
                    <div class="h-3 w-4/5 animate-pulse rounded bg-black/10" />
                </div>
            </div>

            <div v-else-if="basketError"
                class="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 shadow-[0_10px_12px_rgba(0,0,0,0.06)]">
                <p>Не удалось загрузить корзину.</p>
                <button type="button" class="mt-3 rounded-xl bg-white px-4 py-2 font-semibold text-dark shadow-sm"
                    @click="retryBasket">
                    Повторить
                </button>
            </div>

            <template v-else-if="!isEmpty">
                <!-- Сумма -->
                <section
                    class="rounded-2xl border border-soft-border bg-white p-[15px] shadow-[0_10px_12px_rgba(0,0,0,0.08)]">
                    <p class="text-[15px] font-bold text-section">
                        Сумма
                    </p>
                    <div class="mt-2 space-y-2 text-[13px] text-subtle">
                        <div class="flex items-center justify-between gap-3">
                            <span>Блюда</span>
                            <span class="shrink-0 text-[15px] text-body">{{
                                formatPrice(dishesAmount)
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-3">
                            <span>Доставка</span>
                            <span v-if="deliveryAmount != null" class="shrink-0 text-[15px] text-body">{{
                                formatPrice(deliveryAmount) }}</span>
                            <span v-else class="shrink-0 text-[13px] text-caption">{{ preparePending ? "…" : "—"
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-3">
                            <span>Скидка</span>
                            <span class="shrink-0 text-[15px] text-body">− {{
                                formatPrice(discountShown)
                            }}</span>
                        </div>
                    </div>
                    <div class="mt-2.5 flex items-center justify-between border-t border-black/10 pt-3">
                        <span class="text-[15px] font-bold text-body">Итого</span>
                        <span class="text-[20px] font-bold text-section">{{
                            formatPrice(totalAmount)
                        }}</span>
                    </div>
                    <p v-if="!prepareSnapshot && !preparePending" class="mt-2 text-[11px] leading-relaxed text-caption">
                        Укажите адрес и телефон — рассчитаем доставку.
                    </p>
                </section>

                <!-- Адрес доставки -->
                <section
                    class="rounded-[20px] border border-soft-border bg-white p-[19px] shadow-[0_10px_12.5px_rgba(0,0,0,0.08)]">
                    <h2 class="text-[20px] font-semibold text-[#5e7d1a]">
                        Адрес доставки
                    </h2>

                    <div class="mt-5">
                        <label class="block text-[13px] text-[#555555]">Адрес</label>
                        <input v-model="form.addressLine" type="text" autocomplete="street-address"
                            placeholder="Город, улица, дом"
                            class="mt-1.5 w-full rounded-[14px] border border-[#d4d4d4] bg-white px-[15px] py-3 text-[13px] text-body outline-none ring-[#FF7A00]/30 placeholder:text-[#767676] focus:ring-2">
                    </div>

                    <div class="mt-5 grid grid-cols-3 gap-2.5">
                        <div>
                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">Подъезд</label>
                            <input v-model="form.entrance" type="text" inputmode="numeric"
                                class="mt-1.5 h-[42px] w-full rounded-[14px] border border-[#d9d9d9] bg-white px-2 text-center text-[13px] text-body outline-none focus:ring-2 focus:ring-[#FF7A00]/25">
                        </div>
                        <div>
                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">Домофон</label>
                            <input v-model="form.intercom" type="text"
                                class="mt-1.5 h-[42px] w-full rounded-[14px] border border-[#d9d9d9] bg-white px-2 text-center text-[13px] text-body outline-none focus:ring-2 focus:ring-[#FF7A00]/25">
                        </div>
                        <div>
                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">Этаж</label>
                            <input v-model="form.floor" type="text" inputmode="numeric"
                                class="mt-1.5 h-[42px] w-full rounded-[14px] border border-[#d9d9d9] bg-white px-2 text-center text-[13px] text-body outline-none focus:ring-2 focus:ring-[#FF7A00]/25">
                        </div>
                    </div>

                    <div class="mt-5">
                        <label class="block text-[13px] text-[#555555]">Офис / Квартира</label>
                        <input v-model="form.apartment" type="text" autocomplete="address-line2"
                            class="mt-1.5 w-full rounded-[14px] border border-[#d4d4d4] bg-white px-[15px] py-3 text-[13px] text-body outline-none focus:ring-2 focus:ring-[#FF7A00]/25">
                    </div>

                    <div class="mt-5" @focusout="onPhoneSectionFocusOut">
                        <label class="block text-[13px] text-[#555555]">Телефон</label>
                        <UiInput v-model="form.contactPhone" type="tel" phone-mask autocomplete="tel"
                            placeholder="+7 (700) 000-00-00" :error="phoneError"
                            class="mt-1.5 [&_input]:rounded-[14px] [&_input]:border-[#d4d4d4] [&_input]:px-[15px] [&_input]:py-3 [&_input]:text-[13px] [&_input]:text-body [&_input]:placeholder:text-[#767676] [&_input]:focus:border-[#d4d4d4] [&_input]:focus:ring-[#FF7A00]/25" />
                    </div>

                    <div class="mt-5">
                        <label class="block text-[13px] text-[#555555]">Комментарий курьеру</label>
                        <textarea v-model="form.courierComment" rows="3" placeholder="Например: позвонить заранее"
                            class="mt-1.5 min-h-[70px] w-full resize-none rounded-[14px] border border-[#d4d4d4] bg-white px-[15px] py-3 text-[14px] text-body outline-none placeholder:text-[#767676] focus:ring-2 focus:ring-[#FF7A00]/25" />
                    </div>

                    <label class="mt-5 flex cursor-pointer items-start gap-2">
                        <input v-model="form.saveAddress" type="checkbox"
                            class="mt-0.5 size-[13px] shrink-0 rounded border-[#767676] text-[#FF7A00] focus:ring-[#FF7A00]">
                        <span class="text-[13px] leading-snug text-[#555555]">Сохранить адрес для следующих
                            заказов</span>
                    </label>
                </section>

                <!-- Способ оплаты -->
                <!-- <section
                    class="rounded-2xl border border-soft-border bg-white px-[15px] py-3 shadow-[0_10px_12px_rgba(0,0,0,0.08)]">
                    <p class="mb-2 text-[15.6px] font-bold text-section">
                        Выберите способ оплаты
                    </p>
                    <UiSelect v-model="paymentMethod" :options="paymentOptions" />
                </section> -->
            </template>

            <div v-else
                class="rounded-2xl border border-soft-border bg-white/92 p-8 text-center shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
                <p class="text-base font-bold text-body">
                    Корзина пуста
                </p>
                <NuxtLink to="/basket"
                    class="mt-6 inline-flex h-11 items-center justify-center rounded-[18px] bg-[#FF7A00] px-6 text-sm font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)]">
                    В корзину
                </NuxtLink>
            </div>
        </div>

        <div v-if="!basketPending && !basketError && !isEmpty"
            class="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-linear-to-t from-page-cream from-65% to-transparent px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <div class="pointer-events-auto mx-auto w-full max-w-md">
                <button type="button"
                    class="flex h-14 w-full items-center justify-center rounded-[18px] bg-[#FF7A00] text-[17.5px] font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)] disabled:opacity-50"
                    :disabled="submitting" @click="submitOrder">
                    {{ submitting ? "Отправка…" : "Оформить заказ" }}
                </button>
            </div>
        </div>
    </div>
</template>
