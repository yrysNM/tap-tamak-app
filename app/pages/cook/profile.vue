<template>
  <div class="w-auto space-y-4 mb-8">
    <section class="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div class="flex items-start gap-4 flex-wrap">
        <div
          class="relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface-muted">
          <img v-if="avatarSrc" :src="avatarSrc" :alt="displayName" class="size-full object-cover" />
          <div v-else class="flex size-full items-center justify-center bg-primary text-lg font-bold text-white">
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
        <div class="shrink-0 space-y-2">
          <input ref="avatarInputRef" type="file" class="hidden" accept="image/png,image/jpeg,image/webp"
            @change="onPickAvatar" />
          <button type="button"
            class="block w-full rounded-xl border border-primary/35 bg-white px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="uploadingAvatar" @click="onClickChangePhoto">
            {{ uploadingAvatar ? t("l_Loading") : t("l_Change") }}
          </button>
          <!-- <button type="button"
            class="block w-full rounded-xl border border-primary/35 bg-white px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-light"
            @click="goToGeneralProfile">
            Изменить
          </button> -->
        </div>
      </div>
      <p v-if="avatarError" class="mt-3 text-xs text-error">{{ avatarError }}</p>
      <p v-else-if="profileError" class="mt-3 text-xs text-error">{{ profileError }}</p>
    </section>

    <section class="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
        {{ t("l_Cook_profile_section") }}
      </h2>

      <div class="mt-4 divide-y divide-border">
        <div class="flex items-center justify-between gap-3 py-3 first:pt-0">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-dark">{{ $t("l_Avg_cook_time") }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ $t("l_Shown_to_clients") }}</p>
          </div>
          <p class="shrink-0 text-sm font-semibold text-dark">
            {{ avgCookTimeLabel }}
          </p>
        </div>

        <!-- <div class="flex items-center justify-between gap-3 py-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-dark">{{ $t("l_Delivery_radius") }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ $t("l_Max_zone") }}</p>
          </div>
          <p class="shrink-0 text-sm font-semibold text-dark">
            {{ radiusLabel }}
          </p>
        </div> -->

        <!-- <div class="flex items-center justify-between gap-3 py-3 last:pb-0">
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
        </div> -->
        <div class="flex items-center justify-between gap-3 py-3 last:pb-0">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-dark">{{ $t("l_Total_dishes") }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ $t("l_In_your_menu") }}</p>
          </div>
          <p class="shrink-0 text-sm font-semibold text-dark">{{ dishesCountLabel }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
        {{ t("l_Account") }}
      </h2>

      <div class="mt-4 space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-dark">{{ t("l_Phone") }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ phoneLabel }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3 border-t border-border pt-4">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-dark">{{ t("l_Password") }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ t("l_Change_password_hint") }}</p>
          </div>
          <button type="button"
            class="shrink-0 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-dark transition hover:bg-surface-muted/50"
            @click="changePasswordOpen = true">
            {{ t("l_Change") }}
          </button>
        </div>

        <div class="flex items-center justify-between gap-3 border-t border-border pt-4">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-dark">{{ t("l_Language") }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ currentLocaleName }}</p>
          </div>
          <button type="button"
            class="shrink-0 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-dark transition hover:bg-surface-muted/50"
            @click="languagePickerOpen = true">
            {{ t("l_Switch") }}
          </button>
        </div>

        <button type="button"
          class="w-full rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm font-semibold text-error transition hover:bg-error/10"
          @click="deleteAccountOpen = true">
          {{ t("l_Delete_account") }}
        </button>

        <button type="button"
          class="w-full rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm font-semibold text-error transition hover:bg-error/10"
          @click="onLogout">
          {{ t("l_Log_out") }}
        </button>
      </div>
    </section>

    <UiLanguagePickerModal v-model="languagePickerOpen" />
    <UiChangePasswordModal v-model="changePasswordOpen" @success="onPasswordChanged" />
    <UiDeleteAccountModal v-model="deleteAccountOpen" @success="onAccountDeleted" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { currentLocaleName } = useLocaleDisplayName()
const toast = usePageToast()

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
  profileImageUrl?: string;
};

const auth = useAuthStore();
const config = useRuntimeConfig();
const nuxtApp = useNuxtApp();
const api = nuxtApp.$api as (url: string, opts?: object) => Promise<unknown>;

const wsUrl = config.public.wsUrl;
const cookProfile = ref<AuthCook | null>(null);
const profileError = ref("");
const avatarError = ref("");
const uploadingAvatar = ref(false);
const avatarInputRef = ref<HTMLInputElement | null>(null);
const languagePickerOpen = ref(false);
const changePasswordOpen = ref(false);
const deleteAccountOpen = ref(false);

