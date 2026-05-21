<template>
  <div class="min-h-dvh font-sans text-dark">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useHead({
  link: [
    {
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossorigin: "",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    },
  ],
});

const { isAuthenticated, logout, user } = useAuth();

onMounted(async () => {
  // console.log(isAuthenticated.value);
  // if (isAuthenticated.value) {
  //   try {
  //     console.log(user);
  //   } catch {
  //     logout();
  //   }
  // }
});
</script>
