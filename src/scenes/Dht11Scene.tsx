import React, { useMemo } from 'react';
import { Html, OrbitControls } from '@react-three/drei';
import { Dht11Frame, Dht11Snapshot } from '../sim/dht11Sim';
import { useTheme } from '../context/ThemeContext';

interface Dht11SceneProps {
  frame: Dht11Frame;
  snapshot: Dht11Snapshot;
  step: number;
}

const GROUP_COLORS: Record<string, string> = {
  HUM_INT: '#22d3ee',
  HUM_DEC: '#0ea5e9',
  TEMP_INT: '#f97316',
  TEMP_DEC: '#fbbf24',
  CHECKSUM: '#a855f7'
};

export const Dht11Scene: React.FC<Dht11SceneProps> = ({ frame, snapshot, step }) => {
  const { isDark } = useTheme();

  // Build visible preamble segments (steps 1..4) and data-bit pulse bars (steps 5..44)
  const preambleSegments = useMemo(
    () => [
      { x: -6.2, w: 1.4, low: true, label: '18ms LOW', activeStep: 1, color: '#22d3ee' },
      { x: -5.1, w: 0.65, low: false, label: '30µs HI', activeStep: 2, color: '#38bdf8' },
      { x: -4.25, w: 0.9, low: true, label: '80µs LOW', activeStep: 3, color: '#10b981' },
      { x: -3.25, w: 0.9, low: false, label: '80µs HI', activeStep: 4, color: '#34d399' }
    ],
    []
  );

  // Display a sliding window of 12 data bits on the 3D oscilloscope ribbon so each pulse + 54us threshold is crystal clear
  const bitWindowStart = useMemo(() => {
    if (step < 5) return 0;
    const currentIdx = Math.min(39, step - 5);
    return Math.max(0, Math.min(28, currentIdx - 5));
  }, [step]);

  const visibleBits = useMemo(
    () => frame.bits.slice(bitWindowStart, bitWindowStart + 12),
    [frame, bitWindowStart]
  );

  const checksumFail = snapshot.checksumChecked && !snapshot.checksumValid;

  return (
    <>
      <ambientLight intensity={isDark ? 0.6 : 0.95} />
      <directionalLight position={[4, 9, 8]} intensity={1.5} />
      <pointLight position={[0, 4, 4]} intensity={1.4} color="#22d3ee" distance={18} />

      {/* Back oscilloscope backdrop plate */}
      <mesh position={[0, 1.35, -0.65]}>
        <planeGeometry args={[15.5, 3.2]} />
        <meshStandardMaterial
          color={isDark ? '#0e1b0f' : '#dfd8c3'}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Preamble Handshake Waveform (Left Zone: 18ms low, 30us high, 80us low, 80us high) */}
      <group position={[0, 1.15, 0]}>
        {preambleSegments.map((seg) => {
          const isCurrent = step === seg.activeStep;
          const isPassed = step > seg.activeStep;
          const yPos = seg.low ? -0.45 : 0.55;
          return (
            <group key={seg.label} position={[seg.x, yPos, 0]}>
              <mesh>
                <boxGeometry args={[seg.w, 0.16, 0.22]} />
                <meshStandardMaterial
                  color={seg.color}
                  emissive={seg.color}
                  emissiveIntensity={isCurrent ? 2.8 : isPassed ? 1.1 : 0.25}
                  toneMapped={false}
                />
              </mesh>
              <Html position={[0, seg.low ? -0.35 : 0.42, 0.15]} center distanceFactor={13} zIndexRange={[10, 0]}>
                <div
                  className={`pointer-events-none whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[9px] ${
                    isCurrent
                      ? 'bg-cyan-500 font-bold text-slate-950'
                      : 'bg-slate-950/75 text-slate-300'
                  }`}
                >
                  {seg.label}
                </div>
              </Html>
            </group>
          );
        })}

        {/* 54 us Decision Threshold Plane across the 12-bit Data Pulse Window */}
        <mesh position={[2.2, 0.44, 0.05]}>
          <boxGeometry args={[9.4, 0.035, 0.45]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={2.0}
            transparent
            opacity={0.9}
            toneMapped={false}
          />
        </mesh>
        <Html position={[6.95, 0.44, 0.2]} center distanceFactor={12} zIndexRange={[12, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded border border-amber-400/60 bg-amber-950/90 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
            54 µs Threshold
          </div>
        </Html>

        {/* 12 Visible Data Bit Pulse Bars (50us Low Mark + Height Proportional to 27us vs 70us High) */}
        {visibleBits.map((bit, localIdx) => {
          const x = -1.9 + localIdx * 0.76;
          const isCurrent = snapshot.currentBit?.index === bit.index;
          const isShifted = snapshot.shiftRegister[bit.index] !== null;
          const highHeight = bit.bitValue === 1 ? 1.25 : 0.48; // 70 us > 54 us vs 27 us < 54 us
          const barColor =
            bit.byteGroup === 'CHECKSUM' && frame.corrupted
              ? '#ef4444'
              : GROUP_COLORS[bit.byteGroup];

          return (
            <group key={bit.index} position={[x, -0.45, 0]}>
              {/* 50 us LOW mark base */}
              <mesh position={[-0.22, 0, 0]}>
                <boxGeometry args={[0.24, 0.1, 0.2]} />
                <meshStandardMaterial color="#475569" roughness={0.6} />
              </mesh>
              {/* HIGH pulse duration bar (27 us below 54 us line; 70 us above 54 us line) */}
              <mesh position={[0.14, highHeight / 2, 0]}>
                <boxGeometry args={[0.36, highHeight, 0.26]} />
                <meshStandardMaterial
                  color={barColor}
                  emissive={barColor}
                  emissiveIntensity={isCurrent ? 3.2 : isShifted ? 1.2 : 0.22}
                  toneMapped={false}
                />
              </mesh>
              {/* Bit index & decoded value badge on active bit */}
              {isCurrent && (
                <Html position={[0.14, highHeight + 0.35, 0.18]} center distanceFactor={11} zIndexRange={[20, 0]}>
                  <div className="pointer-events-none whitespace-nowrap rounded-md border border-cyan-300 bg-slate-950/95 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-glow-cyan">
                    b{bit.index}: {bit.highUs}µs → {bit.bitValue}
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      {/* 40-Cell 3D Shift Register arranged into 5 color-coded byte groups */}
      <group position={[0, -1.15, 0.25]}>
        {frame.bits.map((bit) => {
          const byteIdx = Math.floor(bit.index / 8);
          const bitInByte = bit.index % 8;
          // 5 bytes spaced clearly with inter-byte gaps
          const x = -6.5 + byteIdx * 2.72 + bitInByte * 0.29;
          const val = snapshot.shiftRegister[bit.index];
          const filled = val !== null;
          const isCurrent = snapshot.currentBit?.index === bit.index;
          const isErrorCell = checksumFail && byteIdx === 4;

          const baseColor = isErrorCell
            ? '#ef4444'
            : GROUP_COLORS[bit.byteGroup];

          return (
            <group key={bit.index} position={[x, isCurrent ? 0.24 : 0, 0]}>
              <mesh>
                <boxGeometry args={[0.24, filled ? (val === 1 ? 0.56 : 0.3) : 0.18, 0.38]} />
                <meshStandardMaterial
                  color={filled ? baseColor : isDark ? '#1e293b' : '#94a3b8'}
                  emissive={filled ? baseColor : '#000000'}
                  emissiveIntensity={isErrorCell ? 2.6 : isCurrent ? 2.8 : filled && val === 1 ? 1.2 : 0.35}
                  roughness={0.3}
                  toneMapped={false}
                />
              </mesh>
            </group>
          );
        })}

        {/* Byte Group Labels underneath the 40-cell Shift Register */}
        {[
          { x: -4.15, label: `HUMIDITY (16b): ${frame.humInt}%`, color: '#22d3ee' },
          { x: 1.3, label: `TEMPERATURE (16b): ${frame.tempInt}°C`, color: '#f97316' },
          {
            x: 5.4,
            label: checksumFail
              ? `CHECKSUM FAIL (0x${frame.transmittedChecksum.toString(16).toUpperCase().padStart(2, '0')})`
              : `CHECKSUM (8b): 0x${frame.transmittedChecksum.toString(16).toUpperCase().padStart(2, '0')}`,
            color: checksumFail ? '#ef4444' : '#a855f7'
          }
        ].map((grp) => (
          <Html key={grp.label} position={[grp.x, -0.62, 0.2]} center distanceFactor={13} zIndexRange={[10, 0]}>
            <div
              className="pointer-events-none whitespace-nowrap rounded-md border bg-slate-950/85 px-2 py-0.5 font-mono text-[10px] font-semibold"
              style={{ borderColor: `${grp.color}66`, color: grp.color }}
            >
              {grp.label}
            </div>
          </Html>
        ))}
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minDistance={6.5}
        maxDistance={15}
        target={[0, 0.1, 0]}
      />
    </>
  );
};
