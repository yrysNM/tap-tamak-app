<template>
  <div class="flex min-h-screen bg-[#FFF8F3]">
    <aside
      class="hidden w-56 shrink-0 border-r border-[#E8E8E8] bg-white lg:block"
    >
      <div class="sticky top-0 flex flex-col gap-1 p-4">
        <NuxtLink
          to="/cook/dashboard"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#666666] transition-colors hover:bg-[#FFF8F3]"
          active-class="!bg-[#F47B20] !text-white"
        >
          <Icon name="material-symbols:dashboard-outline" class="size-6" />
          <span>Дашборд</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/orders"
          class="relative flex items-center gap-3 rounded-xl px-4 py-3 text-[#666666] transition-colors hover:bg-[#FFF8F3]"
          active-class="!bg-[#F47B20] !text-white"
        >
          <Icon name="material-symbols:receipt-long-outline" class="size-6" />
          <span>Заказы</span>
          <span
            v-if="newOrdersCount > 0"
            class="ml-auto flex size-5 items-center justify-center rounded-full bg-[#EF4444] text-xs font-semibold text-white"
          >
            {{ newOrdersCount > 99 ? '99+' : newOrdersCount }}
          </span>
        </NuxtLink>
        <NuxtLink
          to="/cook/menu"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#666666] transition-colors hover:bg-[#FFF8F3]"
          active-class="!bg-[#F47B20] !text-white"
        >
          <Icon name="material-symbols:restaurant-menu-outline" class="size-6" />
          <span>Меню</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/earnings"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#666666] transition-colors hover:bg-[#FFF8F3]"
          active-class="!bg-[#F47B20] !text-white"
        >
          <Icon name="material-symbols:payments-outline" class="size-6" />
          <span>Доход</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/profile"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-[#666666] transition-colors hover:bg-[#FFF8F3]"
          active-class="!bg-[#F47B20] !text-white"
        >
          <Icon name="material-symbols:person-outline" class="size-6" />
          <span>Профиль</span>
        </NuxtLink>
      </div>
    </aside>

    <div class="flex flex-1 flex-col">
      <header class="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8E8E8] bg-white px-4 py-3">
        <h1 class="text-lg font-semibold text-[#1A1A1A]">
          {{ pageTitle }}
        </h1>
        <div class="flex items-center gap-3">
          <span class="text-sm text-[#666666]">{{ cookName }}</span>
          <button
            type="button"
            role="switch"
            :aria-checked="isAvailable"
            :class="[
              'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47B20] focus-visible:ring-offset-2',
              isAvailable ? 'bg-[#22C55E]' : 'bg-[#E8E8E8]',
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
        </div>
      </header>

      <main class="flex-1 overflow-auto p-4">
        <slot />
      </main>

      <nav
        class="flex items-center justify-around border-t border-[#E8E8E8] bg-white py-2 lg:hidden"
      >
        <NuxtLink
          to="/cook/dashboard"
          class="flex flex-col items-center gap-0.5 px-3 py-1 text-[#666666]"
          active-class="!text-[#F47B20]"
        >
          <Icon name="material-symbols:dashboard-outline" class="size-6" />
          <span class="text-xs">Дашборд</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/orders"
          class="relative flex flex-col items-center gap-0.5 px-3 py-1 text-[#666666]"
          active-class="!text-[#F47B20]"
        >
          <Icon name="material-symbols:receipt-long-outline" class="size-6" />
          <span class="text-xs">Заказы</span>
          <span
            v-if="newOrdersCount > 0"
            class="absolute -right-0.5 -top-0.5 size-4 rounded-full bg-[#EF4444] text-[10px] font-semibold leading-4 text-white"
          >
            {{ newOrdersCount }}
          </span>
        </NuxtLink>
        <NuxtLink
          to="/cook/menu"
          class="flex flex-col items-center gap-0.5 px-3 py-1 text-[#666666]"
          active-class="!text-[#F47B20]"
        >
          <Icon name="material-symbols:restaurant-menu-outline" class="size-6" />
          <span class="text-xs">Меню</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/earnings"
          class="flex flex-col items-center gap-0.5 px-3 py-1 text-[#666666]"
          active-class="!text-[#F47B20]"
        >
          <Icon name="material-symbols:payments-outline" class="size-6" />
          <span class="text-xs">Доход</span>
        </NuxtLink>
        <NuxtLink
          to="/cook/profile"
          class="flex flex-col items-center gap-0.5 px-3 py-1 text-[#666666]"
          active-class="!text-[#F47B20]"
        >
          <Icon name="material-symbols:person-outline" class="size-6" />
          <span class="text-xs">Профиль</span>
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { $api } = useNuxtApp()

const cookName = ref('Повар')
const isAvailable = ref(true)
const newOrdersCount = ref(0)

const pageTitle = computed(() => {
  const path = route.path
  if (path.includes('/orders')) return 'Заказы'
  if (path.includes('/menu')) return 'Меню'
  if (path.includes('/earnings')) return 'Доход'
  if (path.includes('/profile')) return 'Профиль'
  return 'Дашборд'
})

async function toggleAvailability() {
  const next = !isAvailable.value
  try {
    await ($api as (url: string, opts: { method: string; body: { isAvailable: boolean } }) => Promise<void>)(
      '/cooks/me/availability',
      { method: 'PATCH', body: { isAvailable: next } }
    )
    isAvailable.value = next
  } catch {
    isAvailable.value = !next
  }
}

onMounted(() => {
  const authStore = useAuthStore()
  if (authStore.user?.cook?.businessName) {
    cookName.value = authStore.user.cook.businessName
  } else if (authStore.user?.firstName) {
    cookName.value = `${authStore.user.firstName}`
  }
})
</script>
