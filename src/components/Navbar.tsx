import React, { useEffect, useState } from 'react';
import { Leaf, Menu, Moon, Sliders, Sun, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSimulator } from '../context/SimulatorContext';

const NAV_LINKS = [
  { href: '#hero', label: '3D Bench' },
  { href: '#overview', label: 'Overview' },
  { href: '#architecture', label: 'Architecture' },
  { href: '#fsm', label: 'FSM' },
  { href: '#dht11', label: 'DHT11' },
  { href: '#gates', label: 'Gates' },
  { href: '#simulator', label: 'Simulator' },
  { href: '#timing', label: 'Timing' },
  { href: '#code', label: 'Verilog' },
  { href: '#specs', label: 'Specs' },
  { href: '#team', label: 'Team' }
];

export const Navbar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { registered, pendingUpdate } = useSimulator();
  const [scrollPct, setScrollPct] = useState(0);
  const [pastLandingHero, setPastLandingHero] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
      setPastLandingHero(window.scrollY > window.innerHeight * 0.72);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        pastLandingHero
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none -translate-y-full opacity-0'
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-[#e5c78a] focus:px-4 focus:py-1.5 focus:text-sm focus:font-semibold focus:text-[#0c160d]"
      >
        Skip to content
      </a>

      {/* Smoked-Forest & Champagne Gold Floating Notch Bar (Pages 2..End) */}
      <div className="mx-auto flex max-w-6xl justify-center px-2 sm:px-4">
        <div className="relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-b-2xl border-x border-b border-[#e3c68a]/25 bg-[#0a140b]/90 px-4 py-2 text-[#f5efe0] shadow-[0_14px_40px_rgba(4,10,5,0.65),inset_0_-1px_0_rgba(227,198,138,0.18)] backdrop-blur-2xl md:rounded-b-3xl md:px-6">
          {/* Brand */}
          <a
            href="#top"
            className="flex shrink-0 items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3c68a]"
          >
            <Leaf className="h-4 w-4 text-[#e3c68a]" />
            <span className="font-serif text-lg font-medium tracking-[0.04em] text-[#f7f0e2]">
              WEATHER
            </span>
            <span className="hidden rounded-full border border-[#e3c68a]/25 bg-[#e3c68a]/10 px-2 py-0.5 font-mono text-[10px] text-[#ecd5a3] sm:inline">
              BAML24303
            </span>
          </a>

          {/* Desktop Editorial Nav Links */}
          <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-[#ede3cd]/78 transition-colors hover:bg-[#e3c68a]/12 hover:text-[#f8f1e1]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Pills */}
          <div className="flex items-center gap-2">
            <a
              href="#simulator"
              className="hidden items-center gap-1.5 rounded-full border border-[#e3c68a]/30 bg-[#e3c68a]/12 px-3 py-1 font-mono text-[11px] font-medium text-[#f4e4c1] transition hover:bg-[#e3c68a]/22 sm:inline-flex"
            >
              <Sliders className="h-3 w-3 text-[#e3c68a]" />
              <span>
                {registered.tempLabel} ({registered.tempStatus})
              </span>
              {pendingUpdate && (
                <span
                  className="h-2 w-2 animate-pulse rounded-full bg-amber-400"
                  title="Pending clock edge"
                />
              )}
            </a>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e3c68a]/25 bg-[#e3c68a]/10 text-[#f4e4c1] transition hover:border-[#e3c68a]/60"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-[#f0d08a]" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e3c68a]/25 bg-[#e3c68a]/10 text-[#f4e4c1] xl:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* Warm Champagne Gold Scroll Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#e3c68a]/12">
            <div
              className="h-full bg-gradient-to-r from-[#b8924f] via-[#e6c788] to-[#faf0d7] transition-[width] duration-75"
              style={{ width: `${scrollPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav aria-label="Mobile navigation" className="mx-auto mt-1.5 max-w-md px-3 xl:hidden">
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[#e3c68a]/25 bg-[#0a140b]/95 p-3 shadow-2xl backdrop-blur-xl">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-full px-3 py-1.5 text-center text-xs font-medium text-[#ede3cd]/85 hover:bg-[#e3c68a]/12 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
