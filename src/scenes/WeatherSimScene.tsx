import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  AlertLedPod,
  Basys3Board,
  Dht11Sensor,
  GlowingWire,
  Lcd16x2Module,
  RainSensorModule
} from './HardwareModels';
import { RegisteredWeatherState, WeatherInputs } from '../sim/weatherLogic';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface WeatherSimSceneProps {
  inputs: WeatherInputs;
  registered: RegisteredWeatherState;
  lcdLines: [string, string];
  clockPulseId: number;
}

/**
 * Instanced Falling Rain Particles (60 FPS, zero per-frame allocations)
 */
const RainParticles: React.FC<{ count: number; animate: boolean }> = ({ count, animate }) => {
  const ref = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const drops = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: ((i * 73.1) % 11) - 5.5,
        y: ((i * 41.7) % 7) - 0.5,
        z: ((i * 29.3) % 8) - 4,
        speed: 7.5 + (i % 5) * 1.1
      })),
    [count]
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = animate ? Math.min(delta, 0.05) : 0;
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y -= d.speed * dt;
      d.x -= d.speed * 0.14 * dt;
      if (d.y < -1.2) {
        d.y = 5.8;
        d.x = ((i * 73.1) % 11) - 5.5;
      }
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(0, 0, -0.14);
      dummy.scale.set(0.022, 0.42, 0.022);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.5, 0.5, 1, 5]} />
      <meshBasicMaterial color="#38bdf8" transparent opacity={0.78} />
    </instancedMesh>
  );
};

/**
 * Instanced Snow Particles for COLD (temp <= 10 °C)
 */
const SnowParticles: React.FC<{ count: number; animate: boolean }> = ({ count, animate }) => {
  const ref = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: ((i * 61.3) % 11) - 5.5,
        y: ((i * 37.9) % 7) - 0.5,
        z: ((i * 47.1) % 8) - 4,
        speed: 1.1 + (i % 5) * 0.25,
        swayPhase: i * 0.7,
        size: 0.045 + (i % 4) * 0.015
      })),
    [count]
  );

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const dt = animate ? Math.min(delta, 0.05) : 0;
    const t = clock.getElapsedTime();
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.y -= f.speed * dt;
      if (f.y < -1.1) f.y = 5.6;
      const swayX = animate ? Math.sin(t * 1.4 + f.swayPhase) * 0.35 : 0;
      dummy.position.set(f.x + swayX, f.y, f.z);
      dummy.scale.setScalar(f.size);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#e0f2fe"
        emissive="#93c5fd"
        emissiveIntensity={0.8}
        roughness={0.2}
      />
    </instancedMesh>
  );
};

/**
 * Shimmering Heat-Haze Ribbons + Radiant Sun Orb for HOT (temp >= 40 °C)
 */
const HeatHazeEffect: React.FC<{ animate: boolean }> = ({ animate }) => {
  const groupRef = useRef<THREE.Group | null>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !animate) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, idx) => {
      child.position.y = 0.6 + ((t * 0.7 + idx * 0.6) % 2.8);
      child.rotation.y = Math.sin(t * 2 + idx) * 0.3;
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.sin(((child.position.y - 0.6) / 2.8) * Math.PI) * 0.24;
      }
    });
  });

  return (
    <group>
      {/* Glowing Sun Orb high back-right */}
      <mesh position={[3.8, 3.6, -3.2]}>
        <sphereGeometry args={[0.72, 24, 24]} />
        <meshStandardMaterial
          color="#fb923c"
          emissive="#ef4444"
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[3.8, 3.6, -2.5]} intensity={3.2} color="#fb923c" distance={16} />

      {/* Rising heat-shimmer translucent rings */}
      <group ref={groupRef}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0.8 + i * 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.4 + i * 0.15, 2.3 + i * 0.2, 32]} />
            <meshBasicMaterial
              color="#f97316"
              transparent
              opacity={0.16}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/**
 * Drifting Volumetric-Style Humidity Fog Puffs for humidity >= 80%
 */
