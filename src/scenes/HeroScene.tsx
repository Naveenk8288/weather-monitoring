import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Basys3Board,
  Dht11Sensor,
  GlowingWire,
  Lcd16x2Module,
  RainSensorModule
} from './HardwareModels';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface HeroSceneProps {
  lcdLines: [string, string];
  ledHeat: boolean;
  ledHumidity: boolean;
  ledRain: boolean;
  clockPulseId: number;
  scrollProgressRef: React.MutableRefObject<number>;
}

/**
 * Glowing Circuit-Trace Grid Floor with Instanced Animated Electric Pulses
 */
const CircuitGridFloor: React.FC<{ isDark: boolean; count: number; animate: boolean }> = ({
  isDark,
  count,
  animate
}) => {
  const instRef = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const pulses = useMemo(() => {
    const items: {
      axis: 'x' | 'z';
      lane: number;
      offset: number;
      speed: number;
      dir: 1 | -1;
      isCyan: boolean;
    }[] = [];
    for (let i = 0; i < count; i++) {
      const axis = i % 2 === 0 ? 'x' : 'z';
      const lane = ((i % 15) - 7) * 1.4;
      items.push({
        axis,
        lane,
        offset: ((i * 1.73) % 20) - 10,
        speed: 2.2 + (i % 5) * 0.7,
        dir: i % 3 === 0 ? -1 : 1,
        isCyan: i % 3 !== 0
      });
    }
    return items;
  }, [count]);

  useEffect(() => {
    if (!instRef.current) return;
    const cCyan = new THREE.Color('#22d3ee');
    const cGreen = new THREE.Color('#10b981');
    pulses.forEach((p, i) => {
      instRef.current!.setColorAt(i, p.isCyan ? cCyan : cGreen);
    });
    if (instRef.current.instanceColor) {
      instRef.current.instanceColor.needsUpdate = true;
    }
  }, [pulses]);

  useFrame(({ clock }) => {
    if (!instRef.current) return;
    const t = animate ? clock.getElapsedTime() : 0.4;
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      let pos = ((p.offset + t * p.speed * p.dir + 12) % 24) - 12;
      if (pos < -12) pos += 24;
      if (p.axis === 'x') {
        dummy.position.set(pos, -1.62, p.lane);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.65, 0.035, 0.045);
      } else {
        dummy.position.set(p.lane, -1.62, pos);
        dummy.rotation.set(0, Math.PI / 2, 0);
        dummy.scale.set(0.65, 0.035, 0.045);
      }
      dummy.updateMatrix();
      instRef.current.setMatrixAt(i, dummy.matrix);
    }
    instRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Subtle translucent floor plane so the looping canopy video shines behind the floating board */}
      <mesh position={[0, -1.68, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 34]} />
        <meshStandardMaterial
          color={isDark ? '#070f08' : '#e0dac7'}
          roughness={0.85}
          metalness={0.15}
          transparent
          opacity={0.32}
        />
      </mesh>
      {/* Orthogonal glowing golden-sage circuit grid */}
      <gridHelper
        args={[26, 26, isDark ? '#d9ba7b' : '#7b6840', isDark ? '#1c2f1d' : '#c7bfa7']}
        position={[0, -1.65, 0]}
      />
      {/* Instanced electric pulses shooting along PCB traces */}
      <instancedMesh ref={instRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

export const HeroScene: React.FC<HeroSceneProps> = ({
  lcdLines,
  ledHeat,
  ledHumidity,
  ledRain,
  clockPulseId,
  scrollProgressRef
}) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const rigRef = useRef<THREE.Group | null>(null);
  const { camera, pointer } = useThree();
  const lookTarget = useMemo(() => new THREE.Vector3(0, 0.1, 0), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const scroll = scrollProgressRef.current;

    // Gentle mouse parallax + slight orbital movement + scroll-driven zoom/elevation
    const targetCamX = (reducedMotion ? 0 : pointer.x * 1.1) + scroll * 1.4;
    const targetCamY = 3.25 + (reducedMotion ? 0 : pointer.y * 0.55) + scroll * 2.1;
    const targetCamZ = (isMobile ? 9.6 : 7.6) - scroll * 1.8;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, dt * 3.2);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, dt * 3.2);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, dt * 3.2);
    camera.lookAt(lookTarget);

    if (rigRef.current && !reducedMotion) {
      rigRef.current.rotation.y = THREE.MathUtils.lerp(
        rigRef.current.rotation.y,
        pointer.x * 0.16 - 0.12 + scroll * 0.35,
        dt * 2.5
      );
      rigRef.current.rotation.x = THREE.MathUtils.lerp(
        rigRef.current.rotation.x,
        0.18 - pointer.y * 0.08,
        dt * 2.5
      );
    }
  });

  const animate = !reducedMotion;

  return (
    <>
      <ambientLight intensity={isDark ? 0.65 : 0.95} />
      <directionalLight position={[6, 9, 6]} intensity={isDark ? 1.45 : 1.8} color="#ffffff" />
      <pointLight position={[-4, 3, 3]} intensity={1.8} color="#22d3ee" distance={14} />
      <pointLight position={[4, 2.5, -2]} intensity={1.3} color="#10b981" distance={12} />

      <CircuitGridFloor isDark={isDark} count={isMobile ? 20 : 48} animate={animate} />

      <group ref={rigRef} position={[0, 0.25, 0]}>
        <Float
          speed={animate ? 1.5 : 0}
          rotationIntensity={animate ? 0.08 : 0}
          floatIntensity={animate ? 0.28 : 0}
        >
          {/* Central Basys 3 FPGA Board */}
          <Basys3Board
            position={[0, 0, 0]}
            ledHeat={ledHeat}
            ledHumidity={ledHumidity}
            ledRain={ledRain}
            clockPulseId={clockPulseId}
          />

          {/* DHT11 Blue Sensor Module (front-left) */}
          <Dht11Sensor position={[-3.35, 0.05, 0.95]} rotation={[0, 0.35, 0]} scale={0.95} />

          {/* Rain Sensor Module (back-left) */}
          <RainSensorModule
            position={[-3.55, 0.18, -1.25]}
            rotation={[0, 0.45, 0]}
            scale={0.82}
            rainActive={ledRain}
          />

          {/* 16x2 Character LCD (right, tilted gracefully toward viewer) */}
          <Lcd16x2Module
            position={[3.65, 0.45, 0.15]}
            rotation={[-0.38, -0.32, 0]}
            scale={0.95}
            line1={lcdLines[0]}
            line2={lcdLines[1]}
            alertTint={ledHeat ? 'hot' : 'normal'}
          />

          {/* Glowing 3D Wires connecting sensors & LCD to Basys 3 PMOD headers */}
          {/* DHT11 -> PMOD JA */}
          <GlowingWire
            points={[
              [-2.88, 0.12, 1.35],
              [-2.55, 0.45, 0.95],
              [-2.28, 0.35, 0.1],
              [-2.08, 0.18, -0.35]
            ]}
            color="#22d3ee"
            speed={0.55}
            phaseOffset={0.1}
            animate={animate}
          />

          {/* Rain Sensor -> PMOD JB */}
          <GlowingWire
            points={[
              [-2.78, 0.15, -0.95],
              [-2.5, 0.42, -0.8],
              [-2.25, 0.32, 0.05],
              [-2.08, 0.18, 0.35]
            ]}
            color="#10b981"
            speed={0.48}
            phaseOffset={0.45}
            animate={animate}
          />

          {/* PMOD JC -> 16x2 LCD parallel data bus (dual ribbon glow) */}
          <GlowingWire
            points={[
              [2.08, 0.18, -0.45],
              [2.55, 0.65, -0.3],
              [2.9, 0.72, -0.05],
              [2.65, 0.92, 0.08]
            ]}
            color="#a855f7"
            speed={0.62}
            phaseOffset={0.25}
            animate={animate}
          />
          <GlowingWire
            points={[
              [2.08, 0.18, 0.35],
              [2.55, 0.5, 0.4],
              [2.95, 0.65, 0.3],
              [3.15, 0.88, 0.18]
            ]}
            color="#22d3ee"
            speed={0.52}
            phaseOffset={0.7}
            animate={animate}
          />

          {/* Subtle floating callout chips on desktop */}
          {!isMobile && (
            <>
              <Html position={[-3.35, 1.05, 0.95]} center distanceFactor={11} zIndexRange={[10, 0]}>
                <div className="pointer-events-none whitespace-nowrap rounded-md border border-cyan-400/40 bg-slate-950/80 px-2 py-0.5 font-mono text-[10px] text-cyan-300 backdrop-blur">
                  DHT11 · 1-Wire
                </div>
              </Html>
              <Html position={[-3.55, 1.1, -1.25]} center distanceFactor={11} zIndexRange={[10, 0]}>
                <div className="pointer-events-none whitespace-nowrap rounded-md border border-emerald-400/40 bg-slate-950/80 px-2 py-0.5 font-mono text-[10px] text-emerald-300 backdrop-blur">
                  Rain Sensor
                </div>
              </Html>
              <Html position={[3.65, 1.45, 0.15]} center distanceFactor={11} zIndexRange={[10, 0]}>
                <div className="pointer-events-none whitespace-nowrap rounded-md border border-purple-400/40 bg-slate-950/80 px-2 py-0.5 font-mono text-[10px] text-purple-300 backdrop-blur">
                  16×2 HD44780 LCD
                </div>
              </Html>
            </>
          )}
        </Float>
      </group>
    </>
  );
};
