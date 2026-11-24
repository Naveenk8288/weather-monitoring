import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface BranchTip {
  x: number;
  y: number;
  angle: number;
  life: number;
  maxLife: number;
  depth: number;
  width: number;
  speed: number;
}

export interface FrostCrystalGrowthProps {
  className?: string;
  density?: 'low' | 'medium' | 'high';
  interactive?: boolean;
  opacity?: number;
}

/**
 * Real-time procedural 6-fold dendritic Frost Crystal Growth glass canvas.
 * Grows branching hexagonal ice crystals organically from edges & nucleation points,
 * with interactive cursor melt-and-regrow trails and viewport-gated 60fps animation.
 */
export const FrostCrystalGrowth: React.FC<FrostCrystalGrowthProps> = ({
  className,
  density = 'medium',
  interactive = true,
  opacity = 0.85
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let tips: BranchTip[] = [];
    let frameCount = 0;

    const maxTips = density === 'high' ? 220 : density === 'low' ? 95 : 150;
    const seedCount = density === 'high' ? 14 : density === 'low' ? 7 : 10;
    const HEX_ANGLE = Math.PI / 3; // 60 degrees -> true 6-fold ice crystal symmetry

    const spawnNucleus = (cx: number, cy: number, maxLifeScale = 1) => {
      const baseAngle = Math.random() * Math.PI * 2;
      const arms = 6;
      for (let i = 0; i < arms; i++) {
        tips.push({
          x: cx,
          y: cy,
          angle: baseAngle + i * HEX_ANGLE,
          life: 0,
          maxLife: (55 + Math.random() * 75) * maxLifeScale,
          depth: 0,
          width: 1.55,
          speed: 1.15 + Math.random() * 0.65
        });
      }
    };

    const seedBorderCrystals = () => {
      tips = [];
      ctx.clearRect(0, 0, width, height);

      // Nucleate crystals around perimeter corners and margins so content stays crisp & framed
      const cornerPts: [number, number][] = [
        [width * 0.04, height * 0.08],
        [width * 0.96, height * 0.1],
        [width * 0.05, height * 0.92],
        [width * 0.95, height * 0.88],
        [width * 0.5, height * 0.02],
        [width * 0.5, height * 0.98],
        [width * 0.02, height * 0.5],
        [width * 0.98, height * 0.5]
      ];

      for (let i = 0; i < Math.min(seedCount, cornerPts.length); i++) {
        const [px, py] = cornerPts[i];
        spawnNucleus(
          px + (Math.random() - 0.5) * 40,
          py + (Math.random() - 0.5) * 40,
          1.15
        );
      }

      for (let i = cornerPts.length; i < seedCount; i++) {
        const edge = i % 4;
        const px =
          edge === 0 ? Math.random() * width : edge === 1 ? width * 0.94 : edge === 2 ? Math.random() * width : width * 0.06;
        const py =
          edge === 0 ? height * 0.06 : edge === 1 ? Math.random() * height : edge === 2 ? height * 0.94 : Math.random() * height;
        spawnNucleus(px, py, 0.85);
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(200, Math.round(rect.width));
      height = Math.max(180, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedBorderCrystals();

      if (reducedMotion) {
        // Pre-grow 70 deterministic frames for static reduced-motion frost pattern
        for (let step = 0; step < 75; step++) {
          stepGrowth();
        }
      }
    };

    const stepGrowth = () => {
      const nextTips: BranchTip[] = [];

      for (let i = 0; i < tips.length; i++) {
        const tip = tips[i];
        const nx = tip.x + Math.cos(tip.angle) * tip.speed;
        const ny = tip.y + Math.sin(tip.angle) * tip.speed;

        // Crystalline ice-blue gradient stroke
        const progress = tip.life / tip.maxLife;
        const alpha = (1 - progress * 0.72) * (tip.depth === 0 ? 0.44 : tip.depth === 1 ? 0.3 : 0.18);

        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(nx, ny);
        if (isDark) {
          ctx.strokeStyle =
            tip.depth === 0
              ? `rgba(224, 242, 254, ${alpha})`
              : tip.depth === 1
                ? `rgba(125, 211, 252, ${alpha})`
                : `rgba(56, 189, 248, ${alpha})`;
        } else {
          ctx.strokeStyle =
            tip.depth === 0
              ? `rgba(2, 132, 199, ${alpha * 0.85})`
              : tip.depth === 1
                ? `rgba(14, 165, 233, ${alpha * 0.75})`
                : `rgba(56, 189, 248, ${alpha * 0.65})`;
        }
        ctx.lineWidth = Math.max(0.45, tip.width * (1 - progress * 0.55));
        ctx.lineCap = 'round';
        ctx.stroke();

        // Occasional crystalline glint dot at branch nodes
        if (tip.depth <= 1 && tip.life % 14 === 0 && Math.random() < 0.45) {
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${alpha * 1.1})`
            : `rgba(255, 255, 255, ${alpha * 1.3})`;
          ctx.beginPath();
          ctx.arc(nx, ny, tip.depth === 0 ? 1.3 : 0.85, 0, Math.PI * 2);
          ctx.fill();
        }

        tip.x = nx;
        tip.y = ny;
        tip.life += 1;

        // Spawn symmetric 60° hexagonal side dendrites
        if (
          tip.depth < 2 &&
          tip.life > 8 &&
          tip.life % (tip.depth === 0 ? 11 : 9) === 0 &&
          tips.length + nextTips.length < maxTips
        ) {
          const remaining = Math.max(12, (tip.maxLife - tip.life) * 0.65);
          for (const dir of [-1, 1]) {
            if (Math.random() < 0.82) {
              nextTips.push({
                x: nx,
                y: ny,
                angle: tip.angle + dir * HEX_ANGLE,
                life: 0,
                maxLife: remaining * (0.7 + Math.random() * 0.45),
                depth: tip.depth + 1,
                width: tip.width * 0.68,
                speed: tip.speed * 0.88
              });
            }
          }
        }

        if (
          tip.life < tip.maxLife &&
          nx > -20 &&
          nx < width + 20 &&
          ny > -20 &&
          ny < height + 20
        ) {
          nextTips.push(tip);
        }
      }

      tips = nextTips;
    };

    const tick = () => {
      if (!isVisible) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      frameCount += 1;
      if (tips.length > 0) {
        stepGrowth();
      } else if (frameCount % 160 === 0) {
        // Gently fade oldest ice layer and re-nucleate fresh crystal dendrites along margins
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        const edge = Math.floor(Math.random() * 4);
        const rx =
          edge === 0 ? Math.random() * width : edge === 1 ? width * 0.94 : edge === 2 ? Math.random() * width : width * 0.06;
        const ry =
          edge === 0 ? height * 0.06 : edge === 1 ? Math.random() * height : edge === 2 ? height * 0.94 : Math.random() * height;
        spawnNucleus(rx, ry, 0.9);
      }

      rafId = requestAnimationFrame(tick);
    };

    // Interactive warm cursor melt + automatic crystal regrowth along the melted perimeter
    const handlePointerMove = (e: PointerEvent) => {
      if (!interactive || reducedMotion || !isVisible) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > width || y > height) return;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      const melt = ctx.createRadialGradient(x, y, 4, x, y, 52);
      melt.addColorStop(0, 'rgba(0,0,0,0.45)');
      melt.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = melt;
      ctx.beginPath();
      ctx.arc(x, y, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Nucleate fresh crystal regrowing around melted rim
      if (tips.length < maxTips && Math.random() < 0.18) {
        const theta = Math.random() * Math.PI * 2;
        spawnNucleus(x + Math.cos(theta) * 44, y + Math.sin(theta) * 44, 0.55);
      }
    };

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              isVisible = entries.some((entry) => entry.isIntersecting);
            },
            { rootMargin: '200px 0px' }
          )
        : null;

    observer?.observe(canvas);
    resize();

    const parent = canvas.parentElement;
    if (interactive && parent) {
      parent.addEventListener('pointermove', handlePointerMove, { passive: true });
    }
    window.addEventListener('resize', resize);

    if (!reducedMotion) {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      if (interactive && parent) {
        parent.removeEventListener('pointermove', handlePointerMove);
      }
    };
  }, [isDark, density, interactive, reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ opacity }}
    >
      {/* Frosted corner crystalline radial ice sheen */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(186,230,253,0.16),transparent_42%),radial-gradient(circle_at_100%_0%,rgba(125,211,252,0.12),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(186,230,253,0.14),transparent_44%),radial-gradient(circle_at_0%_100%,rgba(56,189,248,0.1),transparent_40%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(186,230,253,0.14),transparent_42%),radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(125,211,252,0.13),transparent_44%),radial-gradient(circle_at_0%_100%,rgba(14,165,233,0.1),transparent_40%)]" />
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
};
