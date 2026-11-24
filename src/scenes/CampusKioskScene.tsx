import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Dht11Sensor, Lcd16x2Module, RainSensorModule } from './HardwareModels';
import { createKioskSignTexture } from './proceduralTextures';
import { RegisteredWeatherState } from '../sim/weatherLogic';
import { useTheme } from '../context/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface CampusKioskSceneProps {
  registered: RegisteredWeatherState;
  lcdLines: [string, string];
}

export const CampusKioskScene: React.FC<CampusKioskSceneProps> = ({ registered, lcdLines }) => {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const signTex = useMemo(() => createKioskSignTexture(), []);
  const beaconRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    return () => signTex.dispose();
  }, [signTex]);

  const anyAlert =
    registered.tempStatus === '10' ||
    registered.tempStatus === '00' ||
    registered.humidityAlert ||
    registered.rainAlert;

  const beaconColor =
    registered.tempStatus === '10'
      ? '#ef4444'
      : registered.rainAlert
        ? '#22d3ee'
        : registered.humidityAlert || registered.tempStatus === '00'
          ? '#3b82f6'
          : '#10b981';

  useFrame(({ clock }) => {
    if (!beaconRef.current) return;
    if (anyAlert && !reducedMotion) {
      beaconRef.current.emissiveIntensity = 1.6 + Math.sin(clock.getElapsedTime() * 6) * 1.4;
    } else {
      beaconRef.current.emissiveIntensity = 1.2;
    }
  });

  return (
    <>
      <ambientLight intensity={isDark ? 0.6 : 0.95} />
      <directionalLight position={[6, 10, 7]} intensity={1.5} />
      <pointLight position={[0, 4.5, 2]} intensity={1.5} color={beaconColor} distance={12} />

      {/* Campus Plaza Ground Disc */}
      <mesh position={[0, -2.05, 0]} receiveShadow>
        <cylinderGeometry args={[3.4, 3.6, 0.18, 36]} />
        <meshStandardMaterial color={isDark ? '#152516' : '#d6cfba'} roughness={0.8} />
      </mesh>
      <gridHelper
        args={[14, 14, isDark ? '#6a5b39' : '#968762', isDark ? '#192a1a' : '#cec7b1']}
        position={[0, -2.14, 0]}
      />

      <group position={[0, -0.3, 0]}>
        {/* Main Weatherproof Steel Kiosk Pedestal */}
        <RoundedBox args={[2.1, 3.3, 1.05]} radius={0.1} smoothness={4} position={[0, -0.1, 0]}>
          <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.65} />
        </RoundedBox>

        {/* Glowing Cyan Side Trim Rails */}
        {[-1.06, 1.06].map((x, idx) => (
          <mesh key={idx} position={[x, -0.1, 0.42]}>
            <boxGeometry args={[0.05, 2.9, 0.05]} />
            <meshStandardMaterial
              color="#22d3ee"
              emissive="#22d3ee"
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* GAT Bengaluru Header Signboard */}
        <mesh position={[0, 1.15, 0.54]}>
          <planeGeometry args={[1.85, 0.46]} />
          <meshStandardMaterial map={signTex} roughness={0.25} />
        </mesh>

        {/* Embedded Live 16x2 LCD Screen */}
        <Lcd16x2Module
          position={[0, 0.35, 0.54]}
          scale={0.62}
          line1={lcdLines[0]}
          line2={lcdLines[1]}
          alertTint={
            registered.tempStatus === '10'
              ? 'hot'
              : registered.tempStatus === '00'
                ? 'cold'
                : 'normal'
          }
        />

        {/* Glass Inspection Window revealing Artix-7 PCB Inside */}
        <mesh position={[0, -0.62, 0.53]}>
          <boxGeometry args={[1.45, 0.9, 0.04]} />
          <meshStandardMaterial
            color="#0f5132"
            emissive="#10b981"
            emissiveIntensity={0.25}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, -0.62, 0.56]}>
          <boxGeometry args={[0.42, 0.42, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} />
        </mesh>

        {/* Slanted Solar Canopy Roof */}
        <group position={[0, 1.88, 0.15]} rotation={[0.24, 0, 0]}>
          <mesh>
            <boxGeometry args={[2.7, 0.1, 1.8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Photovoltaic Silicon Solar Cells */}
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[2.45, 0.02, 1.55]} />
            <meshStandardMaterial color="#1d4ed8" metalness={0.8} roughness={0.18} />
          </mesh>
        </group>

        {/* Mast Pole with Mounted Sensors & Alert Beacon */}
        <mesh position={[1.38, 0.65, -0.1]}>
          <cylinderGeometry args={[0.07, 0.08, 4.4, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Sensor Crossbar */}
        <mesh position={[1.38, 1.85, -0.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 1.1, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Pole-Mounted DHT11 + Rain Sensor */}
        <Dht11Sensor position={[1.88, 1.98, -0.1]} scale={0.45} />
        <RainSensorModule
          position={[0.92, 2.02, -0.1]}
          scale={0.42}
          rainActive={registered.rainAlert}
        />

        {/* Top Alert Beacon Dome */}
        <mesh position={[1.38, 2.92, -0.1]}>
          <capsuleGeometry args={[0.16, 0.18, 10, 16]} />
          <meshStandardMaterial
            ref={beaconRef}
            color={beaconColor}
            emissive={beaconColor}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minDistance={5.2}
        maxDistance={11}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.55}
        target={[0.2, 0.25, 0]}
      />
    </>
  );
};
