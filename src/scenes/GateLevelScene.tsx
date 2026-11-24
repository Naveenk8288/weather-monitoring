import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ComparatorSignals, RegisteredWeatherState, mux2to1 } from '../sim/weatherLogic';
import { useTheme } from '../context/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface GateLevelSceneProps {
  temp: number;
  humidity: number;
  rain: boolean;
  comb: ComparatorSignals;
  reg: RegisteredWeatherState;
  evalEn: boolean;
  clockPulseId: number;
  resetFlashId: number;
}

const LogicWire: React.FC<{
  points: [number, number, number][];
  active: boolean;
  activeColor?: string;
  animate: boolean;
}> = ({ points, active, activeColor = '#22d3ee', animate }) => {
  const { curve, geo } = useMemo(() => {
    const vecs = points.map((p) => new THREE.Vector3(...p));
    const c = new THREE.CatmullRomCurve3(vecs);
    const g = new THREE.TubeGeometry(c, 28, active ? 0.042 : 0.025, 8, false);
    return { curve: c, geo: g };
  }, [points, active]);

  const pulseRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    return () => geo.dispose();
  }, [geo]);

  useFrame(({ clock }) => {
    if (!pulseRef.current || !active || !animate) return;
    const t = (clock.getElapsedTime() * 0.7) % 1;
    pulseRef.current.position.copy(curve.getPointAt(t));
  });

  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color={active ? activeColor : '#334155'}
          emissive={active ? activeColor : '#000000'}
          emissiveIntensity={active ? 1.85 : 0}
          roughness={0.35}
          toneMapped={false}
        />
      </mesh>
      {active && animate && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.085, 10, 10]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={activeColor}
            emissiveIntensity={3.2}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
};

const GateBlock: React.FC<{
  position: [number, number, number];
  size: [number, number, number];
  title: string;
  subtitle: string;
  outputBit: string;
  active: boolean;
  color: string;
  isDark: boolean;
}> = ({ position, size, title, subtitle, outputBit, active, color, isDark }) => {
  return (
    <group position={position}>
      <RoundedBox args={size} radius={0.1} smoothness={4}>
        <meshStandardMaterial
          color={isDark ? '#111d33' : '#f8fafc'}
          emissive={active ? color : '#1e293b'}
          emissiveIntensity={active ? 0.45 : 0.06}
          roughness={0.3}
          metalness={0.35}
        />
      </RoundedBox>
      {/* Glowing edge indicator */}
      <mesh position={[0, size[1] / 2 + 0.03, 0]}>
        <boxGeometry args={[size[0] * 0.88, 0.05, size[2] * 0.82]} />
        <meshStandardMaterial
          color={active ? color : '#475569'}
          emissive={active ? color : '#000000'}
          emissiveIntensity={active ? 2.4 : 0}
          toneMapped={false}
        />
      </mesh>
      <Html position={[0, 0, size[2] / 2 + 0.06]} center distanceFactor={11} zIndexRange={[15, 0]}>
        <div className="pointer-events-none select-none rounded-lg border border-slate-700/80 bg-slate-950/92 px-2 py-1 text-center">
          <div className="font-mono text-[10px] font-bold tracking-wide" style={{ color: active ? color : '#94a3b8' }}>
            {title}
          </div>
          <div className="font-mono text-[9px] text-slate-400">{subtitle}</div>
          <div
            className="mt-0.5 inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
            style={{
              backgroundColor: active ? `${color}28` : 'rgba(51,65,85,0.4)',
              color: active ? color : '#94a3b8'
            }}
          >
            {outputBit}
          </div>
        </div>
      </Html>
    </group>
  );
};

