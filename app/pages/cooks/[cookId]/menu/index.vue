<script setup lang="ts">
const { t } = useI18n()
definePageMeta({
    hideBottomNav: true,
});

import { utcTodayYmd } from "~/composables/useUtcMenuDates";
import { usePageToast } from "~/composables/usePageToast";
import type { PublicCookMenuDish } from "~/types";
import { useCartStore } from "~/stores/cart";
import { apiMessage } from "~/utils/apiMessage";
import { fetchPublicCookMenuInformation } from "~/utils/cookApi";
import { dishImageSrc } from "~/utils/dishApi";

const router = useRouter();
const cartStore = useCartStore();
const route = useRoute();
const toast = usePageToast();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const checkoutSubmitting = ref(false);

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
        if (!cookId.value) throw new Error(t("l_Invalid_cook_id"));
        return await fetchPublicCookMenuInformation(api, cookId.value, todayYmd);
    },
    { watch: [cookId] },
);

const dishes = computed(() => menuInfo.value?.dishes ?? []);

function maxPortionsFor(dish: PublicCookMenuDish): number {
    const raw = dish.portionCount;
    if (raw == null || !Number.isFinite(raw)) return Number.POSITIVE_INFINITY;
    return Math.max(0, Math.trunc(raw));
}

watch(
    [dishes, cookId],
    () => {
        const cid = cookId.value;
        if (!cid) return;
        for (const dish of dishes.value) {
            const cap = maxPortionsFor(dish);
            const q = cartStore.quantityFor(cid, dish.id);
            if (q > cap) cartStore.setQuantity(cid, dish.id, cap);
        }
    },
    { immediate: true },
);
const cook = computed(() => menuInfo.value?.cook ?? null);
const cookPhoto = computed(() =>
    dishImageSrc(cook.value?.profileImageUrl, apiBase.value) ??
    dishImageSrc(cook.value?.kitchenPhotoUrls?.[0], apiBase.value),
);

