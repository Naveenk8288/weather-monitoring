import React, { useEffect, useState } from 'react';
import { Check, Copy, Pause, Play, RotateCcw, Terminal } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { TIMING_CYCLES } from '../data/timingData';

const LABEL_W = 112;
const CELL_W = 86;
const TOTAL_W = LABEL_W + TIMING_CYCLES.length * CELL_W + 16;

function buildBitPath(values: (0 | 1)[], yHigh: number, yLow: number): string {
  let d = '';
  values.forEach((v, i) => {
    const x0 = LABEL_W + i * CELL_W;
    const x1 = x0 + CELL_W;
    const y = v === 1 ? yHigh : yLow;
    if (i === 0) {
      d += `M ${x0} ${y} L ${x1} ${y}`;
    } else {
      const prevY = values[i - 1] === 1 ? yHigh : yLow;
      if (prevY !== y) {
        d += ` L ${x0} ${y}`;
      }
      d += ` L ${x1} ${y}`;
    }
  });
  return d;
}

function buildClockPath(count: number, yHigh: number, yLow: number): string {
  let d = `M ${LABEL_W} ${yLow}`;
  for (let i = 0; i < count; i++) {
    const x0 = LABEL_W + i * CELL_W;
    const xMid = x0 + CELL_W * 0.5;
    const x1 = x0 + CELL_W;
    d += ` L ${x0} ${yHigh} L ${xMid} ${yHigh} L ${xMid} ${yLow} L ${x1} ${yLow}`;
  }
  return d;
}

const STATE_FILL: Record<string, string> = {
  IDLE: '#3a3a35',
  REQUEST: '#0891b2',
  MEASURE: '#059669',
  EVALUATE: '#d97706',
  DISPLAY: '#7c3aed'
};

