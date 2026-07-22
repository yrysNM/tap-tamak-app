<script setup lang="ts">
const { t } = useI18n()
import { useDebounceFn } from "@vueuse/core";
import { useNominatim } from "~/composables/useNominatim";
import { usePageToast } from "~/composables/usePageToast";
import { apiMessage } from "~/utils/apiMessage";
import { fetchBasket, updateBasketItemQuantity } from "~/utils/basketApi";
import { isWithinDeliveryRadius } from "~/utils/geoUtils";
import {
    createOrderFromCart,
    prepareOrderFromCart,
    type CheckoutOrderPayload,
    type PrepareOrderResponse,
} from "~/utils/ordersApi";

/** Delivery center used for the 2 km radius check (Almaty center). */
const DELIVERY_CENTER = {
    lat: 43.238949,
    lng: 76.889709,
};

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
    district: "Ауэзовский",
    addressLine: "",
    entrance: "",
    intercom: "",
    floor: "",
    apartment: "",
    contactPhone: "+7",
    courierComment: "",
    saveAddress: false,
});

const districtOptions = [
    { value: "Ауэзовский", label: "Ауэзовский" },
    { value: "Бостандыкский", label: "Бостандыкский" },
];

const promoInput = ref("");
const paymentMethod = ref<"card" | "cash">("card");
const prepareSnapshot = ref<PrepareOrderResponse | null>(null);
const preparePending = ref(false);
const submitting = ref(false);
const clearing = ref(false);
const manualDiscount = ref(0);
const phoneTouched = ref(false);
const addressTouched = ref(false);
const addressCoords = ref<{ lat: number; lng: number } | null>(null);
const addressOutOfRange = ref(false);
const { geocoding, geocodeError, geocodeAddress } = useNominatim();

const paymentOptions = [
    { value: "card", label: t("l_Payment_card") },
    { value: "cash", label: t("l_Payment_cash") },
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

function addressLooksValid(line: string): boolean {
    return line.trim().length >= 4;
}

const phoneError = computed(() => {
    if (!phoneTouched.value) return "";
    if (phoneLooksValid(form.contactPhone)) return "";
    const d = digitsOnly(form.contactPhone);
    if (d.length <= 1) return t("l_Enter_phone_number");
    return t("l_Enter_10_digits_after_7");
});

const addressError = computed(() => {
    if (!addressTouched.value) return "";
    if (!addressLooksValid(form.addressLine)) return t("l_Enter_delivery_address");
    if (geocoding.value) return "";
    if (addressOutOfRange.value) return t("l_Address_outside_delivery_zone");
    if (geocodeError.value === "address_not_found") return t("l_Address_geocode_not_found");
    if (geocodeError.value === "geocode_failed") return t("l_Address_geocode_failed");
    return "";
});

function buildGeocodeQuery(): string {
    return `${form.district}, Алматы, ${form.addressLine.trim()}`;
}

function resetAddressRadiusState(): void {
    addressCoords.value = null;
    addressOutOfRange.value = false;
    geocodeError.value = "";
}

async function validateAddressRadius(): Promise<boolean> {
    if (!addressLooksValid(form.addressLine)) {
        resetAddressRadiusState();
        return false;
    }

    // City is already in the free-form query; Nominatim forbids mixing `q` with `city`
    const result = await geocodeAddress(buildGeocodeQuery(), {
        country: "kz",
    });

    if (!result) {
        addressCoords.value = null;
        addressOutOfRange.value = false;
        return false;
    }

    addressCoords.value = { lat: result.lat, lng: result.lng };
    const withinRadius = isWithinDeliveryRadius(
        result.lat,
        result.lng,
        DELIVERY_CENTER.lat,
        DELIVERY_CENTER.lng,
    );
    addressOutOfRange.value = !withinRadius;
    return withinRadius;
}

async function onAddressBlur(): Promise<void> {
    addressTouched.value = true;
    await validateAddressRadius();
}

async function validateRequiredFields(): Promise<boolean> {
    addressTouched.value = true;
    phoneTouched.value = true;
    if (!addressLooksValid(form.addressLine) || !phoneLooksValid(form.contactPhone)) {
        return false;
    }
    return await validateAddressRadius();
}

const canPlaceOrder = computed(() => {
    return (
        !submitting.value
        && !geocoding.value
        && addressLooksValid(form.addressLine)
        && phoneLooksValid(form.contactPhone)
        && !addressOutOfRange.value
        && !geocodeError.value
    );
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
        addressLooksValid(form.addressLine)
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
    () => [form.addressLine, form.district],
    () => {
        resetAddressRadiusState();
    },
);

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
        toast.show(t("l_Enter_promo"), "error");
        return;
    }
    if (code === "FOOD10") {
        const base = basket.value?.itemsTotal ?? 0;
        manualDiscount.value = Math.min(base, Math.round(base * 0.1));
        toast.show(t("l_Promo_applied"), "success");
        void debouncedPrepare();
        return;
    }
    toast.show(t("l_Promo_not_found"), "error");
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
        toast.show(t("l_Cart_cleared"), "success");
        await navigateTo("/basket");
    } catch (err: unknown) {
        toast.show(apiMessage(err, 'l_Failed_clear_cart'), "error");
    } finally {
        clearing.value = false;
    }
}