const HumidityMistEffect: React.FC<{ animate: boolean }> = ({ animate }) => {
  const groupRef = useRef<THREE.Group | null>(null);
  const puffs = useMemo(
    () => [
      [-3.2, 0.5, -1.5, 1.8],
      [2.8, 0.7, -1.8, 2.0],
      [-1.5, 0.4, 2.2, 1.6],
      [2.2, 0.45, 2.0, 1.7],
      [0, 1.2, -2.5, 2.4]
    ],
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current || !animate) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, idx) => {
      child.position.x = puffs[idx][0] + Math.sin(t * 0.45 + idx * 1.3) * 0.65;
    });
  });

  return (
    <group ref={groupRef}>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1.6, 0.55, 1.2]}>
          <sphereGeometry args={[r, 16, 16]} />
          <meshStandardMaterial
            color="#bae6fd"
            transparent
            opacity={0.14}
            roughness={1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

export const WeatherSimScene: React.FC<WeatherSimSceneProps> = ({
  inputs,
  registered,
  lcdLines,
  clockPulseId
}) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  // Ambient weather environment responds directly to live physical inputs around the sensors,
  // while the FPGA's LCD & Alert LEDs respond STRICTLY to registered outputs on posedge clk!
  const isAmbientHot = inputs.temp >= 40;
  const isAmbientCold = inputs.temp <= 10;
  const isAmbientHumid = inputs.humidity >= 80;
  const isAmbientRain = inputs.rain;

  const regHeat = registered.tempStatus === '10';
  const regCold = registered.tempStatus === '00';

  const fogColor = isAmbientHot
    ? isDark
      ? '#1d140c'
      : '#f3e3cc'
    : isAmbientCold
      ? isDark
        ? '#0a1824'
        : '#dce8f0'
      : isDark
        ? '#09130a'
        : '#ebe6d7';

  return (
    <>
      <color attach="background" args={[fogColor]} />
      <fog
        attach="fog"
        args={[fogColor, isAmbientHumid ? 6.5 : 11, isAmbientHumid ? 17 : 26]}
      />

      <ambientLight
        intensity={isDark ? 0.55 : 0.9}
        color={isAmbientHot ? '#fed7aa' : isAmbientCold ? '#bfdbfe' : '#ffffff'}
      />
      <directionalLight
        position={[5, 9, 6]}
        intensity={isAmbientHot ? 1.85 : 1.45}
        color={isAmbientHot ? '#fdba74' : isAmbientCold ? '#93c5fd' : '#ffffff'}
      />
      <pointLight
        position={[-3, 3, 3]}
        intensity={1.5}
        color={regHeat ? '#ef4444' : regCold ? '#3b82f6' : '#22d3ee'}
        distance={14}
      />

      {/* Chamber Lab Grid Floor */}
      <gridHelper
        args={[22, 22, isDark ? '#c9aa6e' : '#7b6840', isDark ? '#1b2e1c' : '#c9c1aa']}
        position={[0, -1.15, 0]}
      />
      <mesh position={[0, -1.18, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color={isDark ? '#070f08' : '#e0dac7'} roughness={0.85} />
      </mesh>

      {/* Main Testbed Assembly */}
      <group position={[0, -0.35, 0]}>
        {/* Central Basys 3 FPGA Board */}
        <Basys3Board
          position={[-0.35, 0, 0.15]}
          ledHeat={regHeat}
          ledHumidity={registered.humidityAlert}
          ledRain={registered.rainAlert}
          clockPulseId={clockPulseId}
        />

        {/* DHT11 Sensor */}
        <Dht11Sensor position={[-3.35, 0.05, 0.95]} rotation={[0, 0.35, 0]} scale={0.92} />

        {/* Rain Sensor */}
        <RainSensorModule
          position={[-3.5, 0.16, -1.05]}
          rotation={[0, 0.4, 0]}
          scale={0.82}
          rainActive={isAmbientRain}
        />

        {/* Prominent Tilted 16x2 LCD showing REGISTERED FPGA outputs */}
        <Lcd16x2Module
          position={[3.15, 0.72, -0.15]}
          rotation={[-0.32, -0.32, 0]}
          scale={1.08}
          line1={lcdLines[0]}
          line2={lcdLines[1]}
          alertTint={regHeat ? 'hot' : regCold ? 'cold' : 'normal'}
        />

        {/* Prominent 3D Alert LED Pod (Heat Red, Humidity Blue, Rain Cyan) */}
        <AlertLedPod
          position={[3.1, -0.42, 1.05]}
          rotation={[0.15, -0.25, 0]}
          heat={regHeat}
          humidity={registered.humidityAlert}
          rain={registered.rainAlert}
        />

        {/* Glowing Interconnect Wires */}
        <GlowingWire
          points={[
            [-2.9, 0.12, 1.35],
            [-2.6, 0.42, 0.8],
            [-2.4, 0.22, -0.25]
          ]}
          color="#22d3ee"
          animate={animate}
        />
        <GlowingWire
          points={[
            [-2.75, 0.15, -0.75],
            [-2.5, 0.38, -0.2],
            [-2.4, 0.2, 0.45]
          ]}
          color="#10b981"
          animate={animate}
        />
        <GlowingWire
          points={[
            [1.75, 0.18, -0.3],
            [2.25, 0.65, -0.25],
            [2.45, 0.85, -0.15]
          ]}
          color="#a855f7"
          animate={animate}
        />
        <GlowingWire
          points={[
            [1.75, 0.18, 0.55],
            [2.3, 0.2, 0.9],
            [2.55, -0.25, 1.05]
          ]}
          color={regHeat ? '#ef4444' : registered.humidityAlert ? '#3b82f6' : '#22d3ee'}
          animate={animate}
        />
      </group>

      {/* Dynamic Weather Effects */}
      {isAmbientHot && <HeatHazeEffect animate={animate} />}
      {isAmbientCold && <SnowParticles count={isMobile ? 55 : 130} animate={animate} />}
      {isAmbientRain && <RainParticles count={isMobile ? 75 : 170} animate={animate} />}
      {isAmbientHumid && <HumidityMistEffect animate={animate} />}

      <OrbitControls
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minDistance={5.2}
        maxDistance={12.5}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0.4, 0.2, 0]}
      />
    </>
  );
};
