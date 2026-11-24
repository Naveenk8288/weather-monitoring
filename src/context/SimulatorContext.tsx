import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

interface SimulatorContextValue {
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

export const SimulatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inputs, setInputs] = useState<WeatherInputs>(INITIAL_INPUTS);
  const [evalEn, setEvalEn] = useState<boolean>(true);
  const [autoRun, setAutoRun] = useState<boolean>(false);
  const [clockPulseId, setClockPulseId] = useState<number>(1);
  const [resetFlashId, setResetFlashId] = useState<number>(0);

  // Boot with the 41°C / 82% frame latched so Hero & Simulator LCDs display real data immediately
  const [registered, setRegistered] = useState<RegisteredWeatherState>(() =>
    stepRegisteredState(createResetRegisteredState(0), INITIAL_INPUTS, true)
  );

  const setTemp = useCallback((temp: number) => {
    setInputs((prev) => ({ ...prev, temp: Math.max(0, Math.min(60, Math.round(temp))) }));
  }, []);

  const setHumidity = useCallback((humidity: number) => {
    setInputs((prev) => ({ ...prev, humidity: Math.max(0, Math.min(100, Math.round(humidity))) }));
  }, []);

  const setRain = useCallback((rain: boolean) => {
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
    setInputs({ ...preset.inputs });
  }, []);

  // Optional auto-run rising clock edge every 1.25 s
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
