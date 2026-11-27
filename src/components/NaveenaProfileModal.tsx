import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface NaveenaProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAVEENA_PHOTO_SRC = `${import.meta.env.BASE_URL}naveena-photo.jpg`;

export const NaveenaProfileModal: React.FC<NaveenaProfileModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Naveena Kanakannanavar Profile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[460px] overflow-hidden rounded-[2rem] border border-[#3d4d82]/50 bg-gradient-to-b from-[#111932] via-[#0c0e1b] to-[#08090e] px-6 pb-7 pt-9 text-white shadow-[0_28px_90px_rgba(0,0,0,0.92)] sm:px-7"
          >
            {/* Subtle Radial Top Blue-Cyan Glow Behind Avatar */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-64 w-72 -translate-x-1/2"
              style={{
                background:
                  'radial-gradient(circle at 50% 42%, rgba(56, 189, 248, 0.24), rgba(59, 130, 246, 0.08) 52%, transparent 74%)'
              }}
            />

            {/* Top-Right Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile dialog"
              className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/85 transition hover:border-white/35 hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Centered Circular Photo Medallion with Glowing Cyan Ring */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-b from-[#04182b] via-[#061a2e] to-[#041220] shadow-[0_0_55px_rgba(56,189,248,0.28)]">
                {/* Subtle Orbital Accent Rings */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 180 180"
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
                >
                  <circle
                    cx="90"
                    cy="90"
                    r="86"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.22)"
                    strokeWidth="1"
                  />
                  <path
                    d="M 28 32 A 80 80 0 0 1 112 14"
                    fill="none"
                    stroke="rgba(96, 165, 250, 0.32)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 152 148 A 80 80 0 0 1 68 166"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.28)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Glowing White-Cyan Photo Frame */}
                <div className="relative h-[118px] w-[118px] overflow-hidden rounded-full border-[3px] border-[#b7efff] shadow-[0_0_22px_rgba(56,189,248,0.9),0_0_46px_rgba(56,189,248,0.45)]">
                  <img
                    src={NAVEENA_PHOTO_SRC}
                    alt="Naveena Kanakannanavar"
                    className="h-full w-full scale-[1.22] object-cover object-[45%_44%]"
                  />
                </div>
              </div>

              {/* Project Badge Pill */}
              <div className="mt-6 rounded-full border border-[#6b9bff]/60 bg-[#111f3d]/90 px-5 py-2 text-center shadow-[0_0_26px_rgba(99,144,255,0.28)]">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#8ca8ff] sm:text-xs">
                  Digital Design and Computer Organization Project
                </span>
              </div>
            </div>

            {/* Structured Student Details Card */}
            <div className="relative z-10 mt-6 rounded-[1.5rem] border border-white/12 bg-[#0d0e15] px-6 py-5 shadow-inner">
              {/* NAME */}
              <div className="pb-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Name
                </div>
                <div className="mt-1.5 text-2xl font-bold tracking-[-0.02em] leading-tight">
                  <span className="text-white">Naveena </span>
                  <span className="text-[#8ea5ff]">Kanakannanavar</span>
                </div>
              </div>

              {/* USN */}
              <div className="border-t border-dashed border-white/10 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  USN
                </div>
                <div className="mt-1.5 font-mono text-xl font-bold tracking-[0.1em] text-[#8399ff]">
                  1GA25AI030
                </div>
              </div>

              {/* BRANCH */}
              <div className="border-t border-dashed border-white/10 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Branch
                </div>
                <div className="mt-1.5 text-xl font-bold leading-snug text-white">
                  Artificial Intelligence and Machine Learning
                </div>
              </div>

              {/* ROLE */}
              <div className="border-t border-dashed border-white/10 pt-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Course &amp; Role
                </div>
                <div className="mt-1.5 text-sm font-semibold text-slate-200">
                  DHT11 Protocol &amp; Testbench Verification ·{' '}
                  <span className="font-mono text-[#8ea5ff]">BAML24303</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
