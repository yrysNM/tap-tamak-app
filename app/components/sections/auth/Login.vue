<template>
  <section class="px-4 py-8">
    <div class="mx-auto w-full max-w-md">
      <p class="text-center text-xs font-semibold text-primary">
        Добро пожаловать в Tap Tamak
      </p>

      <h1 class="mt-3 text-center text-2xl font-bold text-dark">Вход</h1>

      <p class="mt-2 text-center text-sm text-muted">
        Введите номер телефона и пароль, чтобы войти в аккаунт.
      </p>

      <div class="mt-7 space-y-4">
        <UiInput
          label="Телефон"
          placeholder="+7 (___) ___-__-__"
          v-model="phone"
        />

        <UiInput
          label="Пароль"
          type="password"
          placeholder="Введите пароль"
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
        class="mt-6 rounded-[20px] text-[15px] font-bold shadow-[0_16px_32px_rgba(244,123,32,0.22)]"
        @click="onSubmit"
      >
        {{ loading ? "Загрузка..." : "Войти" }}
      </UiButton>

      <p class="mt-3 text-center text-xs text-muted">
        Нет аккаунта?
        <button
          type="button"
          class="font-semibold text-primary"
          @click="navigateTo('/role')"
        >
          Зарегистрироваться
        </button>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ redirectTo?: string }>();

const auth = useAuthStore();

const phone = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function onSubmit() {
  if (!phone.value || !password.value) return;
  loading.value = true;
  error.value = "";
  try {
    await auth.login({ phone: phone.value, password: password.value });
    if (auth.isCook) {
      await navigateTo("/cook/dashboard");
    } else {
      await navigateTo(props.redirectTo || "/");
    }
  } catch (e: any) {
    error.value = e?.data?.message ?? "Неверный телефон или пароль";
  } finally {
    loading.value = false;
  }
}
</script>
