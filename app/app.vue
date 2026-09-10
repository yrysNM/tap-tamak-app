<template>
  <div class="min-h-dvh font-sans text-dark">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage
        :keepalive="{
          include: ['CustomerHome', 'CustomerOrders', 'CustomerCooksMap', 'CustomerProfile'],
        }"
      />
    </NuxtLayout>
  </div>
</template>
