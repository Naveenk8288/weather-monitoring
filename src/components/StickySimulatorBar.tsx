import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  CloudRain,
  ExternalLink,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';

/**
 * Sticky floating Live Weather Simulator dock styled in Smoked-Forest & Champagne Gold Glass.
 */
export const StickySimulatorBar: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const {
    inputs,
    setTemp,
    setHumidity,
    setRain,
    combinational,
    registered,
    pendingUpdate,
    stepClock,
    triggerAsyncReset
  } = useSimulator();

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mb-2 w-80 overflow-hidden rounded-2xl border border-[#e3c68a]/25 bg-[#0b160c]/94 p-4 text-[#f5efe0] shadow-[0_18px_48px_rgba(4,10,5,0.78),inset_0_1px_0_rgba(245,222,170,0.2)]"
          >
            <div className="mb-3 flex items-center justify-between border-b border-[#e3c68a]/15 pb-2">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ebd29d]">
                Quick FPGA Simulator
              </div>
              <a
                href="#simulator"
                onClick={() => setExpanded(false)}
                className="inline-flex items-center gap-1 font-mono text-[10px] text-[#e3c68a]/70 hover:text-white"
              >
                3D Chamber <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#ede3cd]/75">Temp</span>
                  <span className="font-bold text-red-400">{inputs.temp}°C</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={inputs.temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  aria-label="Sticky simulator temperature"
                  className="lab-slider mt-1 w-full bg-[#e3c68a]/22"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#ede3cd]/75">Humidity</span>
                  <span className="font-bold text-sky-300">{inputs.humidity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={inputs.humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  aria-label="Sticky simulator humidity"
                  className="lab-slider mt-1 w-full bg-[#e3c68a]/22"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setRain(!inputs.rain)}
                  className={`flex-1 rounded-full border px-3 py-1.5 font-mono text-[11px] font-semibold transition ${
                    inputs.rain
                      ? 'border-[#e3c68a] bg-[#e3c68a] text-[#0c160d]'
                      : 'border-[#e3c68a]/25 bg-[#122214] text-[#f4e4c1] hover:border-[#e3c68a]/55'
                  }`}
                >
                  <CloudRain className="mr-1 inline h-3.5 w-3.5" />
                  Rain: {inputs.rain ? '1' : '0'}
                </button>
                <button
                  type="button"
                  onClick={triggerAsyncReset}
                  title="Async Reset"
                  className="rounded-full border border-amber-400/45 bg-amber-500/15 px-3 py-1.5 font-mono text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/25"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="rounded-xl border border-[#e3c68a]/15 bg-[#071008]/85 px-3 py-2 font-mono text-[11px] text-[#ede3cd]/85">
                <div className="flex justify-between">
                  <span className="text-[#e3c68a]/60">Input D:</span>
                  <span className="text-amber-300">
                    {combinational.tempStatus} ({combinational.tempLabel})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e3c68a]/60">Reg Q:</span>
                  <span className="font-bold text-emerald-400">
                    {registered.tempStatus} ({registered.tempLabel})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={stepClock}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#e5c78a] via-[#f0d9a7] to-[#f9eed5] py-2 font-mono text-xs font-semibold text-[#0c160d] transition hover:brightness-105"
              >
                <Activity className="h-3.5 w-3.5" />
                Step Rising Clock Edge (↑)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Smoked-Forest & Gold Pill Dock */}
      <div className="flex items-center gap-1.5 rounded-full border border-[#e3c68a]/30 bg-[#0a140b]/92 p-1.5 text-[#f5efe0] shadow-[0_12px_36px_rgba(4,10,5,0.7)]">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs transition hover:bg-[#e3c68a]/12"
          aria-expanded={expanded}
          aria-label="Toggle live weather simulator quick panel"
        >
          <Sliders className="h-3.5 w-3.5 text-[#e3c68a]" />
          <span className="font-semibold text-[#f7f0e2]">
            {registered.latchedTemp}°C/{registered.latchedHumidity}%
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              registered.tempStatus === '10'
                ? 'bg-red-500/25 text-red-300'
                : registered.tempStatus === '00'
                  ? 'bg-sky-400/25 text-sky-200'
                  : 'bg-emerald-500/25 text-emerald-300'
            }`}
          >
            {registered.tempLabel}
          </span>
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={stepClock}
          title="Step Rising Clock Edge"
          className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold transition ${
            pendingUpdate
              ? 'animate-pulse bg-[#e5c78a] text-[#0c160d]'
              : 'bg-[#e3c68a]/16 text-[#f4e4c1] hover:bg-[#e3c68a]/28'
          }`}
        >
          CLK ↑
        </button>
      </div>
    </div>
  );
};
