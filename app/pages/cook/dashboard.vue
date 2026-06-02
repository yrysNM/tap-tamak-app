<template>
  <div class="p-4 pb-8">
    <header class="mb-5">
      <h1 class="text-xl font-bold text-dark">{{ $t('l_Cook_dashboard_title') }}</h1>
      <p class="mt-1 text-sm text-muted">
        {{ $t('l_Cook_welcome', { name: auth.user?.firstName ?? '' }) }}
      </p>
    </header>

    <div v-if="pending" class="rounded-xl bg-white p-6 text-center text-sm text-muted shadow-card">
      {{ $t('l_Loading_stats') }}
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-error/20 bg-white p-6 text-center text-sm text-error shadow-card"
    >
      <p>{{ $t('l_Failed_load_stats') }}</p>
      <button
        type="button"
        class="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
        @click="refresh()"
      >
        {{ $t('l_Retry') }}
      </button>
    </div>

    <template v-else-if="stats">
      <div
        class="mb-4 flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 shadow-card"
      >
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-muted">
            {{ $t('l_Kitchen_status') }}
          </p>
          <p class="mt-0.5 text-sm font-semibold text-dark">
            {{
              stats.isActiveNow
                ? $t('l_Schedule_active_now')
                : $t('l_Schedule_inactive_now')
            }}
          </p>
        </div>
        <span
          class="size-3 shrink-0 rounded-full"
          :class="stats.isActiveNow ? 'bg-primary' : 'bg-muted/40'"
          aria-hidden="true"
        />
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <UiCard
          v-for="card in statCards"
          :key="card.key"
          padding="sm"
          class="flex flex-col gap-1"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-xs text-muted">{{ card.label }}</p>
            <Icon :name="card.icon" class="size-5 shrink-0 text-primary/80" />
          </div>
          <p class="text-lg font-bold leading-tight text-dark">{{ card.value }}</p>
          <p v-if="card.hint" class="text-[11px] leading-snug text-muted">{{ card.hint }}</p>
        </UiCard>
      </div>

      <section class="mt-6">
        <h2 class="mb-3 text-sm font-semibold text-dark">{{ $t('l_Quick_actions') }}</h2>
        <div class="grid gap-2 sm:grid-cols-2">
          <NuxtLink
            to="/cook/orders"
            class="flex items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 no-underline shadow-card transition hover:border-primary/30"
          >
            <Icon name="material-symbols:receipt-long-outline" class="size-6 text-primary" />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-dark">{{ $t('l_Orders') }}</p>
              <p class="text-xs text-muted">
                {{
                  stats.pendingOrders > 0
                    ? $t('l_Pending_orders_count', { count: stats.pendingOrders })
                    : $t('l_No_orders_in_progress')
                }}
              </p>
            </div>
          </NuxtLink>
          <NuxtLink
            to="/cook/menu"
            class="flex items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 no-underline shadow-card transition hover:border-primary/30"
          >
            <Icon name="material-symbols:menu-book-2" class="size-6 text-primary" />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-dark">{{ $t('l_Menu') }}</p>
              <p class="text-xs text-muted">
                {{ $t('l_Dishes_in_menu', { count: stats.menuDishesToday }) }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'
import { fetchCookDashboardStats, type CookDashboardStats } from '~/utils/cookStatsApi'

const auth = useAuthStore()
const { t, locale } = useI18n()
const { $api } = useNuxtApp()
const api = $api as (url: string, opts?: object) => Promise<unknown>

const {
  data: stats,
  pending,
  error,
  refresh,
} = await useAsyncData<CookDashboardStats | null>(
  'cook-dashboard-stats',
  async () => await fetchCookDashboardStats(api),
  { default: () => null },
)

function formatMoney(kzt: number): string {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
  }).format(kzt)
}

function formatRating(value: number): string {
  return value > 0 ? value.toFixed(1) : '—'
}

const statCards = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    {
      key: 'ordersToday',
      label: t('l_Stats_orders_today'),
      value: String(s.ordersToday),
      icon: 'material-symbols:shopping-bag-outline',
      hint: undefined,
    },
    {
      key: 'pending',
      label: t('l_Stats_pending_orders'),
      value: String(s.pendingOrders),
      icon: 'material-symbols:pending-actions',
      hint: undefined,
    },
    {
      key: 'revenueToday',
      label: t('l_Stats_revenue_today'),
      value: formatMoney(s.revenueToday),
      icon: 'material-symbols:payments-outline',
      hint: undefined,
    },
    {
      key: 'commissionToday',
      label: t('l_Stats_commission_today'),
      value: formatMoney(s.commissionToday),
      icon: 'material-symbols:percent',
      hint: undefined,
    },
    {
      key: 'netPayoutToday',
      label: t('l_Stats_net_payout_today'),
      value: formatMoney(s.netPayoutToday),
      icon: 'material-symbols:account-balance-wallet-outline',
      hint: undefined,
    },
    {
      key: 'revenueTotal',
      label: t('l_Stats_revenue_total'),
      value: formatMoney(s.revenueTotal),
      icon: 'material-symbols:monitoring',
      hint: undefined,
    },
    {
      key: 'commissionTotal',
      label: t('l_Stats_commission_total'),
      value: formatMoney(s.commissionTotal),
      icon: 'material-symbols:savings-outline',
      hint: undefined,
    },
    {
      key: 'netPayoutTotal',
      label: t('l_Stats_net_payout_total'),
      value: formatMoney(s.netPayoutTotal),
      icon: 'material-symbols:wallet-outline',
      hint: undefined,
    },
    {
      key: 'dishes',
      label: t('l_Stats_catalog_dishes'),
      value: String(s.countDishes),
      icon: 'material-symbols:restaurant-outline',
      hint: t('l_Dishes_in_menu', { count: s.menuDishesToday }),
    },
    {
      key: 'rating',
      label: t('l_Stats_rating'),
      value: formatRating(s.rating),
      icon: 'material-symbols:star-outline',
      hint:
        s.totalReviews > 0
          ? t('l_Stats_reviews_count', { count: s.totalReviews })
          : t('l_Stats_no_reviews'),
    },
  ]
})
</script>
