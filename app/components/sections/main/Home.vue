<template>
  <section class="mx-auto mb-20 w-full max-w-md px-4 py-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-heading">{{ $t('l_Home') }}</h1>
      <button type="button"
        class="flex size-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-primary shadow-elevated"
        :aria-label="$t('l_Bookmarks')">
        <Icon name="material-symbols:bookmark-rounded" class="size-5" />
      </button>
    </div>

    <div class="mt-3 flex items-center gap-2">
      <UiInput v-model="search" class="flex-1 rounded-2xl p-3" :placeholder="$t('l_Search_cooks_placeholder')">
        <template #icon>
          <Icon name="material-symbols:search-rounded" class="size-4" />
        </template>
      </UiInput>
      <button type="button"
        class="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-icon-secondary"
        :aria-label="$t('l_Filters')">
        <Icon name="material-symbols:tune-rounded" class="size-5" />
      </button>
    </div>

    <p v-if="listError" class="mt-3 text-[13px] text-red-600">
      {{ listError }}
    </p>

    <div class="mt-5 flex items-center justify-between">
      <h2 class="text-[15px] font-bold text-heading">{{ $t('l_Popular_cooks') }}</h2>
      <NuxtLink to="/cooks" class="text-[11px] font-bold text-primary">{{ $t('l_See_all_cooks') }}</NuxtLink>
    </div>

    <div v-if="pending" class="mt-3 grid grid-cols-2 gap-3" aria-busy="true">
      <div v-for="n in 4" :key="n" class="overflow-hidden rounded-[16px] border border-black/8 bg-black/5">
        <div class="h-[104px] animate-pulse bg-black/10" />
        <div class="space-y-2 p-2.5">
          <div class="h-3.5 w-2/3 animate-pulse rounded bg-black/10" />
          <div class="h-3 w-full animate-pulse rounded bg-black/10" />
        </div>
      </div>
    </div>

    <div v-else class="mt-3 grid grid-cols-2 gap-3">
      <UiCard v-for="chef in filteredCookCards" :key="chef.id" padding="sm"
        class="cursor-pointer overflow-hidden rounded-[16px] border border-black/8 p-0!" role="link" tabindex="0"
        @click="navigateTo(`/cooks/${chef.id}/menu`)" @keydown.enter.prevent="navigateTo(`/cooks/${chef.id}/menu`)">
        <div class="relative">
          <img v-if="chef.image" :src="chef.image" :alt="chef.name" class="h-[104px] w-full object-cover" />
          <div v-else
            class="flex h-[104px] w-full items-center justify-center bg-surface-muted text-xl font-bold text-muted">
            {{ chef.initials }}
          </div>
          <span
            class="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-bold shadow-sm"
            :class="chef.isAvailable ? 'text-[#6B8E23]' : 'text-muted'">
            <span class="size-1.5 shrink-0 rounded-full" :class="chef.isAvailable ? 'bg-[#6B8E23]' : 'bg-black/25'"
              aria-hidden="true" />
            {{ chef.isAvailable ? $t('l_Online') : $t('l_Offline') }}
          </span>
        </div>

        <div class="p-2.5">
          <p class="text-[13px] font-bold text-dark">{{ chef.name }}</p>
          <!-- <p class="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-subtle">
            <Icon name="material-symbols:restaurant-outline" class="size-3.5 shrink-0" aria-hidden="true" />
            {{ $t('l_Cook_dishes_count', { count: chef.countDishes }) }}
          </p> -->
          <div class="mt-2 flex gap-1.5">
            <!-- <button type="button" class="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white"
              @click.stop="
                navigateTo(`/cooks/${encodeURIComponent(chef.id)}/menu`)
                ">
              {{ $t('l_Dishes') }}
            </button> -->
            <button type="button"
              class="rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-bold text-icon-secondary"
              @click.stop="navigateTo(`/cooks/${chef.id}/menu`)">
              {{ $t('l_Cook_profile_btn') }}
            </button>
          </div>
        </div>
      </UiCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Cook } from "~/types";
import { fetchCooksPage } from "~/utils/cookApi";
import { dishImageSrc } from "~/utils/dishApi";

const { t } = useI18n();
const search = ref("");

const { $api } = useNuxtApp();
const config = useRuntimeConfig();
const api = $api as (url: string, opts?: object) => Promise<unknown>;
const apiBase = computed(() => config.public.apiBaseUrl as string);

const {
  data: feed,
  pending,
  error,
} = useAsyncData(
  "home-cooks",
  async () => {
    const cooksPack = await fetchCooksPage(api, 1, 20);

    return {
      cooks: cooksPack.items,
    };
  },
  {
    default: () => ({
      cooks: [] as Cook[],
    }),
  },
);

const listError = computed(() =>
  error.value ? t("l_Failed_load_data") : "",
);

function specialtiesLine(s: string[] | undefined): string {
  if (!s?.length) return "—";
  return s.slice(0, 2).join(" • ");
}

function specialtiesTags(s: string[] | undefined): string {
  if (!s?.length) return "";
  return s.join(", ");
}

function businessInitials(name: string | undefined): string {
  const words = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return t("l_Initial_fallback");
  const initials = words.slice(0, 2).map((word) => word[0] ?? "").join("");
  return (initials || words[0][0] || t("l_Initial_fallback")).toUpperCase();
}

const cookCards = computed(() => {
  const base = apiBase.value;
  return (feed.value?.cooks ?? []).map((c) => ({
    id: c.id,
    name: c.businessName,
    image:
      dishImageSrc(c.profileImageUrl, base) ??
      "",
    initials: businessInitials(c.businessName),
    isAvailable: c.isAvailable !== false,
    meta: specialtiesLine(c.specialties),
    tags: specialtiesTags(c.specialties),
    countDishes:
      typeof c.countDishes === "number" && Number.isFinite(c.countDishes)
        ? Math.max(0, Math.trunc(c.countDishes))
        : 0,
  }));
});

const filteredCookCards = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return cookCards.value;
  return cookCards.value.filter((c) =>
    [c.name, c.meta, c.tags].some((x) => x.toLowerCase().includes(q)),
  );
});
</script>
