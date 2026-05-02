<template>
  <section class="mx-auto w-full max-w-md px-4 py-6">
    <h1 class="text-2xl font-bold text-heading">Избранное</h1>
    <p class="mt-2 text-sm text-subtle">
      Здесь будут ваши любимые блюда и повара.
    </p>

    <div class="mt-5 rounded-2xl border border-soft-border bg-white p-4">
      <p class="text-sm text-body">
        Пока в избранном пусто. Добавляйте позиции со страниц поваров и меню.
      </p>
      <NuxtLink
        to="/"
        class="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
      >
        Перейти на главную
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});
</script>
