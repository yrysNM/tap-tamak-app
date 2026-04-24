<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { CookDish } from "~/types";
import { apiMessage } from "~/utils/apiMessage";
import {
  deleteDishById,
  unwrapDishesList,
  type DishesListMeta,
} from "~/utils/dishApi";
import type {
  CookMenuHistoryItem,
  CookMenuPayload,
  MenusHistoryMeta,
} from "~/utils/menuApi";
import {
  deleteMenuById,
  unwrapMenuPayload,
  unwrapMenusHistoryItems,
  unwrapMenusHistoryMeta,
} from "~/utils/menuApi";
import { httpStatus } from "~/composables/useHttpStatus";
import { usePageToast } from "~/composables/usePageToast";
import { utcMonthRangeYmd, utcTodayYmd } from "~/composables/useUtcMenuDates";

definePageMeta({
  layout: "cook",
});

const { $api } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const toast = usePageToast();

const activeTab = ref<"menus" | "dishes">("menus");

const historyFrom = ref("");
const historyTo = ref("");
const historyPage = ref(1);
const historyItems = ref<CookMenuHistoryItem[]>([]);
const historyMeta = ref<MenusHistoryMeta | null>(null);
const historyLoading = ref(false);

const todayYmd = utcTodayYmd();
const todayMenu = ref<CookMenuPayload | null>(null);
const todayLoading = ref(true);
const todayError = ref("");

const dishes = ref<CookDish[]>([]);
const dishListMeta = ref<DishesListMeta | null>(null);
const dishPage = ref(1);
const dishLimit = 12;
const dishSearch = ref("");
const debouncedDishSearch = ref("");
const updateDishSearchDebounced = useDebounceFn((q: string) => {
  debouncedDishSearch.value = q;
}, 320);

const listLoading = ref(false);
const listError = ref("");
const deletingId = ref<string | null>(null);
const deletingMenuId = ref<string | null>(null);

const createMenuOpen = ref(false);
const createDishOpen = ref(false);

const historyRows = computed(() =>
  historyItems.value.filter((row) => row.date !== todayYmd),
);

const historyTotalPages = computed(() => {
  const t = historyMeta.value?.totalPages;
  return typeof t === "number" && t > 0 ? t : null;
});

function readQuery() {
  const q = route.query;
  if (q.tab === "dishes") activeTab.value = "dishes";
  else activeTab.value = "menus";

  const def = utcMonthRangeYmd();
  const fromQ = typeof q.from === "string" ? q.from : "";
  const toQ = typeof q.to === "string" ? q.to : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(fromQ)) historyFrom.value = fromQ;
  else historyFrom.value = def.from;
  if (/^\d{4}-\d{2}-\d{2}$/.test(toQ)) historyTo.value = toQ;
  else historyTo.value = def.to;

  historyPage.value = 1;

  dishSearch.value = typeof q.dishQ === "string" ? q.dishQ : "";
  debouncedDishSearch.value = dishSearch.value;

  const dp = Number.parseInt(String(q.dPage ?? ""), 10);
  dishPage.value = Number.isFinite(dp) && dp >= 1 ? dp : 1;
}

const syncRoute = useDebounceFn(() => {
  const next: Record<string, string> = {
    tab: activeTab.value,
    from: historyFrom.value,
    to: historyTo.value,
    dPage: String(dishPage.value),
  };
  if (dishSearch.value.trim()) next.dishQ = dishSearch.value.trim();
  void router.replace({ path: route.path, query: next });
}, 320);

watch([activeTab, historyFrom, historyTo, dishSearch, dishPage], () => {
  syncRoute();
});

watch([historyFrom, historyTo], async () => {
  historyPage.value = 1;
  await loadHistory(false);
});

watch(activeTab, (t) => {
  if (t === "dishes") void loadDishes();
});

watch(dishPage, () => {
  if (activeTab.value === "dishes") void loadDishes();
});

