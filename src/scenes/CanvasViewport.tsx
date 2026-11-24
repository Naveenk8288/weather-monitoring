import React, { Component, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../context/ThemeContext';

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<
  { children: React.ReactNode; fallbackLabel: string },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-6 text-center text-slate-300">
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-cyan-400">
            WebGL Fallback Mode
          </div>
          <p className="max-w-md text-sm text-slate-400">{this.props.fallbackLabel}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface CanvasViewportProps {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
  className?: string;
  enableBloom?: boolean;
  bloomIntensity?: number;
  eager?: boolean;
  ariaLabel: string;
  darkBg?: string;
  lightBg?: string;
  disableDefaultBg?: boolean;
  transparentBg?: boolean;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  children,
  cameraPosition = [0, 2.8, 7.5],
  fov = 42,
  className = 'h-[480px] w-full',
  enableBloom = true,
  bloomIntensity = 0.55,
  eager = false,
  ariaLabel,
  darkBg = '#09130a',
  lightBg = '#ebe6d7',
  disableDefaultBg = false,
  transparentBg = false
}) => {
  const { ref, inView } = useInView('360px 0px');
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const { isDark } = useTheme();

  const shouldMount = eager || inView;
  const bg = isDark ? darkBg : lightBg;
  const useBloom = enableBloom && !isMobile && !reducedMotion && !transparentBg;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      {shouldMount ? (
        <CanvasErrorBoundary fallbackLabel={`3D view unavailable: ${ariaLabel}`}>
          <Canvas
            dpr={isMobile ? [1, 1.25] : [1, 2]}
            camera={{ position: cameraPosition, fov, near: 0.1, far: 120 }}
            gl={{
              antialias: !isMobile,
              powerPreference: 'high-performance',
              alpha: transparentBg
            }}
          >
            {!disableDefaultBg && !transparentBg && <color attach="background" args={[bg]} />}
            <Suspense fallback={null}>
              {children}
              {useBloom && (
                <EffectComposer multisampling={0}>
                  <Bloom
                    luminanceThreshold={isDark ? 0.82 : 0.95}
                    luminanceSmoothing={0.25}
                    intensity={isDark ? bloomIntensity : bloomIntensity * 0.45}
                    mipmapBlur
                  />
                </EffectComposer>
              )}
            </Suspense>
          </Canvas>
        </CanvasErrorBoundary>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-200/60 dark:bg-lab-navy/80">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-cyan-400/70">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            Initializing 3D Viewport...
          </div>
        </div>
      )}
    </div>
  );
};
