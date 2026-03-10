<template>
  <div>
    <SectionsAuthRegister :role="role" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const role = computed<'USER' | 'COOK'>(() => {
  const r = String(route.query.role ?? '').toLowerCase()
  return r === 'cook' || r === 'COOK' ? 'COOK' : 'USER'
})
</script>
