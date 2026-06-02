<template>
  <section class="px-4 py-8">
    <div class="mx-auto w-full max-w-md">
      <p class="text-center text-xs font-semibold text-primary">
        {{ $t('l_Welcome_to_TapTamaq') }}
      </p>

      <h1 class="mt-3 text-center text-2xl font-bold text-dark">{{ $t('l_Login_title') }}</h1>

      <p class="mt-2 text-center text-sm font-semibold text-muted">
        {{ $t('l_Login_hint') }}
      </p>

      <div class="mt-7 rounded-3xl border border-black/5 bg-white/90 p-4 shadow-card">
        <UiInput type="tel" :label="$t('l_Phone')" :placeholder="$t('l_Phone_mask_placeholder')" phone-mask
          autocomplete="tel" v-model="phone" />
        <div class="h-3" />
        <UiInput :label="$t('l_Password')" :type="showPassword ? 'text' : 'password'"
          :placeholder="$t('l_Password_placeholder')" v-model="password">
          <template #suffix>
            <button type="button" class="flex items-center justify-center text-muted transition hover:text-dark"
              :aria-label="showPassword ? $t('l_Hide_password') : $t('l_Show_password')"
              @click="showPassword = !showPassword">
              <Icon
                :name="showPassword ? 'material-symbols:visibility-off-outline' : 'material-symbols:visibility-outline'"
                class="size-5" />
            </button>
          </template>
        </UiInput>

        <p v-if="error" class="mt-3 text-center text-xs text-red-500">
          {{ error }}
        </p>

        <UiButton variant="primary" size="md" fullWidth :disabled="loading"
          class="mt-5 rounded-[20px] text-[15px] font-bold shadow-[0_16px_32px_rgba(244,123,32,0.22)]"
          @click="onSubmit">
          {{ loading ? $t('l_Loading') : $t('l_Sign_in') }}
        </UiButton>

        <p class="mt-5 text-center text-xs font-semibold">
          {{ $t('l_No_account') }}
          <button type="button" class="font-bold text-primary" @click="navigateTo('/role')">
            {{ $t('l_Register_link') }}
          </button>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const { normalizePhone } = useNormalizationPhone();
const { t } = useI18n();

const phone = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref("");
const loading = ref(false);

async function onSubmit() {
  if (!phone.value || !password.value) return;
  loading.value = true;
  error.value = "";
  let redirectTo = "/";
  try {
    await auth.login({
      phone: normalizePhone(phone.value).e164,
      password: password.value,
    });

    if (auth.user?.role === 'USER') {
      redirectTo = "/cooks";
    } else if (auth.user?.role === 'COOK') {
      redirectTo = getCookHomePath(auth.user, auth.verificationStatus);
    } else {
      redirectTo = "/";
    }

    await navigateTo(redirectTo);
  } catch (e: any) {
    error.value = e?.data?.message ?? t("l_Invalid_phone_or_password");
  } finally {
    loading.value = false;
  }
}
</script>