export const TimingSection: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(6);
  const [playing, setPlaying] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setActiveIdx((i) => (i >= TIMING_CYCLES.length - 1 ? 0 : i + 1));
    }, 1150);
    return () => window.clearInterval(id);
  }, [playing]);

  const activeCycle = TIMING_CYCLES[activeIdx];

  const handleCopyLog = async () => {
    const fullLog = TIMING_CYCLES.map((c) => c.monitorLine).join('\n');
    try {
      await navigator.clipboard.writeText(fullLog);
      setCopiedLog(true);
      window.setTimeout(() => setCopiedLog(false), 1600);
    } catch {
      // ignore
    }
  };

  const rows = [
    { name: 'clk', y: 42, type: 'clock' as const, color: '#e8cfa0' },
    {
      name: 'reset',
      y: 86,
      type: 'bit' as const,
      color: '#f59e0b',
      vals: TIMING_CYCLES.map((c) => c.reset)
    },
    {
      name: 'sample_tick',
      y: 130,
      type: 'bit' as const,
      color: '#38bdf8',
      vals: TIMING_CYCLES.map((c) => c.sample_tick)
    },
    { name: 'state[2:0]', y: 176, type: 'state' as const, color: '#a855f7' },
    {
      name: 'data_ready',
      y: 222,
      type: 'bit' as const,
      color: '#10b981',
      vals: TIMING_CYCLES.map((c) => c.data_ready)
    },
    { name: 'cond[1:0]', y: 268, type: 'cond' as const, color: '#ef4444' },
    {
      name: 'alert_out',
      y: 314,
      type: 'bit' as const,
      color: '#ef4444',
      vals: TIMING_CYCLES.map((c) => c.alert_out)
    },
    {
      name: 'lcd_update',
      y: 358,
      type: 'bit' as const,
      color: '#c084fc',
      vals: TIMING_CYCLES.map((c) => c.lcd_update)
    }
  ];

  return (
    <SectionWrapper
      id="timing"
      badge="07 · Cycle-Accurate Timing Verification"
      title="Interactive Scrubbable Timing Diagram & $monitor Transcript"
      subtitle="Trace one complete measurement sequence (T1–T9) for the 41°C / 82% test frame: IDLE → REQUEST → MEASURE → EVALUATE → DISPLAY → IDLE, watching cond[1:0] latch 01 → 10 (HOT) on the rising edge."
    >
      <div className="glass-card overflow-hidden">
        {/* Controls & Scrubber Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#b59c6a]/35 bg-[#eee8d7]/90 px-4 py-3 dark:border-[#e8cfa0]/12 dark:bg-[#0f1d10]/95">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="lab-btn-primary py-1.5 text-xs"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? 'Pause' : 'Play T1–T9'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setActiveIdx(0);
              }}
              className="lab-btn-secondary py-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              T1
            </button>
          </div>

          <div className="flex flex-1 items-center gap-3 sm:max-w-md">
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-[#e8cfa0]">
              {activeCycle.cycle} ({activeCycle.timeNs}ns)
            </span>
            <input
              type="range"
              min={0}
              max={TIMING_CYCLES.length - 1}
              value={activeIdx}
              onChange={(e) => {
                setPlaying(false);
                setActiveIdx(Number(e.target.value));
              }}
              aria-label="Scrub timing waveform across cycles T1 through T9"
              className="lab-slider flex-1 bg-[#d9ba7b]/28 dark:bg-[#e8cfa0]/20"
            />
          </div>
        </div>

        {/* Scrubbable SVG Logic Analyzer Waveform */}
        <div className="overflow-x-auto bg-[#081109] p-4">
          <svg
            viewBox={`0 0 ${TOTAL_W} 392`}
            className="min-w-[760px] w-full select-none"
            role="img"
            aria-label="Interactive logic analyzer timing diagram across clock cycles T1 through T9"
          >
            {TIMING_CYCLES.map((c, idx) => {
              const x = LABEL_W + idx * CELL_W;
              const isSelected = idx === activeIdx;
              return (
                <g
                  key={c.cycle}
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    if (!playing) setActiveIdx(idx);
                  }}
                  onClick={() => {
                    setPlaying(false);
                    setActiveIdx(idx);
                  }}
                >
                  <rect
                    x={x}
                    y={0}
                    width={CELL_W}
                    height={388}
                    fill={isSelected ? 'rgba(232, 207, 160, 0.11)' : 'transparent'}
                  />
                  <line
                    x1={x}
                    y1={20}
                    x2={x}
                    y2={382}
                    stroke={isSelected ? 'rgba(232,207,160,0.65)' : 'rgba(232,207,160,0.14)'}
                    strokeDasharray={isSelected ? '0' : '3 4'}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />
                  <text
                    x={x + CELL_W / 2}
                    y={15}
                    textAnchor="middle"
                    className="font-mono text-[11px] font-bold"
                    fill={isSelected ? '#e8cfa0' : '#9e977f'}
                  >
                    {c.cycle}
                  </text>
                </g>
              );
            })}

            {rows.map((row) => (
              <g key={row.name}>
                <line
                  x1={8}
                  y1={row.y + 18}
                  x2={TOTAL_W - 8}
                  y2={row.y + 18}
                  stroke="rgba(232,207,160,0.09)"
                  strokeWidth={1}
                />
                <text
                  x={12}
                  y={row.y + 3}
                  className="font-mono text-[11px] font-semibold"
                  fill="#e8cfa0"
                >
                  {row.name}
                </text>

                {row.type === 'clock' && (
                  <path
                    d={buildClockPath(TIMING_CYCLES.length, row.y - 12, row.y + 10)}
                    fill="none"
                    stroke={row.color}
                    strokeWidth={2}
                  />
                )}

                {row.type === 'bit' && row.vals && (
                  <path
                    d={buildBitPath(row.vals, row.y - 12, row.y + 10)}
                    fill="none"
                    stroke={row.color}
                    strokeWidth={2.2}
                  />
                )}

                {row.type === 'state' &&
                  TIMING_CYCLES.map((c, idx) => {
                    const x0 = LABEL_W + idx * CELL_W + 2;
                    const x1 = x0 + CELL_W - 4;
                    const yTop = row.y - 13;
                    const yBot = row.y + 11;
                    const yMid = (yTop + yBot) / 2;
                    const pts = `${x0 + 6},${yTop} ${x1 - 6},${yTop} ${x1},${yMid} ${x1 - 6},${yBot} ${x0 + 6},${yBot} ${x0},${yMid}`;
                    return (
                      <g key={c.cycle}>
                        <polygon
                          points={pts}
                          fill={STATE_FILL[c.state]}
                          fillOpacity={idx === activeIdx ? 0.92 : 0.65}
                          stroke={idx === activeIdx ? '#e8cfa0' : '#867f68'}
                          strokeWidth={idx === activeIdx ? 1.6 : 0.9}
                        />
                        <text
                          x={(x0 + x1) / 2}
                          y={yMid + 3.5}
                          textAnchor="middle"
                          fill="#ffffff"
                          className="font-mono text-[9.5px] font-bold"
                        >
                          {c.state}
                        </text>
                      </g>
                    );
                  })}

                {row.type === 'cond' &&
                  TIMING_CYCLES.map((c, idx) => {
                    const x0 = LABEL_W + idx * CELL_W + 2;
                    const x1 = x0 + CELL_W - 4;
                    const yTop = row.y - 13;
                    const yBot = row.y + 11;
                    const yMid = (yTop + yBot) / 2;
                    const isHot = c.cond === '10';
                    const pts = `${x0 + 6},${yTop} ${x1 - 6},${yTop} ${x1},${yMid} ${x1 - 6},${yBot} ${x0 + 6},${yBot} ${x0},${yMid}`;
                    return (
                      <g key={c.cycle}>
                        <polygon
                          points={pts}
                          fill={isHot ? '#b91c1c' : '#0f766e'}
                          fillOpacity={idx === activeIdx ? 0.95 : 0.7}
                          stroke={isHot ? '#f87171' : '#34d399'}
                          strokeWidth={1.1}
                        />
                        <text
                          x={(x0 + x1) / 2}
                          y={yMid + 3.5}
                          textAnchor="middle"
                          fill="#ffffff"
                          className="font-mono text-[9.5px] font-bold"
                        >
                          {c.condLabel}
                        </text>
                      </g>
                    );
                  })}
              </g>
            ))}

            <g>
              <circle cx={LABEL_W + 6 * CELL_W} cy={268} r={4.5} fill="#fbbf24" />
              <text
                x={LABEL_W + 6 * CELL_W + 4}
                y={249}
                fill="#fbbf24"
                className="font-mono text-[9px] font-bold"
              >
                01→10 (HOT)
              </text>
            </g>
          </svg>
        </div>

        {/* Cycle-by-Cycle Report Explanation Card */}
        <div className="border-t border-[#b59c6a]/35 bg-[#eee8d7]/60 p-5 dark:border-[#e8cfa0]/12 dark:bg-[#0f1d10]/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black px-3 py-0.5 font-mono text-xs font-bold text-[#e8cfa0] dark:bg-[#e5c78a] dark:text-[#0c160d]">
              {activeCycle.cycle} · {activeCycle.timeNs} ns
            </span>
            <span className="rounded-full border border-[#b59c6a]/40 bg-white/80 px-3 py-0.5 font-mono text-xs font-semibold text-slate-900 dark:border-[#e8cfa0]/20 dark:bg-[#09130a]/86 dark:text-[#e8cfa0]">
              state = {activeCycle.state} ({activeCycle.stateBits})
            </span>
            <span
              className={`rounded-full px-3 py-0.5 font-mono text-xs font-bold ${
                activeCycle.cond === '10'
                  ? 'bg-red-500/20 text-red-600 dark:text-red-300'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              cond = {activeCycle.condLabel}
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-[#e8cfa0]">
              — {activeCycle.title}
            </span>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-[#e8cfa0]/75">
            {activeCycle.explanation}
          </p>
        </div>
      </div>

      {/* Simulated $monitor Console Output Terminal */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#b59c6a]/40 bg-[#081109] shadow-xl dark:border-[#e8cfa0]/16">
        <div className="flex items-center justify-between border-b border-[#e8cfa0]/12 bg-[#0f1d10] px-4 py-2.5">
          <div className="flex items-center gap-2 font-mono text-xs text-[#e8cfa0]">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span>Vivado XSim / ModelSim — $monitor Console (tb_weather_top.v)</span>
          </div>
          <button
            type="button"
            onClick={handleCopyLog}
            className="inline-flex items-center gap-1 rounded-full border border-[#e8cfa0]/20 bg-[#09130a]/78 px-3 py-1 font-mono text-[11px] text-[#e8cfa0]/85 hover:border-[#e8cfa0]/60"
          >
            {copiedLog ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedLog ? 'Copied' : 'Copy Log'}
          </button>
        </div>
        <div className="max-h-64 overflow-x-auto p-4 font-mono text-xs leading-6">
          <div className="text-[#e8cfa0]/45">
            # run -all &nbsp;// Frame: Humidity=82% (0x52), Temp=41C (0x29), Checksum=0x7B
          </div>
          {TIMING_CYCLES.slice(0, activeIdx + 1).map((c, idx) => (
            <div
              key={c.cycle}
              className={`whitespace-pre rounded px-2 py-0.5 ${
                idx === activeIdx
                  ? 'bg-[#e8cfa0]/15 font-semibold text-[#e8cfa0]'
                  : c.cond === '10'
                    ? 'text-amber-300/90'
                    : 'text-emerald-300/80'
              }`}
            >
              {c.monitorLine}
            </div>
          ))}
          <div className="mt-1 inline-block animate-pulse text-[#e8cfa0]">▋</div>
        </div>
      </div>
    </SectionWrapper>
  );
};
