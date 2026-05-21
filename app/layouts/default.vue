<template>
  <div class="safe-x safe-t flex min-h-dvh flex-col bg-page-cream">
    <header
      class="sticky top-0 z-100 flex items-center justify-between border-b border-border bg-primary-light px-4 py-3">
      <NuxtLink to="/" class="flex items-center gap-1.5 text-xl font-semibold text-primary">
        <!-- <span class="block size-8 shrink-0 overflow-hidden" aria-hidden>
          <img src="/logo.png" alt="" class="h-10 w-10 max-w-none object-cover object-left" />
        </span> -->
        <span>TapTamak</span>
      </NuxtLink>
      <div class="flex items-center gap-3">
        <!-- <NuxtLink
          to="/"
          class="rounded-full p-2 text-dark transition-colors hover:bg-white/80"
          aria-label="Search"
        >
          <Icon name="material-symbols:search" class="size-6" />
        </NuxtLink> -->
        <!-- <NuxtLink to="/favorites" class="rounded-full p-2 text-dark transition-colors hover:bg-white/80"
          aria-label="Favorites">
          <Icon name="material-symbols:bookmark-outline" class="size-6" />
        </NuxtLink> -->
      </div>
    </header>

    <main class="min-h-0 flex-1 overflow-auto pb-10" :class="showBottomNav ? 'safe-pb-bottom-nav' : 'safe-b'">
      <slot />
    </main>

    <nav v-if="showBottomNav"
      class="safe-fixed-bottom-nav fixed bottom-0 left-0 w-full z-100 flex items-center justify-around border-t border-border bg-white py-2 shadow-bottom">
      <NuxtLink to="/" class="flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary">
        <Icon name="material-symbols:home-outline" class="size-6" />
        <span class="text-xs">Главная</span>
      </NuxtLink>

      <NuxtLink to="/orders" class="relative flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary">
        <Icon name="material-symbols:receipt-long-outline" class="size-6" />
        <span class="text-xs">Заказы</span>
        <!-- <span
          v-if="cartCount > 0"
          class="absolute -right-1 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
        >
          {{ cartCount > 99 ? "99+" : cartCount }}
        </span> -->
      </NuxtLink>

      <NuxtLink to="/cooks" class="flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary">
        <Icon name="material-symbols:map-outline" class="size-6" />
        <span class="text-xs">Карта</span>
      </NuxtLink>

      <NuxtLink to="/profile" class="flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary">
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
