<template>
  <div>
    <SectionsAuthLogin :redirect-to="redirectTo" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const redirectTo = computed(() => route.query.redirect as string | undefined)
</script>
