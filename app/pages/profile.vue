<template>
  <div
    class="relative min-h-dvh bg-page-cream font-sans text-body"
    data-name="Профиль"
  >
    <!-- Sticky header -->
    <header
      class="sticky top-0 z-20 border-b border-black/6 bg-page-cream/92 px-4 pb-2.5 pt-3.5 backdrop-blur-[5px]"
    >
      <div class="mx-auto flex max-w-[390px] items-center gap-4">
        <h1 class="text-2xl font-bold leading-tight text-heading">Профиль</h1>
      </div>
    </header>

    <main class="mx-auto max-w-[390px] space-y-2.5 px-4 pt-6">
      <!-- Profile card -->
      <section
        class="rounded-2xl border border-soft-border bg-white p-[15px] shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
        data-name="Profile card"
      >
        <div class="flex items-center gap-3">
          <div
            class="relative size-16 shrink-0 overflow-hidden rounded-[18px] border border-black/8 bg-surface-muted"
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
            <p class="truncate text-lg font-bold text-body">
              {{ displayName }}
            </p>
            <p class="mt-1 truncate text-[12.5px] text-subtle">
              {{ contactLine }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-[14px] border border-primary/55 bg-white px-[13px] py-2 text-[12.9px] font-bold text-primary"
          >
            Изменить
          </button>
        </div>
        <p class="mt-2 text-[11px] leading-relaxed text-subtle">
          Здесь можно управлять адресами и языком интерфейса.
        </p>
      </section>

      <!-- Настройки: адреса + язык only -->
      <section
        class="rounded-2xl border border-soft-border bg-white p-[15px] shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
        data-name="Настройки"
      >
        <h2 class="mb-1.5 text-[15px] font-bold text-section">Настройки</h2>

        <NuxtLink
          to="#"
          class="flex items-center gap-3 border-b border-black/8 py-3 first:pt-0"
          @click.prevent
        >
          <div
            class="flex size-[34px] shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-primary/10"
          >
            <i class="fi fi-rr-marker text-[15px] text-primary" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[14.5px] font-bold text-body">Адреса доставки</p>
            <p class="mt-1 text-[11.3px] text-subtle">Дом, школа, другое…</p>
          </div>
          <i
            class="fi fi-rr-angle-small-right shrink-0 text-xl text-subtle/70"
          />
        </NuxtLink>

        <div class="flex items-center gap-3 pt-3">
          <div
            class="flex size-[34px] shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-primary/10"
          >
            <i class="fi fi-rr-world text-[15px] text-primary" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[14.5px] font-bold text-body">Язык</p>
            <p class="mt-1 text-[11.1px] text-subtle">Русский</p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-xl border border-soft-border bg-white px-[11px] py-2 text-[12.7px] font-bold text-body"
          >
            Сменить
          </button>
        </div>
      </section>

      <!-- Активность -->
      <section
        class="rounded-2xl border border-soft-border bg-white p-[15px] shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
        data-name="Активность"
      >
        <h2 class="mb-1.5 text-[15px] font-bold text-section">Активность</h2>

        <NuxtLink
          to="#"
          class="flex items-center gap-3 border-b border-black/8 pb-3 pt-0"
          @click.prevent
        >
          <div
            class="flex size-[34px] shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-primary/10"
          >
            <i class="fi fi-rr-shopping-bag text-[15px] text-primary" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[14.5px] font-bold text-body">Мои заказы</p>
            <p class="mt-1 text-[11.1px] text-subtle">История и статус</p>
          </div>
          <i
            class="fi fi-rr-angle-small-right shrink-0 text-xl text-subtle/70"
          />
        </NuxtLink>

        <NuxtLink to="#" class="flex items-center gap-3 pt-3" @click.prevent>
          <div
            class="flex size-[34px] shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-primary/10"
          >
            <i class="fi fi-rr-heart text-[15px] text-primary" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[14.5px] font-bold text-body">Избранное</p>
            <p class="mt-1 text-[11.3px] text-subtle">Любимые блюда и повара</p>
          </div>
          <i
            class="fi fi-rr-angle-small-right shrink-0 text-xl text-subtle/70"
          />
        </NuxtLink>
      </section>

      <!-- Помощь + выход внизу блока -->
      <section
        class="rounded-2xl border border-soft-border bg-white p-[15px] shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
        data-name="Помощь"
      >
        <h2 class="mb-1.5 text-[15px] font-bold text-section">Помощь</h2>

        <NuxtLink
          to="#"
          class="flex items-center gap-3 border-b border-black/8 pb-3 pt-0"
          @click.prevent
        >
          <div
            class="flex size-[34px] shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-primary/10"
          >
            <i class="fi fi-rr-headset text-[15px] text-primary" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[13.8px] font-bold text-body">Поддержка</p>
            <p class="mt-1 text-[11.1px] text-subtle">Чат, вопросы, помощь</p>
          </div>
          <i
            class="fi fi-rr-angle-small-right shrink-0 text-xl text-subtle/70"
          />
        </NuxtLink>

        <div class="flex items-center gap-3 border-t border-black/8 pt-3">
          <div
            class="flex size-[34px] shrink-0 items-center justify-center rounded-xl border border-danger-foreground/25 bg-danger-foreground/10"
            aria-hidden
          >
            <i class="fi fi-rr-sign-out text-[15px] text-danger-foreground" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[15px] font-bold text-danger-foreground">Выйти</p>
            <p class="mt-1 text-[11.3px] text-subtle">Завершить сеанс</p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-xl border border-danger-foreground/25 bg-danger-foreground/10 px-[11px] py-2 text-[13px] font-bold text-danger-foreground"
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
definePageMeta({
  layout: "default",
});

const router = useRouter();
const auth = useAuthStore();

const user = computed(() => auth.user);

const displayName = computed(() => {
  const u = user.value;
  if (!u) return "Гость";
  const last = u.lastName ? ` ${u.lastName.charAt(0)}.` : "";
  return `${u.firstName}${last}`.trim() || u.phone;
});

const contactLine = computed(() => {
  const u = user.value;
  if (!u) return "";
  return u.email ?? u.phone;
});

const initials = computed(() => {
  const u = user.value;
  if (!u) return "?";
  const parts = [u.firstName, u.lastName].filter(Boolean) as string[];
  const a = parts[0]?.[0];
  const b = parts[1]?.[0];
  if (a && b) {
    return `${a}${b}`.toUpperCase();
  }
  const name = u.firstName || u.phone || "?";
  return name.slice(0, 2).toUpperCase();
});

function goBack() {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
    return;
  }
  navigateTo("/");
}

async function onLogout() {
  auth.logout();
  await navigateTo("/login");
}
</script>
