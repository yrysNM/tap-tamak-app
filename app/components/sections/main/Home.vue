<template>
  <section class="mx-auto w-full max-w-md px-4 py-4 mb-20">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-heading">Главная</h1>
      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-primary shadow-elevated"
        aria-label="Закладки"
      >
        <Icon name="material-symbols:bookmark-rounded" class="size-5" />
      </button>
    </div>

    <div class="mt-3 flex items-center gap-2">
      <Input
        class="flex-1 border p-3 rounded-2xl"
        v-model="search"
        placeholder="Поиск: повар, блюдо, район..."
      >
        <template #icon>
          <Icon name="material-symbols:search-rounded" class="size-4" />
        </template>
      </Input>
      <button
        type="button"
        class="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-icon-secondary"
        aria-label="Фильтры"
      >
        <Icon name="material-symbols:tune-rounded" class="size-5" />
      </button>
    </div>

    <div
      class="mt-4 flex rounded-2xl border border-black/10 bg-black/4 p-1"
      role="tablist"
      aria-label="Что показать"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="homeTab === 'cookers'"
        :class="[
          'flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-colors',
          homeTab === 'cookers'
            ? 'bg-white text-heading shadow-tab'
            : 'text-subtle',
        ]"
        @click="homeTab = 'cookers'"
      >
        Повара
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="homeTab === 'foods'"
        :class="[
          'flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-colors',
          homeTab === 'foods'
            ? 'bg-white text-heading shadow-tab'
            : 'text-subtle',
        ]"
        @click="homeTab = 'foods'"
      >
        Блюда
      </button>
    </div>

    <p v-if="listError" class="mt-3 text-[13px] text-red-600">{{ listError }}</p>

    <!-- <div class="mt-5 flex items-center justify-between">
      <h2 class="text-[15px] font-bold text-heading">Категории кухни</h2>
      <NuxtLink to="/cooks" class="text-xs font-bold text-primary"
        >Все</NuxtLink
      >
    </div>

    <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        :class="[
          'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2.5 text-[13px] font-bold shadow-soft',
          category.active
            ? 'border-primary/35 bg-primary/15 text-body'
            : 'border-black/10 bg-white/90 text-body',
        ]"
      >
        <span
          :class="[
            'flex size-[22px] items-center justify-center rounded-full text-[11px]',
            category.active ? 'bg-primary/10' : 'bg-primary/15',
          ]"
        >
          {{ category.emoji }}
        </span>
        {{ category.name }}
      </button>
    </div> -->

    <template v-if="homeTab === 'cookers'">
      <div class="mt-5 flex items-center justify-between">
        <h2 class="text-[15px] font-bold text-heading">Популярные повара</h2>
        <NuxtLink to="/cooks" class="text-[11px] font-bold text-primary"
          >Смотреть всех</NuxtLink
        >
      </div>

      <div
        v-if="pending"
        class="mt-3 grid grid-cols-2 gap-3"
        aria-busy="true"
      >
        <div
          v-for="n in 4"
          :key="n"
          class="overflow-hidden rounded-[16px] border border-black/8 bg-black/5"
        >
          <div class="h-[104px] animate-pulse bg-black/10" />
          <div class="space-y-2 p-2.5">
            <div class="h-3.5 w-2/3 animate-pulse rounded bg-black/10" />
            <div class="h-3 w-full animate-pulse rounded bg-black/10" />
          </div>
        </div>
      </div>

      <div v-else class="mt-3 grid grid-cols-2 gap-3">
        <Card
          v-for="chef in filteredCookCards"
          :key="chef.id"
          padding="sm"
          class="overflow-hidden rounded-[16px] border border-black/8 p-0!"
        >
          <div class="relative">
            <img
              v-if="chef.image"
              :src="chef.image"
              :alt="chef.name"
              class="h-[104px] w-full object-cover"
            />
            <div
              v-else
              class="flex h-[104px] w-full items-center justify-center bg-surface-muted text-[11px] font-semibold text-muted"
            >
              Нет фото
            </div>
            <div
              class="absolute left-2 top-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-dark"
            >
              {{ chef.rating }} ⭐
            </div>
            <button
              type="button"
              class="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-white/95 text-icon-muted"
              aria-label="В избранное"
            >
              <Icon
                name="material-symbols:favorite-outline-rounded"
                class="size-4"
              />
            </button>
          </div>

          <div class="p-2.5">
            <p class="text-[13px] font-bold text-dark">{{ chef.name }}</p>
            <p class="mt-0.5 text-[11px] font-semibold text-subtle">
              {{ chef.meta }}
            </p>
            <p class="mt-0.5 text-[11px] font-semibold text-subtle">
              {{ chef.tags }}
            </p>
            <div class="mt-2 flex gap-1.5">
              <button
                class="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white"
              >
                Блюда
              </button>
              <button
                class="rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-bold text-icon-secondary"
              >
                Профиль
              </button>
            </div>
          </div>
        </Card>
      </div>
    </template>

    <template v-else>
      <h2 class="mt-5 text-[15px] font-bold text-heading">
        Рекомендации для дня
      </h2>

      <div
        v-if="pending"
        class="mt-3 grid grid-cols-2 gap-3 pb-24"
        aria-busy="true"
      >
        <div
          v-for="n in 4"
          :key="n"
          class="overflow-hidden rounded-[16px] border border-black/8 bg-black/5"
        >
          <div class="h-[100px] animate-pulse bg-black/10" />
          <div class="space-y-2 p-2.5">
            <div class="h-3.5 w-full animate-pulse rounded bg-black/10" />
            <div class="h-4 w-1/2 animate-pulse rounded bg-black/10" />
          </div>
        </div>
      </div>

      <div v-else class="mt-3 grid grid-cols-2 gap-3 pb-24">
        <Card
          v-for="dish in filteredDishCards"
          :key="dish.id"
          padding="sm"
          class="overflow-hidden rounded-[16px] border border-black/8 p-0!"
        >
          <div class="relative">
            <img
              v-if="dish.image"
              :src="dish.image"
              :alt="dish.name"
              class="h-[100px] w-full object-cover"
            />
            <div
              v-else
              class="flex h-[100px] w-full items-center justify-center bg-surface-muted text-[11px] font-semibold text-muted"
            >
              Нет фото
            </div>
            <div
              class="absolute left-2 top-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-dark"
            >
              {{ dish.tag }}
            </div>
            <button
              type="button"
              class="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-white/95 text-icon-muted"
              aria-label="В избранное"
            >
              <Icon
                name="material-symbols:favorite-outline-rounded"
                class="size-4"
              />
            </button>
          </div>
          <div class="p-2.5">
            <p class="line-clamp-2 text-[12px] font-bold text-dark">
              {{ dish.name }}
            </p>
            <div class="mt-1 flex items-center justify-between">
              <p class="text-[15px] font-bold text-primary">
                {{ dish.price }} ₸
              </p>
              <Rating :value="dish.rating" size="sm" show-value />
            </div>
            <p class="mt-0.5 text-[11px] font-semibold text-subtle">
              Повар: {{ dish.chef }}
            </p>
          </div>
        </Card>
      </div>
    </template>

    <div
      class="fixed bottom-[74px] left-1/2 z-10 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-black/10 bg-white/95 p-2 shadow-floating backdrop-blur"
    >
      <div class="flex items-center gap-2">
        <div class="flex-1 rounded-xl bg-surface-warm px-3 py-2">
          <p class="text-[12px] font-bold text-icon-secondary">Корзина: 0 шт</p>
          <p class="text-[11px] font-semibold text-muted">Итого: 0 ₸</p>
        </div>
        <Button size="sm">Оформить</Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Cook, CookDish, Dish } from "~/types";
