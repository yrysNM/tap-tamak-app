import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

let defaultsFixed = false

/** Fix default marker icon URLs broken by Vite bundling. Call once before using Leaflet maps. */
export function ensureLeafletDefaultIcons(): typeof L {
  if (!defaultsFixed) {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
      iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
      shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
    })
    defaultsFixed = true
  }
  return L
}

export { L }
