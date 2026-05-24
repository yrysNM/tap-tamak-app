<template>
  <div class="p-4">
    <h1 class="text-xl font-bold text-dark">{{ $t('l_Cook_dashboard_title') }}</h1>
    <p class="mt-1 text-sm text-muted">{{ $t('l_Cook_welcome', { name: auth.user?.firstName ?? '' }) }}</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
</script>