import { fetchCooksPage } from "~/utils/cookApi";
import { dishImageSrc, fetchDishesPage } from "~/utils/dishApi";

type HomeTab = "cookers" | "foods";

const search = ref("");
const homeTab = ref<HomeTab>("cookers");

const { $api } = useNuxtApp();
const config = useRuntimeConfig();
const api = $api as (url: string, opts?: object) => Promise<unknown>;
const apiBase = computed(() => config.public.apiBaseUrl as string);

const { data: feed, pending, error } = useAsyncData(
  "home-cooks-dishes",
  async () => {
    const [cooksPack, dishesPack] = await Promise.all([
      fetchCooksPage(api, 1, 20),
      fetchDishesPage(api, 1, 20),
    ]);
    return {
      cooks: cooksPack.items,
      dishes: dishesPack.items as Array<Dish | CookDish>,
    };
  },
  {
    default: () => ({
      cooks: [] as Cook[],
      dishes: [] as Array<Dish | CookDish>,
    }),
  },
);

const listError = computed(() =>
  error.value ? "Не удалось загрузить данные. Попробуйте позже." : "",
);

function formatRating(r: number): string {
  if (!Number.isFinite(r)) return "—";
  return r.toFixed(1).replace(".", ",");
}

function specialtiesLine(s: string[] | undefined): string {
  if (!s?.length) return "—";
  return s.slice(0, 2).join(" • ");
}

function specialtiesTags(s: string[] | undefined): string {
  if (!s?.length) return "";
  return s.join(", ");
}

const cookCards = computed(() => {
  const base = apiBase.value;
  return (feed.value?.cooks ?? []).map((c) => ({
    id: c.id,
    name: c.businessName,
    rating: formatRating(c.rating),
    image: dishImageSrc(c.kitchenPhotoUrls?.[0], base) ?? "",
    meta: specialtiesLine(c.specialties),
    tags: specialtiesTags(c.specialties),
  }));
});

const filteredCookCards = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return cookCards.value;
  return cookCards.value.filter((c) =>
    [c.name, c.meta, c.tags].some((x) => x.toLowerCase().includes(q)),
  );
});

const dishCards = computed(() => {
  const base = apiBase.value;
  return (feed.value?.dishes ?? []).map((d) => {
    const dish = d as Dish | CookDish;
    const tags = "tags" in dish && Array.isArray(dish.tags) ? dish.tags : [];
    const rating =
      "rating" in dish &&
      typeof dish.rating === "number" &&
      Number.isFinite(dish.rating)
        ? dish.rating
        : 0;
    const tag = tags[0] || dish.category || "";
    const cookName = (dish as Dish).cook?.businessName ?? "—";
    return {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      rating,
      chef: cookName,
      tag,
      image: dishImageSrc(dish.imageUrl, base) ?? "",
    };
  });
});

const filteredDishCards = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return dishCards.value;
  return dishCards.value.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.chef.toLowerCase().includes(q) ||
      d.tag.toLowerCase().includes(q),
  );
});
</script>
