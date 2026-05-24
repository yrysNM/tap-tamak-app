<template>
  <div>
    <div class="mb-4">
      <button type="button" class="text-sm font-medium text-primary" @click="navigateTo('/login')">
        {{ t("l_Back_to_login") }}
      </button>
    </div>

    <div class="mb-6 text-center">
      <div class="text-4xl">🍳</div>
      <div class="mt-2 text-2xl font-bold text-primary">TapTamaq</div>
    </div>

    <div class="space-y-6 rounded-2xl bg-white p-6 shadow-card md:p-8">
      <div v-if="state === 'request'" class="space-y-6">
        <div class="space-y-1 text-center">
          <h1 class="text-lg font-semibold text-dark">{{ t("l_Reset_password") }}</h1>
          <p class="text-sm text-muted">
            {{ t("l_Reset_password_hint") }}
          </p>
        </div>

        <UiInput
          :label="t('l_Phone_or_email')"
          :placeholder="t('l_Phone_or_email_placeholder')"
          v-model="values.identifier"
          :error="errors.identifier"
        />

        <div class="space-y-3">
          <UiButton variant="primary" fullWidth :loading="isSubmitting" :disabled="isSubmitting" @click="onSubmit">
            {{ t("l_Send_reset_link") }}
          </UiButton>

          <p v-if="apiError" class="text-center text-sm text-red-500">
            {{ apiError }}
          </p>
        </div>
      </div>

      <div v-else class="space-y-6 text-center">
        <div class="flex justify-center">
          <div class="flex size-16 items-center justify-center rounded-full bg-primary-light text-3xl text-success">
            ✅
          </div>
        </div>

        <div class="space-y-1">
          <h1 class="text-lg font-semibold text-dark">{{ t("l_Check_messages") }}</h1>
          <p class="text-sm text-muted">
            {{ t("l_Reset_link_sent") }}
            <span class="font-medium text-dark">{{ lastIdentifier }}</span>.
          </p>
        </div>

        <div class="space-y-3">
          <UiButton variant="primary" fullWidth @click="navigateTo('/login')">
            {{ t("l_Back_to_login") }}
          </UiButton>

          <div class="text-sm text-muted">
            <p>{{ t("l_Didnt_receive") }}</p>
            <button
              v-if="resendCooldown === 0"
              type="button"
              class="mt-1 font-medium text-primary"
              :disabled="isSubmitting"
              @click="onResend"
            >
              {{ t("l_Resend") }}
            </button>
            <p v-else class="mt-1">{{ t("l_Resend_in", { seconds: resendCooldown }) }}</p>
          </div>

          <p v-if="apiError" class="text-center text-sm text-red-500">
            {{ apiError }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

const { t } = useI18n();

const forgotSchema = computed(() =>
  toTypedSchema(
    z.object({
      identifier: z.string().min(1, t("l_Phone_or_email_required")),
    }),
  ),
);

const { handleSubmit, errors, values, isSubmitting } = useForm({
  validationSchema: forgotSchema,
  initialValues: {
    identifier: "",
  },
});

type State = "request" | "sent";

const state = ref<State>("request");
const lastIdentifier = ref("");
const resendCooldown = ref(0);
const apiError = ref<string | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

const submit = handleSubmit(async (formValues) => {
  apiError.value = null;
  lastIdentifier.value = formValues.identifier;

  try {
    const { $api } = useNuxtApp();
    await ($api as (url: string, opts: object) => Promise<unknown>)("/auth/forgot-password", {
      method: "POST",
      body: { identifier: formValues.identifier },
    });
  } catch (error: unknown) {
    const err = error as { data?: { message?: unknown } };
    if (err?.data?.message) {
      apiError.value = String(err.data.message);
    } else {
      apiError.value = t("l_Reset_link_failed");
    }
  } finally {
    state.value = "sent";
    startCooldown();
  }
});

function onSubmit() {
  void submit();
}

function onResend() {
  if (resendCooldown.value > 0) return;
  void submit();
}

function startCooldown() {
  resendCooldown.value = 60;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (resendCooldown.value <= 1) {
      resendCooldown.value = 0;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    } else {
      resendCooldown.value -= 1;
    }
  }, 1000);
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

definePageMeta({
  layout: "auth",
  middleware: [],
});
</script>
