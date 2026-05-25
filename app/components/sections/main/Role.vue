<template>
  <section class="px-4 pb-6">
    <div class="mx-auto w-full max-w-sm">


      <div class="rounded-[32px] bg-page-cream p-6 shadow-card" data-name="Страница выбора роли" data-node-id="178:304">
        <p class="text-center text-xs font-semibold text-primary" data-node-id="178:305">
          TapTamaq
        </p>

        <div class="mt-3 text-center text-[23px] font-bold leading-none text-dark" data-node-id="178:307">
          {{ $t('l_Role_and_account') }}
        </div>

        <p class="mt-3 text-center text-[13px] font-semibold leading-[1.35] text-muted" data-node-id="178:309">
          {{ $t('l_Role_intro') }}
        </p>

        <div class="mt-8 grid grid-cols-1 gap-3">
          <button type="button"
            class="relative flex min-h-[230px] flex-col justify-between rounded-[22px] p-4 text-left text-white shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
            :style="customerCardStyle" :class="[
              'transition-shadow',
              selectedRole === 'client'
                ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-transparent'
                : '',
            ]" data-name="Button - Выбрать роль Клиент" data-node-id="178:310" @click="selectedRole = 'client'">
            <div class="flex items-center justify-between">
              <span
                class="rounded-full border border-white/25 bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">
                {{ $t('l_Order_food') }}
              </span>
              <div
                class="h-6 w-6 shrink-0 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                <i class="fi fi-rr-check flex text-sm" v-show="selectedRole === 'client'" />
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/25 bg-white/10">
                  <img :src="imgCustomer2" alt="" class="h-[29px] w-[29px] object-cover" />
                </div>
              </div>

              <div>
                <h3 class="text-[17px] font-bold leading-none">{{ $t('l_Client') }}</h3>
                <p class="mt-2 text-[12px] font-semibold leading-[1.35]">
                  {{ $t('l_Client_desc') }}
                </p>
              </div>

              <ul class="mt-1 space-y-1 text-[12px] font-semibold leading-[1.3]">
                <li class="flex items-center gap-2">
                  <span class="inline-block h-1.5 w-1.5 rounded-full bg-white/85" />
                  <span>{{ $t('l_Cook_map') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="inline-block h-1.5 w-1.5 rounded-full bg-white/85" />
                  <span>{{ $t('l_Favorites') }}</span>
                </li>
              </ul>
            </div>
          </button>

          <button type="button"
            class="relative flex min-h-[230px] flex-col justify-between rounded-[22px] p-4 text-left text-white shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
            :style="cookCardStyle" :class="[
              'transition-shadow',
              selectedRole === 'cook'
                ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-transparent'
                : '',
            ]" data-name="Button - Выбрать роль Повар" data-node-id="178:332" @click="selectedRole = 'cook'">
            <div class="flex items-center justify-between">
              <span
                class="rounded-full border border-white/25 bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">
                {{ $t('l_Cook_food') }}
              </span>
              <div
                class="h-6 w-6 shrink-0 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                <i class="fi fi-rr-check flex text-sm" v-show="selectedRole === 'cook'" />
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/25 bg-white/10">
                  <img :src="imgChefHat1" alt="" class="h-[29px] w-[29px] object-cover" />
                </div>
              </div>

              <div>
                <h3 class="text-[17px] font-bold leading-none">{{ $t('l_Cook_role') }}</h3>
                <p class="mt-2 text-[12px] font-semibold leading-[1.35]">
                  {{ $t('l_Cook_desc') }}
                </p>
              </div>

              <ul class="mt-1 space-y-1 text-[12px] font-semibold leading-[1.3]">
                <li class="flex items-center gap-2">
                  <span class="inline-block h-1.5 w-1.5 rounded-full bg-white/85" />
                  <span>{{ $t('l_Accept_orders') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="inline-block h-1.5 w-1.5 rounded-full bg-white/85" />
                  <span>{{ $t('l_Manage_menu') }}</span>
                </li>
              </ul>
            </div>
          </button>
        </div>

        <button type="button"
          class="mt-8 flex h-14 w-full items-center justify-center rounded-[18px] bg-primary text-[17px] font-bold text-white shadow-[0_10px_24px_rgba(244,123,32,0.28)]"
          data-name="Button" data-node-id="178:354" @click="onContinue">
          {{ $t('l_Next') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const selectedRole = ref<"client" | "cook" | null>(null);


const imgCustomer2 =
  "https://tap-tamak-production.up.railway.app/api/v1/uploads/gallery/3788fe15-e57f-4794-ad78-d30e832298e3.png";
const imgChefHat1 =
  "https://tap-tamak-production.up.railway.app/api/v1/uploads/gallery/f10bf43f-50d4-45e6-928e-eac220b9f8e7.png";

const customerCardStyle = {
  backgroundImage:
    "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.18) 0, rgba(255,255,255,0) 60%), linear-gradient(160deg, rgba(107,142,35,0.98) 0%, rgba(107,142,35,0.82) 100%)",
};

const cookCardStyle = {
  backgroundImage:
    "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.18) 0, rgba(255,255,255,0) 60%), linear-gradient(160deg, rgba(244,123,32,0.98) 0%, rgba(244,123,32,0.82) 100%)",
};

function onContinue() {
  const selected = selectedRole.value ?? "client";
  const role = selected === "cook" ? "COOK" : "USER";
  navigateTo({ path: "/register", query: { role } });
}
</script>
