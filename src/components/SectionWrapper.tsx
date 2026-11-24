import React from 'react';
import { motion } from 'framer-motion';
import { WordsPullUp } from '@/components/ui/prisma-hero';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface SectionWrapperProps {
  id: string;
  badge: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  id,
  badge,
  title,
  subtitle,
  children,
  className = ''
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id={id}
      className={`relative scroll-mt-16 px-2 py-2.5 sm:px-3 sm:py-3 ${className}`}
    >
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-2xl border border-[#b59c6a]/35 bg-[#f7f3e8]/55 px-4 py-14 shadow-[0_20px_54px_rgba(12,24,14,0.16),inset_0_1px_0_rgba(255,250,235,0.85)] sm:px-8 md:rounded-[2rem] md:px-12 md:py-20 dark:border-[#e3c68a]/25 dark:bg-[#071209]/40 dark:shadow-[0_24px_68px_rgba(2,8,4,0.65),inset_0_1px_0_rgba(247,214,142,0.18)]">
        {/* Warm golden-hour sunlit top rim glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#f4cb7c]/18 to-transparent dark:from-[#e6c278]/12"
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Editorial 12-Column AOMI Header */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 grid grid-cols-12 items-end gap-5 border-b border-[#b59c6a]/30 pb-8 dark:border-[#e3c68a]/18"
          >
            <div className="col-span-12 lg:col-span-8">
              <span className="lab-badge mb-4">{badge}</span>
              <h2 className="font-serif text-4xl font-medium leading-[0.98] tracking-[-0.02em] text-[#142215] sm:text-5xl lg:text-[3.75rem] dark:text-[#f6efe0]">
                {reducedMotion ? (
                  <span>
                    {title}
                    <span className="ml-1 align-super text-[0.45em] text-[#d6b26a]">*</span>
                  </span>
                ) : (
                  <WordsPullUp text={title} showAsterisk />
                )}
              </h2>
            </div>

            {subtitle && (
              <div className="col-span-12 lg:col-span-4 lg:pb-1">
                <p className="text-sm leading-[1.55] text-[#2c3c2d] sm:text-[15px] dark:text-[#ece3ce]/78">
                  {subtitle}
                </p>
              </div>
            )}
          </motion.div>

          {children}
        </div>
      </div>
    </section>
  );
};
