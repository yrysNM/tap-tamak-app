<script setup lang="ts">
import { apiMessage } from "~/utils/apiMessage";

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
  success: [];
}>();

const nuxtApp = useNuxtApp();
const api = nuxtApp.$api as (url: string, opts?: object) => Promise<unknown>;
const auth = useAuthStore();

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const error = ref("");
const submitting = ref(false);

function close() {
  emit("update:modelValue", false);
}

function resetForm() {
  currentPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  error.value = "";
}

async function submit() {
  error.value = "";

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    error.value = t("l_Fill_all_fields");
    return;
  }
  if (newPassword.value.length < 6) {
    error.value = t("l_Password_min_placeholder");
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = t("l_Passwords_do_not_match");
    return;
  }

  submitting.value = true;
  try {
    if (auth.refreshToken) {
      try {
        await auth.refreshAccessToken();
      } catch {
        // Keep going — $api will retry refresh on 401 if needed.
      }
    }

    await api("/auth/change-password", {
      method: "PATCH",
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
    });
    resetForm();
    close();
    emit("success");
  } catch (err) {
    const message = apiMessage(err, "l_Failed_change_password");
    if (message.toLowerCase().includes("user not found or inactive")) {
      auth.logout();
      await navigateTo("/login");
      return;
    }
    error.value = message;
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      resetForm();
    }
    if (typeof document !== "undefined") {
      document.body.style.overflow = open ? "hidden" : "";
    }
  },
);

onBeforeUnmount(() => {
  if (typeof document !== "undefined") document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-10000 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" @click="close" />
      <div class="safe-sheet relative w-full max-w-md rounded-t-3xl border border-border bg-white shadow-elevated sm:rounded-3xl">
        <header class="border-b border-border px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 id="change-password-title" class="text-lg font-bold text-dark">
                {{ t("l_Change_password") }}
              </h2>
              <p class="mt-1 text-xs text-muted">
                {{ t("l_Change_password_hint") }}
              </p>
            </div>
            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-xl text-caption transition hover:bg-surface-muted hover:text-dark"
              :aria-label="t('l_Close')"
              @click="close"
            >
              <Icon name="material-symbols:close-rounded" class="size-6" />
            </button>
          </div>
        </header>

        <form class="space-y-3 px-5 py-4" @submit.prevent="submit">
          <UiInput
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            :label="t('l_Current_password')"
            :placeholder="t('l_Password_placeholder')"
          />
          <UiInput
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            :label="t('l_New_password')"
            :placeholder="t('l_Password_min_placeholder')"
          />
          <UiInput
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            :label="t('l_Confirm_password')"
            :placeholder="t('l_Password_min_placeholder')"
          />

          <p v-if="error" class="text-sm text-error">{{ error }}</p>

          <div class="flex gap-2 pt-1">
            <button
              type="button"
              class="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-dark transition hover:bg-surface-muted/50"
              :disabled="submitting"
              @click="close"
            >
              {{ t("l_Cancel") }}
            </button>
            <button
              type="submit"
              class="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="submitting"
            >
              {{ submitting ? t("l_Saving") : t("l_Save") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