export const GateLevelScene: React.FC<GateLevelSceneProps> = ({
  temp,
  humidity,
  rain,
  comb,
  reg,
  evalEn,
  clockPulseId,
  resetFlashId
}) => {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  // MUX Y = S'·I0 + S·I1 evaluated for status[1] as representative highlighted enable cell
  const q1 = reg.tempStatus[0] === '1';
  const q0 = reg.tempStatus[1] === '1';
  const muxOut1 = mux2to1(evalEn, q1, comb.statusBit1);
  const muxOut0 = mux2to1(evalEn, q0, comb.statusBit0);
  const muxOutStr = `${muxOut1 ? '1' : '0'}${muxOut0 ? '1' : '0'}`;

  // Flash material ref on rising clock edge or async reset
  const dffHaloRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const flashTimer = useRef(0);
  const flashColor = useRef('#22d3ee');

  useEffect(() => {
    if (clockPulseId > 0) {
      flashTimer.current = 1;
      flashColor.current = '#22d3ee';
    }
  }, [clockPulseId]);

  useEffect(() => {
    if (resetFlashId > 0) {
      flashTimer.current = 1;
      flashColor.current = '#f59e0b';
    }
  }, [resetFlashId]);

  useFrame((_, delta) => {
    if (dffHaloRef.current) {
      flashTimer.current = Math.max(0, flashTimer.current - delta * 2.4);
      dffHaloRef.current.emissive.set(flashColor.current);
      dffHaloRef.current.emissiveIntensity = 0.6 + flashTimer.current * 3.0;
    }
  });

  return (
    <>
      <ambientLight intensity={isDark ? 0.6 : 0.95} />
      <directionalLight position={[4, 10, 8]} intensity={1.45} />
      <pointLight position={[0, 4, 4]} intensity={1.4} color="#22d3ee" distance={18} />

      <gridHelper
        args={[20, 20, isDark ? '#6a5b39' : '#968762', isDark ? '#192a1a' : '#cec7b1']}
        position={[0, -2.4, 0]}
      />

      {/* STAGE 1: 8-Bit Magnitude Comparators (Left Column, X = -4.5) */}
      <GateBlock
        position={[-4.6, 1.5, 0]}
        size={[2.1, 1.0, 0.7]}
        title="COMP: HOT"
        subtitle={`T(${temp}) >= 40`}
        outputBit={`HOT = ${comb.hot ? '1' : '0'}`}
        active={comb.hot}
        color="#ef4444"
        isDark={isDark}
      />
      <GateBlock
        position={[-4.6, 0.0, 0]}
        size={[2.1, 1.0, 0.7]}
        title="COMP: COLD"
        subtitle={`T(${temp}) <= 10`}
        outputBit={`COLD = ${comb.cold ? '1' : '0'}`}
        active={comb.cold}
        color="#3b82f6"
        isDark={isDark}
      />
      <GateBlock
        position={[-4.6, -1.5, 0]}
        size={[2.1, 1.0, 0.7]}
        title="COMP: HUM_HI"
        subtitle={`H(${humidity}) >= 80`}
        outputBit={`HUM = ${comb.humHigh ? '1' : '0'} · R=${rain ? 1 : 0}`}
        active={comb.humHigh || rain}
        color="#22d3ee"
        isDark={isDark}
      />

      {/* STAGE 2: Status Encoder Gates (Middle-Left, X = -1.3) */}
      {/* status[1] = HOT pass-through */}
      <GateBlock
        position={[-1.35, 1.5, 0]}
        size={[1.85, 0.85, 0.65]}
        title="STATUS[1]"
        subtitle="BUF(HOT)"
        outputBit={`s[1] = ${comb.statusBit1 ? '1' : '0'}`}
        active={comb.statusBit1}
        color="#ef4444"
        isDark={isDark}
      />

      {/* status[0] = ~HOT & ~COLD (NOT + AND Encoder Gate) */}
      <GateBlock
        position={[-1.35, 0.15, 0]}
        size={[2.0, 1.05, 0.65]}
        title="NOR / INV-AND"
        subtitle="~HOT & ~COLD"
        outputBit={`s[0] = ${comb.statusBit0 ? '1' : '0'}`}
        active={comb.statusBit0}
        color="#10b981"
        isDark={isDark}
      />

      {/* STAGE 3: 2-to-1 Enable MUX Cell (Middle-Right, X = 1.85) */}
      <GateBlock
        position={[1.85, 0.85, 0]}
        size={[2.15, 1.4, 0.72]}
        title="2-to-1 ENABLE MUX"
        subtitle={`Y = S'·I0 + S·I1 (S=${evalEn ? 1 : 0})`}
        outputBit={`Y = ${muxOutStr} (${evalEn ? 'LOAD I1' : 'HOLD I0'})`}
        active={evalEn}
        color="#f59e0b"
        isDark={isDark}
      />

      {/* STAGE 4: D Flip-Flop Bank with Async Reset (Right, X = 4.9) */}
      <group position={[4.95, 0.45, 0]}>
        <RoundedBox args={[2.15, 2.25, 0.85]} radius={0.12} smoothness={4}>
          <meshStandardMaterial
            color={isDark ? '#111d33' : '#f8fafc'}
            emissive="#22d3ee"
            emissiveIntensity={0.22}
            roughness={0.3}
            metalness={0.35}
          />
        </RoundedBox>
        {/* Top clock/reset reaction bar */}
        <mesh position={[0, 1.16, 0]}>
          <boxGeometry args={[1.95, 0.08, 0.7]} />
          <meshStandardMaterial
            ref={dffHaloRef}
            color="#22d3ee"
            emissive="#22d3ee"
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </mesh>
        <Html position={[0, 0, 0.5]} center distanceFactor={11} zIndexRange={[15, 0]}>
          <div className="pointer-events-none select-none rounded-lg border border-cyan-500/40 bg-slate-950/92 px-2.5 py-1.5 text-center">
            <div className="font-mono text-[10px] font-bold text-cyan-300">D FLIP-FLOPS</div>
            <div className="font-mono text-[9px] text-slate-400">posedge clk | async rst</div>
            <div className="mt-1 space-y-0.5 font-mono text-[10px]">
              <div className="text-white">
                Q_status: <span className="font-bold text-amber-300">{reg.tempStatus}</span> ({reg.tempLabel})
              </div>
              <div className="text-slate-300">
                Q_hum: <span className={reg.humidityAlert ? 'text-blue-400 font-bold' : 'text-slate-500'}>{reg.humidityAlert ? '1' : '0'}</span>
                {' · '}
                Q_rain: <span className={reg.rainAlert ? 'text-cyan-400 font-bold' : 'text-slate-500'}>{reg.rainAlert ? '1' : '0'}</span>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {/* Live Glowing Interconnect Wires */}
      {/* HOT -> status[1] */}
      <LogicWire
        points={[[-3.55, 1.5, 0], [-2.28, 1.5, 0]]}
        active={comb.hot}
        activeColor="#ef4444"
        animate={animate}
      />
      {/* HOT -> NOR/INV-AND (~HOT branch) */}
      <LogicWire
        points={[[-3.55, 1.32, 0], [-2.9, 1.32, 0], [-2.9, 0.45, 0], [-2.35, 0.45, 0]]}
        active={!comb.hot}
        activeColor="#10b981"
        animate={animate}
      />
      {/* COLD -> NOR/INV-AND (~COLD branch) */}
      <LogicWire
        points={[[-3.55, 0.0, 0], [-2.35, 0.0, 0]]}
        active={!comb.cold}
        activeColor="#10b981"
        animate={animate}
      />
      {/* Encoder status[1:0] -> MUX I1 (Load input) */}
      <LogicWire
        points={[[-0.42, 1.5, 0], [0.25, 1.5, 0], [0.25, 1.15, 0], [0.78, 1.15, 0]]}
        active={comb.statusBit1 && evalEn}
        activeColor="#ef4444"
        animate={animate}
      />
      <LogicWire
        points={[[-0.35, 0.15, 0], [0.25, 0.15, 0], [0.25, 0.72, 0], [0.78, 0.72, 0]]}
        active={comb.statusBit0 && evalEn}
        activeColor="#10b981"
        animate={animate}
      />

      {/* Feedback Hold Wire: DFF Q -> MUX I0 (lights amber when S = evalEn = 0!) */}
      <LogicWire
        points={[
          [4.95, 1.62, 0],
          [4.95, 2.35, 0],
          [0.45, 2.35, 0],
          [0.45, 1.35, 0],
          [0.78, 1.35, 0]
        ]}
        active={!evalEn}
        activeColor="#f59e0b"
        animate={animate}
      />

      {/* MUX Y -> DFF D input */}
      <LogicWire
        points={[[2.92, 0.85, 0], [3.88, 0.85, 0]]}
        active={muxOut1 || muxOut0}
        activeColor={muxOut1 ? '#ef4444' : '#10b981'}
        animate={animate}
      />

      {/* HUM_HIGH + RAIN bypass bus -> Alert DFFs */}
      <LogicWire
        points={[[-3.55, -1.5, 0], [1.9, -1.5, 0], [3.2, -0.35, 0], [3.88, -0.35, 0]]}
        active={comb.humHigh || rain}
        activeColor="#22d3ee"
        animate={animate}
      />

      {/* Label for Q -> I0 feedback loop */}
      <Html position={[2.7, 2.6, 0]} center distanceFactor={12} zIndexRange={[10, 0]}>
        <div
          className={`pointer-events-none whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] ${
            !evalEn
              ? 'border-amber-400 bg-amber-950/90 font-bold text-amber-300'
              : 'border-slate-700 bg-slate-950/75 text-slate-400'
          }`}
        >
          Feedback Q → I0 ({!evalEn ? 'HOLDING Q' : 'inactive'})
        </div>
      </Html>

      <OrbitControls
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minDistance={6.5}
        maxDistance={15}
        target={[0.1, 0.25, 0]}
      />
    </>
  );
};
