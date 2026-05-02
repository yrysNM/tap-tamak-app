<template>
  <section
    class="relative mx-auto h-[calc(100vh-8.5rem)] w-full max-w-md overflow-hidden rounded-[26px] bg-page-cream"
  >
    <ClientOnly>
      <LMap
        :zoom="mapZoom"
        :center="mapCenter"
        class="h-full w-full"
        :options="{ zoomControl: false }"
      >
        <LTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          layer-type="base"
          name="OpenStreetMap"
        />

        <LCircleMarker
          :lat-lng="[userCoords.lat, userCoords.lng]"
          :radius="hasExactLocation ? 8 : 6"
          :weight="3"
          color="#1d83d4"
          fill-color="#2aa4ff"
          :fill-opacity="0.8"
        />

        <LMarker
          v-for="cook in filteredCooks"
          :key="cook.id"
          :lat-lng="[cook.latitude!, cook.longitude!]"
          @click="selectCook(cook.id)"
        />
      </LMap>
    </ClientOnly>

    <div class="pointer-events-none absolute inset-x-0 top-0 p-3 z-1000">
      <div
        class="pointer-events-auto rounded-[16px] border border-black/10 bg-white/92 p-3 shadow-xl backdrop-blur-sm"
      >
        <h1 class="text-[27px] font-bold leading-none text-heading">
          Карта поваров
        </h1>
        <div class="mt-3 flex items-center gap-2">
          <div
            class="flex flex-1 items-center gap-2 rounded-[14px] border border-black/10 bg-white px-3 py-2"
          >
            <Icon
              name="material-symbols:search-rounded"
              class="size-4 text-muted"
            />
            <input
              v-model.trim="search"
              type="text"
              class="w-full bg-transparent text-[13px] text-body outline-none placeholder:text-subtle"
              placeholder="Поиск по району или имени"
            />
          </div>
        </div>
      </div>

      <!-- <div class="mt-2 flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="rounded-full border px-3 py-2 text-[12px] font-bold whitespace-nowrap"
          :class="
            activeCategory === category
              ? 'border-primary bg-primary/15 text-heading'
              : 'border-black/10 bg-white/90 text-body'
          "
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div> -->
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 p-3 z-1000">
      <div
        class="pointer-events-auto rounded-[22px] border border-black/10 bg-white/94 p-3 shadow-2xl backdrop-blur-md"
      >
        <div class="mx-auto mb-3 h-[5px] w-[52px] rounded-full bg-black/15" />
        <!-- <p v-if="listError" class="text-[12px] font-semibold text-red-600"> -->
        <!-- {{ listError }} -->
        <!-- </p> -->
        <p v-if="!selectedCook" class="text-[13px] text-subtle">
          Поблизости не найдено поваров с координатами.
        </p>
        <template v-else>
          <div class="flex items-center gap-3">
            <img
              v-if="selectedCookImage"
              :src="selectedCookImage"
              :alt="selectedCook.businessName"
              class="size-14 rounded-[16px] border-2 border-white object-cover shadow-md"
            />
            <div
              v-else
              class="flex size-14 items-center justify-center rounded-[16px] border-2 border-white bg-black/5 text-[11px] font-semibold text-muted shadow-md"
            >
              Нет фото
            </div>
            <div class="min-w-0 flex-1">
              <p
                class="truncate text-[20px] font-bold leading-tight text-heading"
              >
                {{ selectedCook.businessName }}
              </p>
              <p class="mt-1 truncate text-[12px] text-subtle">
                {{ specialtiesLine(selectedCook.specialties) }}
              </p>
              <p class="mt-1 text-[12px] font-semibold text-subtle">
                <span class="text-primary"
                  >{{ selectedCook.rating.toFixed(1) }} ★</span
                >
                <span class="mx-1 text-black/25">•</span>
                {{ distanceLabel(selectedCook) }}
              </p>
            </div>
          </div>

          <NuxtLink
            :to="`/cooks/${encodeURIComponent(selectedCook.id)}/menu`"
            class="mt-3 flex h-11 items-center justify-center rounded-[16px] bg-primary text-[14px] font-bold text-white shadow-[0_10px_16px_rgba(255,122,0,0.24)]"
          >
            Смотреть блюда
          </NuxtLink>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  LCircleMarker,
  LMap,
  LMarker,
  LTileLayer,
} from "@vue-leaflet/vue-leaflet";
import type { Cook } from "~/types";
import { fetchCooksPage } from "~/utils/cookApi";
import { dishImageSrc } from "~/utils/dishApi";

definePageMeta({
  layout: "default",
});

const categories = ["Все", "Закуски", "Десерты", "Горячее", "Детское", "Супы"];
const search = ref("");
const activeCategory = ref("Все");
const mapZoom = ref(14);

const { $api } = useNuxtApp();
const config = useRuntimeConfig();
const api = $api as (url: string, opts?: object) => Promise<unknown>;
const apiBase = computed(() => config.public.apiBaseUrl as string);

const {
  coords: userCoords,
  error: locationError,
  hasExactLocation,
  updateLocation,
} = useUserLocation();

const { data: list, error: listFetchError } = await useAsyncData(
  "map-cooks",
  async () => {
    const result = await fetchCooksPage(api, 1, 100);
    return result.items;
  },
);

const listError = computed(() => {
  if (listFetchError.value)
    return "Не удалось загрузить поваров. Попробуйте позже.";
  return locationError.value;
});

const cooksWithCoords = computed(() =>
  (list.value ?? []).filter(
    (c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude),
  ),
);

function matchesCategory(cook: Cook): boolean {
  if (activeCategory.value === "Все") return true;
  const normalized = activeCategory.value.toLowerCase();
  return (cook.specialties ?? []).some((s) =>
    s.toLowerCase().includes(normalized),
  );
}

const filteredCooks = computed(() => {
  const query = search.value.trim().toLowerCase();
  return cooksWithCoords.value.filter((cook) => {
    if (!matchesCategory(cook)) return false;
    if (!query) return true;
    const hay = [cook.businessName, ...(cook.specialties ?? [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  });
});

const selectedCookId = ref<string>("");
const selectedCook = computed(
  () =>
    filteredCooks.value.find((c) => c.id === selectedCookId.value) ??
    filteredCooks.value[0] ??
    null,
);

const selectedCookImage = computed(() =>
  dishImageSrc(selectedCook.value?.kitchenPhotoUrls?.[0], apiBase.value),
);

const mapCenter = computed<[number, number]>(() => {
  if (selectedCook.value?.latitude && selectedCook.value?.longitude) {
    return [selectedCook.value.latitude, selectedCook.value.longitude];
  }
  return [userCoords.value.lat, userCoords.value.lng];
});

watch(selectedCook, (cook) => {
  if (!cook) return;
  selectedCookId.value = cook.id;
});

function specialtiesLine(specialties: string[] | undefined): string {
  if (!specialties?.length) return "Разные блюда";
  return specialties.slice(0, 2).join(", ");
}

function selectCook(cookId: string) {
  selectedCookId.value = cookId;
}

function distanceLabel(cook: Cook): string {
  const { lat, lng } = userCoords.value;
  const lat2 = cook.latitude;
  const lng2 = cook.longitude;
  if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return "без координат";

  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad((lat2 as number) - lat);
  const dLon = toRad((lng2 as number) - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) *
      Math.cos(toRad(lat2 as number)) *
      Math.sin(dLon / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (km < 1) return `${Math.round(km * 1000)} м от вас`;
  return `${km.toFixed(1).replace(".", ",")} км от вас`;
}

onMounted(async () => {
  await updateLocation();
});
</script>
