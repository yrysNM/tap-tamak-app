<template>
  <SectionsMainHome />
</template>

<script setup lang="ts">
defineOptions({ name: 'CustomerHome' })

definePageMeta({
  layout: 'default',
})

const auth = useAuthStore();
</script>
