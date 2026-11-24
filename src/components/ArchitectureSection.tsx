import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, Cpu, Eye, X } from 'lucide-react';
import { LightningVoiceButton } from '@/components/ui/lightning-voice-button';
import { SectionWrapper } from './SectionWrapper';
import { CanvasViewport } from '../scenes/CanvasViewport';
import { ArchitectureScene } from '../scenes/ArchitectureScene';
import { ARCHITECTURE_BLOCKS, ArchitectureBlock } from '../data/architectureData';
import { VerilogCodeBlock } from './VerilogCodeBlock';

gsap.registerPlugin(ScrollTrigger);

export const ArchitectureSection: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollProgressRef = useRef<number>(0);
  const [scrollStagePct, setScrollStagePct] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ArchitectureBlock | null>(null);
  const [freeOrbit, setFreeOrbit] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 15%',
      end: 'bottom 85%',
      scrub: true,
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
        setScrollStagePct(Math.round(self.progress * 100));
      }
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <SectionWrapper
      id="architecture"
      badge="02 · Exploded 3D System Architecture"
      title="Control-Path & Data-Path Hardware Pipeline"
      subtitle="Scroll to fly the camera through the exploded RTL blocks—or switch to Free Orbit, hover any module to lift it, and click to inspect its ports, Artix-7 resources, and Verilog RTL."
    >
      <div ref={scrollContainerRef} className="relative lg:min-h-[155vh]">
        <div className="lg:sticky lg:top-20">
          <div className="glass-card relative overflow-hidden">
            {/* Top Prisma Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#b59c6a]/35 bg-[#eee8d7]/90 px-4 py-3 dark:border-[#e8cfa0]/12 dark:bg-[#0f1d10]/95">
              <div className="flex flex-wrap items-center gap-1.5">
                {ARCHITECTURE_BLOCKS.map((blk) => {
                  const active = selectedBlock?.id === blk.id;
                  return (
                    <button
                      key={blk.id}
                      type="button"
                      onClick={() => {
                        setFreeOrbit(false);
                        setSelectedBlock((prev) => (prev?.id === blk.id ? null : blk));
                      }}
                      className={`rounded-full border px-3 py-1 font-mono text-[11px] font-medium transition ${
                        active
                          ? 'border-[#253d24] bg-[#253d24] text-[#f7f0e2] dark:border-[#e5c78a] dark:bg-[#e5c78a] dark:text-[#0c160d]'
                          : 'border-[#b59c6a]/40 bg-white/70 text-slate-700 hover:border-black/45 dark:border-[#e8cfa0]/18 dark:bg-[#d9ba7b]/140 dark:text-[#e8cfa0]/80 dark:hover:border-[#e8cfa0]/50'
                      }`}
                    >
                      {blk.shortName}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <LightningVoiceButton
                  compact
                  sceneId="architecture-3d"
                  sceneTitle={selectedBlock ? `3D Architecture · ${selectedBlock.name}` : '3D System Architecture'}
                  label={selectedBlock ? `Explain ${selectedBlock.shortName}` : 'Explain Architecture'}
                  script={
                    selectedBlock
                      ? `Inspecting the ${selectedBlock.name} block inside the Basys 3 RTL architecture. ${selectedBlock.functionDetail} Hardware resource footprint: ${selectedBlock.hardwareEstimate}.`
                      : `This exploded 3D architecture separates our Basys 3 FPGA design into a horizontal data path and an overhead control path. From left to right, the DHT11 and rain sensors feed the DHT11 Interface FSM, which shifts 40 serial bits into the 40-bit Data Register. Parallel magnitude comparators in the Condition Decoder classify temperature and humidity thresholds, then latch clean outputs into the Condition and Alert Registers. Finally, the LCD Driver FSM formats ASCII characters for the 16 by 2 LCD and tri-color alert LEDs. Sitting above the pipeline, the 5-state Moore Control FSM orchestrates every stage through deterministic start and done handshakes.`
                  }
                />
                <span className="hidden font-mono text-[11px] text-slate-500 sm:inline dark:text-[#e8cfa0]/55">
                  Flight: {scrollStagePct}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBlock(null);
                    setFreeOrbit((v) => !v);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 font-mono text-xs font-medium transition ${
                    freeOrbit
                      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-[#9e8450]/40 bg-white/80 text-slate-800 hover:border-black/50 dark:border-[#e8cfa0]/25 dark:bg-[#09130a]/86 dark:text-[#e8cfa0]'
                  }`}
                >
                  <Compass className="h-3.5 w-3.5" />
                  {freeOrbit ? 'Free Orbit ON' : 'Scroll Flight'}
                </button>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="relative">
              <CanvasViewport
                cameraPosition={[-8.5, 4.2, 8.6]}
                fov={44}
                className="h-[460px] w-full sm:h-[540px]"
                bloomIntensity={0.48}
                ariaLabel="Exploded 3D system architecture showing DHT11 and Rain sensors feeding into DHT11 FSM, 40-bit Data Register, Condition Decoder, Alert Registers, LCD FSM, and 16x2 LCD + LEDs with an overhead Control FSM sending start/done handshakes"
              >
                <ArchitectureScene
                  scrollProgressRef={scrollProgressRef}
                  hoveredId={hoveredId}
                  selectedId={selectedBlock?.id ?? null}
                  freeOrbit={freeOrbit}
                  onHover={setHoveredId}
                  onSelect={(blk) => {
                    setFreeOrbit(false);
                    setSelectedBlock(blk);
                  }}
                />
              </CanvasViewport>

              {/* Bottom Legend Pill */}
              <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2">
                <div className="rounded-full border border-[#e8cfa0]/25 bg-[#09130a]/86 px-3 py-1 font-mono text-[11px] text-[#e8cfa0] backdrop-blur">
                  <Eye className="mr-1.5 inline h-3 w-3" />
                  Hover a block to lift · Click to open RTL drawer
                </div>
                <div className="hidden rounded-full border border-[#e8cfa0]/15 bg-[#09130a]/82 px-3 py-1 font-mono text-[11px] text-[#e8cfa0]/70 backdrop-blur sm:block">
                  Solid arrows = Data Bus · Overhead arcs = Control Handshakes
                </div>
              </div>

              {/* Slide-Over Inspector Side Panel */}
              <AnimatePresence>
                {selectedBlock && (
                  <motion.aside
                    initial={{ x: '100%', opacity: 0.4 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0.4 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    className="absolute inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-[#b59c6a]/40 bg-white/96 p-5 shadow-2xl backdrop-blur-xl dark:border-[#e8cfa0]/18 dark:bg-[#0a140b]/96"
                    aria-label={`${selectedBlock.name} details`}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-[#b59c6a]/35 pb-3 dark:border-[#e8cfa0]/12">
                      <div>
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-black"
                          style={{ backgroundColor: selectedBlock.color }}
                        >
                          {selectedBlock.category}
                        </span>
                        <h3 className="mt-1.5 text-lg font-medium tracking-[-0.02em] text-slate-900 dark:text-[#e8cfa0]">
                          {selectedBlock.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedBlock(null)}
                        aria-label="Close module inspector"
                        className="rounded-full border border-[#9e8450]/40 p-1.5 text-slate-600 hover:border-black dark:border-[#e8cfa0]/25 dark:text-[#e8cfa0]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-[#e8cfa0]/75">
                        {selectedBlock.functionDetail}
                      </p>

                      <div className="flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-2 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                        <Cpu className="h-4 w-4 shrink-0" />
                        <span>{selectedBlock.hardwareEstimate}</span>
                      </div>

                      <div>
                        <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#e8cfa0]/55">
                          Interface Ports
                        </h4>
                        <div className="overflow-hidden rounded-xl border border-[#b59c6a]/35 dark:border-[#e8cfa0]/12">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#eee8d7] font-mono text-[10px] uppercase text-slate-500 dark:bg-[#112013] dark:text-[#e8cfa0]/60">
                              <tr>
                                <th className="px-2.5 py-1.5">Signal</th>
                                <th className="px-2.5 py-1.5">Dir</th>
                                <th className="px-2.5 py-1.5">Function</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#b59c6a]/25 dark:divide-[#e8cfa0]/10">
                              {selectedBlock.ports.map((p) => (
                                <tr key={p.name}>
                                  <td className="px-2.5 py-1.5 font-mono font-semibold text-slate-900 dark:text-[#e8cfa0]">
                                    {p.name}
                                  </td>
                                  <td className="px-2.5 py-1.5 font-mono text-[10px] text-amber-600 dark:text-amber-300">
                                    {p.dir}
                                  </td>
                                  <td className="px-2.5 py-1.5 text-slate-600 dark:text-[#e8cfa0]/70">
                                    {p.purpose}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#e8cfa0]/55">
                          Verilog RTL Snippet
                        </h4>
                        <VerilogCodeBlock
                          code={selectedBlock.verilogSnippet}
                          filename={`${selectedBlock.id}.v`}
                          maxHeightClass="max-h-52"
                        />
                      </div>
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
