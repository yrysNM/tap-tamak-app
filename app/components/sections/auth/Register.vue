<template>
  <section class="px-4 py-8">
    <div class="mx-auto w-full max-w-md">
      <p class="text-center text-xs font-semibold text-primary" data-node-id="178:280">
        {{ $t('l_Home_food_near_you') }}
      </p>

      <h1 class="mt-3 text-center text-2xl font-bold text-dark" data-node-id="178:281">
        {{ $t('l_Register_title') }}
      </h1>

      <p class="mt-2 text-center text-sm font-semibold text-muted" data-node-id="178:283">
        {{ $t('l_Register_hint') }}
      </p>

      <div class="mt-7 rounded-3xl border border-black/5 bg-white/90 p-4 shadow-card" data-node-id="178:253">
        <div class="space-y-3">
          <UiInput :label="$t('l_Name')" :placeholder="$t('l_Name_placeholder')" v-model="name" />
          <UiInput type="tel" :label="$t('l_Phone')" :placeholder="$t('l_Phone_mask_placeholder')" phone-mask
            autocomplete="tel" v-model="phone" />
          <UiInput :label="$t('l_Password')" :type="showPassword ? 'text' : 'password'"
            :placeholder="$t('l_Password_min_placeholder')" v-model="password">
            <template #suffix>
              <button type="button" class="flex items-center justify-center text-muted transition hover:text-dark"
                :aria-label="showPassword ? $t('l_Hide_password') : $t('l_Show_password')"
                @click="showPassword = !showPassword">
                <Icon :name="showPassword ? 'material-symbols:visibility-off-outline' : 'material-symbols:visibility-outline'"
                  class="size-5" />
              </button>
            </template>
          </UiInput>
        </div>

        <label class="mt-2 flex cursor-pointer ml-1 items-start gap-2.5 text-left">
          <input v-model="acceptedLegal" type="checkbox"
            class="mt-0.5 size-4 shrink-0 rounded border-black/20 text-primary focus:ring-primary" />
          <span class="text-[11px] font-semibold leading-snug text-black/55">
            {{ $t('l_Login_legal_prefix') }}
            <button type="button" class="font-bold text-primary underline underline-offset-2"
              @click.prevent="navigateTo('/legal/privacy')">
              {{ $t('l_Login_legal_privacy_link') }}
            </button>
            {{ $t('l_Login_legal_and') }}
            <button type="button" class="font-bold text-primary underline underline-offset-2"
              @click.prevent="navigateTo('/legal/terms')">
              {{ $t('l_Login_legal_terms_link') }}
            </button>{{ $t('l_Login_legal_suffix') }}
          </span>
        </label>

        <label class="mt-2 flex cursor-pointer ml-1 items-center gap-2.5 text-left">
          <input v-model="acceptedOffer" type="checkbox"
            class="size-4 shrink-0 rounded border-black/20 text-primary focus:ring-primary" />
          <span class="text-[11px] font-semibold leading-snug text-black/55">
            {{ $t('l_Offer_agreement_prefix') }}
            <button type="button" class="font-bold text-primary underline underline-offset-2"
              @click.prevent="navigateTo('/legal/offer?role=' + role)">
              {{ $t('l_Offer_agreement_link') }}
            </button>
          </span>
        </label>

        <p v-if="error" class="mt-3 text-center text-xs text-red-500">
          {{ error }}
        </p>

        <UiButton variant="primary" size="md" fullWidth :disabled="loading || !acceptedOffer || !acceptedLegal"
          class="mt-5 rounded-[20px] text-[15px] font-bold shadow-[0_16px_32px_rgba(244,123,32,0.22)]"
          data-node-id="178:272" @click="onSubmit">
          {{ loading ? $t('l_Loading') : $t('l_Create_account') }}
        </UiButton>

        <p class="mt-5 text-center text-xs font-semibold text-black/45" data-node-id="178:275">
          {{ $t('l_Role_change_later') }}
        </p>

        <p class="mt-2 text-center text-xs font-semibold" data-node-id="178:276">
          <span class="text-muted">{{ $t('l_Already_have_account') }}</span>
          <button type="button" class="font-bold text-primary" data-node-id="178:279" @click="navigateTo('/login')">
            {{ $t('l_Sign_in') }}
          </button>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ role: "USER" | "COOK" }>();

const auth = useAuthStore();
const { normalizePhone } = useNormalizationPhone();
const { t } = useI18n();

const role = computed(() => props.role);

const name = ref("");
const phone = ref("");
const password = ref("");
const showPassword = ref(false);
const acceptedOffer = ref(false);
const acceptedLegal = ref(false);
const config = useRuntimeConfig();
const error = ref("");
const loading = ref(false);

async function onSubmit() {
  if (!name.value || !phone.value || !password.value) return;
  if (!acceptedLegal.value) {
    error.value = t("l_Login_legal_required");
    return;
  }
  if (!acceptedOffer.value) {
    error.value = t("l_Offer_agreement_required");
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    await auth.register({
      firstName: name.value,
      phone: normalizePhone(phone.value).e164,
      password: password.value,
      role: props.role,
      acceptedTermsVersion: config.public.legalTermsVersion as string,
      acceptedPrivacyVersion: config.public.legalPrivacyVersion as string,
    });
    const redirect = props.role === "COOK" ? "/cook/verify" : "/";
    await navigateTo({ path: "/login", query: { redirect } });
  } catch (e: any) {
    error.value = e?.data?.message ?? t("l_Register_error");
  } finally {
    loading.value = false;
  }
}
</script>
