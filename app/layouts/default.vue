<template>
  <div
    class="flex min-h-screen flex-col bg-primary-light pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
  >
    <header
      class="sticky top-0 z-100 flex items-center justify-between border-b border-border bg-primary-light px-4 py-3"
    >
      <NuxtLink
        to="/"
        class="flex items-center gap-1.5 text-xl font-semibold text-primary"
      >
        <span aria-hidden>🍳</span>
        <span>Tap Tamak</span>
      </NuxtLink>
      <div class="flex items-center gap-3">
        <!-- <NuxtLink
          to="/"
          class="rounded-full p-2 text-dark transition-colors hover:bg-white/80"
          aria-label="Search"
        >
          <Icon name="material-symbols:search" class="size-6" />
        </NuxtLink> -->
        <NuxtLink
          to="/favorites"
          class="rounded-full p-2 text-dark transition-colors hover:bg-white/80"
          aria-label="Favorites"
        >
          <Icon name="material-symbols:bookmark-outline" class="size-6" />
        </NuxtLink>
      </div>
    </header>

    <main class="flex-1 overflow-auto pb-20">
      <slot />
    </main>

    <nav
    v-if="showBottomNav"
      class="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-border bg-white py-2 shadow-bottom pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
    >
      <NuxtLink
        to="/"
        class="flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary"
      >
        <Icon name="material-symbols:home-outline" class="size-6" />
        <span class="text-xs">Главная</span>
      </NuxtLink>

      <NuxtLink
        to="/orders"
        class="relative flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary"
      >
        <Icon name="material-symbols:receipt-long-outline" class="size-6" />
        <span class="text-xs">Заказы</span>
        <span
          v-if="cartCount > 0"
          class="absolute -right-1 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
        >
          {{ cartCount > 99 ? "99+" : cartCount }}
        </span>
      </NuxtLink>

      <NuxtLink
        to="/cooks"
        class="flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary"
      >
        <Icon name="material-symbols:map-outline" class="size-6" />
        <span class="text-xs">Карта</span>
      </NuxtLink>

      <NuxtLink
        to="/profile"
        class="flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary"
      >
        <Icon name="material-symbols:person-outline" class="size-6" />
        <span class="text-xs">Профиль</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from "../stores/cart";

const cartStore = useCartStore();
const route = useRoute(); 

const cartCount = computed(() => cartStore.totalItems);
const showBottomNav = computed(() => !route.meta.hideBottomNav);
</script>
