import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cpu, ScanEye, Sparkles, X } from 'lucide-react';

interface NaveenaProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STUDIO_IMG = `${import.meta.env.BASE_URL}naveena-studio.jpg`;
const CYBER_IMG = `${import.meta.env.BASE_URL}naveena-cyber.jpg`;

export const NaveenaProfileModal: React.FC<NaveenaProfileModalProps> = ({ isOpen, onClose }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [fullCyber, setFullCyber] = useState(false);
  const [pointerActive, setPointerActive] = useState(false);
  const [spot, setSpot] = useState({ x: 52, y: 58 });

  const targetRef = useRef({ x: 52, y: 58 });
  const currentRef = useRef({ x: 52, y: 58 });
  const pointerActiveRef = useRef(false);

  // Escape key close + body scroll lock
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

  // Smooth inertia spotlight loop + gentle autonomous showcase sweep until user hovers
  useEffect(() => {
    if (!isOpen) return;
    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      if (!pointerActiveRef.current) {
        const t = (now - startTime) * 0.001;
        // Trace across cheek -> neck -> right shoulder -> chest just like the reference animation
        const cx = 50 + Math.sin(t * 0.85) * 11;
        const cy = 54 + Math.sin(t * 1.35 + 0.6) * 20;
        targetRef.current = { x: cx, y: cy };
      }

      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.14;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.14;

      setSpot({
        x: Math.round(currentRef.current.x * 10) / 10,
        y: Math.round(currentRef.current.y * 10) / 10
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

  const updatePointerFromClient = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const py = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    pointerActiveRef.current = true;
    setPointerActive(true);
    targetRef.current = { x: px, y: py };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updatePointerFromClient(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    pointerActiveRef.current = false;
    setPointerActive(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (touch) {
      updatePointerFromClient(touch.clientX, touch.clientY);
    }
  };

  const handleJumpToCode = () => {
    onClose();
    window.setTimeout(() => {
      document.getElementById('code')?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  const maskValue = fullCyber
    ? 'none'
    : `radial-gradient(circle 155px at ${spot.x}% ${spot.y}%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 36%, rgba(0,0,0,0.45) 68%, rgba(0,0,0,0) 100%)`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Naveena Kanakannanavar Interactive Profile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/92 p-2 sm:p-5"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[1160px] overflow-hidden rounded-[1.5rem] border border-orange-400/30 bg-[#120401] shadow-[0_32px_100px_rgba(0,0,0,0.95)] sm:rounded-[2rem]"
          >
            {/* Interactive Studio + Cybernetic X-Ray Hero Stage */}
            <div
              ref={stageRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleTouchMove}
              className="relative aspect-[16/10] min-h-[440px] w-full cursor-crosshair select-none overflow-hidden bg-gradient-to-r from-[#f26a00] via-[#cc2200] to-[#7a0300] sm:aspect-[16/9]"
            >
              {/* Layer 1: Clean Studio Portrait of Naveena Kanakannanavar */}
              <img
                src={STUDIO_IMG}
                alt="Naveena Kanakannanavar"
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
              />

              {/* Layer 2: Pixel-Aligned Cybernetic X-Ray Reveal Following Cursor */}
              <img
                src={CYBER_IMG}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300"
                style={{
                  WebkitMaskImage: maskValue,
                  maskImage: maskValue
                }}
              />

              {/* Layer 3: Subtle Warm Ember Glow Under Active Scan Lens */}
              {!fullCyber && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 mix-blend-screen"
                  style={{
                    background: `radial-gradient(circle 165px at ${spot.x}% ${spot.y}%, rgba(255, 136, 28, 0.24) 0%, rgba(255, 82, 0, 0.08) 52%, transparent 74%)`
                  }}
                />
              )}

              {/* Subtle Edge Contrast Gradients so Left Copy & Right Orbital Stats Stay Crisp */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#d44400]/55 via-transparent to-[#520100]/45"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/65 via-black/20 to-transparent"
              />

              {/* Top Centered Floating Obsidian Pill Bar (Matches Reference UI) */}
              <div className="absolute left-1/2 top-3.5 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-black/88 px-2 py-1.5 text-[11px] text-white/80 shadow-[0_12px_36px_rgba(0,0,0,0.65)] sm:top-5 sm:gap-4 sm:px-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-black">
                  <Cpu className="h-3.5 w-3.5" />
                </span>
                <span className="hidden whitespace-nowrap font-medium text-white sm:inline">
                  Profile
                </span>
                <span className="hidden whitespace-nowrap text-white/70 md:inline">
                  1GA25AI030
                </span>
                <span className="hidden whitespace-nowrap text-white/70 md:inline">
                  DHT11 RTL
                </span>
                <span className="hidden whitespace-nowrap text-white/70 lg:inline">
                  Basys 3 FPGA
                </span>
                <button
                  type="button"
                  onClick={() => setFullCyber((v) => !v)}
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold transition ${
                    fullCyber
                      ? 'border-orange-400 bg-orange-500/25 text-orange-200'
                      : 'border-white/20 bg-white/10 text-white/90 hover:border-white/50'
                  }`}
                >
                  <ScanEye className="h-3 w-3" />
                  {fullCyber ? 'Full Cyber ON' : 'Hover Scan'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close profile showcase"
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white px-3.5 py-1 text-[11px] font-semibold text-black transition hover:bg-orange-100"
                >
                  Close
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Right Concentric Orbital Arcs + Telemetry Stat Nodes (Matches Reference UI) */}
              <svg
                aria-hidden="true"
                viewBox="0 0 1160 652"
                preserveAspectRatio="xMaxYMid slice"
                className="pointer-events-none absolute inset-0 z-10 h-full w-full"
              >
                <motion.circle
                  cx="690"
                  cy="315"
                  r="415"
                  fill="none"
                  stroke="rgba(255,255,255,0.28)"
                  strokeWidth="1.2"
                  strokeDasharray="2610"
                  initial={{ strokeDashoffset: 2610, opacity: 0 }}
                  animate={{ strokeDashoffset: 0, opacity: 1 }}
                  transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.circle
                  cx="690"
                  cy="315"
                  r="345"
                  fill="none"
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="1"
                  strokeDasharray="2170"
                  initial={{ strokeDashoffset: 2170, opacity: 0 }}
                  animate={{ strokeDashoffset: 0, opacity: 1 }}
                  transition={{ duration: 1.3, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Orbital Marker Dots */}
                <circle cx="888" cy="72" r="4" fill="#ffffff" />
                <circle cx="1040" cy="315" r="4" fill="#ffffff" />
                <circle cx="964" cy="560" r="4" fill="#ffffff" />
              </svg>

              {/* Right Orbital Stat Callouts */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="pointer-events-none absolute right-[10%] top-[10%] z-20 hidden text-left text-white sm:block"
              >
                <div className="text-2xl font-medium tracking-tight md:text-3xl">40-bit</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/75">
                  DHT11 PROTOCOL
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38, duration: 0.5 }}
                className="pointer-events-none absolute right-[3.5%] top-[44%] z-20 hidden text-left text-white sm:block"
              >
                <div className="text-2xl font-medium tracking-tight md:text-3xl">100 MHz</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/75">
                  ARTIX-7 CLOCK
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="pointer-events-none absolute right-[5.5%] bottom-[9%] z-20 hidden text-left text-white sm:block"
              >
                <div className="text-2xl font-medium tracking-tight md:text-3xl">100%</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/75">
                  RTL VERIFIED
                </div>
              </motion.div>

              {/* Lower-Left Editorial Typography Overlay (Matches Reference UI) */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-5 left-5 z-20 max-w-[300px] text-white sm:bottom-8 sm:left-8 sm:max-w-[340px]"
              >
                <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-white/80 uppercase">
                  Gateway to hardware precision
                </div>
                <h2 className="text-3xl font-medium leading-[1.04] tracking-[-0.03em] text-white sm:text-4xl md:text-[2.6rem]">
                  A window
                  <br />
                  of coming
                  <br />
                  enhancements
                </h2>
                <p className="mt-3 text-[11px] leading-[1.45] text-white/85 sm:text-xs">
                  DHT11 single-wire protocol decoding, 40-bit checksum verification, and real-time
                  Verilog RTL weather engineering at Global Academy of Technology.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleJumpToCode}
                    className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:scale-[1.02] hover:bg-orange-50"
                  >
                    Explore Verilog RTL
                  </button>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/45 px-3 py-1.5 font-mono text-[10px] text-white/85">
                    <Sparkles className="h-3 w-3 text-orange-300" />
                    {pointerActive ? 'Scanning live' : 'Move cursor over portrait'}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Dedicated Nameplate Directly Below the Photo */}
            <div className="flex flex-col items-center justify-between gap-2 border-t border-orange-400/25 bg-gradient-to-r from-[#170501] via-[#220802] to-[#120301] px-6 py-4 text-center sm:flex-row sm:px-8 sm:text-left">
              <div>
                <h3 className="font-serif text-2xl font-semibold tracking-[0.02em] text-white sm:text-3xl">
                  Naveena Kanakannanavar
                </h3>
                <p className="mt-0.5 font-mono text-[11px] tracking-wider text-orange-200/80">
                  USN: 1GA25AI030 · DHT11 Protocol &amp; Testbench Verification · Dept. of AI &amp; ML
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-orange-200/80">
                <span className="rounded-full border border-orange-400/35 bg-orange-500/15 px-3 py-1 font-semibold text-orange-200">
                  BAML24303 · GAT Bengaluru
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
