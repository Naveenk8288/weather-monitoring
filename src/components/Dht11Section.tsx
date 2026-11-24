import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  SkipForward
} from 'lucide-react';
import { LightningVoiceButton } from '@/components/ui/lightning-voice-button';
import { SectionWrapper } from './SectionWrapper';
import { CanvasViewport } from '../scenes/CanvasViewport';
import { Dht11Scene } from '../scenes/Dht11Scene';
import {
  DHT11_TIMINGS,
  DHT11_TOTAL_STEPS,
  buildDht11Frame,
  getDht11Snapshot
} from '../sim/dht11Sim';
import { useSimulator } from '../context/SimulatorContext';

export const Dht11Section: React.FC = () => {
  const { inputs } = useSimulator();
  const [humidity, setHumidity] = useState(82);
  const [temperature, setTemperature] = useState(41);
  const [corrupted, setCorrupted] = useState(false);
  const [step, setStep] = useState(14);
  const [playing, setPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(260);

  const frame = useMemo(
    () => buildDht11Frame(humidity, temperature, corrupted),
    [humidity, temperature, corrupted]
  );

  const snapshot = useMemo(() => getDht11Snapshot(frame, step), [frame, step]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStep((s) => (s >= DHT11_TOTAL_STEPS ? 0 : s + 1));
    }, speedMs);
    return () => window.clearInterval(id);
  }, [playing, speedMs]);

  const toHex = (n: number) => `0x${n.toString(16).toUpperCase().padStart(2, '0')}`;
  const toBin = (n: number) => n.toString(2).padStart(8, '0');

  return (
    <SectionWrapper
      id="dht11"
      badge="04 · Single-Wire Protocol Visualizer"
      title="DHT11 40-Bit Acquisition, 54 µs Threshold & Checksum Gate"
      subtitle="Watch the FPGA drive the 18 ms start pulse, decode each bit pulse against the 54 µs threshold into the 40-cell 3D shift register (MSB first), and validate the checksum. Toggle 'Corrupt the frame' to see error rejection."
    >
      <div className="glass-card overflow-hidden">
        {/* Top Protocol Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#b59c6a]/35 bg-[#eee8d7]/90 px-4 py-3 dark:border-[#e8cfa0]/12 dark:bg-[#0f1d10]/95">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="lab-btn-primary py-1.5 text-xs"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? 'Pause' : 'Stream'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStep((s) => (s >= DHT11_TOTAL_STEPS ? 0 : s + 1));
              }}
              className="lab-btn-secondary py-1.5 text-xs"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Step Bit
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="lab-btn-secondary py-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restart
            </button>

            <div className="ml-1 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTemperature(41);
                  setHumidity(82);
                  setStep(0);
                }}
                className="rounded-full border border-[#b59c6a]/40 bg-white/75 px-3 py-1 font-mono text-[11px] text-slate-800 hover:border-black/45 dark:border-[#e8cfa0]/20 dark:bg-[#d9ba7b]/140 dark:text-[#e8cfa0]/85"
              >
                41°C / 82%
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemperature(inputs.temp);
                  setHumidity(inputs.humidity);
                  setStep(0);
                }}
                className="rounded-full border border-[#9e8450]/50 bg-[#d9ba7b]/14 px-3 py-1 font-mono text-[11px] font-medium text-slate-900 dark:border-[#e8cfa0]/35 dark:bg-[#e8cfa0]/10 dark:text-[#e8cfa0]"
              >
                Sync Simulator ({inputs.temp}°C / {inputs.humidity}%)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              aria-label="DHT11 playback speed"
              className="rounded-full border border-[#b59c6a]/40 bg-white/80 px-3 py-1 font-mono text-xs text-slate-900 dark:border-[#e8cfa0]/20 dark:bg-[#09130a]/86 dark:text-[#e8cfa0]"
            >
              <option value={500}>Slow</option>
              <option value={260}>Normal</option>
              <option value={110}>Fast</option>
            </select>

            <button
              type="button"
              role="switch"
              aria-checked={corrupted}
              onClick={() => {
                setCorrupted((c) => !c);
                setStep(40);
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-xs font-bold transition ${
                corrupted
                  ? 'border-red-500 bg-red-500/20 text-red-600 dark:text-red-300'
                  : 'border-[#9e8450]/40 bg-white/80 text-slate-800 hover:border-red-400 dark:border-[#e8cfa0]/20 dark:bg-[#09130a]/86 dark:text-[#e8cfa0]'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Corrupt the frame: {corrupted ? 'ON' : 'OFF'}
            </button>

            <LightningVoiceButton
              compact
              sceneId="dht11-protocol-3d"
              sceneTitle="3D DHT11 Protocol Visualizer"
              label="Explain DHT11"
              script={`Here is the 3D single-wire DHT11 protocol decoder running inside our Basys 3 FPGA. First, the FPGA pulls the data line low for 18 milliseconds and releases it for 30 microseconds. The DHT11 sensor acknowledges with 80 microseconds low followed by 80 microseconds high, then transmits 40 serial data bits most-significant bit first: 16 bits of humidity, 16 bits of temperature, and an 8-bit checksum. Every bit starts with a 50-microsecond low mark followed by a high pulse measured against the amber 54-microsecond decision threshold—around 27 microseconds decodes as logic zero, while 70 microseconds decodes as logic one into the 40-cell shift register tracked by a 6-bit bit counter. ${
                corrupted
                  ? 'Right now frame corruption is switched ON, so the computed sum fails to match the received checksum, causing the interface FSM to abort straight to S IDLE so data ready never fires.'
                  : `For the active frame of ${frame.tempInt} degrees Celsius and ${frame.humInt} percent humidity, the checksum matches cleanly and pulses data ready to the Control FSM.`
              }`}
            />
          </div>
        </div>

        {/* 3D/2.5D Waveform & 40-Cell Shift Register Canvas */}
        <CanvasViewport
          cameraPosition={[0, 1.4, 10.6]}
          fov={42}
          className="h-[380px] w-full sm:h-[430px]"
          bloomIntensity={0.5}
          ariaLabel="3D DHT11 single-wire protocol waveform showing 18ms start pulse, 30us release, 80us sensor response, 54us decision threshold line, and 40-cell 3D shift register filling bit by bit"
        >
          <Dht11Scene frame={frame} snapshot={snapshot} step={step} />
        </CanvasViewport>

        {/* Timeline Scrubber + Live Status */}
        <div className="border-t border-[#b59c6a]/35 bg-[#eee8d7]/70 px-5 py-4 dark:border-[#e8cfa0]/12 dark:bg-[#0f1d10]/85">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono font-bold text-slate-900 dark:text-[#e8cfa0]">
              FSM Phase: {snapshot.phase}
            </span>
            <span className="font-mono text-slate-600 dark:text-[#e8cfa0]/75">
              {snapshot.statusMessage}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={DHT11_TOTAL_STEPS}
            value={step}
            onChange={(e) => {
              setPlaying(false);
              setStep(Number(e.target.value));
            }}
            aria-label="Scrub DHT11 single-wire protocol timeline"
            className="lab-slider mt-3 w-full bg-[#d9ba7b]/28 dark:bg-[#e8cfa0]/20"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500 dark:text-[#e8cfa0]/50">
            <span>S_IDLE</span>
            <span>18ms+30µs</span>
            <span>80+80µs Resp</span>
            <span>Bit 0 (MSB)</span>
            <span>Bit 20</span>
            <span>Bit 39 (LSB)</span>
            <span>Checksum / Done</span>
          </div>
        </div>

        {/* Telemetry Readout Grid: 6-Bit Counter, Byte Groups & Checksum Verifier */}
        <div className="grid gap-4 border-t border-[#b59c6a]/35 p-5 md:grid-cols-12 dark:border-[#e8cfa0]/12">
          <div className="glass-subtle p-4 md:col-span-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#e8cfa0]/55">
              6-Bit Counter (0–39)
            </div>
            <div className="mt-2 flex items-baseline justify-between font-mono">
              <span className="text-3xl font-bold text-slate-900 dark:text-[#e8cfa0]">
                {String(snapshot.bitCounter).padStart(2, '0')}
              </span>
              <span className="rounded-full border border-[#b59c6a]/40 px-2.5 py-0.5 text-xs font-bold text-slate-900 dark:border-[#e8cfa0]/20 dark:text-[#e8cfa0]">
                6&apos;b{snapshot.bitCounterBinary}
              </span>
            </div>
            <div className="mt-2 font-mono text-[11px] text-slate-500 dark:text-[#e8cfa0]/55">
              Threshold: {DHT11_TIMINGS.DECISION_THRESHOLD_US} µs (0≈27µs, 1≈70µs)
            </div>
          </div>

          <div className="glass-subtle p-4 md:col-span-5">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#e8cfa0]/55">
              40-Bit Frame Breakdown (MSB First)
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2">
                <div className="text-[10px] text-cyan-700 dark:text-cyan-300">HUMIDITY (16b)</div>
                <div className="mt-0.5 font-bold text-slate-900 dark:text-[#e8cfa0]">
                  {frame.humInt}.0% ({toHex(frame.humInt)})
                </div>
                <div className="truncate text-[9px] text-slate-500 dark:text-[#e8cfa0]/50">
                  {toBin(frame.humInt)}
                </div>
              </div>
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-2">
                <div className="text-[10px] text-orange-700 dark:text-orange-300">TEMP (16b)</div>
                <div className="mt-0.5 font-bold text-slate-900 dark:text-[#e8cfa0]">
                  {frame.tempInt}.0°C ({toHex(frame.tempInt)})
                </div>
                <div className="truncate text-[9px] text-slate-500 dark:text-[#e8cfa0]/50">
                  {toBin(frame.tempInt)}
                </div>
              </div>
              <div
                className={`rounded-xl border p-2 ${
                  corrupted
                    ? 'border-red-500/60 bg-red-500/15'
                    : 'border-purple-500/30 bg-purple-500/10'
                }`}
              >
                <div
                  className={`text-[10px] ${
                    corrupted
                      ? 'text-red-600 dark:text-red-300'
                      : 'text-purple-700 dark:text-purple-300'
                  }`}
                >
                  CHECKSUM (8b)
                </div>
                <div className="mt-0.5 font-bold text-slate-900 dark:text-[#e8cfa0]">
                  {toHex(frame.transmittedChecksum)}
                </div>
                <div className="truncate text-[9px] text-slate-500 dark:text-[#e8cfa0]/50">
                  {toBin(frame.transmittedChecksum)}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 md:col-span-4 ${
              snapshot.phase === 'S_ERROR_RETURN_IDLE' || (corrupted && snapshot.checksumChecked)
                ? 'border-red-500/60 bg-red-500/10'
                : snapshot.dataReady
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-[#b59c6a]/35 bg-[#f4efe2]/90 dark:border-[#e8cfa0]/12 dark:bg-[#132315]/88'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#e8cfa0]/55">
                Checksum Gate
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                  snapshot.dataReady
                    ? 'bg-emerald-500 text-black'
                    : corrupted
                      ? 'bg-red-500 text-white'
                      : 'bg-[#d9ba7b]/28 text-slate-600 dark:bg-[#e8cfa0]/15 dark:text-[#e8cfa0]/70'
                }`}
              >
                data_ready = {snapshot.dataReady ? '1' : '0'}
              </span>
            </div>

            <div className="mt-2 font-mono text-xs text-slate-900 dark:text-[#e8cfa0]">
              ({frame.humInt} + 0 + {frame.tempInt} + 0) &amp; 0xFF ={' '}
              <strong>{toHex(frame.expectedChecksum)}</strong>{' '}
              {frame.checksumValid ? '==' : '!='}{' '}
              <strong
                className={
                  frame.checksumValid
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }
              >
                {toHex(frame.transmittedChecksum)}
              </strong>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {frame.checksumValid ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-300">
                    Valid packet — pulses data_ready=1 at completion.
                  </span>
                </>
              ) : (
                <>
                  <AlertOctagon className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="text-red-700 dark:text-red-300">
                    Corrupt frame! Returns to S_IDLE; data_ready never fires.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
