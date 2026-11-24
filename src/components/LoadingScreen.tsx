import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const BOOT_STEPS = [
  'POWERING ON BASYS 3 ARTIX-7 FPGA...',
  'LOCKING 100 MHz SYSTEM CLOCK PLL...',
  'LOADING WEATHER_TOP.BIT BITSTREAM...',
  'INITIALIZING 5-STATE MOORE CONTROL FSM...',
  'CALIBRATING DHT11 54 µs THRESHOLD & LCD...'
];

export const LoadingScreen: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(reducedMotion ? 100 : 0);
  const [visible, setVisible] = useState(!reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(false);
      return;
    }

    const start = performance.now();
    const duration = 1150;
    let rafId = 0;

    const tick = (now: number) => {
      const pct = Math.min(100, Math.round(((now - start) / duration) * 100));
      setProgress(pct);
      if (pct < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => setVisible(false), 200);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion]);

  const stepIndex = Math.min(
    BOOT_STEPS.length - 1,
    Math.floor((progress / 100) * BOOT_STEPS.length)
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#050505] p-6 text-[#E1E0CC] sm:p-10"
          role="status"
          aria-live="polite"
        >
          <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.45] mix-blend-overlay" />

          <div className="relative z-10 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-[#E1E0CC]/60">
            <span>BAML24303 · ARTIX-7 XC7A35T</span>
            <span>GAT BENGALURU</span>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center">
            <div className="mb-3 font-medium leading-[0.88] tracking-[-0.06em] text-[15vw] text-[#E1E0CC] sm:text-8xl">
              Weather<span className="align-top text-[0.35em]">*</span>
            </div>
            <p className="mb-8 font-mono text-xs uppercase tracking-[0.16em] text-[#E1E0CC]/65">
              Powering on FPGA Weather Condition Detector...
            </p>

            {/* Hairline Editorial Progress Bar */}
            <div className="h-[3px] w-full max-w-md overflow-hidden rounded-full bg-[#E1E0CC]/15">
              <motion.div
                className="h-full bg-[#E1E0CC]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex w-full max-w-md items-center justify-between font-mono text-[11px] text-[#E1E0CC]/60">
              <span className="truncate pr-3">{BOOT_STEPS[stepIndex]}</span>
              <span className="font-bold text-[#E1E0CC]">{progress}%</span>
            </div>
          </div>

          <div className="relative z-10 flex justify-end">
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="group inline-flex items-center gap-2 rounded-full bg-[#E1E0CC] py-1 pl-4 pr-1 font-mono text-xs font-medium text-black transition-all hover:gap-3"
            >
              Skip
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[#E1E0CC]">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
