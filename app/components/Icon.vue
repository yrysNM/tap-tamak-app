<template>
  <IconifyIcon
    :icon="name"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  name: string
}>()
</script>
