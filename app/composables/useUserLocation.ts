import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export interface UserLocationState {
  lat: number
  lng: number
}

export type UserLocationPermission = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied'

const DEFAULT_ALMATY_CENTER: UserLocationState = {
  lat: 43.238949,
  lng: 76.889709,
}

export function useUserLocation() {
  const { t } = useI18n()
  const coords = ref<UserLocationState>({ ...DEFAULT_ALMATY_CENTER })
  const permission = ref<UserLocationPermission>('prompt')
  const loading = ref(false)
  const error = ref('')
  const hasExactLocation = ref(false)

  async function resolveCurrentPosition(): Promise<UserLocationState> {
    if (Capacitor.getPlatform() === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      return await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          (err) => reject(err),
          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 20000,
          },
        )
      })
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 20000,
    })
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }
  }

  async function updateLocation() {
    loading.value = true
    error.value = ''

    try {
      const check = await Geolocation.checkPermissions()
      permission.value = check.location

      if (check.location !== 'granted') {
        const requested = await Geolocation.requestPermissions({ permissions: ['location'] })
        permission.value = requested.location
      }

      if (permission.value !== 'granted') {
        hasExactLocation.value = false
        error.value = t('l_Geo_unavailable_almaty')
        return
      }

      const current = await resolveCurrentPosition()
      coords.value = current
      hasExactLocation.value = true
    }
    catch {
      hasExactLocation.value = false
      error.value = t('l_Geo_failed_almaty')
    }
    finally {
      loading.value = false
    }
  }

  return {
    coords,
    permission,
    loading,
    error,
    hasExactLocation,
    updateLocation,
    DEFAULT_ALMATY_CENTER,
  }
}
