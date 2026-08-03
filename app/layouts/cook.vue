<template>
  <div class="safe-x flex min-h-dvh bg-primary-light">
    <aside class="hidden w-56 shrink-0 border-r border-border bg-white lg:block">
      <div class="sticky top-0 flex flex-col gap-1 p-4">
        <NuxtLink to="/cook/dashboard"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-muted transition-colors hover:bg-primary-light"
          active-class="!bg-primary !text-white">
          <Icon name="material-symbols:dashboard-outline" class="size-6" />
          <span>{{ $t('l_Dashboard') }}</span>
        </NuxtLink>
        <NuxtLink to="/cook/orders"
          class="relative flex items-center gap-3 rounded-xl px-4 py-3 text-muted transition-colors hover:bg-primary-light"
          active-class="!bg-primary !text-white">
          <Icon name="material-symbols:receipt-long-outline" class="size-6" />
          <span>{{ $t('l_Orders') }}</span>
          <span v-if="newOrdersCount > 0"
            class="ml-auto flex size-5 items-center justify-center rounded-full bg-error text-xs font-semibold text-white">
            {{ newOrdersCount > 99 ? "99+" : newOrdersCount }}
          </span>
        </NuxtLink>
        <NuxtLink to="/cook/menu"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-muted transition-colors hover:bg-primary-light"
          active-class="!bg-primary !text-white">
          <Icon name="material-symbols:menu-book-2" class="size-6" />
          <span>{{ $t('l_Menu') }}</span>
        </NuxtLink>
        <NuxtLink to="/cook/earnings"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-muted transition-colors hover:bg-primary-light"
          active-class="!bg-primary !text-white">
          <Icon name="material-symbols:payments-outline" class="size-6" />
          <span>{{ $t('l_Earnings') }}</span>
        </NuxtLink>
        <NuxtLink to="/cook/profile"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-muted transition-colors hover:bg-primary-light"
          active-class="!bg-primary !text-white">
          <Icon name="material-symbols:person-outline" class="size-6" />
          <span>{{ $t('l_Profile') }}</span>
        </NuxtLink>
      </div>
    </aside>

    <div class="flex flex-1 flex-col">
      <header
        class="safe-app-header sticky top-0 z-100 flex items-center justify-between border-b border-border bg-white px-8! pb-3">
        <h1 class="text-lg font-semibold text-dark">
          {{ pageTitle }}
        </h1>
      </header>

      <main class="safe-pb-bottom-nav flex-1 overflow-auto p-4">
        <slot />
      </main>

      <nav
        class="safe-fixed-bottom-nav fixed bottom-0 z-100 flex w-full max-w-full items-center border-t border-border bg-white py-2 lg:hidden">
        <NuxtLink to="/cook/dashboard"
          class="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-muted"
          active-class="!text-primary">
          <Icon name="material-symbols:dashboard-outline" class="size-6" />
          <span class="text-xs">{{ $t('l_Dashboard') }}</span>
        </NuxtLink>
        <NuxtLink to="/cook/orders"
          class="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-muted"
          active-class="!text-primary">
          <Icon name="material-symbols:receipt-long-outline" class="size-6" />
          <span class="text-xs">{{ $t('l_Orders') }}</span>
          <span v-if="newOrdersCount > 0"
            class="absolute -right-0.5 -top-0.5 size-4 rounded-full bg-error text-[10px] font-semibold leading-4 text-white">
            {{ newOrdersCount }}
          </span>
        </NuxtLink>
        <NuxtLink to="/cook/menu"
          class="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-muted"
          active-class="!text-primary">
          <Icon name="material-symbols:menu-book-2" class="size-6" />
          <span class="text-xs">{{ $t('l_Menu') }}</span>
        </NuxtLink>
        <!-- <NuxtLink to="/cook/earnings"
          class="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-muted"
          active-class="!text-primary">
          <Icon name="material-symbols:payments-outline" class="size-6" />
          <span class="text-xs">{{ $t('l_Earnings') }}</span>
        </NuxtLink> -->
        <NuxtLink to="/cook/profile"
          class="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-muted"
          active-class="!text-primary">
          <Icon name="material-symbols:person-outline" class="size-6" />
          <span class="text-xs">{{ $t('l_Profile') }}</span>
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { $api } = useNuxtApp();
const { t } = useI18n();

const cookName = ref("");
const isAvailable = ref(true);
const newOrdersCount = ref(0);

const pageTitle = computed(() => {
  const path = route.path;
  if (path.includes("/verify")) return t("l_Verification_title");
  if (path.includes("/orders")) return t("l_Orders");
  if (path.includes("/menu")) return t("l_Menu");
  if (path.includes("/earnings")) return t("l_Earnings");
  if (path.includes("/profile")) return t("l_Profile");
  return t("l_Dashboard");
});

async function toggleAvailability() {
  const next = !isAvailable.value;
  try {
    await (
      $api as (
        url: string,
        opts: { method: string; body: { isAvailable: boolean } },
      ) => Promise<void>
    )("/cooks/me/availability", {
      method: "PATCH",
      body: { isAvailable: next },
    });
    isAvailable.value = next;
  } catch {
    isAvailable.value = !next;
  }
}

onMounted(() => {
  const authStore = useAuthStore();
  const user = authStore.user;
  const cookBusinessName = (
    user as { cook?: { businessName?: string } } | null | undefined
  )?.cook?.businessName;

  if (cookBusinessName) {
    cookName.value = cookBusinessName;
  } else if (user?.firstName) {
    cookName.value = user.firstName;
  } else {
    cookName.value = t("l_Cook");
  }
});
</script>
