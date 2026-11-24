import React from 'react';
import { Cpu, MapPin, Server, Wrench } from 'lucide-react';
import { LightningVoiceButton } from '@/components/ui/lightning-voice-button';
import { SectionWrapper } from './SectionWrapper';
import { CanvasViewport } from '../scenes/CanvasViewport';
import { CampusKioskScene } from '../scenes/CampusKioskScene';
import { HARDWARE_SPECS, SOFTWARE_SPECS } from '../data/projectData';
import { useSimulator } from '../context/SimulatorContext';

export const KioskAndSpecsSection: React.FC = () => {
  const { registered, lcdLines } = useSimulator();

  return (
    <SectionWrapper
      id="specs"
      badge="09 · Real-World Deployment & System Specifications"
      title="The Campus Weather Kiosk & Hardware / Software Stack"
      subtitle="See how our Basys 3 Verilog system deploys outdoors as an autonomous solar-assisted campus weather kiosk—synced in real time with the simulator's registered LCD readout and alert beacon."
    >
      {/* Real-World Scenario: 3D Campus Weather Kiosk */}
      <div className="glass-card mb-8 overflow-hidden">
        <div className="grid lg:grid-cols-12">
          <div className="lg:col-span-7">
            <CanvasViewport
              cameraPosition={[3.6, 2.2, 6.2]}
              fov={42}
              className="h-[390px] w-full sm:h-[440px]"
              bloomIntensity={0.5}
              ariaLabel="Interactive 3D Campus Weather Kiosk with solar canopy, pole-mounted DHT11 and rain sensors, glowing LED alert beacon, and live 16x2 LCD"
            >
              <CampusKioskScene registered={registered} lcdLines={lcdLines} />
            </CanvasViewport>
          </div>

          <div className="flex flex-col justify-center space-y-4 border-t border-[#b59c6a]/35 p-6 lg:col-span-5 lg:border-l lg:border-t-0 dark:border-[#e8cfa0]/12">
            <div className="lab-badge w-fit">
              <MapPin className="h-3.5 w-3.5" />
              Real-World Scenario · GAT Bengaluru
            </div>
            <h3 className="text-2xl font-medium tracking-[-0.03em] text-slate-900 dark:text-[#e8cfa0]">
              The Campus Weather Kiosk
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-[#e8cfa0]/70">
              Positioned beside the campus quad, the weatherproof steel kiosk houses the Basys 3
              Artix-7 FPGA behind an inspection window, draws supplemental power from a tilted roof
              solar panel, and polls its mast-mounted DHT11 and raindrop sensors every 5 seconds.
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="glass-subtle p-3">
                <div className="text-[10px] uppercase text-slate-500 dark:text-[#e8cfa0]/50">
                  Live Kiosk LCD
                </div>
                <div className="mt-1 font-bold text-emerald-600 dark:text-emerald-400">
                  {lcdLines[0].trim()}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-[#e8cfa0]/75">
                  {lcdLines[1].trim()}
                </div>
              </div>
              <div className="glass-subtle p-3">
                <div className="text-[10px] uppercase text-slate-500 dark:text-[#e8cfa0]/50">
                  Mast Beacon State
                </div>
                <div
                  className={`mt-1 font-bold ${
                    registered.tempStatus === '10'
                      ? 'text-red-500'
                      : registered.rainAlert
                        ? 'text-cyan-500'
                        : registered.humidityAlert || registered.tempStatus === '00'
                          ? 'text-blue-500'
                          : 'text-emerald-500'
                  }`}
                >
                  {registered.tempStatus === '10'
                    ? 'RED · HEAT ALERT'
                    : registered.rainAlert
                      ? 'CYAN · RAIN ALERT'
                      : registered.humidityAlert
                        ? 'BLUE · HUM ALERT'
                        : registered.tempStatus === '00'
                          ? 'BLUE · COLD ALERT'
                          : 'GREEN · NOMINAL'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#e8cfa0]/50">
                  Auto-synced with Sim
                </div>
              </div>
            </div>
            <div className="pt-1">
              <LightningVoiceButton
                compact
                sceneId="campus-kiosk-3d"
                sceneTitle="3D Campus Weather Kiosk"
                label="Explain 3D Kiosk"
                script={`This 3D model demonstrates our real-world deployment scenario: the Autonomous Campus Weather Kiosk at Global Academy of Technology, Bengaluru. A slanted photovoltaic solar canopy powers the weatherproof steel kiosk housing the Basys 3 Artix-7 FPGA board behind its front window. Mounted on the right mast are the outdoor DHT11 sensor and raindrop detector, crowned by a glowing beacon dome that changes color with active alerts. Right now the kiosk LCD reads ${lcdLines[0].trim()} and ${lcdLines[1].trim()}, automatically synced to your live FPGA simulator state.`}
              />
            </div>

            <p className="font-mono text-[11px] text-slate-500 dark:text-[#e8cfa0]/55">
              Tip: Change weather conditions in the Live Simulator and step CLK ↑ to watch the
              kiosk beacon and LCD react immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Hardware & Software Specification Tables */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#b59c6a]/35 bg-[#eee8d7]/90 px-5 py-3.5 dark:border-[#e8cfa0]/12 dark:bg-[#0f1d10]/95">
            <Cpu className="h-4 w-4 text-slate-900 dark:text-[#e8cfa0]" />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-[#e8cfa0]">
              Hardware Specifications
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#b59c6a]/35 bg-[#d9ba7b]/14 font-mono text-[10px] uppercase text-slate-500 dark:border-[#e8cfa0]/12 dark:bg-[#09130a]/78 dark:text-[#e8cfa0]/55">
                <tr>
                  <th className="px-4 py-2.5">Component</th>
                  <th className="px-4 py-2.5">Model &amp; Specs</th>
                  <th className="px-4 py-2.5">System Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b59c6a]/25 dark:divide-[#e8cfa0]/10">
                {HARDWARE_SPECS.map((row) => (
                  <tr key={row.component} className="align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-[#e8cfa0]">
                      {row.component}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] font-semibold text-slate-900 dark:text-[#e8cfa0]">
                        {row.model}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-[#e8cfa0]/55">
                        {row.specification}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-[#e8cfa0]/70">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#b59c6a]/35 bg-[#eee8d7]/90 px-5 py-3.5 dark:border-[#e8cfa0]/12 dark:bg-[#0f1d10]/95">
            <Wrench className="h-4 w-4 text-emerald-500" />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-[#e8cfa0]">
              Software &amp; EDA Toolchain
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#b59c6a]/35 bg-[#d9ba7b]/14 font-mono text-[10px] uppercase text-slate-500 dark:border-[#e8cfa0]/12 dark:bg-[#09130a]/78 dark:text-[#e8cfa0]/55">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Tool / Standard</th>
                  <th className="px-4 py-2.5">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b59c6a]/25 dark:divide-[#e8cfa0]/10">
                {SOFTWARE_SPECS.map((row) => (
                  <tr key={row.component} className="align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-[#e8cfa0]">
                      {row.component}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {row.model}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-[#e8cfa0]/55">
                        {row.specification}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-[#e8cfa0]/70">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 border-t border-[#b59c6a]/35 bg-[#d9ba7b]/14 px-5 py-3 font-mono text-[11px] text-slate-500 dark:border-[#e8cfa0]/12 dark:bg-[#09130a]/78 dark:text-[#e8cfa0]/60">
            <Server className="h-3.5 w-3.5" />
            Optional UART/Wi-Fi expansion path ready via Basys 3 PMOD + ESP32 bridge.
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
