const PHOTON_BASE_URL = 'https://photon.komoot.io/api/';

/** Bias search toward Almaty delivery center. */
const ALMATY_LAT = 43.238949;
const ALMATY_LNG = 76.889709;
const CITY = 'Алматы';
const COUNTRY_CODE = 'KZ';
const RESULT_LIMIT = 5;

export interface GeocodedAddress {
  lat: number;
  lng: number;
  displayName: string;
}

export interface AddressSearchQuery {
  address: string;
  district?: string;
}

interface PhotonProperties {
  name?: string;
  housenumber?: string;
  street?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  postcode?: string;
  type?: string;
}

interface PhotonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    /** GeoJSON: [longitude, latitude] */
    coordinates: [number, number];
  };
  properties: PhotonProperties;
}

interface PhotonResponse {
  type: 'FeatureCollection';
  features: PhotonFeature[];
}

function buildQuery(parts: AddressSearchQuery): string {
  return [parts.address.trim(), parts.district?.trim(), CITY]
    .filter(Boolean)
    .join(', ');
}

function formatDisplayName(props: PhotonProperties): string {
  const parts = [
    [props.street, props.housenumber].filter(Boolean).join(' '),
    props.name && props.name !== props.street ? props.name : '',
    props.district,
    props.city,
    props.country,
  ]
    .map((s) => s?.trim())
    .filter(Boolean);

  return parts.join(', ') || props.name || '';
}

function isAlmatyResult(props: PhotonProperties): boolean {
  const code = props.countrycode?.toUpperCase();
  if (code && code !== COUNTRY_CODE) return false;

  const city = (props.city ?? '').toLowerCase();
  if (city && !city.includes('алматы') && !city.includes('almaty')) {
    return false;
  }

  return true;
}

export function usePhoton() {
  const geocoding = ref(false);
  const geocodeError = ref('');
  const { locale } = useI18n();

  /**
   * Search addresses via Photon (OSM geocoder).
   * Free-form address + optional district, fixed city Алматы.
   */
  async function geocodeAddress(
    parts: AddressSearchQuery,
  ): Promise<GeocodedAddress[]> {
    const query = buildQuery(parts);
    if (!parts.address.trim()) {
      geocodeError.value = '';
      return [];
    }

    geocoding.value = true;
    geocodeError.value = '';

    try {
      const params = new URLSearchParams({
        q: query,
        lat: String(ALMATY_LAT),
        lon: String(ALMATY_LNG),
        limit: String(RESULT_LIMIT),
        lang: locale.value !== 'en' ? 'default' : locale.value,
      });

      const response = await fetch(`${PHOTON_BASE_URL}?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Photon request failed with status ${response.status}`);
      }

      const data = await response.json() as PhotonResponse;
      const mapped = (data.features ?? [])
        .filter((f) => isAlmatyResult(f.properties))
        .map((f) => {
          const [lng, lat] = f.geometry.coordinates;
          return {
            lat,
            lng,
            displayName: formatDisplayName(f.properties),
          } satisfies GeocodedAddress;
        })
        .filter((a) => Number.isFinite(a.lat) && Number.isFinite(a.lng) && a.displayName);

      if (!mapped.length) {
        geocodeError.value = 'address_not_found';
        return [];
      }

      return mapped;
    }
    catch {
      geocodeError.value = 'geocode_failed';
      return [];
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
