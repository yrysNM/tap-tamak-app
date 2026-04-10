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

      <div class="mt-3 grid grid-cols-2 gap-3">
        <Card
          v-for="chef in popularChefs"
          :key="chef.name"
          padding="sm"
          class="overflow-hidden rounded-[16px] border border-black/8 p-0!"
        >
          <div class="relative">
            <img
              :src="chef.image"
              :alt="chef.name"
              class="h-[104px] w-full object-cover"
            />
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

      <div class="mt-3 grid grid-cols-2 gap-3 pb-24">
        <Card
          v-for="dish in recommendations"
          :key="dish.name"
          padding="sm"
          class="overflow-hidden rounded-[16px] border border-black/8 p-0!"
        >
          <div class="relative">
            <img
              :src="dish.image"
              :alt="dish.name"
              class="h-[100px] w-full object-cover"
            />
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
type HomeTab = "cookers" | "foods";

const search = ref("");
const homeTab = ref<HomeTab>("cookers");

const categories = [
  { id: 1, name: "Все", emoji: "🍽️", active: true },
  { id: 2, name: "Десерты", emoji: "🍰", active: false },
  { id: 3, name: "Супы", emoji: "🍲", active: false },
  { id: 4, name: "Гриль", emoji: "🥩", active: false },
];

const popularChefs = [
  {
    name: "Султан",
    rating: "4,8",
    image:
      "https://www.figma.com/api/mcp/asset/e7673242-e878-4b35-8d4f-fbf7df20a5d7",
    meta: "Европейская • Десерт",
    tags: "Паста, круассаны, крем-",
  },
  {
    name: "Бекиру",
    rating: "4,9",
    image:
      "https://www.figma.com/api/mcp/asset/63debf57-b978-42cb-830b-111a5c2c9107",
    meta: "Азиатская • Вок",
    tags: "Вок, Том Ям, роллы",
  },
  {
    name: "Али",
    rating: "4,6",
    image:
      "https://www.figma.com/api/mcp/asset/d5be6e6a-1026-453e-b7b0-d9f3fa4bf834",
    meta: "Домашняя • Супы",
    tags: "Борщ, пельмени, супы",
  },
  {
    name: "Айдана",
    rating: "4,7",
    image:
      "https://www.figma.com/api/mcp/asset/cd34ceaf-bc86-49f8-a59e-ccf124081b44",
    meta: "Завтраки • Гриль",
    tags: "Омлет, стейк, салаты",
  },
];

const recommendations = [
  {
    name: "Паста с курицей и грибами",
    price: 3230,
    rating: 4.8,
    chef: "Сахнур",
    tag: "Хит дня",
    image:
      "https://www.figma.com/api/mcp/asset/76d796d3-4780-4b53-ae5c-b3f097fdae9b",
  },
  {
    name: "Борщ домашний",
    price: 2350,
    rating: 4.6,
    chef: "Али",
    tag: "Топ",
    image:
      "https://www.figma.com/api/mcp/asset/9f694c71-cc4d-4332-b147-2a3d60f0467d",
  },
  {
    name: "Лапша вок с курицей",
    price: 3400,
    rating: 4.9,
    chef: "Бекиру",
    tag: "Новинка",
    image:
      "https://www.figma.com/api/mcp/asset/2db53155-3907-4169-995b-efe6428e8411",
  },
  {
    name: 'Десерт "Крем-брюле"',
    price: 2290,
    rating: 4.7,
    chef: "Султан",
    tag: "Сладкое",
    image:
      "https://www.figma.com/api/mcp/asset/3fc1c188-881f-4d59-b54d-ee3103b39b07",
  },
];
</script>