async function submitOrder(): Promise<void> {
    if (isEmpty.value) {
        toast.show(t("l_Basket_empty"), "error");
        return;
    }
    if (geocoding.value) {
        toast.show(t("l_Address_verifying"), "error");
        return;
    }
    if (!(await validateRequiredFields())) {
        toast.show(addressError.value || t("l_Enter_delivery_address"), "error");
        return;
    }
    if (!form.district.trim()) {
        toast.show(t("l_Select_district"), "error");
        return;
    }
    submitting.value = true;
    try {
        const payload = buildCheckoutPayload();
        const { orderId, orderIds } = await createOrderFromCart(api, payload);
        const count = orderIds?.length ?? 1;
        toast.show(
            count > 1 ? t("l_Orders_placed_count", { count }) : t("l_Orders_placed_single"),
            "success",
        );
        await navigateTo({ path: "/orders", query: { orderId } });
    } catch (err: unknown) {
        toast.show(apiMessage(err, 'l_Failed_place_order'), "error");
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
                    :aria-label="t('l_Back')" @click="router.back()">
                    <Icon name="material-symbols:chevron-left-rounded" class="size-5 text-icon-secondary" />
                </button>
                <h1 class="min-w-0 flex-1 text-center text-[23px] font-bold leading-[26px] text-heading">
                    {{ t("l_Checkout") }}
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
                <p>{{ t("l_Failed_load_cart") }}</p>
                <button type="button" class="mt-3 rounded-xl bg-white px-4 py-2 font-semibold text-dark shadow-sm"
                    @click="retryBasket">
                    {{ t("l_Retry") }}
                </button>
            </div>

            <template v-else-if="!isEmpty">
                <!-- Сумма -->
                <section
                    class="rounded-2xl border border-soft-border bg-white p-[15px] shadow-[0_10px_12px_rgba(0,0,0,0.08)]">
                    <p class="text-[15px] font-bold text-section">
                        {{ t("l_Amount") }}
                    </p>
                    <div class="mt-2 space-y-2 text-[13px] text-subtle">
                        <div class="flex items-center justify-between gap-3">
                            <span>{{ t("l_Dish_amount") }}</span>
                            <span class="shrink-0 text-[15px] text-body">{{
                                formatPrice(dishesAmount)
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-3">
                            <span>{{ t("l_Delivery") }}</span>
                            <span v-if="deliveryAmount != null" class="shrink-0 text-[15px] text-body">{{
                                formatPrice(deliveryAmount) }}</span>
                            <span v-else class="shrink-0 text-[13px] text-caption">{{ preparePending ? "…" : "—"
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-3">
                            <span>{{ t("l_Discount") }}</span>
                            <span class="shrink-0 text-[15px] text-body">− {{
                                formatPrice(discountShown)
                            }}</span>
                        </div>
                    </div>
                    <div class="mt-2.5 flex items-center justify-between border-t border-black/10 pt-3">
                        <span class="text-[15px] font-bold text-body">{{ t("l_Total") }}</span>
                        <span class="text-[20px] font-bold text-section">{{
                            formatPrice(totalAmount)
                        }}</span>
                    </div>
                    <p v-if="!prepareSnapshot && !preparePending" class="mt-2 text-[11px] leading-relaxed text-caption">
                        {{ t("l_Checkout_address_hint") }}
                    </p>
                </section>

                <!-- Адрес доставки -->
                <section
                    class="rounded-[20px] border border-soft-border bg-white p-[19px] shadow-[0_10px_12.5px_rgba(0,0,0,0.08)]">
                    <h2 class="text-[20px] font-semibold text-[#5e7d1a]">
                        {{ t("l_Delivery_address") }}
                    </h2>

                    <p
                        class="mt-4 rounded-[14px] border border-red-300 px-3 py-2.5 text-[12px] leading-relaxed text-red-700">
                        {{ t("l_Delivery_districts_notice") }}
                    </p>

                    <div class="mt-4">
                        <UiSelect v-model="form.district" :label="t('l_District')" :options="districtOptions" required
                            class="[&_button]:rounded-[14px] [&_button]:border-[#d4d4d4] [&_button]:px-[15px] [&_button]:py-3 [&_button]:text-[13px] [&_label]:text-[13px] [&_label]:text-[#555555]" />
                    </div>

                    <div class="mt-5">
                        <label class="block text-[13px] text-[#555555]">
                            {{ t("l_Address") }}
                            <span class="text-red-600">*</span>
                        </label>
                        <input v-model="form.addressLine" type="text" autocomplete="street-address"
                            :placeholder="t('l_Address_placeholder')" :class="[
                                'mt-1.5 w-full rounded-[14px] border bg-white px-[15px] py-3 text-[13px] text-body outline-none placeholder:text-[#767676] focus:ring-2',
                                addressError
                                    ? 'border-red-500 ring-red-300/40 focus:ring-red-300/40'
                                    : 'border-[#d4d4d4] ring-[#FF7A00]/30 focus:ring-[#FF7A00]/30',
                            ]" @blur="onAddressBlur">
                        <p v-if="geocoding" class="mt-1 text-[12px] text-caption">
                            {{ t("l_Address_verifying") }}
                        </p>
                        <p v-else-if="addressError" class="mt-1 text-[12px] text-red-600">
                            {{ addressError }}
                        </p>
                    </div>

                    <!--  <div class="mt-5 grid grid-cols-3 gap-2.5">
                        <div>
                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">{{ t("l_Entrance") }}</label>
                            <input v-model="form.entrance" type="text" inputmode="numeric"
                                class="mt-1.5 h-[42px] w-full rounded-[14px] border border-[#d9d9d9] bg-white px-2 text-center text-[13px] text-body outline-none focus:ring-2 focus:ring-[#FF7A00]/25">
                        </div>
                        <div>
                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">{{ t("l_Intercom") }}</label>
                            <input v-model="form.intercom" type="text"
                                class="mt-1.5 h-[42px] w-full rounded-[14px] border border-[#d9d9d9] bg-white px-2 text-center text-[13px] text-body outline-none focus:ring-2 focus:ring-[#FF7A00]/25">
                        </div>
                        <div>
                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">{{ t("l_Floor") }}</label>
                            <input v-model="form.floor" type="text" inputmode="numeric"
                                class="mt-1.5 h-[42px] w-full rounded-[14px] border border-[#d9d9d9] bg-white px-2 text-center text-[13px] text-body outline-none focus:ring-2 focus:ring-[#FF7A00]/25">
                        </div>
                    </div> -->

                    <div class="mt-5" @focusout="onPhoneSectionFocusOut">
                        <label class="block text-[13px] text-[#555555]">
                            {{ t("l_Phone") }}
                            <span class="text-red-600">*</span>
                        </label>
                        <UiInput v-model="form.contactPhone" type="tel" phone-mask autocomplete="tel"
                            placeholder="+7 (700) 000-00-00" :error="phoneError"
                            class="mt-1.5 [&_input]:rounded-[14px] [&_input]:border-[#d4d4d4] [&_input]:px-[15px] [&_input]:py-3 [&_input]:text-[13px] [&_input]:text-body [&_input]:placeholder:text-[#767676] [&_input]:focus:border-[#d4d4d4] [&_input]:focus:ring-[#FF7A00]/25" />
                    </div>

                    <div class="mt-5">
                        <label class="block text-[13px] text-[#555555]">{{ t("l_Apartment_office") }}</label>
                        <input v-model="form.apartment" type="text" autocomplete="address-line2"
                            class="mt-1.5 w-full rounded-[14px] border border-[#d4d4d4] bg-white px-[15px] py-3 text-[13px] text-body outline-none focus:ring-2 focus:ring-[#FF7A00]/25">
                    </div>

                    <div class="mt-5">
                        <label class="block text-[13px] text-[#555555]">{{ t("l_Courier_comment") }}</label>
                        <textarea v-model="form.courierComment" rows="3"
                            :placeholder="t('l_Courier_comment_placeholder')"
                            class="mt-1.5 min-h-17.5 w-full resize-none rounded-[14px] border border-[#d4d4d4] bg-white px-3.75 py-3 text-[14px] text-body outline-none placeholder:text-[#767676] focus:ring-2 focus:ring-[#FF7A00]/25" />
                    </div>

                    <!-- <label class="mt-5 flex cursor-pointer items-start gap-2">
                        <input v-model="form.saveAddress" type="checkbox`"
                            class="mt-0.5 size-[13px] shrink-0 rounded border-[#767676] text-[#FF7A00] focus:ring-[#FF7A00]">
                        <span class="text-[13px] leading-snug text-[#555555]">{{ t("l_Save_address_for_next") }}</span>
                    </label> -->
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
                    {{ t("l_Basket_empty") }}
                </p>
                <NuxtLink to="/basket"
                    class="mt-6 inline-flex h-11 items-center justify-center rounded-[18px] bg-[#FF7A00] px-6 text-sm font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)]">
                    {{ t("l_To_cart") }}
                </NuxtLink>
            </div>
        </div>

        <div v-if="!basketPending && !basketError && !isEmpty"
            class="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-linear-to-t from-page-cream from-65% to-transparent px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <div class="pointer-events-auto mx-auto w-full max-w-md">
                <button type="button"
                    class="flex h-14 w-full items-center justify-center rounded-[18px] bg-[#FF7A00] text-[17.5px] font-bold text-white shadow-[0_10px_12px_rgba(255,122,0,0.28)] disabled:opacity-50"
                    :disabled="!canPlaceOrder" @click="submitOrder">
                    {{ submitting || geocoding ? t("l_Submitting") : t("l_Place_order") }}
                </button>
            </div>
        </div>
    </div>
</template>
