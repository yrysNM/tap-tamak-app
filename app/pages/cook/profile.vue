<template>
  <div class="relative min-h-dvh bg-page-cream font-sans text-body">
    <header
      class="sticky top-0 z-20 border-b border-black/6 bg-page-cream/92 px-4 pb-2.5 pt-3.5 backdrop-blur-[5px]"
    >
      <div class="mx-auto flex max-w-[390px] items-center gap-4">
        <h1 class="text-2xl font-bold leading-tight text-heading">Профиль повара</h1>
      </div>
    </header>

    <main class="mx-auto max-w-[390px] space-y-2.5 px-4 pb-6 pt-6">
      <section
        class="rounded-2xl border border-soft-border bg-white p-[15px] shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
      >
        <div class="flex items-center gap-3">
          <div
            class="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-black/8 bg-surface-muted"
          >
            <img
              v-if="user?.avatarUrl"
              :src="user.avatarUrl"
              :alt="displayName"
              class="size-full object-cover"
            />
            <div
              v-else
              class="flex size-full items-center justify-center bg-primary/90 text-lg font-bold text-white"
            >
              {{ initials }}
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <p class="truncate text-lg font-bold text-body">{{ displayName }}</p>
            <p class="mt-1 truncate text-[12.5px] text-subtle">{{ kitchenName }}</p>
            <p class="mt-1 truncate text-[11.3px] text-subtle">{{ contactLine }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-[14px] border border-primary/55 bg-white px-[13px] py-2 text-[12.9px] font-bold text-primary"
            @click="goToGeneralProfile"
          >
            Изменить
          </button>
        </div>
      </section>

      <section
        class="rounded-2xl border border-soft-border bg-white p-[15px] shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
      >
        <h2 class="mb-1.5 text-[15px] font-bold text-section">Повар</h2>

        <div class="space-y-3 pt-1">
          <div class="flex items-center justify-between gap-3 border-b border-black/8 pb-3">
            <div class="min-w-0">
              <p class="text-[14.5px] font-bold text-body">Среднее время готовки</p>
              <p class="mt-1 text-[11.3px] text-subtle">Показывается клиентам</p>
            </div>
            <p class="shrink-0 text-[13px] font-bold text-body">{{ avgCookTimeLabel }}</p>
          </div>

          <div class="flex items-center justify-between gap-3 border-b border-black/8 pb-3">
            <div class="min-w-0">
              <p class="text-[14.5px] font-bold text-body">Радиус доставки</p>
              <p class="mt-1 text-[11.3px] text-subtle">Максимальная зона</p>
            </div>
            <p class="shrink-0 text-[13px] font-bold text-body">{{ radiusLabel }}</p>
          </div>

          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[14.5px] font-bold text-body">Специализация</p>
              <p class="mt-1 truncate text-[11.3px] text-subtle">
                {{ specialtiesLabel }}
              </p>
            </div>
            <Icon
              name="material-symbols:chevron-right-rounded"
              class="size-6 shrink-0 text-subtle/70"
            />
          </div>
        </div>
      </section>

      <section
        class="rounded-2xl border border-soft-border bg-white p-[15px] shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
      >
        <h2 class="mb-1.5 text-[15px] font-bold text-section">Аккаунт</h2>

        <div class="space-y-3 pt-1">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[14.5px] font-bold text-body">Телефон</p>
              <p class="mt-1 text-[11.3px] text-subtle">{{ phoneLabel }}</p>
            </div>
          </div>

          <button
            type="button"
            class="mt-1 w-full rounded-xl border border-danger-foreground/25 bg-danger-foreground/10 px-3 py-2.5 text-[13px] font-bold text-danger-foreground"
            @click="onLogout"
          >
            Выйти
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'

definePageMeta({ layout: 'cook' })

type AuthCook = {
  businessName?: string
  bio?: string
  specialties?: string[]
  kitchenPhotoUrls?: string[]
  preparationTimeMin?: number
  deliveryRadius?: number
  kitchenAddress?: string
  menuItemsCount?: number
  city?: string
}

const auth = useAuthStore()

const user = computed(() => auth.user)
const cook = computed(() => (auth.user as (typeof auth.user & { cook?: AuthCook }) | null)?.cook)

const displayName = computed(() => {
  const first = user.value?.firstName?.trim() ?? ''
  const last = user.value?.lastName?.trim() ?? ''
  return `${first} ${last}`.trim() || 'Без имени'
})

const initials = computed(() => {
  const first = user.value?.firstName?.trim()?.[0] ?? ''
  const last = user.value?.lastName?.trim()?.[0] ?? ''
  const value = `${first}${last}`.toUpperCase()
  return value || 'П'
})

const kitchenName = computed(
  () => cook.value?.businessName?.trim() || `Домашняя кухня ${user.value?.firstName ?? ''}`.trim()
)
const contactLine = computed(() => user.value?.email || user.value?.phone || 'Контакт не указан')
const phoneLabel = computed(() => user.value?.phone || '+7 (___) ___-__-__')
const avgCookTimeLabel = computed(() => `${cook.value?.preparationTimeMin ?? 45} мин`)
const radiusLabel = computed(() => `${cook.value?.deliveryRadius ?? 4} км`)
const specialtiesLabel = computed(() =>
  (cook.value?.specialties?.length ? cook.value.specialties : ['Домашняя', 'Итальянская']).join(
    ', '
  )
)

function goToGeneralProfile() {
  navigateTo('/profile')
}

async function onLogout() {
  auth.logout()
  await navigateTo('/login')
}
</script>
