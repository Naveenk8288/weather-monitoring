import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Compass, RotateCw, Sparkles } from 'lucide-react';
import { LightningVoiceButton } from '@/components/ui/lightning-voice-button';
import { SectionWrapper } from './SectionWrapper';
import { CanvasViewport } from '../scenes/CanvasViewport';
import { RoadmapScene } from '../scenes/RoadmapScene';
import {
  ADVANTAGES_AND_APPLICATIONS,
  FUTURE_ROADMAP,
  FlipCardItem,
  LIMITATIONS_LIST,
  RoadmapMilestone
} from '../data/projectData';
import { useReducedMotion } from '../hooks/useReducedMotion';

const FlipCard: React.FC<{ item: FlipCardItem }> = ({ item }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="perspective-1000 h-60">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={`${item.title}: click or press Enter to flip for details`}
        className={`preserve-3d relative h-full w-full cursor-pointer rounded-2xl text-left transition-transform duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8cfa0] ${
          flipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front Face */}
        <div className="backface-hidden glass-card absolute inset-0 flex flex-col justify-between p-5 hover:border-black/35 dark:hover:border-[#e8cfa0]/45">
          <div>
            <div className="flex items-center justify-between">
              <span
                className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-black"
                style={{ backgroundColor: item.accent }}
              >
                {item.category}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-[#e8cfa0]/45">
                <RotateCw className="h-3 w-3" /> Flip
              </span>
            </div>
            <h3 className="mt-3 text-lg font-medium tracking-[-0.02em] text-slate-900 dark:text-[#e8cfa0]">
              {item.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#e8cfa0]/60">{item.tagline}</p>
          </div>

          <ul className="space-y-1.5 border-t border-[#b59c6a]/35 pt-3 dark:border-[#e8cfa0]/12">
            {item.frontPoints.map((pt) => (
              <li
                key={pt}
                className="flex items-center gap-2 text-xs text-slate-700 dark:text-[#e8cfa0]/75"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.accent }} />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Back Face — Matte Prisma Obsidian */}
        <div
          className="backface-hidden rotate-y-180 glass-card absolute inset-0 flex flex-col justify-between border-[#e8cfa0]/35 p-5"
          style={{
            background: 'linear-gradient(145deg, #132415, #071008)'
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase" style={{ color: item.accent }}>
                {item.title}
              </span>
              <span className="rounded-full bg-[#e8cfa0]/15 px-2.5 py-0.5 font-mono text-[10px] text-[#e8cfa0]">
                {item.metric}
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#e8cfa0]/85 sm:text-[13px]">
              {item.backDetail}
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-[#e8cfa0]/15 pt-2.5 font-mono text-[10px] text-[#e8cfa0]/55">
            <span>RTL Hardware Advantage</span>
            <span>Click to flip back ↺</span>
          </div>
        </div>
      </button>
    </div>
  );
};

export const ApplicationsSection: React.FC = () => {
  const [selectedMilestone, setSelectedMilestone] = useState<RoadmapMilestone>(FUTURE_ROADMAP[0]);
  const reducedMotion = useReducedMotion();

  return (
    <SectionWrapper
      id="applications"
      badge="10 · Impact, Limitations & 3D Future Roadmap"
      title="Advantages, Applications & Next-Gen FPGA Roadmap"
      subtitle="Flip any card below to inspect real-world engineering deployments, examine current hardware boundaries, and explore our interactive 3D upgrade roadmap."
    >
      {/* Flip Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ADVANTAGES_AND_APPLICATIONS.map((item) => (
          <FlipCard key={item.id} item={item} />
        ))}
      </div>

      {/* Limitations + 3D Future Scope Roadmap */}
      <div className="mt-12 grid gap-5 lg:grid-cols-12">
        <div className="glass-card p-6 lg:col-span-4">
          <div className="mb-4 flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">
              Current Prototype Limitations
            </h3>
          </div>
          <div className="space-y-3">
            {LIMITATIONS_LIST.map((lim) => (
              <div
                key={lim.title}
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5"
              >
                <h4 className="text-sm font-semibold text-slate-900 dark:text-[#e8cfa0]">{lim.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-[#e8cfa0]/70">
                  {lim.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card overflow-hidden lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#b59c6a]/35 bg-[#eee8d7]/90 px-5 py-3 dark:border-[#e8cfa0]/12 dark:bg-[#0f1d10]/95">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-slate-900 dark:text-[#e8cfa0]" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-[#e8cfa0]">
                Interactive 3D Future Scope Roadmap
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LightningVoiceButton
                compact
                sceneId="roadmap-3d"
                sceneTitle={`3D Future Roadmap · ${selectedMilestone.title}`}
                label="Explain Roadmap"
                script={`This ascending 3D roadmap highlights four hardware extensions for our Basys 3 FPGA weather system. Phase 1 introduces programmable temperature and humidity thresholds via slide switches or UART. Phase 2 connects an ESP32 Wi-Fi gateway for real-time MQTT cloud logging. Phase 3 uses Artix-7 on-chip Block RAM as a 24-hour circular history buffer. Phase 4 adds a multi-tone PWM piezo siren for audible alarm escalation. Currently selected is ${selectedMilestone.step}, ${selectedMilestone.title}: ${selectedMilestone.description}`}
              />
              {FUTURE_ROADMAP.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMilestone(m)}
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] font-semibold transition ${
                    selectedMilestone.id === m.id
                      ? 'border-[#253d24] bg-[#253d24] text-[#f7f0e2] dark:border-[#e5c78a] dark:bg-[#e5c78a] dark:text-[#0c160d]'
                      : 'border-[#b59c6a]/40 bg-white/75 text-slate-700 dark:border-[#e8cfa0]/20 dark:bg-[#d9ba7b]/140 dark:text-[#e8cfa0]/75'
                  }`}
                >
                  {m.step}
                </button>
              ))}
            </div>
          </div>

          <CanvasViewport
            cameraPosition={[0, 3.2, 9.6]}
            fov={42}
            className="h-[340px] w-full sm:h-[380px]"
            bloomIntensity={0.5}
            ariaLabel="Interactive 3D ascending roadmap showing Phase 1 Programmable Thresholds, Phase 2 ESP32 Cloud Logging, Phase 3 BRAM History Buffer, and Phase 4 Audible PWM Buzzer"
          >
            <RoadmapScene activeId={selectedMilestone.id} onSelect={setSelectedMilestone} />
          </CanvasViewport>

          <div className="border-t border-[#b59c6a]/35 p-5 dark:border-[#e8cfa0]/12">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-0.5 font-mono text-xs font-bold text-black"
                  style={{ backgroundColor: selectedMilestone.color }}
                >
                  {selectedMilestone.step}
                </span>
                <h4 className="text-base font-medium text-slate-900 dark:text-[#e8cfa0]">
                  {selectedMilestone.title}
                </h4>
              </div>
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                {selectedMilestone.hardwareChange}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#e8cfa0]/70">
              {selectedMilestone.description}
            </p>
          </div>
        </div>
      </div>

      {/* Conclusion Card */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="glass-card mt-10 p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 text-slate-900 dark:text-[#e8cfa0]">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">Conclusion</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-[#e8cfa0]/80 sm:text-base">
          This project demonstrates how clean digital design principles—strict Control-Path /
          Data-Path partitioning, Moore finite state machines, microsecond-accurate single-wire
          protocol decoding with hardware checksum gating, and clock-enabled flip-flops with
          asynchronous reset—combine inside a Xilinx Artix-7 FPGA to deliver a fast, reliable, and
          extensible weather condition detector and alert system using less than 1% of the Basys 3
          logic fabric.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Control FSM', val: '5 Moore States (3 DFFs)' },
            { label: 'DHT11 Capture', val: '40-Bit SIPO + 54 µs Gate' },
            { label: 'Evaluation Latency', val: '1 Clock Cycle (10 ns)' },
            { label: 'Artix-7 Footprint', val: '< 0.7% LUT Utilization' }
          ].map((stat) => (
            <div key={stat.label} className="glass-subtle flex items-center gap-2.5 px-3.5 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <div className="font-mono text-[10px] uppercase text-slate-500 dark:text-[#e8cfa0]/50">
                  {stat.label}
                </div>
                <div className="font-mono text-xs font-bold text-slate-900 dark:text-[#e8cfa0]">
                  {stat.val}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </SectionWrapper>
  );
};
