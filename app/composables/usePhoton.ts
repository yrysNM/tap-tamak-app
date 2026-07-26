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

export interface StructuredAddressQuery {
  microdistrict: string;
  street: string;
  houseNumber: string;
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

function buildQuery(parts: StructuredAddressQuery): string {
  const house = parts.houseNumber.trim();
  const street = parts.street.trim();
  const micro = parts.microdistrict.trim();

  return [micro, street, house, CITY]
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

  /**
   * Search addresses via Photon (OSM autocomplete geocoder).
   * Query includes microdistrict, street, house number + fixed city Алматы.
   * Results are biased to Almaty and filtered to KZ / Алматы when possible.
   */
  async function geocodeAddress(
    parts: StructuredAddressQuery,
  ): Promise<GeocodedAddress[]> {
    const query = buildQuery(parts);
    if (!query || query === CITY) {
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
        lang: 'default',
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
