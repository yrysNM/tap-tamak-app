<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    class="size-6"
  >
    <path v-if="name === 'home'" d="M6 19v-9l6-4.5L18 10v9h-3.5v-5.5h-5V19H6Z" />
    <path
      v-else-if="name === 'orders'"
      d="M5 21V3h14v18l-7-3-7 3Zm2-3.05 5-2.15 5 2.15V5H7v12.95ZM9 13V7h2v6H9Zm0 4v-2h2v2H9Zm4-4V7h2v6h-2Zm0 4v-2h2v2h-2Z"
    />
    <path
      v-else-if="name === 'map'"
      d="M15 21v-8.575L9 14.25V3l6-1.825V12.75L21 9v12l-6-1.825ZM3 21V9l6 1.85V21l-6-1.825Z"
    />
    <path
      v-else-if="name === 'profile'"
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  name: 'home' | 'orders' | 'map' | 'profile'
}>()
</script>
