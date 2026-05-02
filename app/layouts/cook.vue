<template>
  <div class="flex min-h-screen bg-primary-light">
    <aside
      class="hidden w-56 shrink-0 border-r border-border bg-white lg:block"
    >
      <div class="sticky top-0 flex flex-col gap-1 p-4">
        <NuxtLink
          to="/cook/dashboard"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-muted transition-colors hover:bg-primary-light"
          active-class="!bg-primary !text-white"
        >
          <Icon name="material-symbols:dashboard-outline" class="size-6" />
          <span>Дашборд</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/orders"
          class="relative flex items-center gap-3 rounded-xl px-4 py-3 text-muted transition-colors hover:bg-primary-light"
          active-class="!bg-primary !text-white"
        >
          <Icon name="material-symbols:receipt-long-outline" class="size-6" />
          <span>Заказы</span>
          <span
            v-if="newOrdersCount > 0"
            class="ml-auto flex size-5 items-center justify-center rounded-full bg-error text-xs font-semibold text-white"
          >
            {{ newOrdersCount > 99 ? "99+" : newOrdersCount }}
          </span>
        </NuxtLink>
        <NuxtLink
          to="/cook/menu"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-muted transition-colors hover:bg-primary-light"
          active-class="!bg-primary !text-white"
        >
          <Icon name="material-symbols:menu-book-2" class="size-6" />
          <span>Меню</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/earnings"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-muted transition-colors hover:bg-primary-light"
          active-class="!bg-primary !text-white"
        >
          <Icon name="material-symbols:payments-outline" class="size-6" />
          <span>Доход</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/profile"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-muted transition-colors hover:bg-primary-light"
          active-class="!bg-primary !text-white"
        >
          <Icon name="material-symbols:person-outline" class="size-6" />
          <span>Профиль</span>
        </NuxtLink>
      </div>
    </aside>

    <div class="flex flex-1 flex-col">
      <header
        class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-4 py-3"
      >
        <h1 class="text-lg font-semibold text-dark">
          {{ pageTitle }}
        </h1>
        <!-- <div class="flex items-center gap-3">
          <span class="text-sm text-muted">{{ cookName }}</span>
          <button
            type="button"
            role="switch"
            :aria-checked="isAvailable"
            :class="[
              'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isAvailable ? 'bg-success' : 'bg-border',
            ]"
            @click="toggleAvailability"
          >
            <span
              :class="[
                'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition',
                isAvailable ? 'translate-x-6' : 'translate-x-1',
              ]"
            />
          </button>
        </div> -->
      </header>

      <main class="flex-1 overflow-auto p-4">
        <slot />
      </main>

      <nav
        class="flex w-full max-w-full items-center border-t border-border bg-white py-2 lg:hidden"
      >
        <NuxtLink
          to="/cook/dashboard"
          class="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-muted"
          active-class="!text-primary"
        >
          <Icon name="material-symbols:dashboard-outline" class="size-6" />
          <span class="text-xs">Дашборд</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/orders"
          class="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-muted"
          active-class="!text-primary"
        >
          <Icon name="material-symbols:receipt-long-outline" class="size-6" />
          <span class="text-xs">Заказы</span>
          <span
            v-if="newOrdersCount > 0"
            class="absolute -right-0.5 -top-0.5 size-4 rounded-full bg-error text-[10px] font-semibold leading-4 text-white"
          >
            {{ newOrdersCount }}
          </span>
        </NuxtLink>
        <NuxtLink
          to="/cook/menu"
          class="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-muted"
          active-class="!text-primary"
        >
          <Icon name="material-symbols:menu-book-2" class="size-6" />
          <span class="text-xs">Меню</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/earnings"
          class="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-muted"
          active-class="!text-primary"
        >
          <Icon name="material-symbols:payments-outline" class="size-6" />
          <span class="text-xs">Доход</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/profile"
          class="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-muted"
          active-class="!text-primary"
        >
          <Icon name="material-symbols:person-outline" class="size-6" />
          <span class="text-xs">Профиль</span>
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { $api } = useNuxtApp();

const cookName = ref("Повар");
const isAvailable = ref(true);
const newOrdersCount = ref(0);

const pageTitle = computed(() => {
  const path = route.path;
  if (path.includes("/verify")) return "Верификация";
  if (path.includes("/orders")) return "Заказы";
  if (path.includes("/menu")) return "Меню";
  if (path.includes("/earnings")) return "Доход";
  if (path.includes("/profile")) return "Профиль";
  return "Дашборд";
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
  }
});
</script>
