<template>
  <section class="px-4 py-8">
    <div class="mx-auto w-full max-w-md">
      <p
        class="text-center text-xs font-semibold text-primary"
        data-node-id="178:280"
      >
        Домашняя еда рядом с вами
      </p>

      <h1
        class="mt-3 text-center text-2xl font-bold text-dark"
        data-node-id="178:281"
      >
        Регистрация
      </h1>

      <p
        class="mt-2 text-center text-sm font-semibold text-muted"
        data-node-id="178:283"
      >
        Создайте аккаунт, чтобы получить доступ к заказам и меню.
      </p>

      <div
        class="mt-7 rounded-3xl border border-black/5 bg-white/90 p-4 shadow-card"
        data-node-id="178:253"
      >
        <div class="space-y-4">
          <UiInput label="Имя" placeholder="Например: Айдана" v-model="name" />

          <UiInput
            label="Телефон"
            placeholder="+7 (___) ___-__-__"
            v-model="phone"
          />

          <UiInput
            label="Пароль"
            type="password"
            placeholder="Минимум 6 символов"
            v-model="password"
          />
        </div>

        <p v-if="error" class="mt-3 text-center text-xs text-red-500">
          {{ error }}
        </p>

        <UiButton
          variant="primary"
          size="md"
          fullWidth
          :disabled="loading"
          class="mt-5 rounded-[20px] text-[15px] font-bold shadow-[0_16px_32px_rgba(244,123,32,0.22)]"
          data-node-id="178:272"
          @click="onSubmit"
        >
          {{ loading ? "Загрузка..." : "Создать аккаунт" }}
        </UiButton>

        <p
          class="mt-3 text-center text-xs font-semibold text-black/45"
          data-node-id="178:275"
        >
          Можно поменять роль позже в настройках
        </p>

        <p
          class="mt-2 text-center text-xs font-semibold"
          data-node-id="178:276"
        >
          <span class="text-muted">Уже есть аккаунт? </span>
          <button
            type="button"
            class="font-bold text-primary"
            data-node-id="178:279"
            @click="navigateTo('/login')"
          >
            Войти
          </button>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ role: "USER" | "COOK" }>();

const auth = useAuthStore();

const name = ref("");
const phone = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function onSubmit() {
  if (!name.value || !phone.value || !password.value) return;
  loading.value = true;
  error.value = "";
  try {
    await auth.register({
      firstName: name.value,
      phone: phone.value,
      password: password.value,
      role: props.role,
    });
    await navigateTo({ path: "/login", query: { redirect: "/" } });
  } catch (e: any) {
    error.value = e?.data?.message ?? "Ошибка регистрации";
  } finally {
    loading.value = false;
  }
}
</script>
