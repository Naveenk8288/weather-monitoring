import React, { Suspense, lazy } from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SimulatorProvider } from './context/SimulatorContext';
import { VoiceNarratorProvider } from './context/VoiceNarratorContext';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { OverviewSection } from './components/OverviewSection';
import { StickySimulatorBar } from './components/StickySimulatorBar';
import { VoiceCaptionBanner } from './components/VoiceCaptionBanner';
import { Footer } from './components/Footer';
import { PrismaHero } from '@/components/ui/prisma-hero';
import { CanopyVideoBackdrop } from '@/components/ui/canopy-video-backdrop';
import { PROJECT_META } from './data/projectData';

// Lazy-load heavy 3D-intensive & syntax-highlighted sections for fast initial paint
const ArchitectureSection = lazy(() =>
  import('./components/ArchitectureSection').then((m) => ({ default: m.ArchitectureSection }))
);
const ControlFsmSection = lazy(() =>
  import('./components/ControlFsmSection').then((m) => ({ default: m.ControlFsmSection }))
);
const Dht11Section = lazy(() =>
  import('./components/Dht11Section').then((m) => ({ default: m.Dht11Section }))
);
const GateLevelSection = lazy(() =>
  import('./components/GateLevelSection').then((m) => ({ default: m.GateLevelSection }))
);
const WeatherSimulatorSection = lazy(() =>
  import('./components/WeatherSimulatorSection').then((m) => ({
    default: m.WeatherSimulatorSection
  }))
);
const TimingSection = lazy(() =>
  import('./components/TimingSection').then((m) => ({ default: m.TimingSection }))
);
const CodeSection = lazy(() =>
  import('./components/CodeSection').then((m) => ({ default: m.CodeSection }))
);
const KioskAndSpecsSection = lazy(() =>
  import('./components/KioskAndSpecsSection').then((m) => ({ default: m.KioskAndSpecsSection }))
);
const ApplicationsSection = lazy(() =>
  import('./components/ApplicationsSection').then((m) => ({ default: m.ApplicationsSection }))
);
const TeamSection = lazy(() =>
  import('./components/TeamSection').then((m) => ({ default: m.TeamSection }))
);

const SectionFallback: React.FC = () => (
  <div className="mx-auto flex h-48 max-w-7xl items-center justify-center px-6">
    <div className="flex items-center gap-2 font-mono text-xs text-[#6f5a30] dark:text-[#e3c68a]/80">
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#e3c68a]" />
      Loading RTL Module...
    </div>
  </div>
);

const LANDING_NAV_ITEMS = [
  { label: '3D Bench', href: '#hero' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Control FSM', href: '#fsm' },
  { label: 'Simulator', href: '#simulator' },
  { label: 'Verilog RTL', href: '#code' }
];

const FirstPageHero: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <PrismaHero
      id="top"
      title="Weather"
      showAsterisk
      eyebrow={`${PROJECT_META.courseCode} · Artix-7 FPGA · GAT Bengaluru`}
      description="FPGA-Based Weather Condition Detector and Alert System using Verilog HDL — featuring a 5-state Moore Control FSM, 40-bit single-wire DHT11 decoder, clock-enabled comparators, and a live 3D Basys 3 simulation lab."
      ctaLabel="Enter 3D FPGA Lab"
      ctaHref="#hero"
      navItems={LANDING_NAV_ITEMS}
      topRightSlot={
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E1E0CC]/25 bg-black/65 text-[#E1E0CC] backdrop-blur-md transition hover:border-[#E1E0CC]/60"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4" />}
        </button>
      }
    />
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SimulatorProvider>
        <VoiceNarratorProvider>
          <div className="min-h-screen transition-colors duration-300">
            <LoadingScreen />

            {/* 1st Page UI: Original PrismaHero preserved 100% untouched */}
            <FirstPageHero />

            {/* Pages 2..End: Looping Sunlit Rainforest Video UI Backdrop */}
            <div className="valley-pages relative min-h-screen bg-[#ece9dc] text-[#172417] dark:bg-[#050d06] dark:text-[#f5efe0]">
              {/* Continuous Full-Bleed Looping Video pinned behind Pages 2..End */}
              <div className="pointer-events-none sticky top-0 z-0 h-0 w-full">
                <div className="relative h-screen w-full overflow-hidden">
                  <CanopyVideoBackdrop />
                </div>
              </div>

              <div className="relative z-10">
                <Navbar />

                <main id="main-content" className="relative">
                  <HeroSection />
                  <OverviewSection />

                  <Suspense fallback={<SectionFallback />}>
                    <ArchitectureSection />
                    <ControlFsmSection />
                    <Dht11Section />
                    <GateLevelSection />
                    <WeatherSimulatorSection />
                    <TimingSection />
                    <CodeSection />
                    <KioskAndSpecsSection />
                    <ApplicationsSection />
                    <TeamSection />
                  </Suspense>
                </main>

                <Footer />
              </div>

              <VoiceCaptionBanner />
              <StickySimulatorBar />
            </div>
          </div>
        </VoiceNarratorProvider>
      </SimulatorProvider>
    </ThemeProvider>
  );
};

export default App;
