import React from 'react';
import {
  Activity,
  CloudRain,
  Droplets,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Snowflake,
  Thermometer,
  Zap
} from 'lucide-react';
import { LightningVoiceButton } from '@/components/ui/lightning-voice-button';
import { SectionWrapper } from './SectionWrapper';
import { CanvasViewport } from '../scenes/CanvasViewport';
import { WeatherSimScene } from '../scenes/WeatherSimScene';
import { useSimulator } from '../context/SimulatorContext';
import { REPORT_PRESETS } from '../sim/weatherLogic';

export const WeatherSimulatorSection: React.FC = () => {
  const {
    inputs,
    setTemp,
    setHumidity,
    setRain,
    combinational,
    registered,
    lcdLines,
    pendingUpdate,
    autoRun,
    setAutoRun,
    clockPulseId,
    stepClock,
    triggerAsyncReset,
    applyPreset
  } = useSimulator();

  const regHeat = registered.tempStatus === '10';
  const regCold = registered.tempStatus === '00';

  return (
    <SectionWrapper
      id="simulator"
      badge="06 · Flagship Interactive Feature"
      title="Live 3D FPGA Weather Simulator"
      subtitle="Adjust ambient temperature, humidity, and rainfall—then step the FPGA clock to watch registered outputs update strictly on the rising clock edge (posedge clk), or hit Reset to test immediate asynchronous recovery."
    >
      {/* 4 Official Report Scenario Preset Buttons (+ 41C/82% Timing Frame) */}
      <div className="mb-6">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-[#e8cfa0]/65">
            Report Verification Scenarios (Stage Inputs → Step Clock ↑)
          </span>
          {pendingUpdate && (
            <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-amber-500/60 bg-amber-500/15 px-3 py-0.5 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300">
              <Zap className="h-3 w-3" />
              Input ≠ Registered Output — Awaiting posedge clk
            </span>
          )}
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {REPORT_PRESETS.map((preset) => {
            const isStaged =
              inputs.temp === preset.inputs.temp &&
              inputs.humidity === preset.inputs.humidity &&
              inputs.rain === preset.inputs.rain;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-2xl border p-3.5 text-left transition-all ${
                  isStaged
                    ? 'border-[#253d24] bg-[#253d24] text-[#f7f0e2] dark:border-[#e5c78a] dark:bg-[#e5c78a] dark:text-[#0c160d]'
                    : 'border-[#b59c6a]/35 bg-white/90 text-black hover:border-black/40 dark:border-[#e8cfa0]/14 dark:bg-[#0d190e]/90 dark:text-[#e8cfa0] dark:hover:border-[#e8cfa0]/45'
                }`}
              >
                <div className="font-mono text-[10px] font-semibold uppercase tracking-wider opacity-65">
                  {preset.fromReport ? 'Report Case' : 'Timing Frame'}
                </div>
                <div className="mt-1 font-mono text-xs font-bold">{preset.shortLabel}</div>
                <div className="mt-0.5 text-[11px] opacity-75">{preset.expectedSummary}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Simulator Layout */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left: 3D Dynamic Weather Chamber */}
        <div className="glass-card relative overflow-hidden lg:col-span-7">
          <CanvasViewport
            cameraPosition={[0.6, 3.1, 7.6]}
            fov={42}
            className="h-[460px] w-full sm:h-[560px]"
            bloomIntensity={0.58}
            disableDefaultBg
            ariaLabel="Interactive 3D weather simulation chamber with Basys 3 FPGA board, 16x2 LCD readout, tri-color alert LEDs, and dynamic heat haze, snow, rain, and humidity fog effects"
          >
            <WeatherSimScene
              inputs={inputs}
              registered={registered}
              lcdLines={lcdLines}
              clockPulseId={clockPulseId}
            />
          </CanvasViewport>

          {/* Ambient Weather Badges Overlay */}
          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-[#e8cfa0]/20 bg-[#09130a]/88 px-3 py-1 font-mono text-[11px] text-[#e8cfa0]">
              Ambient: {inputs.temp}°C · {inputs.humidity}% · {inputs.rain ? 'RAIN' : 'DRY'}
            </span>
            {inputs.temp >= 40 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-400/50 bg-red-950/88 px-2.5 py-1 font-mono text-[11px] font-bold text-red-300">
                <Flame className="h-3 w-3" /> Heat Haze
              </span>
            )}
            {inputs.temp <= 10 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/50 bg-blue-950/88 px-2.5 py-1 font-mono text-[11px] font-bold text-blue-300">
                <Snowflake className="h-3 w-3" /> Snow &amp; Frost
              </span>
            )}
            {inputs.rain && (
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/50 bg-cyan-950/88 px-2.5 py-1 font-mono text-[11px] font-bold text-cyan-300">
                <CloudRain className="h-3 w-3" /> Rainfall
              </span>
            )}
            {inputs.humidity >= 80 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#9e8450]/50 bg-sky-950/88 px-2.5 py-1 font-mono text-[11px] font-bold text-sky-300">
                <Droplets className="h-3 w-3" /> Dense Fog
              </span>
            )}
          </div>

          {/* Lightning Male Voice Explain Button (Top-Right of 3D Chamber) */}
          <div className="absolute right-3 top-3 z-20">
            <LightningVoiceButton
              compact
              sceneId="weather-sim-3d"
              sceneTitle="Live 3D Basys 3 Weather Simulator"
              label="Explain 3D Sim"
              script={`You are viewing the live 3D Basys 3 Weather Chamber. Right now the ambient chamber sensors see ${inputs.temp} degrees Celsius, ${inputs.humidity} percent humidity, and ${inputs.rain ? 'active rainfall' : 'dry weather'}. Because our Verilog outputs are synchronous edge-triggered registers, the 3D 16 by 2 LCD and the red heat, blue humidity, and cyan rain alert LEDs update only on the rising edge of the clock. Currently the registered FPGA output holds ${registered.tempLabel}, binary ${registered.tempStatus}, with humidity alert ${registered.humidityAlert ? 'active' : 'off'} and rain alert ${registered.rainAlert ? 'active' : 'off'}. ${pendingUpdate ? 'Notice that your new inputs are pending—click Step Clock to latch them into the Basys 3 registers, or press Reset to asynchronously force NORMAL 01 and clear all alerts immediately.' : 'All outputs are currently synchronized with the sensor inputs. Try switching presets or moving sliders to observe the rising-edge clock delay.'}`}
            />
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-[#e8cfa0]/20 bg-[#09130a]/88 px-3.5 py-1 font-mono text-[11px] text-[#e8cfa0]/80">
            Environment = live sensor input · 3D LCD &amp; LEDs = registered FPGA outputs (posedge clk)
          </div>
        </div>

        {/* Right: Hardware Control Panel + Input vs Registered Output Diff */}
        <div className="glass-card flex flex-col justify-between space-y-5 p-5 lg:col-span-5">
          <div className="space-y-4">
            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="sim-temp-slider"
                  className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800 dark:text-[#e8cfa0]"
                >
                  <Thermometer className="h-4 w-4 text-red-400" />
                  Temperature (0–60 °C)
                </label>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                    inputs.temp >= 40
                      ? 'bg-red-500/20 text-red-600 dark:text-red-300'
                      : inputs.temp <= 10
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                        : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {inputs.temp}°C
                </span>
              </div>
              <input
                id="sim-temp-slider"
                type="range"
                min={0}
                max={60}
                value={inputs.temp}
                onChange={(e) => setTemp(Number(e.target.value))}
                className="lab-slider mt-2 w-full bg-gradient-to-r from-blue-500 via-emerald-400 to-red-500"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500 dark:text-[#e8cfa0]/55">
                <span>0°C</span>
                <span className="text-blue-500">≤10°C COLD (00)</span>
                <span className="text-emerald-500">11–39 NORM (01)</span>
                <span className="text-red-500">≥40°C HOT (10)</span>
              </div>
            </div>

            {/* Humidity Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="sim-hum-slider"
                  className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800 dark:text-[#e8cfa0]"
                >
                  <Droplets className="h-4 w-4 text-blue-400" />
                  Relative Humidity (0–100 %)
                </label>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                    inputs.humidity >= 80
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                      : 'bg-[#d9ba7b]/20 text-slate-700 dark:bg-[#e8cfa0]/10 dark:text-[#e8cfa0]'
                  }`}
                >
                  {inputs.humidity}%
                </span>
              </div>
              <input
                id="sim-hum-slider"
                type="range"
                min={0}
                max={100}
                value={inputs.humidity}
                onChange={(e) => setHumidity(Number(e.target.value))}
                className="lab-slider mt-2 w-full bg-gradient-to-r from-neutral-500 via-sky-400 to-blue-600"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500 dark:text-[#e8cfa0]/55">
                <span>0%</span>
                <span>50%</span>
                <span className="font-semibold text-blue-500">≥80% → humidity_alert = 1</span>
                <span>100%</span>
              </div>
            </div>

            {/* Rain Sensor Toggle */}
            <div className="glass-subtle flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <CloudRain
                  className={`h-4 w-4 ${inputs.rain ? 'text-cyan-400' : 'text-slate-400 dark:text-[#e8cfa0]/40'}`}
                />
                <span className="font-mono text-xs font-semibold text-slate-800 dark:text-[#e8cfa0]">
                  Raindrop Sensor (rain_in)
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={inputs.rain}
                onClick={() => setRain(!inputs.rain)}
                className={`rounded-full border px-3.5 py-1 font-mono text-xs font-bold transition ${
                  inputs.rain
                    ? 'border-[#253d24] bg-[#253d24] text-[#f7f0e2] dark:border-[#e5c78a] dark:bg-[#e5c78a] dark:text-[#0c160d]'
                    : 'border-[#9e8450]/40 bg-white/75 text-slate-600 dark:border-[#e8cfa0]/20 dark:bg-[#09130a]/86 dark:text-[#e8cfa0]/70'
                }`}
              >
                {inputs.rain ? 'RAIN = 1 (WET)' : 'RAIN = 0 (DRY)'}
              </button>
            </div>

            {/* Clock & Async Reset Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={stepClock}
                className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 font-mono text-xs font-bold transition ${
                  pendingUpdate
                    ? 'bg-[#253d24] text-[#f7f0e2] ring-2 ring-amber-400 dark:bg-[#e5c78a] dark:text-[#0c160d]'
                    : 'bg-[#253d24] text-[#f7f0e2] hover:bg-black/85 dark:bg-[#e5c78a] dark:text-[#0c160d] dark:hover:bg-white'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Step CLK ↑
              </button>

              <button
                type="button"
                onClick={() => setAutoRun(!autoRun)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2.5 font-mono text-xs font-bold transition ${
                  autoRun
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'border-[#9e8450]/40 bg-transparent text-slate-800 hover:border-black/50 dark:border-[#e8cfa0]/22 dark:bg-[#d9ba7b]/140 dark:text-[#e8cfa0]'
                }`}
              >
                {autoRun ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {autoRun ? 'Auto ON' : 'Auto-run'}
              </button>

              <button
                type="button"
                onClick={triggerAsyncReset}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-500/55 bg-amber-500/15 px-3 py-2.5 font-mono text-xs font-bold text-amber-700 transition hover:bg-amber-500/25 dark:text-amber-300"
                title="Asynchronous reset: sets temp_status=01 and alerts=0 immediately"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Input vs Registered Output Comparison Panel */}
          <div className="rounded-2xl border border-[#e8cfa0]/18 bg-[#081109] p-3.5 font-mono text-xs text-[#e8cfa0]">
            <div className="mb-2 flex items-center justify-between border-b border-[#e8cfa0]/12 pb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#e8cfa0]/80">
                Sequential Delay Monitor (CLK #{registered.clockCount})
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  pendingUpdate
                    ? 'bg-amber-500/25 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {pendingUpdate ? 'PENDING EDGE' : 'SYNCHRONIZED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#e8cfa0]/12 bg-[#0f1d10] p-2.5">
                <div className="text-[10px] uppercase text-[#e8cfa0]/55">Combinational (D Input)</div>
                <div className="mt-1.5 space-y-1">
                  <div>
                    status:{' '}
                    <strong className="text-amber-300">
                      {combinational.tempStatus} ({combinational.tempLabel})
                    </strong>
                  </div>
                  <div>
                    hum_alrt:{' '}
                    <strong className={combinational.humidityAlert ? 'text-blue-400' : 'opacity-45'}>
                      {combinational.humidityAlert ? '1' : '0'}
                    </strong>
                  </div>
                  <div>
                    rain_alrt:{' '}
                    <strong className={combinational.rainAlert ? 'text-cyan-400' : 'opacity-45'}>
                      {combinational.rainAlert ? '1' : '0'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#e8cfa0]/30 bg-[#152817] p-2.5">
                <div className="text-[10px] uppercase text-[#e8cfa0]">Registered (Q Output)</div>
                <div className="mt-1.5 space-y-1">
                  <div>
                    status:{' '}
                    <strong
                      className={
                        regHeat ? 'text-red-400' : regCold ? 'text-blue-400' : 'text-emerald-400'
                      }
                    >
                      {registered.tempStatus} ({registered.tempLabel})
                    </strong>
                  </div>
                  <div>
                    hum_alrt:{' '}
                    <strong className={registered.humidityAlert ? 'text-blue-400' : 'opacity-45'}>
                      {registered.humidityAlert ? '1' : '0'}
                    </strong>
                  </div>
                  <div>
                    rain_alrt:{' '}
                    <strong className={registered.rainAlert ? 'text-cyan-400' : 'opacity-45'}>
                      {registered.rainAlert ? '1' : '0'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2D Mirror of 16x2 HD44780 LCD + 3 Alert LEDs */}
          <div className="space-y-3">
            <div className="rounded-xl border-2 border-[#9e8450]/55 bg-[#86d654] p-3 font-mono text-sm font-bold tracking-[0.14em] text-[#0c240c] shadow-inner dark:border-[#e8cfa0]/20">
              <div>{lcdLines[0]}</div>
              <div>{lcdLines[1]}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div
                className={`flex items-center justify-center gap-1.5 rounded-full border py-1.5 ${
                  regHeat
                    ? 'border-red-500 bg-red-500/20 font-bold text-red-500'
                    : 'border-[#b59c6a]/35 bg-[#d9ba7b]/14 text-slate-400 dark:border-[#e8cfa0]/12 dark:bg-[#09130a]/78 dark:text-[#e8cfa0]/40'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${regHeat ? 'bg-red-500' : 'bg-neutral-500'}`} />
                HEAT LED
              </div>
              <div
                className={`flex items-center justify-center gap-1.5 rounded-full border py-1.5 ${
                  registered.humidityAlert
                    ? 'border-blue-500 bg-blue-500/20 font-bold text-blue-500'
                    : 'border-[#b59c6a]/35 bg-[#d9ba7b]/14 text-slate-400 dark:border-[#e8cfa0]/12 dark:bg-[#09130a]/78 dark:text-[#e8cfa0]/40'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    registered.humidityAlert ? 'bg-blue-500' : 'bg-neutral-500'
                  }`}
                />
                HUM LED
              </div>
              <div
                className={`flex items-center justify-center gap-1.5 rounded-full border py-1.5 ${
                  registered.rainAlert
                    ? 'border-cyan-400 bg-cyan-500/20 font-bold text-cyan-500'
                    : 'border-[#b59c6a]/35 bg-[#d9ba7b]/14 text-slate-400 dark:border-[#e8cfa0]/12 dark:bg-[#09130a]/78 dark:text-[#e8cfa0]/40'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    registered.rainAlert ? 'bg-cyan-400' : 'bg-neutral-500'
                  }`}
                />
                RAIN LED
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
