import type { CartItem } from '../../base/types'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )
  return { items, totalItems }
}, {
  persist: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  },
})
