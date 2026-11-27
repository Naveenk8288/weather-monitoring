import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Building2, GraduationCap, MapPin, UserCheck, Users } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { NaveenaProfileModal } from './NaveenaProfileModal';
import { PROJECT_META } from '../data/projectData';
import { useReducedMotion } from '../hooks/useReducedMotion';

const NAVEENA_USN = '1GA25AI030';
const NAVEENA_PHOTO_SRC = `${import.meta.env.BASE_URL}naveena-photo.jpg`;

export const TeamSection: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const [naveenaOpen, setNaveenaOpen] = useState(false);

  return (
    <SectionWrapper
      id="team"
      badge="11 · Project Team & Institution"
      title="Department of AI & ML · Global Academy of Technology"
      subtitle={`Submitted for ${PROJECT_META.courseName} (${PROJECT_META.courseCode}) under the mentorship of ${PROJECT_META.facultyGuide}.`}
    >
      {/* 4 Student Team Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PROJECT_META.team.map((member, idx) => {
          const isNaveena = member.usn === NAVEENA_USN;

          return (
            <motion.div
              key={member.usn}
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              role={isNaveena ? 'button' : undefined}
              tabIndex={isNaveena ? 0 : undefined}
              onClick={isNaveena ? () => setNaveenaOpen(true) : undefined}
              onKeyDown={
                isNaveena
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setNaveenaOpen(true);
                      }
                    }
                  : undefined
              }
              aria-label={isNaveena ? 'Open Naveena Kanakannanavar profile card' : undefined}
              className={`glass-card flex flex-col justify-between p-5 transition ${
                isNaveena
                  ? 'group cursor-pointer hover:-translate-y-1 hover:border-[#6b9bff]/75 hover:shadow-[0_16px_40px_rgba(56,189,248,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9bff]'
                  : 'hover:border-black/35 dark:hover:border-[#e8cfa0]/45'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  {isNaveena ? (
                    <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[#8fdfff] shadow-[0_0_16px_rgba(56,189,248,0.6)]">
                      <img
                        src={NAVEENA_PHOTO_SRC}
                        alt="Naveena Kanakannanavar"
                        className="h-full w-full scale-[1.26] object-cover object-[45%_42%] transition duration-300 group-hover:scale-[1.34]"
                      />
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#b59c6a]/40 bg-black font-mono text-xs font-bold text-[#e8cfa0] dark:border-[#e8cfa0]/25 dark:bg-[#e5c78a] dark:text-[#0c160d]">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <span className="rounded-full border border-[#b59c6a]/40 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-800 dark:border-[#e8cfa0]/20 dark:text-[#e8cfa0]">
                    {member.usn}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-medium tracking-[-0.02em] text-slate-900 dark:text-[#e8cfa0]">
                  {member.name}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-[#e8cfa0]/65">{member.role}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-1.5 border-t border-[#b59c6a]/35 pt-3 font-mono text-[10px] text-slate-500 dark:border-[#e8cfa0]/12 dark:text-[#e8cfa0]/55">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Dept. of AI &amp; ML</span>
                </span>
                {isNaveena && (
                  <span className="rounded-full border border-[#6b9bff]/45 bg-[#122244]/85 px-2.5 py-0.5 font-semibold text-[#9bb8ff] transition group-hover:border-[#9be7ff] group-hover:text-white">
                    View Profile
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Naveena Kanakannanavar Profile Modal */}
      <NaveenaProfileModal isOpen={naveenaOpen} onClose={() => setNaveenaOpen(false)} />

      {/* Faculty Guide + Institution + NAAC Badge Placeholder */}
      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <div className="glass-card flex flex-col justify-between p-6 lg:col-span-5">
          <div>
            <div className="lab-badge w-fit">
              <UserCheck className="h-3.5 w-3.5" />
              Faculty Guide
            </div>
            <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-slate-900 dark:text-[#e8cfa0]">
              {PROJECT_META.facultyGuide}
            </h3>
            <p className="mt-1.5 text-sm text-slate-700 dark:text-[#e8cfa0]/75">
              {PROJECT_META.courseName} ({PROJECT_META.courseCode})
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#e8cfa0]/55">
              {PROJECT_META.department}
            </p>
          </div>
          <div className="glass-subtle mt-5 flex items-center gap-2 px-3.5 py-2.5 font-mono text-xs text-slate-700 dark:text-[#e8cfa0]/75">
            <GraduationCap className="h-4 w-4" />
            <span>Guided RTL Design, FSM Synthesis &amp; Verification</span>
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between p-6 lg:col-span-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-[#e8cfa0]/75">
                <Building2 className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">
                  Institution
                </span>
              </div>
              <h3 className="mt-2 text-xl font-medium tracking-[-0.02em] text-slate-900 dark:text-[#e8cfa0]">
                {PROJECT_META.college}
              </h3>
              <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {PROJECT_META.department}
              </p>
              <div className="mt-2.5 flex items-start gap-2 text-xs text-slate-600 dark:text-[#e8cfa0]/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{PROJECT_META.address}</span>
              </div>
            </div>

            {/* NAAC Accreditation Badge Placeholder */}
            <div
              className="flex shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-500/55 bg-amber-500/10 px-5 py-4 text-center"
              aria-label="NAAC Accreditation Badge Placeholder"
            >
              <Award className="h-8 w-8 text-amber-500" />
              <div className="mt-1.5 font-mono text-xs font-extrabold tracking-wider text-amber-700 dark:text-amber-300">
                NAAC BADGE
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-slate-500 dark:text-[#e8cfa0]/60">
                Accredited · Autonomous
              </div>
              <div className="mt-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[9px] text-amber-700 dark:text-amber-200">
                Placeholder Seal
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#b59c6a]/35 pt-4 font-mono text-[11px] text-slate-500 dark:border-[#e8cfa0]/12 dark:text-[#e8cfa0]/55">
            <span>Course: {PROJECT_META.courseCode} · DDCO</span>
            <span>FPGA Platform: Xilinx Artix-7 Basys 3</span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
