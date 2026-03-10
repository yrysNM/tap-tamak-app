<template>
  <div class="p-4">
    <h1 class="text-xl font-bold text-dark">Панель повара</h1>
    <p class="mt-1 text-sm text-muted">Добро пожаловать, {{ auth.user?.firstName }}!</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'

definePageMeta({
  layout: 'cook',
})

const auth = useAuthStore()
</script>
