import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface MistyValleyBackdropProps {
  className?: string;
  showParticles?: boolean;
  intensity?: 'ambient' | 'full';
}

interface FloatingElement {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  vAngle: number;
  alpha: number;
  isLeaf: boolean;
}

/**
 * Golden-Hour Misty Terraced Mountain & Botanical Sunrise Backdrop UI
 * (crafted directly from the uploaded AOMI atmospheric sunrise aesthetic).
 * Renders layered misty mountain ridges, golden sunbeams, contoured terraced emerald hills,
 * foreground botanical leaves, and gently drifting golden light motes + tumbling leaves.
 */
export const MistyValleyBackdrop: React.FC<MistyValleyBackdropProps> = ({
  className,
  showParticles = true,
  intensity = 'full'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!showParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let isVisible = true;
    let w = 0;
    let h = 0;
    let items: FloatingElement[] = [];

    const count = intensity === 'full' ? 38 : 18;

    const initParticles = () => {
      items = Array.from({ length: count }, (_, idx) => {
        const isLeaf = idx < (intensity === 'full' ? 5 : 2);
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: isLeaf ? 0.32 + Math.random() * 0.35 : 0.1 + Math.random() * 0.18,
          vy: isLeaf ? 0.15 + Math.random() * 0.2 : -0.08 - Math.random() * 0.16,
          size: isLeaf ? 5 + Math.random() * 4.5 : 1.1 + Math.random() * 2.2,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.015,
          alpha: isLeaf ? 0.35 + Math.random() * 0.25 : 0.22 + Math.random() * 0.38,
          isLeaf
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(200, Math.round(rect.width));
      h = Math.max(160, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const draw = () => {
      if (!isVisible) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < items.length; i++) {
        const p = items[i];
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy + (p.isLeaf ? Math.sin(p.angle * 2) * 0.12 : 0);
          p.angle += p.vAngle;

          if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20;
          if (p.y > h + 20) p.y = -20;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.isLeaf) {
          // Soft botanical tea-leaf silhouette catching golden rim light
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.45, p.size * 0.52, 0, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(116, 152, 74, ${p.alpha})`
            : `rgba(72, 108, 52, ${p.alpha * 0.7})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(244, 206, 128, ${p.alpha * 0.75})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        } else {
          // Warm golden-hour sunlit pollen mote
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2.4);
          grad.addColorStop(0, `rgba(255, 228, 165, ${p.alpha})`);
          grad.addColorStop(1, 'rgba(255, 228, 165, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(draw);
      }
    };

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              isVisible = entries.some((entry) => entry.isIntersecting);
            },
            { rootMargin: '150px 0px' }
          )
        : null;

    observer?.observe(canvas);
    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [isDark, showParticles, intensity, reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Golden-Hour Atmospheric Sky & Sunburst Gradient */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          isDark
            ? 'bg-[radial-gradient(ellipse_75%_55%_at_76%_16%,rgba(245,198,112,0.44),rgba(168,116,52,0.22)_38%,rgba(20,34,20,0.88)_74%,rgba(8,15,9,1)_100%)]'
            : 'bg-[radial-gradient(ellipse_78%_56%_at_76%_14%,rgba(250,214,136,0.52),rgba(218,186,126,0.25)_42%,rgba(232,231,216,0.92)_78%,rgba(222,223,207,1)_100%)]'
        )}
      />

      {/* Radiant Sun Core & Soft Diagonal Crepuscular Sunbeams */}
      <div
        className="absolute right-[14%] top-[7%] h-56 w-56 rounded-full blur-3xl"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(255,232,175,0.55) 0%, rgba(235,172,82,0.22) 48%, transparent 72%)'
            : 'radial-gradient(circle, rgba(255,240,196,0.85) 0%, rgba(236,184,96,0.3) 50%, transparent 72%)'
        }}
      />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          background:
            'linear-gradient(128deg, transparent 22%, rgba(252,220,148,0.16) 44%, transparent 56%, rgba(242,196,112,0.12) 72%, transparent 88%)'
        }}
      />

      {/* Multi-Layered Misty Mountain Ridges & Terraced Emerald Hills SVG */}
      <svg
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="mv-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#6a6342' : '#b7b398'} stopOpacity="0.65" />
            <stop offset="100%" stopColor={isDark ? '#273524' : '#8a9578'} stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="mv-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#3a4a2e' : '#738562'} stopOpacity="0.82" />
            <stop offset="100%" stopColor={isDark ? '#182617' : '#556847'} stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="mv-terrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isDark ? '#25391e' : '#5d744c'} stopOpacity="0.95" />
            <stop offset="55%" stopColor={isDark ? '#162614' : '#435936'} stopOpacity="0.98" />
            <stop offset="100%" stopColor={isDark ? '#0c160b' : '#2d3f25'} stopOpacity="1" />
          </linearGradient>
          <linearGradient id="mv-mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#f4d599' : '#fff7e0'} stopOpacity="0" />
            <stop offset="50%" stopColor={isDark ? '#e4c995' : '#fff3d6'} stopOpacity={isDark ? '0.22' : '0.45'} />
            <stop offset="100%" stopColor={isDark ? '#162516' : '#d6dac7'} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mv-fg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#111e10' : '#2e4126'} stopOpacity="0.95" />
            <stop offset="100%" stopColor={isDark ? '#070e07' : '#1b2817'} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Distant Misty Mountain Range */}
        <path
          d="M0 320 Q160 220 340 275 T720 245 T1110 280 T1440 215 L1440 720 L0 720 Z"
          fill="url(#mv-far)"
        />

        {/* Mid-Distance Mountain Slopes */}
        <path
          d="M0 380 Q210 290 420 340 T860 315 T1220 355 T1440 295 L1440 720 L0 720 Z"
          fill="url(#mv-mid)"
        />

        {/* Drifting Valley Morning Mist Band */}
        <rect
          x="0"
          y="310"
          width="1440"
          height="170"
          fill="url(#mv-mist)"
          className={reducedMotion ? '' : 'animate-pulse'}
        />

        {/* Terraced Emerald Tea-Hill Contours */}
        <path
          d="M0 475 Q260 390 540 455 T1040 430 T1440 390 L1440 720 L0 720 Z"
          fill="url(#mv-terrace)"
        />

        {/* Delicate Sunlit Terrace Contour Lines (AOMI Signature Terraces) */}
        <g
          fill="none"
          stroke={isDark ? 'rgba(226, 200, 138, 0.18)' : 'rgba(255, 244, 214, 0.35)'}
          strokeWidth="1.4"
        >
          <path d="M0 508 Q280 432 560 492 T1080 468 T1440 430" />
          <path d="M0 542 Q300 472 590 526 T1110 502 T1440 468" />
          <path d="M0 578 Q310 512 620 562 T1140 538 T1440 508" />
          <path d="M0 616 Q320 558 650 600 T1170 576 T1440 550" />
        </g>

        {/* Deep Forest Foreground Hill Base */}
        <path
          d="M0 620 Q340 565 710 628 T1440 585 L1440 720 L0 720 Z"
          fill="url(#mv-fg)"
        />

        {/* Framing Botanical Leaf Silhouettes (Bottom-Left & Bottom-Right Corners) */}
        <g fill={isDark ? '#0b160b' : '#24351e'} opacity={isDark ? '0.88' : '0.42'}>
          <path d="M-10 720 C20 620 95 570 165 555 C120 605 88 660 65 720 Z" />
          <path d="M40 720 C95 635 170 608 245 612 C185 650 142 682 115 720 Z" />
          <path d="M1450 720 C1410 610 1335 562 1260 548 C1310 602 1345 658 1372 720 Z" />
          <path d="M1395 720 C1340 635 1265 605 1190 612 C1252 650 1295 684 1322 720 Z" />
        </g>
      </svg>

      {/* Drifting Sunlit Golden Motes & Botanical Leaves Canvas */}
      {showParticles && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />}

      {/* Subtle Soft Vignette for Content Legibility */}
      <div
        className={cn(
          'absolute inset-0',
          isDark
            ? 'bg-gradient-to-b from-[#070e07]/45 via-transparent to-[#060c06]/82'
            : 'bg-gradient-to-b from-[#f5f2e8]/35 via-transparent to-[#e8e5d4]/55'
        )}
      />
    </div>
  );
};
