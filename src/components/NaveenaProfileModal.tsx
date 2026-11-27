import React, { useEffect, useRef, useState } from 'react';
import { Menu, Play, Sun, User, X } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface NaveenaProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAVEENA_PHOTO_SRC = `${import.meta.env.BASE_URL}naveena-photo.jpg`;
const GLOW_PLATE_URL =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/7e2a7695-c32b-4179-9c90-cae865819272.jpg';
const GLOW_VIDEO_URL =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/6ad9485f-ab40-444b-bd3c-40dcb9bd0e2f.mp4';

const PROFILE_NAV_LINKS = [
  { label: 'Overview', href: '#overview' },
  { label: 'DHT11 RTL', href: '#dht11' },
  { label: 'Control FSM', href: '#fsm' },
  { label: 'Live Weather', href: '#simulator' },
  { label: 'Verilog', href: '#code' }
];

export const NaveenaProfileModal: React.FC<NaveenaProfileModalProps> = ({ isOpen, onClose }) => {
  const reducedMotion = useReducedMotion();
  const [videoReady, setVideoReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const line1Ref = useRef<HTMLSpanElement | null>(null);
  const line2Ref = useRef<HTMLSpanElement | null>(null);
  const sublineRef = useRef<HTMLDivElement | null>(null);
  const btn1Ref = useRef<HTMLButtonElement | null>(null);
  const btn2Ref = useRef<HTMLButtonElement | null>(null);

  // ESC close + body scroll lock + reset transient states on close
  useEffect(() => {
    if (!isOpen) {
      setVideoReady(false);
      setMobileMenuOpen(false);
      return;
    }

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

  // 1.9s Web Animations API entrance choreography (skipped cleanly under prefers-reduced-motion)
  useEffect(() => {
    if (!isOpen || reducedMotion) return;

    const anims: Animation[] = [];
    const easeOut = 'cubic-bezier(0.16, 1, 0.3, 1)';

    const run = (
      el: Element | null,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions
    ) => {
      if (!el || typeof el.animate !== 'function') return;
      anims.push(el.animate(keyframes, { fill: 'both', easing: easeOut, ...options }));
    };

    // 1. Nav (logo, links, close/profile action) fades in
    run(
      navRef.current,
      [
        { opacity: 0, transform: 'translateY(-10px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 480, delay: 40 }
    );

    // 2. Portrait medallion + ember-glass badge open from center
    run(
      avatarRef.current,
      [
        { opacity: 0, transform: 'scale(0.84)' },
        { opacity: 1, transform: 'scale(1)' }
      ],
      { duration: 520, delay: 220 }
    );

    run(
      badgeRef.current,
      [
        { opacity: 0, transform: 'scaleX(0.35) scaleY(0.85)' },
        { opacity: 1, transform: 'scaleX(1) scaleY(1)' }
      ],
      { duration: 540, delay: 360 }
    );

    // 3. Headline lines wipe up out of clip
    run(
      line1Ref.current,
      [
        { opacity: 0, transform: 'translateY(115%)' },
        { opacity: 1, transform: 'translateY(0%)' }
      ],
      { duration: 640, delay: 620 }
    );

    run(
      line2Ref.current,
      [
        { opacity: 0, transform: 'translateY(115%)' },
        { opacity: 1, transform: 'translateY(0%)' }
      ],
      { duration: 640, delay: 780 }
    );

    // 4. Subline rises
    run(
      sublineRef.current,
      [
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 520, delay: 1080 }
    );

    // 5. Each button rises sequentially (~1.9s total)
    run(
      btn1Ref.current,
      [
        { opacity: 0, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 480, delay: 1320 }
    );

    run(
      btn2Ref.current,
      [
        { opacity: 0, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 480, delay: 1460 }
    );

    return () => {
      anims.forEach((a) => a.cancel());
    };
  }, [isOpen, reducedMotion]);

  const navigateToSection = (href: string) => {
    setMobileMenuOpen(false);
    onClose();
    const id = href.replace('#', '');
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Naveena Kanakannanavar Profile"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black text-white"
      style={{
        fontFamily: "'Anta', 'Inter', system-ui, sans-serif",
        ['--p' as string]: 'min(calc(100vw / 894), calc(100svh / 541))'
      }}
    >
      {/* Floor Gradient Under the Molten Solar Ring (rgb(255,150,40) -> deep ember -> pure black) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgb(255, 150, 40) 0%, rgba(196, 68, 12, 0.58) 14%, rgba(72, 18, 4, 0.24) 32%, #000000 58%)'
        }}
      />

      {/* Bottom-Anchored Molten Solar Ring Plate + Looping Motion Video (identical sizing) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden"
        style={{
          width: 'max(118vw, calc(906 * var(--p)))',
          height: 'max(54svh, calc(515 * var(--p)))',
          maxWidth: '1720px'
        }}
      >
        <img
          src={GLOW_PLATE_URL}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-bottom select-none"
        />

        {!reducedMotion && (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
            src={GLOW_VIDEO_URL}
            className="absolute inset-0 h-full w-full object-cover object-bottom transition-opacity duration-[800ms] ease-out"
            style={{ opacity: videoReady ? 1 : 0 }}
          />
        )}

        {/* Top seamless black feather so the pure-black upper sky blends invisibly */}
        <div
          className="absolute inset-x-0 top-0 h-24"
          style={{
            background: 'linear-gradient(to bottom, #000000 0%, transparent 100%)'
          }}
        />
      </div>

      {/* Top Navigation Bar (Pinned to Top) */}
      <header
        ref={navRef}
        className="absolute inset-x-0 top-0 z-30 mx-auto flex w-full max-w-[1380px] items-center justify-between px-5 py-4 sm:px-8 md:px-12 md:py-6"
      >
        {/* Left: Round White Logo Mark with Four-Point Sparkle Cut-Out + Name */}
        <button
          type="button"
          onClick={onClose}
          className="group flex items-center gap-2.5 text-left focus-visible:outline-none"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_0_20px_rgba(255,160,60,0.35)] transition group-hover:scale-105 sm:h-9 sm:w-9">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M12 2.5C12.8 8.1 15.9 11.2 21.5 12C15.9 12.8 12.8 15.9 12 21.5C11.2 15.9 8.1 12.8 2.5 12C8.1 11.2 11.2 8.1 12 2.5Z"
                fill="#030103"
              />
            </svg>
          </span>
          <span
            className="font-normal tracking-[0.02em] text-white"
            style={{ fontSize: 'clamp(1.25rem, calc(23.8 * var(--p)), 2.2rem)' }}
          >
            Naveena
          </span>
        </button>

        {/* Center Desktop Links */}
        <nav aria-label="Profile navigation" className="hidden items-center gap-7 md:flex">
          {PROFILE_NAV_LINKS.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => navigateToSection(item.href)}
              className="text-white/80 transition hover:text-white"
              style={{ fontSize: 'clamp(0.8rem, calc(10.7 * var(--p)), 1rem)' }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Desktop Action ("Close" with User/Close icon) */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-white/90 transition hover:border-[#ff9646]/70 hover:bg-[#ff9646]/20 hover:text-white"
            style={{ fontSize: 'clamp(0.8rem, calc(10.7 * var(--p)), 0.98rem)' }}
          >
            <User className="h-4 w-4 text-[#FAD53E]" />
            <span>Close</span>
            <X className="h-3.5 w-3.5 opacity-75" />
          </button>
        </div>

        {/* Mobile / Tablet Round Ember-Glass Burger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle profile menu"
          aria-expanded={mobileMenuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ff9646]/40 text-white transition md:hidden"
          style={{ backgroundColor: 'rgba(220, 110, 40, 0.22)' }}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Mobile Dark Ember Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className="absolute right-5 top-16 z-40 w-60 overflow-hidden rounded-2xl border border-[#ff9646]/35 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.85)] md:hidden"
            style={{ backgroundColor: 'rgba(24, 9, 2, 0.96)' }}
          >
            <div className="flex flex-col gap-1">
              {PROFILE_NAV_LINKS.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => navigateToSection(item.href)}
                  className="rounded-xl px-3.5 py-2.5 text-left text-sm text-white/85 transition hover:bg-[#ff9646]/20 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={onClose}
                className="mt-1 flex items-center justify-between rounded-xl border border-[#ff9646]/30 bg-white px-3.5 py-2 text-sm font-medium text-[#030103]"
              >
                <span>Close Profile</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Centered Hero Profile Content (Floats in Middle Above Rising Molten Ring) */}
      <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center px-5 pb-12 pt-16 text-center sm:px-8 md:pb-16">
        {/* Enlarged Circular Profile Portrait */}
        <div ref={avatarRef} className="mb-4 sm:mb-5">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-[3px] border-[#ffd89b] shadow-[0_0_32px_rgba(255,150,40,0.75),0_0_64px_rgba(220,90,20,0.45)] sm:h-40 sm:w-40">
            <img
              src={NAVEENA_PHOTO_SRC}
              alt="Naveena Kanakannanavar"
              className="h-full w-full scale-[1.28] object-cover object-[45%_42%]"
            />
          </div>
        </div>

        {/* Ember-Glass Pill Badge (Silver Glossy Stylish Font for USN + DDCO Project Title) */}
        <div
          ref={badgeRef}
          className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-[#d6e0f0]/40 px-2.5 py-1.5 shadow-[0_0_28px_rgba(220,110,40,0.32),inset_0_1px_0_rgba(255,255,255,0.35)]"
          style={{ backgroundColor: 'rgba(220, 110, 40, 0.16)' }}
        >
          <span
            className="rounded-full border border-white/35 bg-black/85 px-3 py-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <span className="text-silver-glossy text-[11px] font-bold tracking-[0.14em] sm:text-xs">
              1GA25AI030
            </span>
          </span>
          <span
            className="text-silver-glossy px-1.5 text-[11px] font-bold tracking-[0.06em] sm:text-xs"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Digital Design and Computer Organization Project
          </span>
          <Sun className="mr-1 h-4 w-4 shrink-0" style={{ color: '#FAD53E' }} />
        </div>

        {/* Clipped Two-Line Display Headline (Silver Glossy Stylish Font) */}
        <h1
          className="mt-4 sm:mt-5"
          style={{
            fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
            fontSize: 'clamp(1.7rem, calc(35 * var(--p)), 3.45rem)',
            lineHeight: 'clamp(2.15rem, calc(44 * var(--p)), 4.25rem)'
          }}
        >
          <span className="block overflow-hidden">
            <span
              ref={line1Ref}
              className="text-silver-glossy-shimmer block font-bold tracking-[0.04em]"
            >
              Naveena Kanakannanavar
            </span>
          </span>
          <span className="mt-1 block overflow-hidden">
            <span
              ref={line2Ref}
              className="text-silver-glossy block font-semibold tracking-[0.05em]"
              style={{ fontSize: 'clamp(1.02rem, calc(20 * var(--p)), 2rem)' }}
            >
              Artificial Intelligence and Machine Learning
            </span>
          </span>
        </h1>

        {/* Light-Blurred White Glass Plate with Sharp Black Glossy Typography */}
        <div
          ref={sublineRef}
          className="black-glossy-plate mt-4 w-full max-w-[740px] overflow-hidden rounded-2xl px-5 py-3.5 sm:mt-5 sm:px-7 sm:py-4"
        >
          {/* Subtle Top Glass Specular Sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.04) 100%)'
            }}
          />
          <div
            className="relative z-10 flex flex-col gap-1.5"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 'clamp(0.76rem, calc(10.8 * var(--p)), 0.98rem)',
              lineHeight: 1.5
            }}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 sm:justify-between">
              <span className="text-black-glossy-sharp font-bold tracking-[0.015em]">
                DHT11 Protocol &amp; Testbench Verification ·
              </span>
              <span className="text-black-glossy-sharp font-bold tracking-[0.015em]">
                Global Academy of Technology, Bengaluru
              </span>
            </div>
            <p className="text-black-glossy-sharp text-center font-bold tracking-[0.015em]">
              FPGA-Based Weather Condition Detector and Alert System Using Verilog HDL.
            </p>
          </div>
        </div>

        {/* Action Pill Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5 sm:mt-7">
          <button
            ref={btn1Ref}
            type="button"
            onClick={() => navigateToSection('#code')}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-normal tracking-wide text-[#030103] transition duration-200 hover:scale-[1.03] hover:shadow-[0_0_32px_rgba(255,150,40,0.82)] sm:px-7 sm:py-3"
          >
            Explore Verilog RTL
          </button>

          <button
            ref={btn2Ref}
            type="button"
            onClick={() => navigateToSection('#simulator')}
            className="inline-flex items-center gap-2 rounded-full border border-[#ff9646]/45 px-6 py-2.5 text-sm font-normal tracking-wide text-white transition duration-200 hover:scale-[1.03] hover:border-[#ffb366]/80 sm:px-7 sm:py-3"
            style={{ backgroundColor: 'rgba(255, 150, 70, 0.2)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 130, 45, 0.36)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 150, 70, 0.2)';
            }}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Live 3D Simulator</span>
          </button>
        </div>
      </div>
    </div>
  );
};