watch(debouncedDishSearch, () => {
  dishPage.value = 1;
  if (activeTab.value === "dishes") void loadDishes();
});

watch(dishSearch, (q) => {
  updateDishSearchDebounced(q);
});

async function loadHistory(append: boolean) {
  if (!historyFrom.value || !historyTo.value) return;
  historyLoading.value = true;
  try {
    const raw = await ($api as (url: string, opts: object) => Promise<unknown>)(
      "/menus/history",
      {
        method: "GET",
        query: {
          from: historyFrom.value,
          to: historyTo.value,
          page: historyPage.value,
          limit: 20,
        },
      },
    );
    const items = unwrapMenusHistoryItems(
      (raw as { data?: unknown }).data ?? raw,
    );
    const meta = unwrapMenusHistoryMeta(
      (raw as { data?: unknown }).data ?? raw,
    );
    historyMeta.value = meta;
    if (append) {
      const seen = new Set(historyItems.value.map((x) => x.date));
      const extra = items.filter((x) => !seen.has(x.date));
      historyItems.value = [...historyItems.value, ...extra];
    } else {
      historyItems.value = items;
    }
  } catch (err) {
    toast.show(apiMessage(err, "Не удалось загрузить историю меню."), "error");
    if (!append) historyItems.value = [];
    historyMeta.value = null;
  } finally {
    historyLoading.value = false;
  }
}

async function loadMoreHistory() {
  const tp = historyTotalPages.value;
  if (tp != null && historyPage.value >= tp) return;
  historyPage.value += 1;
  await loadHistory(true);
}

async function loadTodayMenu() {
  todayLoading.value = true;
  todayError.value = "";
  try {
    const raw = await ($api as (url: string, opts: object) => Promise<unknown>)(
      "/menus/today",
      { method: "GET" },
    );
    const m = unwrapMenuPayload(raw);
    todayMenu.value = m;
  } catch (err) {
    if (httpStatus(err) === 404) {
      todayMenu.value = null;
    } else {
      todayError.value = apiMessage(err, "Не удалось проверить меню на сегодня.");
      todayMenu.value = null;
    }
  } finally {
    todayLoading.value = false;
  }
}

async function loadDishes() {
  listLoading.value = true;
  listError.value = "";
  try {
    const q = debouncedDishSearch.value.trim();
    const raw = await ($api as (url: string, opts: object) => Promise<unknown>)(
      "/dishes",
      {
        method: "GET",
        query: {
          page: dishPage.value,
          limit: dishLimit,
          ...(q ? { search: q } : {}),
        },
      },
    );
    const { items, meta } = unwrapDishesList(
      (raw as { data?: unknown }).data ?? raw,
    );
    dishes.value = items;
    dishListMeta.value = meta;
  } catch (err) {
    listError.value = apiMessage(err, "Не удалось загрузить блюда.");
    dishes.value = [];
    dishListMeta.value = null;
  } finally {
    listLoading.value = false;
  }
}

async function onDeleteDish(id: string) {
  deletingId.value = id;
  try {
    await deleteDishById(
      $api as (url: string, opts?: object) => Promise<unknown>,
      id,
    );
    toast.show("Блюдо удалено.", "success");
    await loadDishes();
  } catch (err) {
    toast.show(apiMessage(err, "Не удалось удалить блюдо."), "error");
  } finally {
    deletingId.value = null;
  }
}

async function onDeleteMenu(menuKey: string) {
  const apiFn = $api as (url: string, opts?: object) => Promise<unknown>;
  if (
    !confirm(
      "Удалить это меню? Действие необратимо.",
    )
  ) {
    return;
  }
  deletingMenuId.value = menuKey;
  try {
    await deleteMenuById(apiFn, menuKey);
    toast.show("Меню удалено.", "success");
    await loadTodayMenu();
    await loadHistory(false);
  } catch (err) {
    toast.show(apiMessage(err, "Не удалось удалить меню."), "error");
  } finally {
    deletingMenuId.value = null;
  }
}

