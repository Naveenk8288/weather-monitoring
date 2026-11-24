import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, CheckCircle2, GitBranch, Target } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { EVOLUTION_TIMELINE, OVERVIEW_CONTENT } from '../data/projectData';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const OverviewSection: React.FC = () => {
  const reducedMotion = useReducedMotion();

  return (
    <SectionWrapper
      id="overview"
      badge="01 · Engineering Overview"
      title="From Combinational Comparators to a Complete Sequential FPGA System"
      subtitle="Digital Design and Computer Organization (BAML24303) — designed to replace jitter-prone microcontroller polling loops with deterministic Artix-7 Verilog hardware."
    >
      {/* Abstract, Problem Statement & Objectives */}
      <div className="grid gap-5 lg:grid-cols-3">
        <motion.article
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="mb-3 flex items-center gap-2 text-slate-800 dark:text-[#e8cfa0]">
            <BookOpen className="h-4 w-4" />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">Abstract</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-[#e8cfa0]/75 sm:text-[15px]">
            {OVERVIEW_CONTENT.abstract}
          </p>
        </motion.article>

        <motion.article
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="glass-card border-amber-500/25 p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">
              Problem Statement
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-[#e8cfa0]/75">
            {OVERVIEW_CONTENT.problemStatement}
          </p>
        </motion.article>
      </div>

      {/* Objectives Strip */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="glass-card mt-5 p-6"
      >
        <div className="mb-4 flex items-center gap-2 text-slate-800 dark:text-[#e8cfa0]">
          <Target className="h-4 w-4 text-emerald-500" />
          <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">
            Design Objectives
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {OVERVIEW_CONTENT.objectives.map((obj, idx) => (
            <div key={idx} className="glass-subtle flex items-start gap-3 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-sm leading-relaxed text-slate-700 dark:text-[#e8cfa0]/80">{obj}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Assignment 1 -> Assignment 2 Evolution Timeline */}
      <div className="mt-12">
        <div className="mb-6 flex items-center gap-2.5">
          <GitBranch className="h-4 w-4 text-slate-600 dark:text-[#e8cfa0]" />
          <h3 className="text-2xl font-medium tracking-[-0.03em] text-slate-900 dark:text-[#e8cfa0]">
            Architecture Evolution: Assignment 1 → Assignment 2
          </h3>
        </div>

        <div className="relative grid gap-5 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-10 right-10 top-10 hidden h-px bg-black/15 dark:bg-[#e8cfa0]/20 lg:block" />

          {EVOLUTION_TIMELINE.map((stage, idx) => (
            <motion.div
              key={stage.phase}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              className="glass-card relative flex flex-col p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#253d24] px-3 py-1 font-mono text-[11px] font-semibold text-[#e8cfa0] dark:bg-[#e5c78a] dark:text-[#0c160d]">
                  {stage.phase}
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-[#e8cfa0]/55">
                  {stage.badge}
                </span>
              </div>

              <h4 className="text-lg font-medium tracking-[-0.02em] text-slate-900 dark:text-[#e8cfa0]">
                {stage.title}
              </h4>
              <div className="mt-1 font-mono text-xs text-slate-500 dark:text-[#e8cfa0]/60">
                {stage.module}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-[#e8cfa0]/70">
                {stage.description}
              </p>

              <ul className="mt-4 space-y-2 border-t border-[#b59c6a]/35 pt-4 dark:border-[#e8cfa0]/12">
                {stage.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-2 text-xs text-slate-600 dark:text-[#e8cfa0]/75"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: stage.accent }}
                    />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};
