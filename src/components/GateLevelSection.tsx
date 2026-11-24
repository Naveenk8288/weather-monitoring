import React from 'react';
import { Activity, RotateCcw, ToggleLeft, ToggleRight } from 'lucide-react';
import { LightningVoiceButton } from '@/components/ui/lightning-voice-button';
import { SectionWrapper } from './SectionWrapper';
import { CanvasViewport } from '../scenes/CanvasViewport';
import { GateLevelScene } from '../scenes/GateLevelScene';
import { useSimulator } from '../context/SimulatorContext';
import { mux2to1 } from '../sim/weatherLogic';

export const GateLevelSection: React.FC = () => {
  const {
    inputs,
    setTemp,
    setHumidity,
    setRain,
    combinational,
    registered,
    evalEn,
    setEvalEn,
    clockPulseId,
    resetFlashId,
    stepClock,
    triggerAsyncReset
  } = useSimulator();

  const q1 = registered.tempStatus[0] === '1';
  const q0 = registered.tempStatus[1] === '1';
  const mux1 = mux2to1(evalEn, q1, combinational.statusBit1);
  const mux0 = mux2to1(evalEn, q0, combinational.statusBit0);

  return (
    <SectionWrapper
      id="gates"
      badge="05 · 3D Gate-Level Logic Explorer"
      title="Comparators, Status Encoder & 2-to-1 Enable MUX + D Flip-Flop"
      subtitle="Trace live signals through the synthesized gate network. Toggle the enable select S (eval_en) to observe the 2-to-1 MUX feedback loop (Y = S'·I0 + S·I1) holding Q versus loading new comparator outputs on posedge clk."
    >
      <div className="glass-card overflow-hidden">
        {/* Interactive Gate-Level Control Bar */}
        <div className="grid gap-4 border-b border-[#b59c6a]/35 bg-[#eee8d7]/90 p-4 md:grid-cols-12 dark:border-[#e8cfa0]/12 dark:bg-[#0f1d10]/95">
          <div className="flex flex-col justify-center md:col-span-3">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-600 dark:text-[#e8cfa0]/75">temp[7:0]</span>
              <span className="font-bold text-red-500">{inputs.temp}°C</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={inputs.temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className="lab-slider mt-1.5 bg-[#d9ba7b]/28 dark:bg-[#e8cfa0]/20"
              aria-label="Gate explorer temperature input"
            />
          </div>

          <div className="flex flex-col justify-center md:col-span-3">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-600 dark:text-[#e8cfa0]/75">humidity[7:0]</span>
              <span className="font-bold text-blue-500">{inputs.humidity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={inputs.humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              className="lab-slider mt-1.5 bg-[#d9ba7b]/28 dark:bg-[#e8cfa0]/20"
              aria-label="Gate explorer humidity input"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 md:col-span-6 md:justify-end">
            <button
              type="button"
              onClick={() => setRain(!inputs.rain)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-xs font-semibold transition ${
                inputs.rain
                  ? 'border-[#253d24] bg-[#253d24] text-[#f7f0e2] dark:border-[#e5c78a] dark:bg-[#e5c78a] dark:text-[#0c160d]'
                  : 'border-[#9e8450]/40 bg-white/80 text-slate-700 dark:border-[#e8cfa0]/20 dark:bg-[#09130a]/86 dark:text-[#e8cfa0]/80'
              }`}
            >
              rain = {inputs.rain ? '1' : '0'}
            </button>

            <button
              type="button"
              onClick={() => setEvalEn(!evalEn)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-xs font-bold transition ${
                evalEn
                  ? 'border-amber-500/60 bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  : 'border-[#9e8450]/40 bg-[#d9ba7b]/20 text-slate-600 dark:border-[#e8cfa0]/20 dark:bg-[#09130a]/86 dark:text-[#e8cfa0]/70'
              }`}
            >
              {evalEn ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              S (eval_en) = {evalEn ? '1' : '0'}
            </button>

            <button type="button" onClick={stepClock} className="lab-btn-primary py-1.5 text-xs">
              <Activity className="h-3.5 w-3.5" />
              CLK ↑
            </button>

            <button
              type="button"
              onClick={triggerAsyncReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/15 px-3.5 py-1.5 font-mono text-xs font-bold text-amber-700 hover:bg-amber-500/25 dark:text-amber-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Async Reset
            </button>

            <LightningVoiceButton
              compact
              sceneId="gate-level-3d"
              sceneTitle="3D Gate-Level Logic Explorer"
              label="Explain Gates"
              script={`This 3D gate-level explorer reveals the exact digital logic synthesized onto the Artix-7 FPGA. On the left, three parallel 8-bit magnitude comparators evaluate HOT for temperature at least 40 degrees, COLD for 10 degrees or below, and HUM HIGH for humidity at least 80 percent. Currently temperature is ${inputs.temp} degrees and humidity is ${inputs.humidity} percent, producing encoded status ${combinational.tempStatus}, which means ${combinational.tempLabel}. In the center, the status encoder outputs bit 1 directly from HOT and bit 0 from NOT HOT AND NOT COLD. Next sits the 2-to-1 enable multiplexer implementing Y equals S bar I0 plus S I1. With enable S currently set to ${evalEn ? '1, it forwards new combinational values into the D flip-flops on the next rising clock edge' : '0, the amber feedback loop holds the previous registered output Q steady'}.`}
            />
          </div>
        </div>

        {/* 3D Gate-Level Canvas */}
        <CanvasViewport
          cameraPosition={[0.1, 1.3, 10.2]}
          fov={42}
          className="h-[410px] w-full sm:h-[460px]"
          bloomIntensity={0.55}
          ariaLabel="3D interactive gate-level circuit showing HOT, COLD, and HUM_HIGH comparators, status encoder gates, 2-to-1 enable MUX Y = S'I0 + SI1, and D flip-flops with async reset"
        >
          <GateLevelScene
            temp={inputs.temp}
            humidity={inputs.humidity}
            rain={inputs.rain}
            comb={combinational}
            reg={registered}
            evalEn={evalEn}
            clockPulseId={clockPulseId}
            resetFlashId={resetFlashId}
          />
        </CanvasViewport>

        {/* Live Boolean Equations Readout */}
        <div className="grid gap-3 border-t border-[#b59c6a]/35 p-5 sm:grid-cols-2 lg:grid-cols-3 dark:border-[#e8cfa0]/12">
          <div className="glass-subtle p-3.5 font-mono text-xs">
            <div className="text-[10px] uppercase text-slate-500 dark:text-[#e8cfa0]/55">
              Magnitude Comparators
            </div>
            <div className="mt-1.5 space-y-1 text-slate-800 dark:text-[#e8cfa0]/85">
              <div>
                HOT = (T ≥ 40) →{' '}
                <strong className={combinational.hot ? 'text-red-500' : 'opacity-45'}>
                  {combinational.hot ? '1' : '0'}
                </strong>
              </div>
              <div>
                COLD = (T ≤ 10) →{' '}
                <strong className={combinational.cold ? 'text-blue-500' : 'opacity-45'}>
                  {combinational.cold ? '1' : '0'}
                </strong>
              </div>
              <div>
                HUM_HIGH = (H ≥ 80) →{' '}
                <strong className={combinational.humHigh ? 'text-cyan-500' : 'opacity-45'}>
                  {combinational.humHigh ? '1' : '0'}
                </strong>
              </div>
            </div>
          </div>

          <div className="glass-subtle p-3.5 font-mono text-xs">
            <div className="text-[10px] uppercase text-slate-500 dark:text-[#e8cfa0]/55">
              Status Encoder Gates
            </div>
            <div className="mt-1.5 space-y-1 text-slate-800 dark:text-[#e8cfa0]/85">
              <div>
                status[1] = HOT →{' '}
                <strong className="text-red-500">{combinational.statusBit1 ? '1' : '0'}</strong>
              </div>
              <div>
                status[0] = ~HOT · ~COLD →{' '}
                <strong className="text-emerald-500">
                  {combinational.statusBit0 ? '1' : '0'}
                </strong>
              </div>
              <div className="font-semibold text-slate-900 dark:text-[#e8cfa0]">
                Encoded D_in = 2&apos;b{combinational.tempStatus} ({combinational.tempLabel})
              </div>
            </div>
          </div>

          <div className="glass-subtle p-3.5 font-mono text-xs sm:col-span-2 lg:col-span-1">
            <div className="text-[10px] uppercase text-amber-700 dark:text-amber-300">
              2-to-1 Enable MUX + DFF Cell
            </div>
            <div className="mt-1.5 space-y-1 text-slate-800 dark:text-[#e8cfa0]/85">
              <div className="font-bold text-slate-900 dark:text-[#e8cfa0]">Y = S&apos;·I0 + S·I1</div>
              <div>
                S={evalEn ? '1' : '0'}, I0(Q)={registered.tempStatus}, I1(D_in)=
                {combinational.tempStatus}
              </div>
              <div className="text-amber-700 dark:text-amber-300">
                Y → D = 2&apos;b{mux1 ? '1' : '0'}
                {mux0 ? '1' : '0'} ({evalEn ? 'Will latch on CLK ↑' : 'Holding Q'})
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