function onMenuCreated() {
  toast.show("Меню успешно создано.", "success");
  void loadTodayMenu();
  void loadHistory(false);
}

function onDishCreated() {
  toast.show("Блюдо создано.", "success");
  void loadDishes();
  if (activeTab.value === "menus") void loadHistory(false);
}

const canDishNext = computed(() => {
  const m = dishListMeta.value;
  if (m?.totalPages != null && m.totalPages > 0)
    return dishPage.value < m.totalPages;
  return dishes.value.length >= dishLimit;
});

onMounted(() => {
  readQuery();
  void loadTodayMenu();
  void loadHistory(false);
  void loadDishes();
});
</script>

<template>
  <div class="min-h-screen bg-page-cream pb-10 pt-4 sm:pt-8">
    <div class="mx-auto max-w-5xl px-4">
      <div
        class="mb-6 flex rounded-pill border border-border bg-white/90 p-1 shadow-tab backdrop-blur-sm"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'menus'"
          class="flex-1 rounded-pill py-2.5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="
            activeTab === 'menus'
              ? 'bg-primary text-white shadow-primary-cta'
              : 'text-muted hover:text-dark'
          "
          @click="activeTab = 'menus'"
        >
          Меню
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'dishes'"
          class="flex-1 rounded-pill py-2.5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="
            activeTab === 'dishes'
              ? 'bg-primary text-white shadow-primary-cta'
              : 'text-muted hover:text-dark'
          "
          @click="activeTab = 'dishes'"
        >
          Блюда
        </button>
      </div>

      <CookMenuHistorySection
        v-show="activeTab === 'menus'"
        v-model:from="historyFrom"
        v-model:to="historyTo"
        :items="historyRows"
        :loading="historyLoading"
        :history-page="historyPage"
        :history-total-pages="historyTotalPages"
        :today-ymd="todayYmd"
        :today-menu="todayMenu"
        :today-loading="todayLoading"
        :today-error="todayError"
        :deleting-menu-id="deletingMenuId"
        @create-today="createMenuOpen = true"
        @load-more="loadMoreHistory"
        @delete-menu="onDeleteMenu"
      />

      <CookMenuDishSection
        v-show="activeTab === 'dishes'"
        v-model:search="dishSearch"
        :dishes="dishes"
        :loading="listLoading"
        :list-error="listError"
        :deleting-id="deletingId"
        @create-click="createDishOpen = true"
        @delete="onDeleteDish"
      />

      <div
        v-if="activeTab === 'dishes'"
        class="mt-6 flex items-center justify-center gap-3"
      >
        <button
          type="button"
          class="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-dark shadow-sm transition hover:border-primary/40 disabled:opacity-40"
          :disabled="dishPage <= 1 || listLoading"
          @click="dishPage--"
        >
          Назад
        </button>
        <span class="text-sm text-muted">Стр. {{ dishPage }}</span>
        <button
          type="button"
          class="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-dark shadow-sm transition hover:border-primary/40 disabled:opacity-40"
          :disabled="!canDishNext || listLoading"
          @click="dishPage++"
        >
          Далее
        </button>
      </div>
    </div>

    <CookMenuCreateMenuModal
      v-model="createMenuOpen"
      @success="onMenuCreated"
    />
    <CookMenuCreateDishModal
      v-model="createDishOpen"
      @success="onDishCreated"
    />

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div
          v-if="toast.open"
          class="fixed bottom-6 left-1/2 z-80 w-[min(calc(100vw-2rem),420px)] -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-floating backdrop-blur-sm"
          :class="
            toast.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
              : toast.kind === 'error'
                ? 'border-red-200 bg-red-50/95 text-red-900'
                : 'border-border bg-white/95 text-dark'
          "
          role="status"
        >
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
