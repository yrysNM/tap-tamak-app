import type { CartLineItem, PublicCookMenuCookInfo, PublicCookMenuDish } from '~/types'

function maxPortionsFor(dish: PublicCookMenuDish): number {
  const raw = dish.portionCount
  if (raw == null || !Number.isFinite(raw)) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.trunc(raw))
}

export const useCartStore = defineStore(
  'cart',
  () => {
    const items = ref<CartLineItem[]>([])

    const totalItems = computed(() =>
      items.value.reduce((sum, line) => sum + line.quantity, 0),
    )

    const totalAmount = computed(() =>
      items.value.reduce(
        (sum, line) => sum + line.dish.price * line.quantity,
        0,
      ),
    )

    function snapshotCook(cook: PublicCookMenuCookInfo): CartLineItem['cook'] {
      return {
        id: cook.id,
        businessName: cook.businessName,
        rating: cook.rating,
        totalReviews: cook.totalReviews,
        kitchenPhotoUrls: [...cook.kitchenPhotoUrls],
      }
    }

    function snapshotDish(dish: PublicCookMenuDish): CartLineItem['dish'] {
      return {
        id: dish.id,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        imageUrl: dish.imageUrl,
        cookingTime: dish.cookingTime,
        calories: dish.calories,
        portionCount: dish.portionCount,
      }
    }

    function findIndex(cookId: string, dishId: string): number {
      return items.value.findIndex(
        (i) => i.cook.id === cookId && i.dish.id === dishId,
      )
    }

    function addOrIncrement(
      cook: PublicCookMenuCookInfo,
      dish: PublicCookMenuDish,
    ): void {
      const cap = maxPortionsFor(dish)
      const idx = findIndex(cook.id, dish.id)
      if (idx === -1) {
        if (cap <= 0) return
        items.value.push({
          cook: snapshotCook(cook),
          dish: snapshotDish(dish),
          quantity: 1,
          addedAt: new Date().toISOString(),
        })
        return
      }
      const line = items.value[idx]!
      if (line.quantity >= cap) return
      line.quantity += 1
    }

    function decrement(cookId: string, dishId: string): void {
      const idx = findIndex(cookId, dishId)
      if (idx === -1) return
      const line = items.value[idx]!
      if (line.quantity <= 1) {
        items.value.splice(idx, 1)
        return
      }
      line.quantity -= 1
    }

    function removeLine(cookId: string, dishId: string): void {
      const idx = findIndex(cookId, dishId)
      if (idx !== -1) items.value.splice(idx, 1)
    }

    function setQuantity(
      cookId: string,
      dishId: string,
      quantity: number,
    ): void {
      const idx = findIndex(cookId, dishId)
      if (idx === -1) return
      const line = items.value[idx]!
      const cap =
        line.dish.portionCount != null && Number.isFinite(line.dish.portionCount)
          ? Math.max(0, Math.trunc(line.dish.portionCount))
          : Number.POSITIVE_INFINITY
      if (quantity <= 0) {
        items.value.splice(idx, 1)
        return
      }
      line.quantity = Math.min(quantity, cap)
    }

    function clear(): void {
      items.value = []
    }

    function quantityFor(cookId: string, dishId: string): number {
      const idx = findIndex(cookId, dishId)
      return idx === -1 ? 0 : items.value[idx]!.quantity
    }

    function totalsForCook(cookId: string): { items: number; amount: number } {
      const lines = items.value.filter((i) => i.cook.id === cookId)
      const count = lines.reduce((s, i) => s + i.quantity, 0)
      const amount = lines.reduce((s, i) => s + i.dish.price * i.quantity, 0)
      return { items: count, amount }
    }

    return {
      items,
      totalItems,
      totalAmount,
      addOrIncrement,
      decrement,
      removeLine,
      setQuantity,
      clear,
      quantityFor,
      totalsForCook,
    }
  },
  {
    persist: {
      key: 'tap-tamak-cart-v2',
      pick: ['items'],
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    },
  },
)
