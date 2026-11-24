import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export const CANOPY_BACKDROP_SRC = `${import.meta.env.BASE_URL}canopy-bg.jpg`;

export interface CanopyVideoBackdropProps {
  className?: string;
  src?: string;
  subtle?: boolean;
}

interface MacawBird {
  x: number;
  y: number;
  baseY: number;
  vx: number;
  scale: number;
  depth: number; // 0.35 (far) .. 1.0 (near)
  flapPhase: number;
  flapSpeed: number;
  glidePhase: number;
  glidePeriod: number;
  bobPhase: number;
  dir: 1 | -1; // 1 = flying left->right, -1 = right->left
  bankAngle: number;
}

interface SunMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
}

/**
 * Draws a richly detailed backlit Scarlet Macaw in mid-flight with articulated wing flex,
 * scarlet/gold/cobalt plumage layers, flowing twin tail feathers, and golden sunbeam rim glow.
 */
function drawScarletMacaw(
  ctx: CanvasRenderingContext2D,
  bird: MacawBird,
  flapVal: number, // -1 (wings full up) .. +1 (wings full down)
  sunlightFactor: number, // 0..1 glow boost when passing through golden sunbeams
  isDark: boolean
) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.scale(bird.dir * bird.scale, bird.scale);
  ctx.rotate(bird.bankAngle + flapVal * 0.055);

  const depthAlpha = (isDark ? 0.62 : 0.55) + bird.depth * 0.36;
  ctx.globalAlpha = Math.min(0.96, depthAlpha);

  // Subtle golden backlit halo when flying through the sunbeams
  if (sunlightFactor > 0.08) {
    ctx.shadowColor = `rgba(255, 206, 112, ${0.75 * sunlightFactor})`;
    ctx.shadowBlur = 16 * bird.scale * sunlightFactor;
  }

  const wingY = flapVal * 34; // Vertical excursion of wingtips
  const farWingY = flapVal * 26 - 8;
  const wristLag = Math.sin(bird.flapPhase - 0.55) * 14;
  const tailFlex = -flapVal * 5.5;

  // 1. Far Wing (background perspective wing — darker crimson + gold + cobalt)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(4, -3);
  ctx.quadraticCurveTo(10, -24 + farWingY * 0.6, -12, -32 + farWingY + wristLag * 0.5);
  ctx.quadraticCurveTo(-24, -18 + farWingY * 0.7, -8, -2);
  ctx.closePath();
  const farGrad = ctx.createLinearGradient(6, -3, -16, -30 + farWingY);
  farGrad.addColorStop(0, '#991b1b');
  farGrad.addColorStop(0.55, '#d97706');
  farGrad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = farGrad;
  ctx.fill();
  ctx.restore();

  // 2. Long Flowing Scarlet & Blue Tail Streamers
  ctx.beginPath();
  ctx.moveTo(-14, 1);
  ctx.quadraticCurveTo(-34, 4 + tailFlex * 0.6, -58, 9 + tailFlex);
  ctx.quadraticCurveTo(-36, 10 + tailFlex * 0.5, -13, 5);
  ctx.closePath();
  const tailGrad = ctx.createLinearGradient(-14, 2, -58, 9 + tailFlex);
  tailGrad.addColorStop(0, '#dc2626');
  tailGrad.addColorStop(0.65, '#ef4444');
  tailGrad.addColorStop(1, '#2563eb');
  ctx.fillStyle = tailGrad;
  ctx.fill();

  // Secondary thin accent tail feather
  ctx.beginPath();
  ctx.moveTo(-15, 3);
  ctx.quadraticCurveTo(-36, 9 + tailFlex * 0.8, -51, 15 + tailFlex * 1.15);
  ctx.strokeStyle = sunlightFactor > 0.3 ? '#fb923c' : '#b91c1c';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 3. Sleek Scarlet Torso & Head
  ctx.beginPath();
  ctx.moveTo(22, -1); // Forehead / beak base
  ctx.quadraticCurveTo(14, -7, -2, -4);
  ctx.quadraticCurveTo(-15, -2, -18, 2);
  ctx.quadraticCurveTo(-8, 8, 8, 6);
  ctx.quadraticCurveTo(18, 5, 22, -1);
  ctx.closePath();
  const bodyGrad = ctx.createLinearGradient(-14, 0, 22, -2);
  bodyGrad.addColorStop(0, '#b91c1c');
  bodyGrad.addColorStop(0.6, '#ef4444');
  bodyGrad.addColorStop(1, sunlightFactor > 0.35 ? '#f97316' : '#dc2626');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // White macaw cheek patch + curved ivory beak
  ctx.beginPath();
  ctx.ellipse(17.5, -1.2, 2.6, 1.7, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#fef3c7';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(21, -2.2);
  ctx.quadraticCurveTo(26.5, -1.2, 25.5, 3.2);
  ctx.quadraticCurveTo(23.2, 1.5, 20.5, 1.2);
  ctx.closePath();
  ctx.fillStyle = '#fde68a';
  ctx.fill();

  // 4. Primary Near Wing (Articulated: Scarlet Inner -> Golden Band -> Cobalt Primary Tips)
  const tipX = -18 + Math.abs(flapVal) * 7;
  const tipY = -36 + wingY + wristLag;
  const leadCtrlX = 16;
  const leadCtrlY = -20 + wingY * 0.55;

  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.quadraticCurveTo(leadCtrlX, leadCtrlY, tipX, tipY);
  // Subtle scalloped primary feather tips
  ctx.lineTo(tipX - 6, tipY + 6);
  ctx.lineTo(tipX - 2, tipY + 9);
  ctx.lineTo(tipX - 8, tipY + 14);
  ctx.quadraticCurveTo(-14, -6 + wingY * 0.45, -11, 3);
  ctx.closePath();

  const wingGrad = ctx.createLinearGradient(8, 0, tipX, tipY);
  wingGrad.addColorStop(0, '#dc2626'); // Deep scarlet covert
  wingGrad.addColorStop(0.42, '#ef4444');
  wingGrad.addColorStop(0.64, '#facc15'); // Signature golden-yellow macaw bar
  wingGrad.addColorStop(0.84, '#2563eb'); // Royal cobalt blue primaries
  wingGrad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = wingGrad;
  ctx.fill();

  // Golden sunbeam backlit translucent wing-edge highlight
  ctx.beginPath();
  ctx.moveTo(9, -1);
  ctx.quadraticCurveTo(leadCtrlX, leadCtrlY, tipX, tipY);
  ctx.strokeStyle = `rgba(255, 232, 165, ${0.35 + sunlightFactor * 0.55})`;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.restore();
}

