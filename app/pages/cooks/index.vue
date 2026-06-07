<template>
  <section class="relative mx-auto h-[calc(100vh-8.5rem)] w-full max-w-md overflow-hidden rounded-[26px] bg-page-cream">
    <ClientOnly>
      <LMap :zoom="mapZoom" :center="mapCenter" class="h-full w-full" :options="{ zoomControl: false }"
        @ready="onMapReady">
        <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base" name="OpenStreetMap" />

        <LCircle v-if="hasExactLocation" :lat-lng="[userCoords.lat, userCoords.lng]" :radius="locationAccuracy"
          color="#2aa4ff" :fill-color="'#2aa4ff'" :fill-opacity="0.12" :weight="1" />

        <LMarker v-if="hasExactLocation" :lat-lng="[userCoords.lat, userCoords.lng]" :icon="userMarkerIcon"
          :z-index-offset="1000" />

        <LMarker v-for="cook in mapCooks" :key="cook.id" :lat-lng="[cook.latitude!, cook.longitude!]"
          :icon="cookMarkerIconFor(cook)" :z-index-offset="cook.isAvailable ? 200 : 0" @click="selectCook(cook.id)" />
      </LMap>
    </ClientOnly>

    <div class="pointer-events-none absolute inset-x-0 top-0 p-3 z-1000">
      <div class="pointer-events-auto rounded-[16px] border border-black/10 bg-white/92 p-3 shadow-xl backdrop-blur-sm">
        <h1 class="text-[27px] font-bold leading-none text-heading">
          {{ t("l_Cooks_map_title") }}
        </h1>
        <p v-if="locationError" class="mt-2 text-[12px] font-semibold text-amber-700">
          {{ locationError }}
        </p>
        <div class="mt-3 flex items-center gap-2">
          <div class="flex flex-1 items-center gap-2 rounded-[14px] border border-black/10 bg-white px-3 py-2">
            <Icon name="material-symbols:search-rounded" class="size-4 text-muted" />
            <input v-model.trim="search" type="text"
              class="w-full bg-transparent text-[13px] text-body outline-none placeholder:text-subtle"
              :placeholder="t('l_Search_area_or_name')" />
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

    <button type="button"
      class="pointer-events-auto absolute right-3 top-[calc(50%-2.5rem)] z-1001 flex size-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-primary shadow-lg backdrop-blur-sm disabled:opacity-60"
      :disabled="locationLoading" :aria-label="t('l_My_location')" @click="locateUser">
      <Icon :name="locationLoading ? 'svg-spinners:ring-resize' : 'material-symbols:my-location-rounded'"
        class="size-5" />
    </button>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 p-3 z-1000">
      <div
        class="pointer-events-auto rounded-[22px] border border-black/10 bg-white/94 p-3 shadow-2xl backdrop-blur-md">
        <div class="mx-auto mb-3 h-[5px] w-[52px] rounded-full bg-black/15" />
        <!-- <p v-if="listError" class="text-[12px] font-semibold text-red-600"> -->
        <!-- {{ listError }} -->
        <!-- </p> -->
        <p v-if="!selectedCook" class="text-[13px] text-subtle">
          {{ t("l_No_cooks_with_coords") }}
        </p>
        <template v-else>
          <div class="flex items-center gap-3">
            <img v-if="selectedCookImage" :src="selectedCookImage" :alt="selectedCook.businessName"
              class="size-14 rounded-[16px] border-2 border-white object-cover shadow-md" />
            <div v-else
              class="flex size-14 items-center justify-center rounded-[16px] border-2 border-white bg-black/5 text-lg font-bold text-muted shadow-md">
              {{ cookInitials(selectedCook.businessName) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-[20px] font-bold leading-tight text-heading">
                {{ selectedCook.businessName }}
              </p>
              <p class="mt-1 truncate text-[12px] text-subtle">
                {{ specialtiesLine(selectedCook.specialties) }}
              </p>
              <p class="mt-1 text-[12px] font-semibold text-subtle">
                <span :class="selectedCook.isAvailable ? 'text-[#6B8E23]' : 'text-muted'">
                  {{ selectedCook.isAvailable ? t("l_Online") : t("l_Offline") }}
                </span>
                <span class="mx-1 text-black/25">•</span>
                {{ distanceLabel(selectedCook) }}
              </p>
            </div>
          </div>

          <NuxtLink :to="`/cooks/${encodeURIComponent(selectedCook.id)}/menu`"
            class="mt-3 flex h-11 items-center justify-center rounded-[16px] bg-primary text-[14px] font-bold text-white shadow-[0_10px_16px_rgba(255,122,0,0.24)]">
            {{ t("l_View_dishes") }}
          </NuxtLink>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  LCircle,
  LMap,
  LMarker,
  LTileLayer,
} from "@vue-leaflet/vue-leaflet";
import * as L from "leaflet";
import type { Cook } from "~/types";
import { fetchCooksPage } from "~/utils/cookApi";
import { dishImageSrc } from "~/utils/dishApi";

definePageMeta({
  layout: "default",
});

const { t } = useI18n();
const categories = computed(() => [t("l_Category_all"), t("l_Category_snacks"), t("l_Category_desserts"), t("l_Category_hot"), t("l_Category_kids"), t("l_Category_soups")]);
const search = ref("");
const activeCategory = ref("");
const mapZoom = ref(14);
const mapCenter = ref<[number, number]>([43.238949, 76.889709]);
const leafletMap = shallowRef<L.Map | null>(null);

const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const userMarkerIcon = computed(
  (): L.Icon =>
    L.divIcon({
      html: `<div class="user-location-marker"><span class="user-location-marker__pulse"></span><span class="user-location-marker__dot"></span></div>`,
      className: "user-location-marker-wrap",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    }) as L.Icon,
);

const onlineCookMarkerIcon = computed(
  (): L.Icon =>
    L.divIcon({
      html: `<div class="cook-map-marker-online">
        <span class="cook-map-marker-online__pulse"></span>
        <img src="https://api.iconify.design/fluent/person-available-32-light.svg?color=%23f47b20&width=32&height=32" alt="" class="cook-map-marker-online__icon" />
      </div>`,
      className: "cook-map-marker-online-wrap",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    }) as L.Icon,
);

const offlineCookMarkerIcon = computed(
  (): L.Icon =>
    L.divIcon({
      html: `<img src="https://api.iconify.design/glyphs-poly/map-marker-1.svg?color=%239ca3af&width=28&height=28" alt="" />`,
      className: "cook-map-marker-offline-wrap",
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    }) as L.Icon,
);

function cookMarkerIconFor(cook: Cook): L.Icon {
  return cook.isAvailable === true
    ? onlineCookMarkerIcon.value
    : offlineCookMarkerIcon.value;
}
const api = $api as (url: string, opts?: object) => Promise<unknown>;
const apiBase = computed(() => config.public.apiBaseUrl as string);

const {
  coords: userCoords,
  error: locationError,
  hasExactLocation,
  accuracy: locationAccuracyMeters,
  loading: locationLoading,
  updateLocation,
} = useUserLocation();

const locationAccuracy = computed(() => {
  const meters = locationAccuracyMeters.value;
  if (meters == null || !Number.isFinite(meters) || meters <= 0) return 80;
  return Math.min(Math.max(meters, 25), 500);
});

const { data: list } = await useAsyncData(
  "map-cooks",
  async () => {
    const result = await fetchCooksPage(api, 1, 100);
    return result.items.map((cook) => ({
      ...cook,
      isAvailable: cook.isAvailable === true,
    }));
  },
);

function onMapReady(map: L.Map) {
  leafletMap.value = map;
}

function centerMapOn(lat: number, lng: number, animate = true) {
  mapCenter.value = [lat, lng];
  if (leafletMap.value && animate) {
    leafletMap.value.flyTo([lat, lng], mapZoom.value, { duration: 0.75 });
  }
}

async function locateUser() {
  await updateLocation();
  if (hasExactLocation.value) {
    centerMapOn(userCoords.value.lat, userCoords.value.lng);
  }
}

const cooksWithCoords = computed(() =>
  (list.value ?? []).filter(
    (c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude),
  ),
);

function matchesCategory(cook: Cook): boolean {
  if (!activeCategory.value || activeCategory.value === categories.value[0]) return true;
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

const mapCooks = computed(() => filteredCooks.value);

const selectedCookId = ref<string>("");
const selectedCook = computed(
  () =>
    mapCooks.value.find((c) => c.id === selectedCookId.value) ??
    mapCooks.value.find((c) => c.isAvailable) ??
    mapCooks.value[0] ??
    null,
);

const selectedCookImage = computed(() =>
  dishImageSrc(selectedCook.value?.profileImageUrl, apiBase.value) ??
  dishImageSrc(selectedCook.value?.kitchenPhotoUrls?.[0], apiBase.value),
);

watch(selectedCook, (cook) => {
  if (!cook) return;
  selectedCookId.value = cook.id;
});

watch(hasExactLocation, (exact) => {
  if (exact && !selectedCookId.value) {
    centerMapOn(userCoords.value.lat, userCoords.value.lng, false);
  }
});

function specialtiesLine(specialties: string[] | undefined): string {
  if (!specialties?.length) return t("l_Various_dishes");
  return specialties.slice(0, 2).join(", ");
}

function cookInitials(name: string | undefined): string {
  const words = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return t("l_Initial_fallback");
  const initials = words.slice(0, 2).map((word) => word[0] ?? "").join("");
  return (initials || words[0][0] || t("l_Initial_fallback")).toUpperCase();
}

function selectCook(cookId: string) {
  selectedCookId.value = cookId;
  const cook = mapCooks.value.find((c) => c.id === cookId);
  if (cook?.latitude && cook?.longitude) {
    centerMapOn(cook.latitude, cook.longitude);
  }
}

function distanceLabel(cook: Cook): string {
  const { lat, lng } = userCoords.value;
  const lat2 = cook.latitude;
  const lng2 = cook.longitude;
  if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return t("l_No_coords");

  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad((lat2 as number) - lat);
  const dLon = toRad((lng2 as number) - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) *
    Math.cos(toRad(lat2 as number)) *
    Math.sin(dLon / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (km < 1) return t("l_Meters_from_you", { meters: Math.round(km * 1000) });
  return t("l_Km_from_you", { km: km.toFixed(1).replace(".", ",") });
}

onMounted(async () => {
  activeCategory.value = categories.value[0] ?? "";
  await locateUser();
});
</script>

<style scoped>
:deep(.cook-map-marker-online-wrap),
:deep(.cook-map-marker-offline-wrap) {
  background: transparent;
  border: none;
}

:deep(.cook-map-marker-online) {
  position: relative;
  width: 36px;
  height: 36px;
}

:deep(.cook-map-marker-online__icon) {
  position: relative;
  z-index: 2;
  display: block;
  width: 32px;
  height: 32px;
  margin: 0 auto;
  filter: drop-shadow(0 2px 4px rgba(244, 123, 32, 0.35));
}

:deep(.cook-map-marker-online__pulse) {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: rgba(244, 123, 32, 0.28);
  transform: translate(-50%, -50%);
  animation: cook-marker-pulse 2s ease-out infinite;
}

@keyframes cook-marker-pulse {
  0% {
    opacity: 0.85;
    transform: translate(-50%, -50%) scale(0.55);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.6);
  }
}

:deep(.user-location-marker-wrap) {
  background: transparent;
  border: none;
}

:deep(.user-location-marker) {
  position: relative;
  width: 28px;
  height: 28px;
}

:deep(.user-location-marker__dot) {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  width: 14px;
  height: 14px;
  border: 3px solid #fff;
  border-radius: 9999px;
  background: #2aa4ff;
  box-shadow: 0 2px 8px rgba(29, 131, 212, 0.45);
  transform: translate(-50%, -50%);
}

:deep(.user-location-marker__pulse) {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: rgba(42, 164, 255, 0.25);
  transform: translate(-50%, -50%);
  animation: user-location-pulse 2s ease-out infinite;
}

@keyframes user-location-pulse {
  0% {
    opacity: 0.85;
    transform: translate(-50%, -50%) scale(0.55);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.35);
  }
}
</style>
