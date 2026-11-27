import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  ComparatorSignals,
  RegisteredWeatherState,
  WeatherInputs,
  WeatherPreset,
  createResetRegisteredState,
  evaluateCombinational,
  formatLcdLines,
  hasPendingClockUpdate,
  stepRegisteredState
} from '../sim/weatherLogic';
import {
  DEFAULT_LOCATION,
  LiveWeatherReading,
  WeatherLocation,
  fetchLiveWeather,
  getBrowserCoordinates,
  reverseGeocodeCoords
} from '../services/liveWeather';

export type SimulatorMode = 'live' | 'manual';
export type LiveFetchStatus = 'idle' | 'locating' | 'loading' | 'live' | 'error';

interface SimulatorContextValue {
  mode: SimulatorMode;
  setMode: (mode: SimulatorMode) => void;
  liveStatus: LiveFetchStatus;
  liveError: string | null;
  liveNotice: string | null;
  liveLocation: WeatherLocation;
  liveReading: LiveWeatherReading | null;
  autoPoll: boolean;
  setAutoPoll: (v: boolean) => void;
  selectLiveLocation: (loc: WeatherLocation) => Promise<void>;
  detectMyLocation: () => Promise<void>;
  refreshLiveWeather: () => Promise<void>;

  inputs: WeatherInputs;
  setTemp: (temp: number) => void;
  setHumidity: (humidity: number) => void;
  setRain: (rain: boolean) => void;
  combinational: ComparatorSignals;
  registered: RegisteredWeatherState;
  lcdLines: [string, string];
  pendingUpdate: boolean;
  evalEn: boolean;
  setEvalEn: (en: boolean) => void;
  autoRun: boolean;
  setAutoRun: (v: boolean) => void;
  clockPulseId: number;
  resetFlashId: number;
  stepClock: () => void;
  triggerAsyncReset: () => void;
  applyPreset: (preset: WeatherPreset) => void;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

const INITIAL_INPUTS: WeatherInputs = {
  temp: 41,
  humidity: 82,
  rain: false
};

const LIVE_POLL_INTERVAL_MS = 60_000;

export const SimulatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<SimulatorMode>('live');
  const [liveStatus, setLiveStatus] = useState<LiveFetchStatus>('loading');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<WeatherLocation>(DEFAULT_LOCATION);
  const [liveReading, setLiveReading] = useState<LiveWeatherReading | null>(null);
  const [autoPoll, setAutoPoll] = useState<boolean>(true);

  const [inputs, setInputs] = useState<WeatherInputs>(INITIAL_INPUTS);
  const [evalEn, setEvalEn] = useState<boolean>(true);
  const [autoRun, setAutoRun] = useState<boolean>(false);
  const [clockPulseId, setClockPulseId] = useState<number>(1);
  const [resetFlashId, setResetFlashId] = useState<number>(0);

  // Boot with the 41°C / 82% frame latched so Hero & Simulator LCDs display valid FPGA telemetry immediately
  const [registered, setRegistered] = useState<RegisteredWeatherState>(() =>
    stepRegisteredState(createResetRegisteredState(0), INITIAL_INPUTS, true)
  );

  const requestSeqRef = useRef<number>(0);
  const userOverrodeRef = useRef<boolean>(false);
  const modeRef = useRef<SimulatorMode>(mode);
  const liveLocationRef = useRef<WeatherLocation>(liveLocation);
  const liveReadingRef = useRef<LiveWeatherReading | null>(liveReading);
  const evalEnRef = useRef<boolean>(evalEn);

  modeRef.current = mode;
  liveLocationRef.current = liveLocation;
  liveReadingRef.current = liveReading;
  evalEnRef.current = evalEn;

  const latchInputsToFpga = useCallback((nextInputs: WeatherInputs) => {
    setInputs(nextInputs);
    setRegistered((prev) => stepRegisteredState(prev, nextInputs, evalEnRef.current));
    setClockPulseId((id) => id + 1);
  }, []);

