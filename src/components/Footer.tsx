import React from 'react';
import { ArrowUp } from 'lucide-react';
import { CanopyVideoBackdrop } from '@/components/ui/canopy-video-backdrop';
import { PROJECT_META } from '../data/projectData';

export const Footer: React.FC = () => {
  return (
    <footer className="px-2 pb-3 pt-2.5 sm:px-3">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-2xl border border-[#b59c6a]/35 bg-[#071209]/70 px-6 py-12 text-[#f5efe0] shadow-[0_24px_64px_rgba(2,8,4,0.72)] backdrop-blur-[3px] md:rounded-[2rem] md:px-12 dark:border-[#e3c68a]/25">
        <CanopyVideoBackdrop subtle />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="font-serif text-4xl font-medium tracking-[0.06em] text-[#f7f0e2] sm:text-6xl">
              WEATHER<span className="align-top text-[0.35em] text-[#e3c68a]">*</span>
            </div>
            <div className="mt-3 max-w-xl text-xs text-[#ede3cd]/82 sm:text-sm">
              {PROJECT_META.title}
            </div>
            <div className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-[#e3c68a]/75">
              Course Code: <strong className="text-[#f7f0e2]">{PROJECT_META.courseCode}</strong> ·{' '}
              {PROJECT_META.courseName} · {PROJECT_META.college}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#code"
              className="rounded-full border border-[#e3c68a]/30 bg-[#0b160c]/65 px-4 py-2 font-mono text-xs text-[#f4e4c1] backdrop-blur transition hover:border-[#e3c68a]/70 hover:text-white"
            >
              Verilog RTL
            </a>
            <a
              href="#simulator"
              className="rounded-full border border-[#e3c68a]/30 bg-[#0b160c]/65 px-4 py-2 font-mono text-xs text-[#f4e4c1] backdrop-blur transition hover:border-[#e3c68a]/70 hover:text-white"
            >
              Simulator
            </a>
            <a
              href="#top"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#e5c78a] via-[#f0d9a7] to-[#f9eed5] py-1 pl-4 pr-1 text-xs font-medium text-[#0c160d] transition-all hover:gap-3"
            >
              Back to Top
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0e1b0f] text-[#f4e4c1] transition-transform group-hover:scale-110">
                <ArrowUp className="h-3.5 w-3.5" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
