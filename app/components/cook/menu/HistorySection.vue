<script setup lang="ts">
const { t } = useI18n()
import type { CookSchedule } from "~/types";
import type { CookMenuHistoryItem, CookMenuPayload } from "~/utils/menuApi";
import { formatMenuDateLabel } from "~/composables/useUtcMenuDates";
import { apiMessage } from "~/utils/apiMessage";
import { unwrapMenuPayload } from "~/utils/menuApi";
import { dishImageSrc, unwrapDishesList } from "~/utils/dishApi";
import { formatScheduleLocalRange } from "~/utils/scheduleApi";
import type { CookDish } from "~/types";

const from = defineModel<string>("from", { required: true });
const to = defineModel<string>("to", { required: true });

defineProps<{
  items: CookMenuHistoryItem[];
  loading: boolean;
  historyPage: number;
  historyTotalPages: number | null;
  todayYmd: string;
  todayMenu: CookMenuPayload | null;
  todayLoading: boolean;
  todayError: string;
  /** Path segment for PATCH/DELETE (menu id or YYYY-MM-DD). */
  deletingMenuId: string | null;
  schedule: CookSchedule | null;
  scheduleLoading: boolean;
  scheduleError: string;
}>();

const emit = defineEmits<{
  "load-more": [];
  "create-today": [];
  "delete-menu": [menuKey: string];
  "open-schedule": [];
}>();

function menuEditPath(menuKey: string) {
  return `/cook/menu/edit/${encodeURIComponent(menuKey)}`;
}

function menuKeyFromRow(row: CookMenuHistoryItem) {
  return row.id ?? row.date;
}

function menuKeyToday(menu: CookMenuPayload, todayYmd: string) {
  return menu.id ?? todayYmd;
}

const { $api } = useNuxtApp();
const config = useRuntimeConfig();
const apiBase = computed(() => config.public.apiBaseUrl as string);

const previewOpen = ref(false);
const previewDate = ref<string | null>(null);
const previewLoading = ref(false);
const previewError = ref("");
const previewDishes = ref<CookDish[]>([]);

function imageSrc(url: string | undefined) {
  return dishImageSrc(url, apiBase.value);
}

async function openPreview(id: string) {
  previewOpen.value = true;
  previewLoading.value = true;
  previewError.value = "";
  previewDishes.value = [];
  try {
    const raw = await ($api as (url: string, opts: object) => Promise<unknown>)(
      `/menus/${encodeURIComponent(id)}`,
      { method: "GET" },
    );
    const menu = unwrapMenuPayload(raw);
    if (!menu?.dishIds?.length) {
      previewDishes.value = [];
      return;
    }
    const rawDishes = await (
      $api as (url: string, opts: object) => Promise<unknown>
    )("/dishes", {
      method: "GET",
      query: { page: 1, limit: 100 },
    });
    const { items } = unwrapDishesList(
      (rawDishes as { data?: unknown }).data ?? rawDishes,
    );
    const map = new Map(items.map((d) => [d.id, d]));
    previewDishes.value = menu.dishIds
      .map((id) => map.get(id))
      .filter(Boolean) as CookDish[];
  } catch (err) {
    previewError.value = apiMessage(err, 'l_Failed_load_menu');
  } finally {
    previewLoading.value = false;
  }
}

function closePreview() {
  previewOpen.value = false;
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("draft")) return "bg-amber-50 text-amber-800 ring-amber-200";
  if (s.includes("publish") || s.includes("live"))
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  return "bg-primary-light text-primary ring-primary/25";
}

function formatTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
}
</script>

