import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---------------- WordsPullUp ---------------- */
export interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({
  text,
  className = '',
  showAsterisk = false,
  style
}: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(' ');

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative inline-block"
            style={{ marginRight: isLast ? 0 : '0.25em' }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute -right-[0.3em] top-[0.65em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
export interface Segment {
  text: string;
  className?: string;
}

export interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
}

export const WordsPullUpMultiStyle = ({
  segments,
  className = '',
  style
}: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(' ').forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ''}`}
          style={{ marginRight: '0.25em' }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- PrismaHero ---------------- */
export interface PrismaNavItem {
  label: string;
  href: string;
}

export interface PrismaHeroProps {
  id?: string;
  title?: string;
  showAsterisk?: boolean;
  eyebrow?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  navItems?: PrismaNavItem[];
  videoSrc?: string;
  posterSrc?: string;
  topRightSlot?: React.ReactNode;
  className?: string;
}

const DEFAULT_NAV_ITEMS: PrismaNavItem[] = [
  { label: 'Our story', href: '#' },
  { label: 'Collective', href: '#' },
  { label: 'Workshops', href: '#' },
  { label: 'Programs', href: '#' },
  { label: 'Inquiries', href: '#' }
];

const DEFAULT_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4';

const PrismaHero = ({
  id,
  title = 'Prisma',
  showAsterisk = true,
  eyebrow,
  description = 'Prisma is a worldwide network of visual artists, filmmakers and storytellers bound not by place, status or labels but by passion and hunger to unlock potential through our unique perspectives.',
  ctaLabel = 'Join the lab',
  ctaHref,
  onCtaClick,
  navItems = DEFAULT_NAV_ITEMS,
  videoSrc = DEFAULT_VIDEO_SRC,
  posterSrc,
  topRightSlot,
  className
}: PrismaHeroProps) => {
  const handleCta = () => {
    if (onCtaClick) {
      onCtaClick();
      return;
    }
    if (ctaHref) {
      const target = document.querySelector(ctaHref);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      id={id}
      className={cn(
        'h-screen w-full bg-[#F3F2E8] p-2 sm:p-3 dark:bg-[#050505]',
        className
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#070d18] md:rounded-[2rem]">
        {/* Background video with dark ambient fallback */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={posterSrc}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
        />

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/75" />

        {/* Top centered notch Navbar */}
        <nav
          aria-label="Landing quick navigation"
          className="absolute left-1/2 top-0 z-20 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 whitespace-nowrap rounded-b-2xl bg-black px-4 py-2 sm:gap-6 md:gap-10 md:rounded-b-3xl md:px-8 lg:gap-12">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[10px] font-medium transition-colors sm:text-xs md:text-sm"
                style={{ color: 'rgba(225, 224, 204, 0.8)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E1E0CC')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'rgba(225, 224, 204, 0.8)')
                }
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Optional top-right slot (e.g., course pill / theme toggle) */}
        {topRightSlot && (
          <div className="absolute right-4 top-4 z-20 hidden sm:flex sm:items-center sm:gap-2">
            {topRightSlot}
          </div>
        )}

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 sm:px-6 md:px-10 md:pb-5">
          <div className="grid grid-cols-12 items-end gap-4">
            <div className="col-span-12 lg:col-span-8">
              {eyebrow && (
                <motion.div
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E1E0CC]/25 bg-black/45 px-3.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider backdrop-blur-md"
                  style={{ color: '#E1E0CC' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E1E0CC]" />
                  {eyebrow}
                </motion.div>
              )}
              <h1
                className="font-medium leading-[0.85] tracking-[-0.07em] text-[20vw] sm:text-[18vw] md:text-[16vw] lg:text-[14.5vw] xl:text-[14vw]"
                style={{ color: '#E1E0CC' }}
              >
                <WordsPullUp text={title} showAsterisk={showAsterisk} />
              </h1>
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-4 lg:col-span-4 lg:pb-8">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs text-primary/80 sm:text-sm md:text-base"
                style={{ lineHeight: 1.35 }}
              >
                {description}
              </motion.p>

              <motion.button
                type="button"
                onClick={handleCta}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group inline-flex items-center gap-2 self-start rounded-full bg-primary py-1 pl-5 pr-1 text-sm font-medium text-black transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:text-base"
              >
                {ctaLabel}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                  <ArrowRight className="h-4 w-4" style={{ color: '#E1E0CC' }} />
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { PrismaHero };
