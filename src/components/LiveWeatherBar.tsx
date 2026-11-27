import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CloudRain,
  Droplets,
  Globe,
  Loader2,
  LocateFixed,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  Sliders,
  Thermometer,
  Wind,
  X
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import {
  CitySearchResult,
  QUICK_CITIES,
  formatCoords,
  formatLocationLabel,
  searchCities
} from '../services/liveWeather';

export const LiveWeatherBar: React.FC = () => {
  const {
    mode,
    setMode,
    liveStatus,
    liveError,
    liveNotice,
    liveLocation,
    liveReading,
    autoPoll,
    setAutoPoll,
    selectLiveLocation,
    detectMyLocation,
    refreshLiveWeather,
    registered
  } = useSimulator();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Close autocomplete dropdown on outside click
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // Debounced Open-Meteo city search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const list = await searchCities(trimmed, controller.signal);
        setResults(list);
        setDropdownOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSearchError('City search unavailable right now.');
          setResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelectCity = async (city: CitySearchResult) => {
    setDropdownOpen(false);
    setQuery('');
    setResults([]);
    await selectLiveLocation({
      name: city.name,
      region: city.region,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      source: 'search'
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      void handleSelectCity(results[0]);
    }
  };

  const isBusy = liveStatus === 'loading' || liveStatus === 'locating';
  const updatedTimeStr = liveReading
    ? new Date(liveReading.fetchedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : null;

  return (
    <div className="glass-card mb-6 p-4 sm:p-5">
      {/* Top Row: Live / Manual Toggle + GPS & Refresh Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#b59c6a]/25 pb-3.5 dark:border-[#e3c68a]/15">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div
            role="group"
            aria-label="Sensor input mode"
            className="inline-flex rounded-full border border-[#b59c6a]/35 bg-[#ece6d5] p-1 dark:border-[#e3c68a]/25 dark:bg-[#071008]"
          >
            <button
              type="button"
              onClick={() => setMode('live')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 font-mono text-[11px] font-bold transition ${
                mode === 'live'
                  ? 'bg-[#1f3b22] text-[#f7f0e2] shadow-sm dark:bg-[#e5c78a] dark:text-[#0c160d]'
                  : 'text-[#2c3c2d] hover:text-black dark:text-[#e8cfa0]/70 dark:hover:text-white'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  mode === 'live'
                    ? 'animate-pulse bg-emerald-400 dark:bg-emerald-700'
                    : 'bg-neutral-400'
                }`}
              />
              Live Weather Feed
            </button>

            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 font-mono text-[11px] font-bold transition ${
                mode === 'manual'
                  ? 'bg-[#1f3b22] text-[#f7f0e2] shadow-sm dark:bg-[#e5c78a] dark:text-[#0c160d]'
                  : 'text-[#2c3c2d] hover:text-black dark:text-[#e8cfa0]/70 dark:hover:text-white'
              }`}
            >
              <Sliders className="h-3 w-3" />
              Manual FPGA Lab
            </button>
          </div>

          <span className="hidden items-center gap-1 font-mono text-[11px] text-[#3a4a3a] md:inline-flex dark:text-[#e8cfa0]/65">
            <Radio className="h-3 w-3 text-emerald-500" />
            {mode === 'live'
              ? 'Real-time Open-Meteo telemetry latched into Basys 3 FPGA'
              : 'Manual override active — stage sliders & step posedge clk'}
          </span>
        </div>

        {/* GPS, Auto-Poll & Refresh Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void detectMyLocation()}
            disabled={liveStatus === 'locating'}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#8e784c]/40 bg-[#faf7ee]/90 px-3 py-1.5 font-mono text-[11px] font-semibold text-[#172818] transition hover:border-[#233a22] hover:bg-white disabled:opacity-60 dark:border-[#e3c68a]/30 dark:bg-[#0c190e] dark:text-[#f4e4c1] dark:hover:border-[#e3c68a]"
          >
            {liveStatus === 'locating' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5 text-emerald-500" />
            )}
            {liveStatus === 'locating' ? 'Locating GPS…' : 'Use My GPS'}
          </button>

          <button
            type="button"
            onClick={() => setAutoPoll(!autoPoll)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] font-semibold transition ${
              autoPoll && mode === 'live'
                ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                : 'border-[#8e784c]/35 bg-transparent text-[#2c3c2d] dark:border-[#e3c68a]/20 dark:text-[#e8cfa0]/65'
            }`}
            title="Automatically poll fresh live weather every 60 seconds"
          >
            Auto 60s: {autoPoll ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => void refreshLiveWeather()}
            disabled={isBusy}
            aria-label="Refresh live weather now"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#8e784c]/40 bg-[#faf7ee]/90 px-3 py-1.5 font-mono text-[11px] font-semibold text-[#172818] transition hover:border-[#233a22] disabled:opacity-60 dark:border-[#e3c68a]/30 dark:bg-[#0c190e] dark:text-[#f4e4c1] dark:hover:border-[#e3c68a]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Middle Row: City Search + Quick World City Chips */}
      <div className="mt-3.5 grid items-center gap-3 lg:grid-cols-12">
        <div ref={searchBoxRef} className="relative lg:col-span-5">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b5a38] dark:text-[#e3c68a]/65" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setDropdownOpen(false);
              }}
              placeholder="Search any city worldwide (e.g. Bengaluru, Tokyo, Paris)…"
              aria-label="Search city for live weather"
              className="w-full rounded-full border border-[#b59c6a]/45 bg-white/95 py-2 pl-10 pr-9 font-mono text-xs text-[#142215] placeholder:text-[#5c6a5d] focus:border-[#233a22] focus:outline-none dark:border-[#e3c68a]/25 dark:bg-[#09130a] dark:text-[#f5efe0] dark:placeholder:text-[#e8cfa0]/45 dark:focus:border-[#e3c68a]"
            />
            {searching ? (
              <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-[#e3c68a]" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setDropdownOpen(false);
                }}
                aria-label="Clear city search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b5a38] hover:text-black dark:text-[#e3c68a]/60 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </form>

          {/* Autocomplete Dropdown */}
          {dropdownOpen && (results.length > 0 || searchError || (query.trim().length >= 2 && !searching)) && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-2xl border border-[#b59c6a]/45 bg-[#faf7ee] shadow-2xl dark:border-[#e3c68a]/30 dark:bg-[#09130a]">
              {searchError ? (
                <div className="px-4 py-3 font-mono text-xs text-amber-700 dark:text-amber-300">
                  {searchError}
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 font-mono text-xs text-[#4a5a4b] dark:text-[#e8cfa0]/65">
                  No matching cities found for &ldquo;{query.trim()}&rdquo;
                </div>
              ) : (
                <ul role="listbox" aria-label="Matching cities" className="divide-y divide-[#b59c6a]/15 dark:divide-[#e3c68a]/12">
                  {results.map((city) => (
                    <li key={city.id}>
                      <button
                        type="button"
                        onClick={() => void handleSelectCity(city)}
                        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition hover:bg-[#e8cfa0]/25 dark:hover:bg-[#e3c68a]/15"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <div className="truncate">
                            <span className="font-mono text-xs font-bold text-[#142215] dark:text-[#f7f0e2]">
                              {city.name}
                            </span>
                            {(city.region || city.country) && (
                              <span className="ml-1.5 font-mono text-[11px] text-[#4a5a4b] dark:text-[#e8cfa0]/65">
                                {[city.region, city.country].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-[#6b5a38] dark:text-[#e8cfa0]/50">
                          {formatCoords(city.latitude, city.longitude)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Quick Global Cities */}
        <div className="flex flex-wrap items-center gap-1.5 lg:col-span-7 lg:justify-end">
          <span className="mr-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#4a5a4b] dark:text-[#e8cfa0]/55">
            <Globe className="h-3 w-3" />
            Quick Monitor:
          </span>
          {QUICK_CITIES.map((city) => {
            const isSelected =
              mode === 'live' &&
              liveLocation.name.toLowerCase() === city.name.toLowerCase();
            return (
              <button
                key={city.name}
                type="button"
                onClick={() => void selectLiveLocation(city)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium transition ${
                  isSelected
                    ? 'border-[#1f3b22] bg-[#1f3b22] text-[#f7f0e2] dark:border-[#e5c78a] dark:bg-[#e5c78a] dark:text-[#0c160d]'
                    : 'border-[#b59c6a]/35 bg-white/80 text-[#1d2e1e] hover:border-[#233a22] dark:border-[#e3c68a]/20 dark:bg-[#0b160c] dark:text-[#e8cfa0]/80 dark:hover:border-[#e3c68a]/60'
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Non-blocking GPS Notice or Fetch Error */}
      {(liveNotice || liveError) && (
        <div
          className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2 font-mono text-[11px] ${
            liveError
              ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
              : 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {liveError ?? liveNotice}
          </span>
          {liveError && (
            <button
              type="button"
              onClick={() => void refreshLiveWeather()}
              className="rounded-full border border-current px-2.5 py-0.5 font-bold hover:opacity-80"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Live Atmospheric Telemetry → FPGA Input Mapping Strip */}
      {liveReading && (
        <div className="mt-3.5 rounded-2xl border border-[#b59c6a]/30 bg-[#081209]/92 p-3.5 text-[#f5efe0] dark:border-[#e3c68a]/20">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#e3c68a]/15 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#f7f0e2]">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                {formatLocationLabel(liveReading.location)}
              </span>
              <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-300">
                {liveReading.location.source === 'gps' ? 'GPS Locked' : 'Live Station'}
              </span>
              <span className="font-mono text-[10px] text-[#e8cfa0]/65">
                {formatCoords(liveReading.location.latitude, liveReading.location.longitude)} ·{' '}
                {liveReading.weatherLabel}
              </span>
            </div>

            <div className="font-mono text-[10px] text-[#e8cfa0]/65">
              {updatedTimeStr ? `Updated ${updatedTimeStr}` : ''}
              {mode === 'manual' && (
                <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
                  MANUAL OVERRIDE
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Temperature */}
            <div className="rounded-xl border border-[#e3c68a]/15 bg-[#0e1c10] px-3 py-2 font-mono">
              <div className="flex items-center justify-between text-[10px] uppercase text-[#e8cfa0]/60">
                <span className="inline-flex items-center gap-1">
                  <Thermometer className="h-3 w-3 text-red-400" /> Live Temp
                </span>
                <span>temp_in</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-bold text-white">
                  {liveReading.temperatureC.toFixed(1)}°C
                </span>
                <span className="text-[11px] text-amber-300">
                  8&apos;d{liveReading.fpgaInputs.temp}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-[#e8cfa0]/55">
                {liveReading.tempClamped
                  ? `Clamped to DHT11 0–60°C range`
                  : `Feels like ${liveReading.apparentTempC.toFixed(1)}°C`}
              </div>
            </div>

            {/* Humidity */}
            <div className="rounded-xl border border-[#e3c68a]/15 bg-[#0e1c10] px-3 py-2 font-mono">
              <div className="flex items-center justify-between text-[10px] uppercase text-[#e8cfa0]/60">
                <span className="inline-flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-sky-400" /> Relative Humidity
                </span>
                <span>hum_in</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-bold text-white">
                  {Math.round(liveReading.humidityPct)}%
                </span>
                <span className="text-[11px] text-sky-300">
                  8&apos;d{liveReading.fpgaInputs.humidity}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-[#e8cfa0]/55">
                {liveReading.fpgaInputs.humidity >= 80
                  ? '≥80% → humidity_alert = 1'
                  : '<80% → humidity_alert = 0'}
              </div>
            </div>

            {/* Precipitation / Rain */}
            <div className="rounded-xl border border-[#e3c68a]/15 bg-[#0e1c10] px-3 py-2 font-mono">
              <div className="flex items-center justify-between text-[10px] uppercase text-[#e8cfa0]/60">
                <span className="inline-flex items-center gap-1">
                  <CloudRain className="h-3 w-3 text-cyan-400" /> Rain Sensor
                </span>
                <span>rain_in</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-bold text-white">
                  {liveReading.isRaining ? 'WET' : 'DRY'}
                </span>
                <span className="text-[11px] text-cyan-300">
                  1&apos;b{liveReading.fpgaInputs.rain ? '1' : '0'}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-[#e8cfa0]/55">
                Precip: {liveReading.precipitationMm.toFixed(1)} mm · {liveReading.weatherLabel}
              </div>
            </div>

            {/* Wind & Live FPGA Classification */}
            <div className="rounded-xl border border-[#e3c68a]/25 bg-[#132515] px-3 py-2 font-mono">
              <div className="flex items-center justify-between text-[10px] uppercase text-[#e8cfa0]/70">
                <span className="inline-flex items-center gap-1">
                  <Wind className="h-3 w-3 text-emerald-300" /> Wind · FPGA State
                </span>
                <span>status</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-bold text-white">
                  {liveReading.windKmh.toFixed(1)} km/h
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    registered.tempStatus === '10'
                      ? 'bg-red-500/25 text-red-300'
                      : registered.tempStatus === '00'
                        ? 'bg-sky-500/25 text-sky-200'
                        : 'bg-emerald-500/25 text-emerald-300'
                  }`}
                >
                  {registered.tempStatus} {registered.tempLabel}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-[#e8cfa0]/60">
                {mode === 'live'
                  ? 'Auto-latched to 3D Basys 3 & LCD'
                  : 'Click Live Weather Feed to sync'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
