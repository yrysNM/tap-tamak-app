<template>
  <div class="w-auto space-y-4">
    <section class="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div class="flex items-start gap-4 flex-wrap">
        <div
          class="relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface-muted"
        >
          <img
            v-if="user?.avatarUrl"
            :src="user.avatarUrl"
            :alt="displayName"
            class="size-full object-cover"
          />
          <div
            v-else
            class="flex size-full items-center justify-center bg-primary text-lg font-bold text-white"
          >
            {{ initials }}
          </div>
        </div>

        <div class="min-w-0 pt-0.5">
          <p class="truncate text-base font-semibold text-dark">
            {{ displayName }}
          </p>
          <p class="mt-1 truncate text-sm text-muted">
            {{ kitchenName }}
          </p>
          <p class="mt-0.5 truncate text-xs text-caption">
            {{ contactLine }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-xl border border-primary/35 bg-white px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-light"
          @click="goToGeneralProfile"
        >
          Изменить
        </button>
      </div>
    </section>

    <section class="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
        Повар
      </h2>

      <div class="mt-4 divide-y divide-border">
        <div class="flex items-center justify-between gap-3 py-3 first:pt-0">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-dark">Среднее время готовки</p>
            <p class="mt-0.5 text-xs text-muted">Показывается клиентам</p>
          </div>
          <p class="shrink-0 text-sm font-semibold text-dark">
            {{ avgCookTimeLabel }}
          </p>
        </div>

        <div class="flex items-center justify-between gap-3 py-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-dark">Радиус доставки</p>
            <p class="mt-0.5 text-xs text-muted">Максимальная зона</p>
          </div>
          <p class="shrink-0 text-sm font-semibold text-dark">
            {{ radiusLabel }}
          </p>
        </div>

        <div class="flex items-center justify-between gap-3 py-3 last:pb-0">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-dark">Специализация</p>
            <p class="mt-0.5 truncate text-xs text-muted">
              {{ specialtiesLabel }}
            </p>
          </div>
          <Icon
            name="material-symbols:chevron-right-rounded"
            class="size-6 shrink-0 text-muted"
          />
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
        Аккаунт
      </h2>

      <div class="mt-4 space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-dark">Телефон</p>
            <p class="mt-0.5 text-xs text-muted">{{ phoneLabel }}</p>
          </div>
        </div>

        <button
          type="button"
          class="w-full rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm font-semibold text-error transition hover:bg-error/10"
          @click="onLogout"
        >
          Выйти
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "cook" });

type AuthCook = {
  businessName?: string;
  bio?: string;
  specialties?: string[];
  kitchenPhotoUrls?: string[];
  preparationTimeMin?: number;
  deliveryRadius?: number;
  kitchenAddress?: string;
  menuItemsCount?: number;
  city?: string;
};

const auth = useAuthStore();

const user = computed(() => auth.user);
const cook = computed(
  () => (auth.user as (typeof auth.user & { cook?: AuthCook }) | null)?.cook,
);

const displayName = computed(() => {
  const first = user.value?.firstName?.trim() ?? "";
  const last = user.value?.lastName?.trim() ?? "";
  return `${first} ${last}`.trim() || "Без имени";
});

const initials = computed(() => {
  const first = user.value?.firstName?.trim()?.[0] ?? "";
  const last = user.value?.lastName?.trim()?.[0] ?? "";
  const value = `${first}${last}`.toUpperCase();
  return value || "П";
});

const kitchenName = computed(
  () =>
    cook.value?.businessName?.trim() ||
    `Домашняя кухня ${user.value?.firstName ?? ""}`.trim(),
);
const contactLine = computed(
  () => user.value?.email || user.value?.phone || "Контакт не указан",
);
const phoneLabel = computed(() => user.value?.phone || "+7 (___) ___-__-__");
const avgCookTimeLabel = computed(
  () => `${cook.value?.preparationTimeMin ?? 45} мин`,
);
const radiusLabel = computed(() => `${cook.value?.deliveryRadius ?? 4} км`);
const specialtiesLabel = computed(() =>
  (cook.value?.specialties?.length
    ? cook.value.specialties
    : ["Домашняя", "Итальянская"]
  ).join(", "),
);

function goToGeneralProfile() {
  navigateTo("/profile");
}

async function onLogout() {
  auth.logout();
  await navigateTo("/login");
}
</script>
