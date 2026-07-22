const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

export interface GeocodedAddress {
  lat: number;
  lng: number;
  displayName: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

export function useNominatim() {
  const geocoding = ref(false);
  const geocodeError = ref('');

  /**
   * Geocode a free-text address via OpenStreetMap Nominatim.
   * Uses free-form `q` only — do not mix with structured params (city, street, etc.).
   * `countrycodes` is a filter and is allowed alongside `q`.
   * Returns coordinates or null when the address cannot be resolved.
   */
  async function geocodeAddress(
    address: string,
    options?: { country?: string },
  ): Promise<GeocodedAddress | null> {
    const query = address.trim();
    if (!query) {
      geocodeError.value = '';
      return null;
    }

    geocoding.value = true;
    geocodeError.value = '';

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
        addressdetails: '0',
      });

      // countrycodes is a filter (allowed with q); structured city/street/etc. are not
      if (options?.country) {
        params.set('countrycodes', options.country);
      }

      const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim request failed with status ${response.status}`);
      }

      const results = await response.json() as NominatimSearchResult[];
      const first = results[0];
      if (!first) {
        geocodeError.value = 'address_not_found';
        return null;
      }

      return {
        lat: Number.parseFloat(first.lat),
        lng: Number.parseFloat(first.lon),
        displayName: first.display_name,
      };
    }
    catch {
      geocodeError.value = 'geocode_failed';
      return null;
    }
    finally {
      geocoding.value = false;
    }
  }

  return {
    geocoding,
    geocodeError,
    geocodeAddress,
  };
}