const cookInitials = computed(() => {
    const words = (cook.value?.businessName ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (!words.length) return t("l_Initial_fallback");
    const initials = words
        .slice(0, 2)
        .map((word) => word[0] ?? "")
        .join("");
    return (initials || words[0]?.[0] || t("l_Initial_fallback")).toUpperCase();
});

const cookingWindow = computed(() => {
    const mins = dishes.value
        .map((d) => d.cookingTime)
        .filter((v): v is number => Number.isFinite(v));
    if (!mins.length) return "—";
    const min = Math.min(...mins);
    const max = Math.max(...mins);
    return min === max ? t("l_Cooking_time_single", { min }) : t("l_Cooking_time_range", { min, max });
});

const cookTotals = computed(() => cartStore.totalsForCook(cookId.value));
const totalItems = computed(() => cookTotals.value.items);
const totalAmount = computed(() => cookTotals.value.amount);

function qtyOf(dishId: string): number {
    return cartStore.quantityFor(cookId.value, dishId);
}

function addToCart(dish: PublicCookMenuDish): void {
    if (!cook.value) return;
    const cap = maxPortionsFor(dish);
    const current = qtyOf(dish.id);
    if (current >= cap) return;
    cartStore.addOrIncrement(cook.value, dish);
}

function atMaxPortions(dish: PublicCookMenuDish): boolean {
    return qtyOf(dish.id) >= maxPortionsFor(dish);
}

function hasFinitePortionCap(dish: PublicCookMenuDish): boolean {
    return Number.isFinite(maxPortionsFor(dish));
}

function decrementFromCart(dishId: string): void {
    cartStore.decrement(cookId.value, dishId);
}

function formatPrice(value: number): string {
    return `${Math.round(value).toLocaleString("ru-RU")} ₸`;
}

function dishImage(dish: PublicCookMenuDish): string | undefined {
    return dishImageSrc(dish.imageUrl, apiBase.value);
}

function openDish(dishId: string): void {
    router.push(`/cooks/${cookId.value}/menu/${dishId}`);
}

function clearCookCartCache(): void {
    const cid = cookId.value;
    if (cid) cartStore.clearForCook(cid);
}

function goBack(): void {
    clearCookCartCache();
    router.back();
}

async function checkoutThisCook(): Promise<void> {
    const cid = cookId.value;
    if (!cid || checkoutSubmitting.value || totalItems.value === 0) return;

    const items = cartStore.items
        .filter((line) => line.cook.id === cid && line.quantity > 0)
        .map((line) => ({
            dishId: line.dish.id,
            quantity: line.quantity,
        }));

    if (!items.length) {
        toast.show(
            t("l_No_cart_items_for_cook"),
            "error",
        );
        return;
    }

    checkoutSubmitting.value = true;
    try {
        await api(`/basket/items`, {
            method: "POST",
            body: { items },
        });
        clearCookCartCache();
        await navigateTo("/basket");
    } catch (err: unknown) {
        toast.show(
            apiMessage(err, 'l_Failed_add_to_cart'),
            "error",
        );
    } finally {
        checkoutSubmitting.value = false;
    }
}

const checkoutDisabled = computed(
    () => totalItems.value === 0 || checkoutSubmitting.value,
);
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

        <div v-if="pending" class="rounded-[22px] border border-black/6 bg-white/90 p-4 shadow-elevated">
            <div class="flex items-center gap-3">
                <div class="size-14 animate-pulse rounded-2xl bg-black/10" />
                <div class="min-w-0 flex-1 space-y-2">
                    <div class="h-4 w-40 animate-pulse rounded bg-black/10" />
                    <div class="h-3 w-32 animate-pulse rounded bg-black/10" />
                    <div class="h-8 w-24 animate-pulse rounded-full bg-black/10" />
                </div>
            </div>
        </div>

        <div v-else-if="error" class="rounded-[22px] border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
            <p>{{ t("l_Failed_load_cook_menu") }}</p>
            <button type="button" class="mt-3 rounded-xl bg-white px-4 py-2 font-semibold text-dark" @click="refresh()">
                {{ t("l_Retry") }}
            </button>
        </div>

        <div v-else-if="cook" class="rounded-[22px] border border-black/6 bg-white/90 p-4 shadow-elevated">
            <div class="flex items-center gap-3">
                <div class="size-14 overflow-hidden rounded-2xl border border-white/70 bg-surface-muted">
                    <img v-if="cookPhoto" :src="cookPhoto" :alt="cook.businessName" class="size-full object-cover" />
                    <div v-else class="flex size-full items-center justify-center text-lg font-bold text-muted">
                        {{ cookInitials }}
                    </div>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <p class="truncate text-base font-bold text-dark">
                            {{ cook.businessName }}
                        </p>
                        <span class="size-1.5 rounded-full bg-black/25" />
                        <p class="text-xs font-bold" :class="cook.isAvailable ? 'text-[#6B8E23]' : 'text-muted'">
                            {{ cook.isAvailable ? t("l_Online") : t("l_Offline") }}
                        </p>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-dark">
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
            {{ t("l_How_cook_prepares", { name: cook?.businessName || t("l_Cook_name_fallback") }) }}
        </h2>
        <div class="mt-3 rounded-[22px] border border-black/6 bg-white/90 p-4 shadow-elevated">
            <div class="space-y-3">
                <div class="rounded-2xl border border-black/10 bg-black/2 p-3">
                    <p class="text-sm font-bold text-dark">
                        {{ t("l_Fresh_products") }}
                    </p>
                    <p class="mt-1 text-xs font-semibold leading-5 text-[#6B6B6B]">
                        {{ t("l_Cook_after_confirm") }}
                    </p>
                </div>
                <div class="rounded-2xl border border-black/10 bg-black/2 p-3">
                    <p class="text-sm font-bold text-dark">{{ t("l_Timing_cook_delivery") }}</p>
                    <p class="mt-1 text-xs font-semibold leading-5 text-[#6B6B6B]">
                        {{ t("l_Timing_hint") }}
                    </p>
                </div>
                <div class="rounded-2xl border border-black/10 bg-black/2 p-3">
                    <p class="text-sm font-bold text-dark">{{ t("l_Packaging_cafe") }}</p>
                    <p class="mt-1 text-xs font-semibold leading-5 text-[#6B6B6B]">
                        {{ t("l_Packaging_containers_hint") }}
                    </p>
                </div>
            </div>
        </div>

        <h2 class="mt-7 text-[28px] font-bold text-dark">{{ t("l_Menu") }}</h2>
        <p class="mt-1 text-xs font-semibold text-muted">{{ t("l_Menu_date_label") }} {{ todayYmd }}</p>

        <div v-if="!dishes.length"
            class="mt-4 rounded-2xl border border-dashed border-black/15 bg-white/90 p-6 text-center">
            <p class="text-sm font-semibold text-dark">{{ t("l_No_dishes_today") }}</p>
            <p class="mt-1 text-xs text-muted">{{ t("l_Try_menu_later") }}</p>
        </div>

        <div v-else class="mt-3 grid grid-cols-2 gap-3">
            <article v-for="dish in dishes" :key="dish.id" role="button" tabindex="0"
                class="cursor-pointer overflow-hidden rounded-[22px] border border-black/8 bg-white/95 shadow-md transition hover:border-black/15 hover:shadow-lg"
                @click="openDish(dish.id)" @keydown.enter="openDish(dish.id)"
                @keydown.space.prevent="openDish(dish.id)">
                <div class="relative h-28 bg-surface-muted">
                    <img v-if="dishImage(dish)" :src="dishImage(dish)" :alt="dish.name"
                        class="size-full object-cover" />
                    <div
                        class="absolute right-2 top-2 rounded-full bg-[#ff7a008f] px-2.5 py-1 text-[10px] font-bold text-dark">
                        ⏱ {{ t("l_Cooking_time_single", { min: dish.cookingTime }) }}
                    </div>
                </div>
                <div class="p-2.5">
                    <p class="line-clamp-2 min-h-[36px] text-[13px] font-bold leading-[1.15] text-dark">
                        {{ dish.name }}
                    </p>
                    <p class="mt-1 line-clamp-2 text-[10px] font-semibold text-[#6B6B6B]">
                        {{ dish.description || t("l_Homemade_dish") }}
                    </p>
                    <div class="mt-3">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <p class="text-sm font-bold leading-none text-[#FF7A00]">
                                {{ formatPrice(dish.price) }}
                            </p>
                            <div class="flex items-center gap-1.5">
                                <button v-if="qtyOf(dish.id) > 0" type="button"
                                    class="flex size-8 items-center justify-center rounded-xl border border-black/10 bg-white text-base font-bold text-dark"
                                    @click.stop="decrementFromCart(dish.id)">
                                    -
                                </button>
                                <span v-if="qtyOf(dish.id) > 0" class="min-w-4 text-center text-xs font-bold text-dark">
                                    {{ qtyOf(dish.id) }}
                                </span>
                                <button type="button"
                                    class="flex size-8 items-center justify-center rounded-xl text-lg font-bold shadow-[0_12px_11px_rgba(255,122,0,0.22)] transition"
                                    :class="atMaxPortions(dish)
                                        ? 'cursor-not-allowed bg-[#FF7A00]/40 text-white'
                                        : 'bg-[#FF7A00] text-white'
                                        " :disabled="atMaxPortions(dish)" :aria-disabled="atMaxPortions(dish)"
                                    @click.stop="addToCart(dish)">
                                    +
                                </button>
                            </div>
                        </div>
                        <p v-if="atMaxPortions(dish) && hasFinitePortionCap(dish)"
                            class="mt-1 text-right text-[10px] font-semibold leading-tight text-muted">
                            <template v-if="maxPortionsFor(dish) === 0">
                                {{ t("l_No_portions_zero") }}
                            </template>
                            <template v-else>
                                {{ t("l_Max_portions", { count: maxPortionsFor(dish) }) }}
                            </template>
                        </p>
                    </div>
                </div>
            </article>
        </div>

        <div class="safe-fixed-bottom-bar fixed inset-x-0 bottom-4 z-20 mx-auto w-[calc(100%-2rem)] max-w-md rounded-[22px] border border-black/8 bg-white p-3 shadow-elevated"
            v-show="cook?.isAvailable">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p class="text-[13px] font-bold text-dark">
                        {{ t("l_Cart_summary", { count: totalItems }) }}
                    </p>
                    <p class="text-xs font-semibold text-[#6B6B6B]">
                        {{ t("l_Total_amount", { amount: formatPrice(totalAmount) }) }}
                    </p>
                </div>
                <button type="button"
                    class="inline-flex h-11 min-w-29 items-center justify-center rounded-2xl px-4 text-sm font-bold text-white shadow-[0_12px_11px_rgba(255,122,0,0.22)] transition disabled:opacity-95"
                    :class="checkoutDisabled
                        ? 'bg-[#FF7A00]/45'
                        : 'bg-[#FF7A00]'
                        " :disabled="checkoutDisabled" :aria-busy="checkoutSubmitting" :aria-disabled="checkoutDisabled"
                    @click="checkoutThisCook">
                    {{ checkoutSubmitting ? t("l_Submitting") : t("l_Checkout_btn") }}
                </button>
            </div>
        </div>

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
                            : 'border-border bg-white/95 text-dark'
                        " role="alert">
                    {{ toast.message }}
                </div>
            </Transition>
        </Teleport>
    </section>
</template>
