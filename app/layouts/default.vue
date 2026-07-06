<template>
  <div class="safe-x flex min-h-dvh flex-col bg-page-cream">
    <header
      class="sticky top-0 z-100 flex items-center justify-between border-b border-border bg-primary-light px-4 pb-3 pt-[calc(var(--safe-area-top)+0.75rem)]">
      <NuxtLink to="/" class="flex items-center gap-1.5 text-xl font-semibold text-primary">
        <span>TapTamaq</span>
      </NuxtLink>
      <div class="flex items-center gap-3" />
    </header>

    <main class="min-h-0 flex-1 overflow-auto pb-10" :class="showBottomNav ? 'safe-pb-bottom-nav' : 'safe-b'">
      <slot />
    </main>

    <nav v-if="showBottomNav"
      class="safe-fixed-bottom-nav fixed bottom-0 left-0 w-full z-100 flex items-center justify-around border-t border-border bg-white py-2 shadow-bottom">
      <NuxtLink to="/" class="flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary">
        <Icon name="material-symbols:home-outline" class="size-6" />
        <span class="text-xs">{{ $t('l_Home') }}</span>
      </NuxtLink>

      <NuxtLink to="/orders" class="relative flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary">
        <Icon name="material-symbols:receipt-long-outline" class="size-6" />
        <span class="text-xs">{{ $t('l_Orders') }}</span>
      </NuxtLink>

      <NuxtLink to="/cooks" class="flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary">
        <Icon name="material-symbols:map-outline" class="size-6" />
        <span class="text-xs">{{ $t('l_Map') }}</span>
      </NuxtLink>

      <NuxtLink to="/profile" class="flex flex-col items-center gap-0.5 px-4 py-1 text-muted transition-colors"
        active-class="!text-primary">
        <Icon name="material-symbols:person-outline" class="size-6" />
        <span class="text-xs">{{ $t('l_Profile') }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from "../stores/cart";

const cartStore = useCartStore();
const route = useRoute();
const auth = useAuthStore();

onMounted(() => {
  if (auth.isAuthenticated) {
    useModerationStore().refreshBlocks().catch(() => undefined);
  }
});

const cartCount = computed(() => cartStore.totalItems);
const showBottomNav = computed(() => !route.meta.hideBottomNav);
</script>
