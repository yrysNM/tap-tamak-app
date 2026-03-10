<template>
  <div>
    <NuxtLayout name="customer">
      <SectionsMainHome />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
</script>
