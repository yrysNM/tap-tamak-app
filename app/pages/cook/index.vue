<template>
  <div />
</template>

<script setup lang="ts">
const auth = useAuthStore()
await navigateTo(getCookHomePath(auth.user), { replace: true })
</script>
