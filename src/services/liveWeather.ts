import { WeatherInputs } from '../sim/weatherLogic';

export type LocationSource = 'gps' | 'search' | 'quick' | 'default';

export interface WeatherLocation {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  source: LocationSource;
}

export interface CitySearchResult {
  id: number;
  name: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

export interface LiveWeatherReading {
  location: WeatherLocation;
  temperatureC: number;
  apparentTempC: number;
  humidityPct: number;
  rainMm: number;
  showersMm: number;
  precipitationMm: number;
  snowfallCm: number;
  windKmh: number;
  weatherCode: number;
  weatherLabel: string;
  isDay: boolean;
  isRaining: boolean;
  elevationM?: number;
  timezone?: string;
  observedAt: string;
  fetchedAt: number;
  fpgaInputs: WeatherInputs;
  tempClamped: boolean;
}

export const DEFAULT_LOCATION: WeatherLocation = {
  name: 'Bengaluru',
  region: 'Karnataka',
  country: 'India',
  latitude: 12.926,
  longitude: 77.527,
  source: 'default'
};

export const QUICK_CITIES: WeatherLocation[] = [
  {
    name: 'Bengaluru',
    region: 'Karnataka',
    country: 'India',
    latitude: 12.9719,
    longitude: 77.5937,
    source: 'quick'
  },
  {
    name: 'Mumbai',
    region: 'Maharashtra',
    country: 'India',
    latitude: 19.076,
    longitude: 72.8777,
    source: 'quick'
  },
  {
    name: 'New Delhi',
    region: 'Delhi',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.209,
    source: 'quick'
  },
  {
    name: 'Dubai',
    region: 'Dubai',
    country: 'UAE',
    latitude: 25.2048,
    longitude: 55.2708,
    source: 'quick'
  },
  {
    name: 'London',
    region: 'England',
    country: 'UK',
    latitude: 51.5072,
    longitude: -0.1276,
    source: 'quick'
  },
  {
    name: 'Reykjavik',
    region: 'Capital Region',
    country: 'Iceland',
    latitude: 64.1466,
    longitude: -21.9426,
    source: 'quick'
  }
];

const WMO_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Light rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm'
};

export function decodeWmoWeather(code: number): string {
  return WMO_LABELS[code] ?? `Weather code ${code}`;
}

/**
 * WMO codes that represent active liquid rain / drizzle / rain showers / thunderstorm.
 */
export function isRainWmoCode(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  );
}

/**
 * Maps real-world atmospheric telemetry into the FPGA's exact 8-bit DHT11 + 1-bit rain_in inputs.
 */
export function mapLiveWeatherToFpgaInputs(params: {
  temperatureC: number;
  humidityPct: number;
  rainMm: number;
  showersMm?: number;
  precipitationMm?: number;
  weatherCode: number;
}): { fpgaInputs: WeatherInputs; tempClamped: boolean; isRaining: boolean } {
  const roundedTemp = Math.round(params.temperatureC);
  const clampedTemp = Math.max(0, Math.min(60, roundedTemp));
  const clampedHumidity = Math.max(0, Math.min(100, Math.round(params.humidityPct)));
  const isRaining =
    params.rainMm > 0 ||
    (params.showersMm ?? 0) > 0 ||
    (params.precipitationMm ?? 0) > 0 ||
    isRainWmoCode(params.weatherCode);

  return {
    fpgaInputs: {
      temp: clampedTemp,
      humidity: clampedHumidity,
      rain: isRaining
    },
    tempClamped: roundedTemp !== clampedTemp,
    isRaining
  };
}

export function formatCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
}

export function formatLocationLabel(loc: WeatherLocation): string {
  return [loc.name, loc.region, loc.country].filter(Boolean).join(', ');
}

interface OpenMeteoForecastResponse {
  elevation?: number;
  timezone?: string;
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature?: number;
    is_day?: number;
    precipitation?: number;
    rain?: number;
    showers?: number;
    snowfall?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
}

export async function fetchLiveWeather(
  location: WeatherLocation,
  signal?: AbortSignal
): Promise<LiveWeatherReading> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', location.latitude.toFixed(4));
  url.searchParams.set('longitude', location.longitude.toFixed(4));
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m'
  );
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url.toString(), { signal, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Weather API responded with HTTP ${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoForecastResponse;
  if (!data.current) {
    throw new Error('Weather API returned an empty current reading');
  }

  const c = data.current;
  const temperatureC = Number(c.temperature_2m ?? 0);
  const apparentTempC = Number(c.apparent_temperature ?? temperatureC);
  const humidityPct = Number(c.relative_humidity_2m ?? 0);
  const rainMm = Number(c.rain ?? 0);
  const showersMm = Number(c.showers ?? 0);
  const precipitationMm = Number(c.precipitation ?? 0);
  const snowfallCm = Number(c.snowfall ?? 0);
  const windKmh = Number(c.wind_speed_10m ?? 0);
  const weatherCode = Number(c.weather_code ?? 0);
  const isDay = c.is_day !== 0;

  const { fpgaInputs, tempClamped, isRaining } = mapLiveWeatherToFpgaInputs({
    temperatureC,
    humidityPct,
    rainMm,
    showersMm,
    precipitationMm,
    weatherCode
  });

  return {
    location,
    temperatureC,
    apparentTempC,
    humidityPct,
    rainMm,
    showersMm,
    precipitationMm,
    snowfallCm,
    windKmh,
    weatherCode,
    weatherLabel: decodeWmoWeather(weatherCode),
    isDay,
    isRaining,
    elevationM: data.elevation,
    timezone: data.timezone,
    observedAt: c.time,
    fetchedAt: Date.now(),
    fpgaInputs,
    tempClamped
  };
}

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    admin1?: string;
    country?: string;
    country_code?: string;
    latitude: number;
    longitude: number;
  }>;
}

export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<CitySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '6');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    throw new Error(`City search responded with HTTP ${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoGeocodingResponse;
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    region: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    latitude: r.latitude,
    longitude: r.longitude
  }));
}

interface NominatimReverseResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<{ name: string; region?: string; country?: string }> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', latitude.toFixed(4));
    url.searchParams.set('lon', longitude.toFixed(4));
    url.searchParams.set('zoom', '10');
    url.searchParams.set('accept-language', 'en');

    const res = await fetch(url.toString(), { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as NominatimReverseResponse;
    const addr = data.address;
    const name =
      addr?.city ||
      addr?.town ||
      addr?.village ||
      addr?.municipality ||
      addr?.suburb ||
      addr?.county ||
      'Your Location';
    return {
      name,
      region: addr?.state,
      country: addr?.country
    };
  } catch {
    return {
      name: 'Your Location'
    };
  }
}

export function getBrowserCoordinates(timeoutMs = 8500): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Location permission was denied.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('Location request timed out.'));
        } else {
          reject(new Error('Unable to determine your current location.'));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 180000
      }
    );
  });
}
