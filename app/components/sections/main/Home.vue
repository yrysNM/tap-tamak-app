<template>
  <section class="px-4 py-6">
    <div class="mx-auto w-full max-w-md">
      <h1 class="text-xl font-bold text-dark">
        Добро пожаловать
      </h1>
      <p class="mt-2 text-sm text-muted">
        Выберите повара на карте или найдите блюда по вкусу.
      </p>
      <NuxtLink
        to="/cooks"
        class="mt-6 flex items-center justify-center rounded-[18px] bg-primary px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(244,123,32,0.28)]"
      >
        Карта поваров
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