const user = computed(() => auth.user);
const cook = computed(
  () =>
    cookProfile.value ??
    ((auth.user as (typeof auth.user & { cook?: AuthCook }) | null)?.cook ?? null),
);
const avatarSrc = computed(
  () => `${wsUrl}${cook.value?.profileImageUrl || user.value?.avatarUrl || ""}`,
);

const displayName = computed(() => {
  const first = user.value?.firstName?.trim() ?? "";
  const last = user.value?.lastName?.trim() ?? "";
  return `${first} ${last}`.trim() || t("l_No_name");
});

const initials = computed(() => {
  const first = user.value?.firstName?.trim()?.[0] ?? "";
  const last = user.value?.lastName?.trim()?.[0] ?? "";
  const value = `${first}${last}`.toUpperCase();
  return value || t("l_Initial_fallback");
});

const kitchenName = computed(
  () =>
    cook.value?.businessName?.trim() ||
    t("l_Homemade_kitchen", { name: user.value?.firstName ?? "" }).trim(),
);
const contactLine = computed(
  () => user.value?.email || user.value?.phone || t("l_Contact_not_set"),
);
const phoneLabel = computed(() => user.value?.phone || "+7 (___) ___-__-__");
const avgCookTimeLabel = computed(
  () => t("l_Cooking_time_single", { min: cook.value?.preparationTimeMin ?? 45 }),
);
const radiusLabel = computed(() =>
  t("l_Radius_km", { km: cook.value?.deliveryRadius ?? 4 }),
);
const dishesCountLabel = computed(() => String(cook.value?.menuItemsCount ?? 0));
const specialtiesLabel = computed(() =>
  (cook.value?.specialties?.length
    ? cook.value.specialties
    : ["Домашняя", "Итальянская"]
  ).join(", "),
);

onMounted(async () => {
  await loadCookProfile();
});

async function loadCookProfile() {
  profileError.value = "";
  try {
    const raw = await api("/cooks/me/informations", { method: "GET" });
    const envelope = raw as { data?: unknown };
    const payload = (
      (envelope?.data as { data?: unknown } | undefined)?.data ??
      envelope?.data ??
      raw
    ) as Record<string, unknown>;
    cookProfile.value = {
      businessName:
        typeof payload.businessName === "string" ? payload.businessName : undefined,
      preparationTimeMin:
        typeof payload.avgTimeCooking === "number"
          ? payload.avgTimeCooking.toFixed(2)
          : undefined,
      menuItemsCount:
        typeof payload.countDishes === "number"
          ? payload.countDishes
          : undefined,
      profileImageUrl:
        typeof payload.image === "string"
          ? payload.image
          : undefined,
    };
  } catch (err) {
    profileError.value = apiMessage(err, 'l_Failed_load_cook_profile');
  }
}

function goToGeneralProfile() {
  navigateTo("/profile");
}

function onClickChangePhoto() {
  avatarInputRef.value?.click();
}

async function onPickAvatar(event: Event) {
  avatarError.value = "";
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return;

  uploadingAvatar.value = true;
  try {
    const form = new FormData();
    form.append("image", file);
    const raw = await api("/cooks/me/profile-image", {
      method: "PATCH",
      body: form,
    });
    const envelope = raw as { data?: unknown };
    const payload = (
      (envelope?.data as { data?: unknown } | undefined)?.data ??
      envelope?.data ??
      raw
    ) as Record<string, unknown>;
    const nextImage =
      typeof payload.profileImageUrl === "string"
        ? payload.profileImageUrl
        : typeof payload.avatarUrl === "string"
          ? payload.avatarUrl
          : undefined;
    if (nextImage) {
      cookProfile.value = { ...(cookProfile.value ?? {}), profileImageUrl: nextImage };
    } else {
      await loadCookProfile();
    }
  } catch (err) {
    avatarError.value = apiMessage(err, 'l_Failed_update_avatar');
  } finally {
    uploadingAvatar.value = false;
    if (input) input.value = "";
  }
}

async function onLogout() {
  auth.logout();
  await navigateTo("/login");
}

async function onPasswordChanged() {
  toast.show(t("l_Password_changed"), "success");
  auth.logout();
  await navigateTo("/login");
}

async function onAccountDeleted() {
  auth.logout();
  await navigateTo("/login");
  toast.show(t("l_Account_deleted"), "success");
}
</script>