/**
 * Watermark-free sunlit rainforest canopy with a live 60 FPS animated flock of
 * wing-flapping, soaring scarlet-and-gold macaws + drifting sunlit golden motes.
 */
export const CanopyVideoBackdrop: React.FC<CanopyVideoBackdropProps> = ({
  className,
  src = CANOPY_BACKDROP_SRC,
  subtle = false
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
    let w = 0;
    let h = 0;
    let birds: MacawBird[] = [];
    let motes: SunMote[] = [];

    const birdCount = subtle ? 4 : 7;
    const moteCount = subtle ? 16 : 34;

    const initScene = () => {
      // Create a natural multi-depth flock soaring across the sunlit canopy
      const presets = [
        { xFrac: 0.18, yFrac: 0.34, scale: 1.08, depth: 0.95, speed: 68, dir: 1 as const, bank: -0.14 },
        { xFrac: 0.56, yFrac: 0.28, scale: 0.86, depth: 0.8, speed: 58, dir: 1 as const, bank: -0.18 },
        { xFrac: 0.78, yFrac: 0.46, scale: 0.72, depth: 0.65, speed: 52, dir: -1 as const, bank: -0.12 },
        { xFrac: 0.38, yFrac: 0.56, scale: 0.94, depth: 0.88, speed: 64, dir: 1 as const, bank: -0.1 },
        { xFrac: 0.86, yFrac: 0.22, scale: 0.56, depth: 0.48, speed: 44, dir: -1 as const, bank: -0.16 },
        { xFrac: 0.12, yFrac: 0.18, scale: 0.48, depth: 0.4, speed: 38, dir: 1 as const, bank: -0.08 },
        { xFrac: 0.64, yFrac: 0.64, scale: 0.64, depth: 0.58, speed: 48, dir: 1 as const, bank: -0.15 }
      ];

      birds = presets.slice(0, birdCount).map((p, idx) => ({
        x: w * p.xFrac,
        y: h * p.yFrac,
        baseY: h * p.yFrac,
        vx: p.speed * p.dir,
        scale: p.scale * (w < 640 ? 0.68 : 1),
        depth: p.depth,
        flapPhase: idx * 1.35,
        flapSpeed: 5.4 + (idx % 3) * 0.7,
        glidePhase: idx * 2.1,
        glidePeriod: 5.5 + (idx % 3) * 1.4,
        bobPhase: idx * 0.9,
        dir: p.dir,
        bankAngle: p.bank
      }));

      motes = Array.from({ length: moteCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 8 + Math.random() * 14,
        vy: -5 - Math.random() * 10,
        r: 1.0 + Math.random() * 2.2,
        alpha: 0.22 + Math.random() * 0.42
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(240, Math.round(rect.width));
      h = Math.max(180, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initScene();
    };

    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!isVisible) {
        rafId = requestAnimationFrame(frame);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // 1. Drifting golden sunlight motes inside the diagonal beams
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        if (!reducedMotion) {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (m.x > w + 12) m.x = -12;
          if (m.y < -12) m.y = h + 12;
        }

        const inBeam = m.x > w * 0.35 && m.x < w * 0.92;
        const a = m.alpha * (inBeam ? 1 : 0.4);
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 2.8);
        grad.addColorStop(0, `rgba(255, 232, 168, ${a})`);
        grad.addColorStop(1, 'rgba(255, 232, 168, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Sort birds far-to-near and animate natural flap-and-glide flight
      const ordered = [...birds].sort((a, b) => a.depth - b.depth);
      for (let i = 0; i < ordered.length; i++) {
        const b = ordered[i];
        if (!reducedMotion) {
          b.x += b.vx * dt;
          b.glidePhase += dt;
          b.bobPhase += dt * 1.15;

          // Alternate rhythmic wingbeat bursts (~70% of cycle) with brief outstretched soaring glides (~30%)
          const glideCycle = (b.glidePhase % b.glidePeriod) / b.glidePeriod;
          const isGliding = glideCycle > 0.72;
          if (!isGliding) {
            b.flapPhase += b.flapSpeed * dt;
          } else {
            // Smoothly settle wings into a graceful slightly-lifted glide arch
            b.flapPhase += (Math.PI * 1.65 - (b.flapPhase % (Math.PI * 2))) * dt * 2.5;
          }

          // Gentle soaring wave + vertical lift reaction from wingbeats
          const flapWave = Math.sin(b.flapPhase);
          b.y = b.baseY + Math.sin(b.bobPhase) * 26 * b.depth - flapWave * 4.5 * b.scale;

          // Seamless screen wrap with slightly varied altitude on re-entry
          const margin = 110 * b.scale;
          if (b.dir === 1 && b.x > w + margin) {
            b.x = -margin;
            b.baseY = h * (0.16 + Math.random() * 0.56);
          } else if (b.dir === -1 && b.x < -margin) {
            b.x = w + margin;
            b.baseY = h * (0.16 + Math.random() * 0.56);
          }
        }

        const flapVal = Math.sin(b.flapPhase);

        // Compute proximity to the golden diagonal sunbeam corridor (x: 42%..88%, y: 10%..72%)
        const dxBeam = (b.x / w - 0.66) / 0.26;
        const dyBeam = (b.y / h - 0.42) / 0.34;
        const distSq = dxBeam * dxBeam + dyBeam * dyBeam;
        const sunlightFactor = Math.max(0, 1 - distSq * 0.75);

        drawScarletMacaw(ctx, b, flapVal, sunlightFactor, isDark);
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(frame);
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
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [isDark, subtle, reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden bg-[#061108]',
        className
      )}
    >
      {/* Crisp High-Resolution Watermark-Free Rainforest Canopy Artwork */}
      <img
        src={src}
        alt=""
        loading="eager"
        decoding="async"
        className={cn(
          'h-full w-full object-cover object-center transition-opacity duration-500 will-change-transform',
          !reducedMotion && 'animate-canopy-drift',
          subtle ? 'opacity-80' : isDark ? 'opacity-95' : 'opacity-65'
        )}
      />

      {/* Live 60 FPS Wing-Flapping & Soaring Scarlet Macaw Flock Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Light Atmospheric Contrast Scrim (minimal darkening so foliage & flying birds stay clear) */}
      <div
        className={cn(
          'absolute inset-0 transition-colors duration-500',
          isDark
            ? subtle
              ? 'bg-gradient-to-b from-[#050e06]/40 via-[#061208]/25 to-[#040a05]/60'
              : 'bg-gradient-to-b from-[#050e06]/30 via-[#071409]/15 to-[#040a05]/50'
            : 'bg-gradient-to-b from-[#f6f2e7]/50 via-[#f2ecdc]/40 to-[#ece6d5]/55'
        )}
      />

      {/* Subtle Warm Sunlit Radial Highlight */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 65% 50% at 72% 28%, rgba(247, 208, 122, 0.14), transparent 68%)'
            : 'radial-gradient(ellipse 65% 50% at 72% 28%, rgba(255, 240, 200, 0.22), transparent 68%)'
        }}
      />
    </div>
  );
};
