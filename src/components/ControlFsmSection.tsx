import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, RotateCcw, SkipForward, Zap } from 'lucide-react';
import { LightningVoiceButton } from '@/components/ui/lightning-voice-button';
import { SectionWrapper } from './SectionWrapper';
import { CanvasViewport } from '../scenes/CanvasViewport';
import { ControlFsmScene } from '../scenes/ControlFsmScene';
import {
  FSM_EQUATIONS,
  FSM_STATES,
  FSM_STATE_MAP,
  FsmStateName,
  MOORE_EQUATIONS,
  asyncResetFsm,
  getMooreOutputs,
  stepFsmAutomatic
} from '../sim/fsmSim';

export const ControlFsmSection: React.FC = () => {
  const [currentState, setCurrentState] = useState<FsmStateName>('IDLE');
  const [prevState, setPrevState] = useState<FsmStateName>('IDLE');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [transitionTrigger, setTransitionTrigger] = useState(0);
  const [resetFlashTrigger, setResetFlashTrigger] = useState(0);
  const [showEquations, setShowEquations] = useState(false);

  const stepForward = () => {
    setCurrentState((curr) => {
      const next = stepFsmAutomatic(curr).nextState;
      setPrevState(curr);
      setTransitionTrigger((n) => n + 1);
      return next;
    });
  };

  const handleAsyncReset = () => {
    setPlaying(false);
    setPrevState(currentState);
    setCurrentState(asyncResetFsm());
    setTransitionTrigger((n) => n + 1);
    setResetFlashTrigger((n) => n + 1);
  };

  const handleSelectState = (target: FsmStateName) => {
    setPrevState(currentState);
    setCurrentState(target);
    setTransitionTrigger((n) => n + 1);
  };

  useEffect(() => {
    if (!playing) return;
    const intervalMs = Math.max(450, Math.round(1600 / speed));
    const id = window.setInterval(stepForward, intervalMs);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  const meta = FSM_STATE_MAP[currentState];
  const moore = getMooreOutputs(currentState);
  const [s2, s1, s0] = meta.bits;

  return (
    <SectionWrapper
      id="fsm"
      badge="03 · Interactive 3D Control FSM"
      title="5-State Moore Finite State Machine"
      subtitle="Orchestrates sensor wake-up, serial capture, single-cycle evaluation, and LCD refresh. Step through states, observe the traveling transition token, or fire Async Reset from any state."
    >
      <div className="grid gap-5 lg:grid-cols-12">
        {/* 3D State Machine Canvas */}
        <div className="glass-card overflow-hidden lg:col-span-8">
          <CanvasViewport
            cameraPosition={[0, 3.8, 9.2]}
            fov={42}
            className="h-[420px] w-full sm:h-[480px]"
            bloomIntensity={0.58}
            ariaLabel="Interactive 3D Moore Finite State Machine with 5 glowing spheres IDLE 000, REQUEST 001, MEASURE 010, EVALUATE 011, DISPLAY 100 connected by labeled transition arcs"
          >
            <ControlFsmScene
              currentState={currentState}
              prevState={prevState}
              transitionTrigger={transitionTrigger}
              resetFlashTrigger={resetFlashTrigger}
              onSelectState={handleSelectState}
            />
          </CanvasViewport>

          {/* Prisma Controls Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#b59c6a]/35 bg-[#eee8d7]/90 px-4 py-3 dark:border-[#e8cfa0]/12 dark:bg-[#0f1d10]/95">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="lab-btn-primary py-1.5 text-xs"
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {playing ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  stepForward();
                }}
                className="lab-btn-secondary py-1.5 text-xs"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Step
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  handleSelectState('IDLE');
                }}
                className="lab-btn-secondary py-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleAsyncReset}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/55 bg-amber-500/15 px-3.5 py-1.5 font-mono text-xs font-bold text-amber-700 transition hover:bg-amber-500/25 dark:text-amber-300"
              >
                <Zap className="h-3.5 w-3.5" />
                Async reset → IDLE
              </button>
              <LightningVoiceButton
                compact
                sceneId="control-fsm-3d"
                sceneTitle={`3D Moore Control FSM (${meta.name})`}
                label="Explain FSM"
                script={`This 3D interactive state machine visualizes our 5-state Moore Control FSM implemented using 3 D flip-flops on the Basys 3 FPGA. The five binary states are IDLE 000, REQUEST 001, MEASURE 010, EVALUATE 011, and DISPLAY 100. Right now the active state is ${meta.name}, binary code ${meta.bits.join(' ')}. ${meta.description} Because it is a pure Moore machine, its control outputs—start, shift enable, evaluation enable, and LCD update—depend strictly on the current state bits, eliminating input glitches. Pressing Async Reset immediately returns all three flip-flops to IDLE 000 without waiting for a clock edge.`}
              />
            </div>

            <label className="flex items-center gap-2.5 font-mono text-xs text-slate-600 dark:text-[#e8cfa0]/75">
              <span>Speed {speed.toFixed(2)}×</span>
              <input
                type="range"
                min={0.25}
                max={3}
                step={0.25}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="lab-slider w-24 bg-[#d9ba7b]/28 dark:bg-[#e8cfa0]/20"
                aria-label="FSM animation speed"
              />
            </label>
          </div>
        </div>

        {/* Live Telemetry Side Card */}
        <div className="glass-card flex flex-col justify-between p-5 lg:col-span-4">
          <div className="space-y-5">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-[#e8cfa0]/55">
                Active State Register
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-3xl font-medium tracking-[-0.04em]" style={{ color: meta.color }}>
                  {meta.name}
                </span>
                <span className="rounded-full border border-[#b59c6a]/40 bg-[#d9ba7b]/14 px-3 py-1 font-mono text-xs font-bold text-slate-900 dark:border-[#e8cfa0]/25 dark:bg-[#e8cfa0]/10 dark:text-[#e8cfa0]">
                  3&apos;b{meta.code}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-[#e8cfa0]/70">
                {meta.description}
              </p>
            </div>

            {/* 3 State Flip-Flop Bits s2 s1 s0 */}
            <div>
              <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-[#e8cfa0]/55">
                State Flip-Flops (3 DFFs)
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 's2', val: s2 },
                  { label: 's1', val: s1 },
                  { label: 's0', val: s0 }
                ].map((bit) => (
                  <div
                    key={bit.label}
                    className={`rounded-xl border p-3 text-center font-mono transition-all ${
                      bit.val === 1
                        ? 'border-[#253d24] bg-[#253d24] text-[#f7f0e2] dark:border-[#e5c78a] dark:bg-[#e5c78a] dark:text-[#0c160d]'
                        : 'border-[#b59c6a]/35 bg-[#d9ba7b]/14 text-slate-500 dark:border-[#e8cfa0]/12 dark:bg-[#09130a]/78 dark:text-[#e8cfa0]/45'
                    }`}
                  >
                    <div className="text-[11px] opacity-75">{bit.label}</div>
                    <div className="mt-0.5 text-xl font-bold">{bit.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Moore Decoded Outputs */}
            <div>
              <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-[#e8cfa0]/55">
                Moore Control Outputs
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    { key: 'start', val: moore.start, color: '#22d3ee', state: 'REQUEST' },
                    { key: 'shift_en', val: moore.shift_en, color: '#10b981', state: 'MEASURE' },
                    { key: 'eval_en', val: moore.eval_en, color: '#f59e0b', state: 'EVALUATE' },
                    { key: 'lcd_update', val: moore.lcd_update, color: '#a855f7', state: 'DISPLAY' }
                  ] as const
                ).map((out) => (
                  <div
                    key={out.key}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 font-mono text-xs transition-all ${
                      out.val === 1
                        ? 'border-[#e8cfa0]/45 bg-[#253d24] text-[#f7f0e2]'
                        : 'border-[#b59c6a]/35 bg-[#d9ba7b]/14 text-slate-500 dark:border-[#e8cfa0]/12 dark:bg-[#09130a]/75 dark:text-[#e8cfa0]/45'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{out.key}</div>
                      <div className="text-[10px] opacity-70">{out.state}</div>
                    </div>
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: out.val === 1 ? out.color : 'rgba(150,150,140,0.2)',
                        color: out.val === 1 ? '#0a0a0a' : '#8a897c'
                      }}
                    >
                      {out.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-subtle mt-5 px-3.5 py-2.5 font-mono text-xs">
            <span className="text-slate-500 dark:text-[#e8cfa0]/55">Next Transition: </span>
            <span className="font-semibold text-slate-900 dark:text-[#e8cfa0]">
              {meta.name} —[{meta.transitionLabel}]→ {meta.nextState}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible State Table & Boolean Next-State Equations (D2, D1, D0) */}
      <div className="glass-card mt-5 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowEquations((v) => !v)}
          aria-expanded={showEquations}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#d9ba7b]/14 dark:hover:bg-[#e8cfa0]/5"
        >
          <div>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-[#e8cfa0]/60">
              Boolean Synthesis Reference
            </span>
            <h3 className="text-base font-medium tracking-[-0.02em] text-slate-900 dark:text-[#e8cfa0]">
              State Transition Table &amp; Next-State Equations (D2, D1, D0)
            </h3>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-[#b59c6a]/40 px-3 py-1 font-mono text-xs text-slate-600 dark:border-[#e8cfa0]/20 dark:text-[#e8cfa0]/80">
            {showEquations ? 'Hide' : 'Expand'}
            {showEquations ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
        </button>

        {showEquations && (
          <div className="grid gap-6 border-t border-[#b59c6a]/35 p-5 lg:grid-cols-12 dark:border-[#e8cfa0]/12">
            <div className="overflow-x-auto lg:col-span-7">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-[#b59c6a]/35 text-[11px] uppercase text-slate-500 dark:border-[#e8cfa0]/15 dark:text-[#e8cfa0]/55">
                  <tr>
                    <th className="py-2 pr-3">State</th>
                    <th className="py-2 px-2">s2 s1 s0</th>
                    <th className="py-2 px-2">Condition</th>
                    <th className="py-2 px-2">Next</th>
                    <th className="py-2 pl-2">Active Moore Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b59c6a]/25 dark:divide-[#e8cfa0]/10">
                  {FSM_STATES.map((st) => {
                    const active = st.name === currentState;
                    const out = getMooreOutputs(st.name);
                    const activeOut = out.start
                      ? 'start=1'
                      : out.shift_en
                        ? 'shift_en=1'
                        : out.eval_en
                          ? 'eval_en=1'
                          : out.lcd_update
                            ? 'lcd_update=1'
                            : 'all 0';
                    return (
                      <tr
                        key={st.name}
                        className={
                          active
                            ? 'bg-[#d9ba7b]/20 font-bold text-slate-900 dark:bg-[#e8cfa0]/15 dark:text-[#e8cfa0]'
                            : 'text-slate-700 dark:text-[#e8cfa0]/75'
                        }
                      >
                        <td className="py-2.5 pr-3">{st.name}</td>
                        <td className="py-2.5 px-2">{st.bits.join(' ')}</td>
                        <td className="py-2.5 px-2 text-amber-600 dark:text-amber-300">
                          {st.transitionLabel}
                        </td>
                        <td className="py-2.5 px-2">{st.nextState}</td>
                        <td className="py-2.5 pl-2 text-emerald-600 dark:text-emerald-400">
                          {activeOut}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:col-span-5">
              <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#e8cfa0]/55">
                Next-State Flip-Flop Inputs
              </h4>
              {FSM_EQUATIONS.map((eq) => (
                <div key={eq.lhs} className="glass-subtle p-3">
                  <div className="font-mono text-xs font-bold text-slate-900 dark:text-[#e8cfa0]">
                    {eq.lhs} = {eq.expression}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-[#e8cfa0]/65">{eq.meaning}</p>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {MOORE_EQUATIONS.map((m) => (
                  <div key={m.signal} className="glass-subtle px-2.5 py-1.5 font-mono text-[11px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {m.signal}
                    </span>{' '}
                    = {m.expression}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};
