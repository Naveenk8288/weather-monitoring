import React, { useEffect, useRef } from 'react';
import { Square, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceNarrator } from '@/context/VoiceNarratorContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface LightningVoiceButtonProps {
  sceneId: string;
  sceneTitle: string;
  script: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Glossy obsidian pill button with a live animated diagonal silver-white electric plasma arc
 * inside the glass pill (inspired by the uploaded lightning button), wired to the Male Voice Narrator.
 */
export const LightningVoiceButton: React.FC<LightningVoiceButtonProps> = ({
  sceneId,
  sceneTitle,
  script,
  label = 'Explain 3D in Voice',
  className,
  compact = false
}) => {
  const { supported, isSpeaking, activeSceneId, toggleSpeak } = useVoiceNarrator();
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isThisSpeaking = isSpeaking && activeSceneId === sceneId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastDraw = 0;

    const drawLightning = (time: number) => {
      const interval = isThisSpeaking ? 55 : 95;
      if (!reducedMotion && time - lastDraw < interval) {
        rafId = requestAnimationFrame(drawLightning);
        return;
      }
      lastDraw = time;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 210;
      const h = canvas.clientHeight || 48;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Subtle glossy edge reflections matching the reference button
      const leftGlow = ctx.createRadialGradient(w * 0.08, h * 0.65, 1, w * 0.08, h * 0.65, h * 0.85);
      leftGlow.addColorStop(0, isThisSpeaking ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.24)');
      leftGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, w, h);

      const topRightGlow = ctx.createRadialGradient(w * 0.82, h * 0.12, 1, w * 0.82, h * 0.12, h * 0.9);
      topRightGlow.addColorStop(0, 'rgba(255,255,255,0.16)');
      topRightGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = topRightGlow;
      ctx.fillRect(0, 0, w, h);

      // Build jagged diagonal electric lightning bolt cutting from upper-left to lower-center/right
      const phase = reducedMotion ? 1.4 : time * (isThisSpeaking ? 0.004 : 0.0014);
      const startX = w * 0.28 + Math.sin(phase) * 4;
      const startY = -2;
      const endX = w * 0.68 + Math.cos(phase * 0.8) * 5;
      const endY = h + 2;

      const segments = 16;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const bx = startX + (endX - startX) * t;
        const by = startY + (endY - startY) * t;
        const jitterAmp =
          i === 0 || i === segments ? 0 : (isThisSpeaking ? 6.5 : 3.8) * Math.sin(t * Math.PI);
        const seed = Math.sin(i * 19.37 + phase * 3.1) * Math.cos(i * 7.13 - phase * 2.2);
        const offsetX = seed * jitterAmp;
        const offsetY = Math.cos(i * 11.7 + phase * 2.4) * (jitterAmp * 0.55);
        pts.push({ x: bx + offsetX, y: by + offsetY });
      }

      // Pass 1: Wide soft silver-white plasma halo
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = isThisSpeaking ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.28)';
      ctx.lineWidth = isThisSpeaking ? 11 : 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = isThisSpeaking ? 18 : 12;
      ctx.stroke();

      // Pass 2: Bright jagged plasma ribbon
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = isThisSpeaking ? 'rgba(255,255,255,0.92)' : 'rgba(240,242,245,0.75)';
      ctx.lineWidth = isThisSpeaking ? 3.4 : 2.6;
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Pass 3: Fine white electric filament core
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.25;
      ctx.shadowBlur = 4;
      ctx.stroke();

      // Secondary corner rim lightning flare (bottom-left crescent like reference)
      ctx.beginPath();
      ctx.arc(h * 0.5, h * 0.5, h * 0.46, Math.PI * 0.62, Math.PI * 0.96);
      ctx.strokeStyle = isThisSpeaking ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 10;
      ctx.stroke();

      ctx.restore();

      if (!reducedMotion) {
        rafId = requestAnimationFrame(drawLightning);
      }
    };

    rafId = requestAnimationFrame(drawLightning);
    return () => cancelAnimationFrame(rafId);
  }, [isThisSpeaking, reducedMotion]);

  if (!supported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => toggleSpeak(sceneId, sceneTitle, script)}
      aria-pressed={isThisSpeaking}
      aria-label={isThisSpeaking ? `Stop voice explanation for ${sceneTitle}` : `Explain ${sceneTitle} in male voice`}
      className={cn(
        'group relative inline-flex select-none items-center justify-center gap-2.5 overflow-hidden rounded-full border border-white/20 bg-gradient-to-b from-[#171717] via-[#090909] to-[#040404] text-white shadow-[0_8px_28px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_-1px_12px_rgba(255,255,255,0.08)] transition-all duration-200 hover:scale-[1.03] hover:border-white/40 hover:shadow-[0_10px_34px_rgba(255,255,255,0.14),inset_0_1px_2px_rgba(255,255,255,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 active:scale-[0.98]',
        compact ? 'px-4 py-2 text-xs' : 'px-6 py-2.5 text-sm',
        isThisSpeaking && 'border-white/55 ring-1 ring-white/40',
        className
      )}
    >
      {/* Animated Diagonal Lightning Plasma Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Crisp Glossy Top Specular Sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/15 to-transparent"
      />

      {/* Foreground Label + Icon */}
      <span className="relative z-10 flex items-center gap-2 font-medium tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
        {isThisSpeaking ? (
          <>
            <Square className="h-3.5 w-3.5 fill-white text-white" />
            <span>Stop Voice</span>
            <span className="flex items-end gap-0.5 pl-0.5" aria-hidden="true">
              <span className="h-2.5 w-0.5 animate-pulse rounded-full bg-white" />
              <span className="h-3.5 w-0.5 animate-bounce rounded-full bg-white" />
              <span className="h-2 w-0.5 animate-pulse rounded-full bg-white" />
            </span>
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4 text-white/95 transition-transform group-hover:scale-110" />
            <span>{label}</span>
          </>
        )}
      </span>
    </button>
  );
};