<template>
  <section class="space-y-5">
    <div class="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-bold text-dark">{{ t("l_Work_schedule") }}</h3>
          <p class="mt-1 text-[13px] text-muted">
            {{ t("l_Schedule_window_hint") }}
          </p>
        </div>
        <button type="button"
          class="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-dark transition hover:border-primary/40 hover:text-primary"
          @click="emit('open-schedule')">
          {{
            schedule?.workStartAt && schedule?.workEndAt
              ? t("l_Change")
              : t("l_Add_schedule")
          }}
        </button>
      </div>

      <p v-if="scheduleLoading" class="mt-3 text-sm text-caption">
        {{ t("l_Loading_schedule") }}
      </p>
      <p v-else-if="scheduleError" class="mt-3 text-sm text-error">
        {{ scheduleError }}
      </p>
      <div v-else class="mt-3 rounded-xl bg-surface-muted/30 p-3">
        <p class="text-sm font-semibold text-dark">
          {{
            schedule?.workStartAt && schedule?.workEndAt
              ? formatScheduleLocalRange(schedule.workStartAt, schedule.workEndAt)
              : t("l_Schedule_not_set")
          }}
        </p>
        <p class="mt-1 text-[12px] text-caption">
          {{ t("l_Status") }}
          <span class="font-semibold text-dark">
            {{ schedule?.isActiveNow ? t("l_Schedule_active_now") : t("l_Schedule_inactive_now") }}
          </span>
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-lg font-bold text-dark">{{ t("l_Menu_history") }}</h2>
      <CookMenuDateRangePicker v-model:from="from" v-model:to="to" />
    </div>

    <div v-if="todayLoading" class="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div class="h-5 w-48 animate-pulse rounded bg-surface-muted" />
      <div class="mt-3 h-4 w-full animate-pulse rounded bg-surface-muted" />
    </div>
    <div v-else-if="todayError" class="rounded-2xl border border-error/25 bg-white p-5 text-sm text-error shadow-sm">
      {{ todayError }}
    </div>
    <div v-else-if="!todayMenu"
      class="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary-light to-white p-5 shadow-md ring-1 ring-primary/15">
      <h3 class="text-base font-bold text-dark">{{ t("l_No_menu_today") }}</h3>
      <p class="mt-1 text-[13px] text-muted">
        {{ t("l_Create_menu_today_hint", { date: formatMenuDateLabel(todayYmd) }) }}
      </p>
      <button type="button"
        class="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-primary-cta transition hover:bg-primary-hover sm:w-auto sm:px-8"
        @click="emit('create-today')">
        {{ t("l_Create_menu_today") }}
      </button>
    </div>
    <div v-else class="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-[12px] font-medium uppercase tracking-wide text-caption">
            {{ t("l_Today") }}
          </p>
          <p class="text-base font-bold text-dark">
            {{ formatMenuDateLabel(todayMenu.date) }}
          </p>
        </div>
        <span
          class="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
          {{ t("l_Created") }}
        </span>
      </div>
      <p class="mt-2 text-sm text-muted">
        {{ t("l_Dishes_in_menu", { count: todayMenu.dishIds.length }) }}
      </p>
      <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <NuxtLink :to="menuEditPath(menuKeyToday(todayMenu, todayYmd))"
          class="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border text-sm font-semibold text-dark transition hover:border-primary/40 hover:text-primary sm:flex-none sm:px-5 py-3">
          {{ t("l_Edit") }}
        </NuxtLink>
        <button type="button"
          class="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-error/30 text-sm font-semibold text-error transition hover:bg-error/5 disabled:opacity-45 sm:flex-none sm:px-5 py-3"
          :disabled="deletingMenuId === menuKeyToday(todayMenu, todayYmd)"
          @click="emit('delete-menu', menuKeyToday(todayMenu, todayYmd))">
          {{
            deletingMenuId === menuKeyToday(todayMenu, todayYmd)
              ? t("l_Deleting")
              : t("l_Delete")
          }}
        </button>
      </div>
    </div>

    <div v-if="loading && items.length === 0" class="space-y-3">
      <div v-for="n in 4" :key="n" class="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div class="flex gap-3">
          <div class="h-14 w-24 animate-pulse rounded-xl bg-surface-muted" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-4 w-40 animate-pulse rounded bg-surface-muted" />
            <div class="h-3 w-full animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!loading && items.length === 0"
      class="rounded-2xl border border-dashed border-border bg-white py-14 text-center shadow-sm">
      <Icon name="material-symbols:history-rounded" class="mx-auto size-12 text-caption" />
      <p class="mt-3 text-sm font-semibold text-dark">{{ t("l_No_menu_history") }}</p>
      <p class="mt-1 px-6 text-[13px] text-caption">
        {{ t("l_No_menu_history_hint") }}
      </p>
    </div>
    <ul v-else class="space-y-3">
      <li v-for="row in items" :key="row.id ?? row.date"
        class="rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:border-primary/25 hover:shadow-md">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-base font-bold text-dark">
                {{ formatMenuDateLabel(row.date) }}
              </p>
              <span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1"
                :class="statusClass(row.status)">
                {{ row.status }}
              </span>
            </div>
            <p class="mt-1 text-[13px] text-muted">
              {{ t("l_Menu_row_meta", { count: row.dishCount, time: formatTime(row.createdAt) }) }}
            </p>
            <p v-if="row.dishNamePreview.length" class="mt-2 line-clamp-2 text-[13px] text-caption">
              {{ row.dishNamePreview.join(" · ") }}
              <span v-if="row.dishCount > row.dishNamePreview.length" class="text-caption">…</span>
            </p>
          </div>
          <div class="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <NuxtLink :to="menuEditPath(menuKeyFromRow(row))"
              class="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-dark transition hover:border-primary/40 hover:text-primary">
              {{ t("l_Edit") }}
            </NuxtLink>
            <button type="button"
              class="h-10 rounded-xl border border-border px-4 text-sm font-semibold text-dark transition hover:border-primary/40 hover:text-primary"
              @click="openPreview(row.id || '')">
              {{ t("l_View") }}
            </button>
            <button type="button"
              class="h-10 rounded-xl border border-error/30 px-4 text-sm font-semibold text-error transition hover:bg-error/5 disabled:opacity-45"
              :disabled="deletingMenuId === menuKeyFromRow(row)" @click="emit('delete-menu', menuKeyFromRow(row))">
              {{ deletingMenuId === menuKeyFromRow(row) ? "…" : t("l_Delete") }}
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="historyTotalPages != null && historyPage < historyTotalPages" class="flex justify-center pt-1">
      <button type="button"
        class="rounded-full border border-border bg-white px-5 py-2 text-sm font-semibold text-dark shadow-sm transition hover:border-primary/40 hover:text-primary disabled:opacity-45"
        :disabled="loading" @click="emit('load-more')">
        {{ loading ? t("l_Loading_ellipsis") : t("l_Show_more") }}
      </button>
    </div>

    <Teleport to="body">
      <div v-if="previewOpen" class="fixed inset-0 z-1000 flex items-end justify-center sm:items-center sm:p-4"
        role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-black/45" @click="closePreview" />
        <div
          class="safe-sheet relative max-h-[min(88vh,640px)] w-full max-w-md overflow-hidden rounded-t-3xl border border-border bg-white shadow-elevated sm:rounded-3xl">
          <header class="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 class="text-base font-bold text-dark">
              {{ t("l_Menu_preview_title", { date: previewDate ? formatMenuDateLabel(previewDate) : "" }) }}
            </h3>
            <button type="button"
              class="flex size-9 items-center justify-center rounded-xl text-caption hover:bg-surface-muted"
              :aria-label="t('l_Close')" @click="closePreview">
              <Icon name="material-symbols:close-rounded" class="size-6" />
            </button>
          </header>
          <div class="max-h-[55vh] overflow-y-auto px-4 py-3">
            <p v-if="previewLoading" class="text-sm text-caption">{{ t("l_Loading_ellipsis") }}</p>
            <p v-else-if="previewError" class="text-sm text-error">
              {{ previewError }}
            </p>
            <ul v-else-if="previewDishes.length" class="space-y-3">
              <li v-for="d in previewDishes" :key="d.id" class="flex gap-3 rounded-xl border border-border p-2">
                <div class="size-14 shrink-0 overflow-hidden rounded-lg bg-primary-light">
                  <img v-if="imageSrc(d.imageUrl)" :src="imageSrc(d.imageUrl)" :alt="d.name"
                    class="size-full object-cover" />
                  <div v-else class="flex size-full items-center justify-center text-icon-muted">
                    <Icon name="material-symbols:restaurant-outline" class="size-7" />
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-dark">
                    {{ d.name }}
                  </p>
                  <p class="text-[12px] text-muted">{{ t("l_Cooking_time_single", { min: d.cookingTime }) }}</p>
                </div>
              </li>
            </ul>
            <p v-else class="text-sm text-caption">{{ t("l_No_dishes_in_menu") }}</p>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
