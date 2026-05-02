<template>
  <div />
</template>

<script setup lang="ts">
const auth = useAuthStore();
navigateTo(getCookHomePath(auth.user, auth.verificationStatus), {
  replace: true,
});
</script>
