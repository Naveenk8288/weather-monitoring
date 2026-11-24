import React, { useState } from 'react';
import { Cpu, FileCode2 } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { VERILOG_FILES } from '../data/verilogFiles';
import { VerilogCodeBlock } from './VerilogCodeBlock';

export const CodeSection: React.FC = () => {
  const [activeFileId, setActiveFileId] = useState(VERILOG_FILES[0].id);
  const activeFile = VERILOG_FILES.find((f) => f.id === activeFileId) ?? VERILOG_FILES[0];

  return (
    <SectionWrapper
      id="code"
      badge="08 · Synthesizable Verilog HDL & Hardware Mapping"
      title="Complete RTL Source Code & Hardware Realization"
      subtitle="Inspect all six Verilog modules—from Assignment 1's combinational core to the top-level structural integration and testbench—paired directly with how Vivado synthesizes every construct into Artix-7 hardware."
    >
      {/* File Tabs */}
      <div
        role="tablist"
        aria-label="Verilog HDL source files"
        className="mb-5 flex flex-wrap gap-2"
      >
        {VERILOG_FILES.map((file) => {
          const selected = file.id === activeFile.id;
          return (
            <button
              key={file.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveFileId(file.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs font-semibold transition ${
                selected
                  ? 'border-[#253d24] bg-[#253d24] text-[#f7f0e2] dark:border-[#e5c78a] dark:bg-[#e5c78a] dark:text-[#0c160d]'
                  : 'border-[#b59c6a]/40 bg-white/90 text-slate-700 hover:border-black/45 dark:border-[#e8cfa0]/16 dark:bg-[#0d190e]/90 dark:text-[#e8cfa0]/80 dark:hover:border-[#e8cfa0]/45'
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" />
              <span>{file.filename}</span>
            </button>
          );
        })}
      </div>

      {/* Selected File Banner */}
      <div className="glass-card mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-base font-bold text-slate-900 dark:text-[#e8cfa0]">
              {activeFile.filename}
            </h3>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
              {activeFile.badge}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#e8cfa0]/70">{activeFile.summary}</p>
        </div>
        <div className="font-mono text-xs text-slate-500 dark:text-[#e8cfa0]/60">
          {activeFile.subtitle}
        </div>
      </div>

      {/* Two-Column Code + Verilog-to-Hardware Mapping Table */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <VerilogCodeBlock
            code={activeFile.code}
            filename={activeFile.filename}
            maxHeightClass="max-h-[560px]"
            showDownload
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl border border-emerald-400/25 bg-[#04080e]/95 p-5 text-slate-100 shadow-[0_18px_48px_rgba(0,0,0,0.55)] lg:col-span-5">
          <div className="mb-4 flex items-center justify-between border-b border-emerald-400/20 pb-3">
            <div className="flex items-center gap-2 text-emerald-300">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">
                Verilog → Hardware Decode Map
              </h4>
            </div>
            <span className="rounded border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
              ARTIX-7 LUT/FF
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto">
            {activeFile.hardwareMappings.map((row, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-emerald-400/18 bg-[#07111b] p-3.5"
              >
                <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-emerald-300">
                  <span className="text-[10px] text-emerald-500/60">
                    0x{(idx * 16).toString(16).toUpperCase().padStart(2, '0')}
                  </span>
                  <span>{row.verilogConstruct}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-sky-50">
                  <span className="text-emerald-400">→</span>
                  <span>{row.hardwareRealization}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {row.notes}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3.5 font-mono text-[11px] text-emerald-100">
            <div className="font-bold uppercase tracking-wider text-emerald-300">
              Top-Level Synthesis Summary (Artix-7)
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-sky-100/85">
              <span>• State reg: 3 DFFs</span>
              <span>• case(): MUX tree</span>
              <span>• Shift reg: 40 DFFs</span>
              <span>• Sample cnt: 24-bit (5 s)</span>
              <span>• Enable if: 2:1 MUX + DFF</span>
              <span>• Total: &lt;0.7% LUTs</span>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
