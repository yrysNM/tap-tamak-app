<template>
  <div
    class="safe-bottom-above-nav fixed left-1/2 z-10 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-black/10 bg-white/95 p-2 shadow-floating backdrop-blur"
  >
    <div class="flex items-center gap-2">
      <div class="flex-1 rounded-xl bg-surface-warm px-3 py-2">
        <p class="text-[12px] font-bold text-icon-secondary">{{ $t('l_Cart_summary', { count: 0 }) }}</p>
        <p class="text-[11px] font-semibold text-muted">{{ $t('l_Total_amount', { amount: '0 ₸' }) }}</p>
      </div>
      <Button size="sm">{{ $t('l_Checkout_btn') }}</Button>
    </div>
  </div>
</template>
