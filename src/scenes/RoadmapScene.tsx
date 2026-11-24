import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { FUTURE_ROADMAP, RoadmapMilestone } from '../data/projectData';
import { useTheme } from '../context/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface RoadmapSceneProps {
  activeId: string;
  onSelect: (milestone: RoadmapMilestone) => void;
}

const MilestoneIcon: React.FC<{
  id: string;
  color: string;
  active: boolean;
  animate: boolean;
}> = ({ id, color, active, animate }) => {
  const ref = useRef<THREE.Group | null>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !animate) return;
    ref.current.rotation.y = clock.getElapsedTime() * (active ? 1.1 : 0.45);
    ref.current.position.y = 0.85 + Math.sin(clock.getElapsedTime() * 2.2) * 0.08;
  });

  return (
    <group ref={ref} position={[0, 0.85, 0]}>
      {id === 'thresholds' && (
        // Sliders / DIP switch rack
        <group>
          {[-0.25, 0, 0.25].map((x, idx) => (
            <group key={idx} position={[x, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.12, 0.56, 0.12]} />
                <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh position={[0, idx === 1 ? 0.12 : -0.1, 0.08]}>
                <boxGeometry args={[0.16, 0.12, 0.1]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={active ? 2.4 : 1.0}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {id === 'cloud' && (
        // ESP32 Wi-Fi Signal Rings + Cloud Core
        <group>
          <mesh>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={active ? 2.2 : 1.0}
              toneMapped={false}
            />
          </mesh>
          {[0.42, 0.58].map((r, idx) => (
            <mesh key={idx} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.025, 10, 32]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={active ? 2.0 : 0.7}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      )}
      {id === 'bram' && (
        // Stacked Block RAM Memory Layers
        <group>
          {[-0.22, 0, 0.22].map((y, idx) => (
            <mesh key={idx} position={[0, y, 0]}>
              <boxGeometry args={[0.62, 0.12, 0.62]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={active ? 1.8 : 0.8}
                roughness={0.25}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      )}
      {id === 'buzzer' && (
        // Piezo Acoustic Transducer Cone + Sound Wave Ring
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.16, 0.35, 20]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={active ? 2.2 : 1.0}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0.34, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.36, 0.026, 10, 28]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={active ? 2.4 : 0.8}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export const RoadmapScene: React.FC<RoadmapSceneProps> = ({ activeId, onSelect }) => {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  const { curve, pathGeo } = useMemo(() => {
    const pts = FUTURE_ROADMAP.map((m) => new THREE.Vector3(...m.position));
    const c = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(c, 56, 0.055, 10, false);
    return { curve: c, pathGeo: g };
  }, []);

  const travelerRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    return () => pathGeo.dispose();
  }, [pathGeo]);

  useFrame(({ clock }) => {
    if (!travelerRef.current || !animate) return;
    const t = (clock.getElapsedTime() * 0.22) % 1;
    travelerRef.current.position.copy(curve.getPointAt(t));
  });

  return (
    <>
      <ambientLight intensity={isDark ? 0.55 : 0.9} />
      <directionalLight position={[4, 10, 6]} intensity={1.45} />
      <pointLight position={[0, 5, 4]} intensity={1.5} color="#22d3ee" distance={20} />

      <gridHelper
        args={[20, 20, isDark ? '#6a5b39' : '#968762', isDark ? '#192a1a' : '#cec7b1']}
        position={[0, -0.8, 0]}
      />

      {/* Ascending Glowing Roadmap Spine */}
      <mesh geometry={pathGeo}>
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      {animate && (
        <mesh ref={travelerRef}>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#22d3ee"
            emissiveIntensity={3.2}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* 4 Holographic Milestone Pedestals */}
      {FUTURE_ROADMAP.map((m) => {
        const isActive = m.id === activeId;
        const pillarHeight = m.position[1] + 0.8;
        return (
          <group
            key={m.id}
            position={m.position}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(m);
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            {/* Supporting glowing column down to floor */}
            <mesh position={[0, -pillarHeight / 2, 0]}>
              <cylinderGeometry args={[0.12, 0.2, pillarHeight, 14]} />
              <meshStandardMaterial
                color={isDark ? '#111d33' : '#cbd5e1'}
                emissive={m.color}
                emissiveIntensity={isActive ? 0.45 : 0.12}
              />
            </mesh>
            {/* Glowing Halo Disc */}
            <mesh>
              <cylinderGeometry args={[0.68, 0.78, 0.16, 24]} />
              <meshStandardMaterial
                color={isDark ? '#0f172a' : '#f8fafc'}
                emissive={m.color}
                emissiveIntensity={isActive ? 1.4 : 0.4}
                roughness={0.25}
                metalness={0.5}
              />
            </mesh>

            <MilestoneIcon id={m.id} color={m.color} active={isActive} animate={animate} />

            <Html position={[0, -0.45, 0.65]} center distanceFactor={11} zIndexRange={[15, 0]}>
              <button
                type="button"
                onClick={() => onSelect(m)}
                className={`whitespace-nowrap rounded-lg border px-2.5 py-1 font-mono text-[10px] transition-all ${
                  isActive
                    ? 'border-cyan-300 bg-slate-950/95 font-bold text-white shadow-glow-cyan'
                    : 'border-slate-700/80 bg-slate-950/80 text-slate-300 hover:border-cyan-400/50'
                }`}
              >
                <span style={{ color: m.color }}>{m.step}</span> · {m.shortLabel}
              </button>
            </Html>
          </group>
        );
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minDistance={6.5}
        maxDistance={15}
        target={[0, 1.5, 0]}
      />
    </>
  );
};
