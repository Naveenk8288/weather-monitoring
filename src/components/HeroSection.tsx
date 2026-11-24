import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { WordsPullUp } from '@/components/ui/prisma-hero';
import { CanopyVideoBackdrop } from '@/components/ui/canopy-video-backdrop';
import { LightningVoiceButton } from '@/components/ui/lightning-voice-button';
import { CanvasViewport } from '../scenes/CanvasViewport';
import { HeroScene } from '../scenes/HeroScene';
import { useSimulator } from '../context/SimulatorContext';
import { PROJECT_META } from '../data/projectData';

gsap.registerPlugin(ScrollTrigger);

export const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollProgressRef = useRef<number>(0);
  const { lcdLines, registered, clockPulseId } = useSimulator();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
      }
    });

    return () => {
      trigger.kill();
    };
  }, []);

  const ledHeat = registered.tempStatus === '10';
  const heroVoiceScript = `Welcome to the 3D Basys 3 FPGA Weather Condition Detector workbench. At the center floats the Xilinx Artix-7 XC7A35T Basys 3 board with its 16 slide switches, status LEDs, 7-segment display, center reset pushbutton, and PMOD expansion headers. On the left, the blue DHT11 digital sensor streams 40-bit temperature and humidity packets over a single bidirectional wire, while the gold-plated rain sensor module detects active rainfall. On the right, the 16 by 2 HD44780 LCD displays the latched FPGA output: currently reading ${registered.latchedTemp} degrees Celsius and ${registered.latchedHumidity} percent humidity, classified as ${registered.tempLabel}. All decision logic runs in pure synthesizable Verilog HDL inside the FPGA fabric with deterministic hardware timing.`;

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative px-2 py-2.5 sm:px-3 sm:py-3"
    >
      <div className="relative mx-auto flex min-h-[92vh] max-w-[1440px] flex-col justify-between overflow-hidden rounded-2xl border border-[#b59c6a]/40 bg-[#09130a]/88 shadow-[0_24px_68px_rgba(4,10,5,0.72),inset_0_1px_0_rgba(245,222,170,0.2)] md:rounded-[2rem] dark:border-[#e3c68a]/25">
        {/* Full-Bleed Looping Rainforest Video + Transparent 3D FPGA Hardware Backdrop */}
        <div className="absolute inset-0 z-0">
          <CanopyVideoBackdrop subtle />
          <CanvasViewport
            eager
            transparentBg
            cameraPosition={[0, 3.25, 7.6]}
            fov={42}
            className="relative z-10 h-full w-full"
            ariaLabel="Interactive 3D Basys 3 FPGA board connected by glowing wires to a DHT11 sensor, rain sensor module, and 16x2 LCD floating over the sunlit rainforest video"
          >
            <HeroScene
              lcdLines={lcdLines}
              ledHeat={ledHeat}
              ledHumidity={registered.humidityAlert}
              ledRain={registered.rainAlert}
              clockPulseId={clockPulseId}
              scrollProgressRef={scrollProgressRef}
            />
          </CanvasViewport>
          <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-[#061108]/55 via-transparent to-[#050d06]/85" />
        </div>

        {/* Top Bar inside 3D Bench Frame */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 pt-6 sm:px-8 md:px-12 md:pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e3c68a]/35 bg-[#0b160c]/78 px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#f4e4c1] backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e3c68a]" />
              00 · Interactive 3D Hardware Workbench
            </span>
            <span className="hidden rounded-full border border-[#e3c68a]/22 bg-[#0b160c]/68 px-3 py-1 font-mono text-[11px] text-[#e8d6b0]/85 backdrop-blur-md sm:inline-block">
              {PROJECT_META.courseCode} · Artix-7 Basys 3
            </span>
          </div>

          <div className="flex flex-wrap gap-2 font-mono text-[11px]">
            <div className="rounded-full border border-[#e3c68a]/25 bg-[#0b160c]/82 px-3 py-1 text-[#f5efe0] backdrop-blur-md">
              LCD: <span className="font-semibold text-emerald-300">{lcdLines[0].trim()}</span>
            </div>
            <div className="rounded-full border border-[#e3c68a]/25 bg-[#0b160c]/82 px-3 py-1 text-[#f5efe0] backdrop-blur-md">
              COND:{' '}
              <span
                className={`font-bold ${
                  registered.tempStatus === '10'
                    ? 'text-red-400'
                    : registered.tempStatus === '00'
                      ? 'text-sky-300'
                      : 'text-emerald-300'
                }`}
              >
                {registered.tempStatus} ({registered.tempLabel})
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Asymmetric 12-Column AOMI Editorial Overlay */}
        <div className="relative z-10 px-5 pb-6 pt-24 sm:px-8 md:px-12 md:pb-10">
          <div className="grid grid-cols-12 items-end gap-6">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-serif text-4xl font-medium leading-[0.94] tracking-[-0.02em] text-[#f7f0e2] drop-shadow-[0_4px_24px_rgba(5,12,6,0.88)] sm:text-6xl lg:text-7xl">
                <WordsPullUp
                  text="FPGA-Based Weather Condition Detector & Alert System"
                  showAsterisk
                />
              </h2>
            </div>

            <div className="col-span-12 flex flex-col gap-5 lg:col-span-4">
              <p className="text-xs leading-[1.5] text-[#ede3cd]/82 sm:text-sm">
                Move your pointer for subtle 3D parallax over the floating Basys 3 FPGA, DHT11
                single-wire sensor, raindrop module, and live 16×2 HD44780 LCD readout.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <LightningVoiceButton
                  sceneId="hero-basys3"
                  sceneTitle="3D Basys 3 FPGA Workbench"
                  label="Explain Basys 3"
                  script={heroVoiceScript}
                />

                <a
                  href="#simulator"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#e5c78a] via-[#f0d9a7] to-[#f9eed5] py-1 pl-5 pr-1 text-sm font-medium text-[#0c160d] shadow-[0_0_24px_rgba(230,200,136,0.3)] transition-all hover:gap-3"
                >
                  Live Simulator
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0e1b0f] text-[#f4e4c1] transition-transform group-hover:scale-110">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </a>

                <a
                  href="#overview"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e3c68a]/35 bg-[#0b160c]/75 px-4 py-2.5 font-mono text-xs text-[#f4e4c1] backdrop-blur-md transition hover:border-[#e3c68a]/75 hover:text-white"
                >
                  <span>Scroll to explore</span>
                  <ArrowDown className="h-3.5 w-3.5 animate-bounce text-[#e3c68a]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
