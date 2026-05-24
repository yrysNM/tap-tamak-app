<template>
  <section class="mx-auto w-full max-w-md px-4 py-6">
    <h1 class="text-2xl font-bold text-heading">{{ $t('l_Favorites_title') }}</h1>
    <p class="mt-2 text-sm text-subtle">
      {{ $t('l_Favorites_empty') }}
    </p>

    <div class="mt-5 rounded-2xl border border-soft-border bg-white p-4">
      <p class="text-sm text-body">
        {{ $t('l_Favorites_empty_action') }}
      </p>
      <NuxtLink
        to="/"
        class="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
      >
        {{ $t('l_Go_home') }}
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});
</script>
