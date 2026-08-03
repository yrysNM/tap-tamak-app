import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { PluginListenerHandle } from '@capacitor/core'
import type { Order } from '~/types'
import {
  fetchOrders,
  fetchPendingCookAcceptanceOrders,
} from '~/utils/ordersApi'

const POLL_INTERVAL_MS = 20_000
const SEEN_STORAGE_PREFIX = 'order-local-notif-seen:'

type ApiRequest = (url: string, opts?: object) => Promise<unknown>

function seenStorageKey(userId: string): string {
  return `${SEEN_STORAGE_PREFIX}${userId}`
}

function loadSeenIds(userId: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(seenStorageKey(userId))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

function saveSeenIds(userId: string, ids: Set<string>): void {
  try {
    sessionStorage.setItem(seenStorageKey(userId), JSON.stringify([...ids]))
  } catch {
    // Ignore quota / private mode failures.
  }
}

function notificationIdForOrder(orderId: string): number {
  let hash = 0
  for (let i = 0; i < orderId.length; i += 1) {
    hash = (hash * 31 + orderId.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 2_000_000_000 || 1
}

async function ensurePermissions(): Promise<boolean> {
  if (Capacitor.getPlatform() === 'android') {
    try {
      await LocalNotifications.createChannel({
        id: 'orders',
        name: 'Заказы',
        description: 'Уведомления о новых заказах',
        importance: 5,
        visibility: 1,
      })
    } catch (error) {
      console.warn('[order-local-notif] createChannel failed:', error)
    }
  }
  const current = await LocalNotifications.checkPermissions()
  if (current.display === 'granted') return true
  const requested = await LocalNotifications.requestPermissions()
  return requested.display === 'granted'
}

async function scheduleNewOrderNotification(order: Order): Promise<void> {
  const label = order.orderNumber?.trim() || order.id.slice(0, 8)
  await LocalNotifications.schedule({
    notifications: [
      {
        id: notificationIdForOrder(order.id),
        title: 'Новый заказ',
        body: `Заказ ${label}`,
        channelId: 'orders',
        schedule: { at: new Date(Date.now() + 250) },
        extra: { orderId: order.id },
      },
    ],
  })
}

export function useOrderLocalNotifications() {
  const auth = useAuthStore()
  const { $api } = useNuxtApp()
  const api = $api as ApiRequest

  let timer: ReturnType<typeof setInterval> | null = null
  let seeded = false
  let polling = false
  let activeUserId: string | null = null
  let actionListener: PluginListenerHandle | null = null

  async function fetchWatchedOrders(): Promise<Order[]> {
    if (auth.isCook) {
      return fetchPendingCookAcceptanceOrders(api, { page: 1, limit: 50 })
    }
    if (auth.isAdmin) {
      return fetchOrders(api, { page: 1, limit: 50 })
    }
    return []
  }

  async function pollOnce(): Promise<void> {
    if (polling) return
    const userId = auth.user?.id
    if (!userId) return
    if (!auth.isCook && !auth.isAdmin) return
    if (auth.isCook && auth.verificationStatus !== 'APPROVED') return

    polling = true
    try {
      const orders = await fetchWatchedOrders()
      const seen = loadSeenIds(userId)

      if (!seeded || activeUserId !== userId) {
        for (const order of orders) {
          seen.add(order.id)
        }
        saveSeenIds(userId, seen)
        seeded = true
        activeUserId = userId
        return
      }

      const fresh = orders.filter((order) => !seen.has(order.id))
      for (const order of fresh) {
        seen.add(order.id)
        try {
          await scheduleNewOrderNotification(order)
        } catch (error) {
          console.warn('[order-local-notif] schedule failed:', error)
        }
      }
      if (fresh.length > 0) {
        saveSeenIds(userId, seen)
      }
    } catch (error) {
      console.warn('[order-local-notif] poll failed:', error)
    } finally {
      polling = false
    }
  }

  async function onNotificationTap(orderId: string | undefined): Promise<void> {
    if (!orderId) return
    if (auth.isCook) {
      await navigateTo('/cook/orders')
      return
    }
    if (auth.isAdmin) {
      await navigateTo('/')
    }
  }

  async function start(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return
    stop()

    const allowed = await ensurePermissions()
    if (!allowed) {
      console.warn('[order-local-notif] permission not granted')
      return
    }

    seeded = false
    activeUserId = auth.user?.id ?? null

    actionListener = await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (event) => {
        const orderId = event.notification.extra?.orderId
        void onNotificationTap(typeof orderId === 'string' ? orderId : undefined)
      },
    )

    await pollOnce()
    timer = setInterval(() => {
      void pollOnce()
    }, POLL_INTERVAL_MS)
  }

  function stop(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (actionListener) {
      void actionListener.remove()
      actionListener = null
    }
    seeded = false
    activeUserId = null
    polling = false
  }

  return { start, stop }
}