  const fetchAndApplyLocation = useCallback(
    async (loc: WeatherLocation, options?: { silent?: boolean; forceApply?: boolean }) => {
      const seq = ++requestSeqRef.current;
      if (!options?.silent) {
        setLiveStatus('loading');
      }
      setLiveError(null);

      try {
        const reading = await fetchLiveWeather(loc);
        if (seq !== requestSeqRef.current) return;

        setLiveLocation(loc);
        setLiveReading(reading);
        setLiveStatus('live');

        if (options?.forceApply || modeRef.current === 'live') {
          latchInputsToFpga(reading.fpgaInputs);
        }
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        const message =
          err instanceof Error ? err.message : 'Unable to fetch live weather telemetry.';
        setLiveError(message);
        setLiveStatus('error');
      }
    },
    [latchInputsToFpga]
  );

  const selectLiveLocation = useCallback(
    async (loc: WeatherLocation) => {
      userOverrodeRef.current = true;
      modeRef.current = 'live';
      setModeState('live');
      setLiveNotice(null);
      setLiveLocation(loc);
      await fetchAndApplyLocation(loc, { forceApply: true });
    },
    [fetchAndApplyLocation]
  );

  const detectMyLocation = useCallback(async () => {
    userOverrodeRef.current = true;
    modeRef.current = 'live';
    setModeState('live');
    setLiveStatus('locating');
    setLiveError(null);
    setLiveNotice(null);

    try {
      const coords = await getBrowserCoordinates(9000);
      const place = await reverseGeocodeCoords(coords.latitude, coords.longitude);
      const gpsLocation: WeatherLocation = {
        name: place.name,
        region: place.region,
        country: place.country,
        latitude: coords.latitude,
        longitude: coords.longitude,
        source: 'gps'
      };
      setLiveLocation(gpsLocation);
      await fetchAndApplyLocation(gpsLocation, { forceApply: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not detect browser GPS location.';
      setLiveNotice(`${msg} Monitoring ${liveLocationRef.current.name} — or search any city.`);
      if (liveReadingRef.current) {
        setLiveStatus('live');
        latchInputsToFpga(liveReadingRef.current.fpgaInputs);
      } else {
        await fetchAndApplyLocation(liveLocationRef.current, { forceApply: true });
      }
    }
  }, [fetchAndApplyLocation, latchInputsToFpga]);

  const refreshLiveWeather = useCallback(async () => {
    userOverrodeRef.current = true;
    modeRef.current = 'live';
    setModeState('live');
    await fetchAndApplyLocation(liveLocationRef.current, { forceApply: true });
  }, [fetchAndApplyLocation]);

  const setMode = useCallback(
    (nextMode: SimulatorMode) => {
      userOverrodeRef.current = true;
      modeRef.current = nextMode;
      setModeState(nextMode);

      if (nextMode === 'live') {
        const current = liveReadingRef.current;
        if (current) {
          latchInputsToFpga(current.fpgaInputs);
          if (Date.now() - current.fetchedAt > 30_000) {
            void fetchAndApplyLocation(liveLocationRef.current, {
              silent: true,
              forceApply: true
            });
          }
        } else {
          void fetchAndApplyLocation(liveLocationRef.current, { forceApply: true });
        }
      }
    },
    [fetchAndApplyLocation, latchInputsToFpga]
  );

  // Initial mount: auto-detect browser GPS location while showing fallback live weather right away
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      // Load default Bengaluru live weather immediately so the 3D FPGA updates within ~300 ms
      await fetchAndApplyLocation(DEFAULT_LOCATION, { forceApply: false });

      if (cancelled || userOverrodeRef.current) return;

      // Attempt automatic browser GPS detection and seamlessly switch to the user's live location
      try {
        const coords = await getBrowserCoordinates(7500);
        if (cancelled || userOverrodeRef.current) return;

        const place = await reverseGeocodeCoords(coords.latitude, coords.longitude);
        if (cancelled || userOverrodeRef.current) return;

        const gpsLocation: WeatherLocation = {
          name: place.name,
          region: place.region,
          country: place.country,
          latitude: coords.latitude,
          longitude: coords.longitude,
          source: 'gps'
        };
        setLiveNotice(null);
        await fetchAndApplyLocation(gpsLocation, { silent: true, forceApply: false });
      } catch {
        if (!cancelled && !userOverrodeRef.current) {
          setLiveNotice(
            'Auto-GPS unavailable — showing live Bengaluru weather. Click "Use My GPS" or search any city.'
          );
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [fetchAndApplyLocation]);

  // Automatic 60-second live weather refresh while in Live mode
  useEffect(() => {
    if (mode !== 'live' || !autoPoll) return;

    const timer = window.setInterval(() => {
      void fetchAndApplyLocation(liveLocationRef.current, { silent: true, forceApply: false });
    }, LIVE_POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [mode, autoPoll, fetchAndApplyLocation]);

  const setTemp = useCallback((temp: number) => {
    userOverrodeRef.current = true;
    modeRef.current = 'manual';
    setModeState('manual');
    setInputs((prev) => ({ ...prev, temp: Math.max(0, Math.min(60, Math.round(temp))) }));
  }, []);

  const setHumidity = useCallback((humidity: number) => {
    userOverrodeRef.current = true;
    modeRef.current = 'manual';
    setModeState('manual');
    setInputs((prev) => ({ ...prev, humidity: Math.max(0, Math.min(100, Math.round(humidity))) }));
  }, []);

  const setRain = useCallback((rain: boolean) => {
    userOverrodeRef.current = true;
    modeRef.current = 'manual';
    setModeState('manual');
    setInputs((prev) => ({ ...prev, rain }));
  }, []);

  const stepClock = useCallback(() => {
    setRegistered((prev) => stepRegisteredState(prev, inputs, evalEn));
    setClockPulseId((id) => id + 1);
  }, [inputs, evalEn]);

  const triggerAsyncReset = useCallback(() => {
    setRegistered((prev) => createResetRegisteredState(prev.clockCount));
    setResetFlashId((id) => id + 1);
  }, []);

  const applyPreset = useCallback((preset: WeatherPreset) => {
    userOverrodeRef.current = true;
    modeRef.current = 'manual';
    setModeState('manual');
    setInputs({ ...preset.inputs });
  }, []);

  // Optional auto-run rising clock edge every 1.25 s (manual FPGA waveform mode)
  useEffect(() => {
    if (!autoRun) return;
    const timer = window.setInterval(() => {
      setRegistered((prev) => stepRegisteredState(prev, inputs, evalEn));
      setClockPulseId((id) => id + 1);
    }, 1250);
    return () => window.clearInterval(timer);
  }, [autoRun, inputs, evalEn]);

  const combinational = useMemo(() => evaluateCombinational(inputs), [inputs]);
  const pendingUpdate = useMemo(
    () => hasPendingClockUpdate(inputs, registered),
    [inputs, registered]
  );
  const lcdLines = useMemo(() => formatLcdLines(registered), [registered]);

  const value = useMemo<SimulatorContextValue>(
    () => ({
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
      inputs,
      setTemp,
      setHumidity,
      setRain,
      combinational,
      registered,
      lcdLines,
      pendingUpdate,
      evalEn,
      setEvalEn,
      autoRun,
      setAutoRun,
      clockPulseId,
      resetFlashId,
      stepClock,
      triggerAsyncReset,
      applyPreset
    }),
    [
      mode,
      setMode,
      liveStatus,
      liveError,
      liveNotice,
      liveLocation,
      liveReading,
      autoPoll,
      selectLiveLocation,
      detectMyLocation,
      refreshLiveWeather,
      inputs,
      setTemp,
      setHumidity,
      setRain,
      combinational,
      registered,
      lcdLines,
      pendingUpdate,
      evalEn,
      autoRun,
      clockPulseId,
      resetFlashId,
      stepClock,
      triggerAsyncReset,
      applyPreset
    ]
  );

  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>;
};

export function useSimulator(): SimulatorContextValue {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error('useSimulator must be used within SimulatorProvider');
  return ctx;
}
