import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  ARCHITECTURE_BLOCKS,
  ARCHITECTURE_LINKS,
  ArchitectureBlock
} from '../data/architectureData';
import { useTheme } from '../context/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ArchitectureSceneProps {
  scrollProgressRef: React.MutableRefObject<number>;
  hoveredId: string | null;
  selectedId: string | null;
  freeOrbit: boolean;
  onHover: (id: string | null) => void;
  onSelect: (block: ArchitectureBlock) => void;
}

const ArchBlockMesh: React.FC<{
  block: ArchitectureBlock;
  isHovered: boolean;
  isSelected: boolean;
  isDark: boolean;
  onHover: (id: string | null) => void;
  onSelect: (block: ArchitectureBlock) => void;
}> = ({ block, isHovered, isSelected, isDark, onHover, onSelect }) => {
  const groupRef = useRef<THREE.Group | null>(null);
  const baseY = block.position[1];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetY = baseY + (isHovered || isSelected ? 0.38 : 0);
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      Math.min(1, delta * 9)
    );
  });

  const [w, h, d] = block.size;

  return (
    <group
      ref={groupRef}
      position={block.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(block.id);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block);
      }}
    >
      {/* Main Frosted Hardware Block */}
      <RoundedBox args={[w, h, d]} radius={0.12} smoothness={4}>
        <meshStandardMaterial
          color={isDark ? '#101d32' : '#ffffff'}
          emissive={block.color}
          emissiveIntensity={isSelected ? 0.55 : isHovered ? 0.38 : 0.14}
          roughness={0.3}
          metalness={0.35}
        />
      </RoundedBox>

      {/* Top glowing accent rail */}
      <mesh position={[0, h / 2 + 0.04, 0]}>
        <boxGeometry args={[w * 0.9, 0.06, d * 0.85]} />
        <meshStandardMaterial
          color={block.color}
          emissive={block.color}
          emissiveIntensity={isSelected ? 2.4 : isHovered ? 1.8 : 0.95}
          toneMapped={false}
        />
      </mesh>

      {/* Subtle Circuit Port Pins on left & right */}
      {[-0.25, 0, 0.25].map((zOff, i) => (
        <React.Fragment key={i}>
          <mesh position={[-w / 2 - 0.04, 0, zOff]}>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[w / 2 + 0.04, 0, zOff]}>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Crisp Hardware Block Label */}
      <Html position={[0, 0.05, d / 2 + 0.08]} center distanceFactor={13} zIndexRange={[15, 0]}>
        <div
          className={`pointer-events-none select-none rounded-lg border px-2.5 py-1 text-center transition-all ${
            isSelected
              ? 'border-cyan-300 bg-slate-950/95 shadow-glow-cyan'
              : isHovered
                ? 'border-cyan-400/70 bg-slate-950/92'
                : 'border-slate-700/80 bg-slate-950/86'
          }`}
        >
          <div
            className="font-mono text-[10px] font-bold uppercase tracking-wider"
            style={{ color: block.color }}
          >
            {block.category === 'control' ? 'CONTROL PATH' : block.shortName}
          </div>
          <div className="max-w-[130px] text-[11px] font-semibold leading-tight text-slate-100">
            {block.name}
          </div>
        </div>
      </Html>

      {/* Hover Tooltip */}
      {isHovered && (
        <Html position={[0, h / 2 + 0.85, 0]} center distanceFactor={13} zIndexRange={[30, 0]}>
          <div className="pointer-events-none w-56 rounded-xl border border-cyan-400/50 bg-slate-950/95 p-2.5 text-left shadow-xl">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-bold uppercase text-cyan-300">
                Click to inspect RTL
              </span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: block.color }}
              />
            </div>
            <p className="text-[11px] leading-snug text-slate-200">{block.summary}</p>
          </div>
        </Html>
      )}
    </group>
  );
};

const DataFlowLink: React.FC<{
  from: ArchitectureBlock;
  to: ArchitectureBlock;
  color: string;
  type: 'data' | 'handshake';
  animate: boolean;
}> = ({ from, to, color, type, animate }) => {
  const { curve, geometry, arrowPos, arrowQuat } = useMemo(() => {
    const start = new THREE.Vector3(...from.position);
    const end = new THREE.Vector3(...to.position);

    let pts: THREE.Vector3[];
    if (type === 'data') {
      start.x += from.size[0] / 2 + 0.08;
      end.x -= to.size[0] / 2 + 0.14;
      const mid = start.clone().lerp(end, 0.5);
      pts = [start, mid, end];
    } else {
      // Overhead Control FSM handshake curving cleanly down into block top
      start.y -= from.size[1] / 2 + 0.05;
      end.y += to.size[1] / 2 + 0.14;
      const mid1 = new THREE.Vector3(
        THREE.MathUtils.lerp(start.x, end.x, 0.35),
        start.y - 0.8,
        (start.z + end.z) * 0.5
      );
      const mid2 = new THREE.Vector3(
        THREE.MathUtils.lerp(start.x, end.x, 0.8),
        end.y + 0.85,
        end.z
      );
      pts = [start, mid1, mid2, end];
    }

    const c = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(c, 28, type === 'data' ? 0.04 : 0.028, 8, false);
    const tip = c.getPointAt(0.96);
    const tangent = c.getTangentAt(0.96).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    return { curve: c, geometry: g, arrowPos: tip, arrowQuat: quat };
  }, [from, to, type]);

  const beadRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame(({ clock }) => {
    if (!animate || !beadRef.current) return;
    const t = (clock.getElapsedTime() * (type === 'data' ? 0.55 : 0.42)) % 1;
    beadRef.current.position.copy(curve.getPointAt(t));
  });

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={type === 'data' ? 1.0 : 0.7}
          transparent={type === 'handshake'}
          opacity={type === 'handshake' ? 0.72 : 1}
          toneMapped={false}
        />
      </mesh>
      {/* Arrowhead Cone */}
      <mesh position={arrowPos} quaternion={arrowQuat}>
        <coneGeometry args={[0.11, 0.26, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      {/* Animated travelling data token */}
      {animate && (
        <mesh ref={beadRef}>
          <sphereGeometry args={[0.095, 10, 10]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={color}
            emissiveIntensity={3.0}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
};

export const ArchitectureScene: React.FC<ArchitectureSceneProps> = ({
  scrollProgressRef,
  hoveredId,
  selectedId,
  freeOrbit,
  onHover,
  onSelect
}) => {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 1.0, 0));

  const blockMap = useMemo(() => {
    const map: Record<string, ArchitectureBlock> = {};
    for (const b of ARCHITECTURE_BLOCKS) map[b.id] = b;
    return map;
  }, []);

  // Scroll camera flight path across all 8 exploded hardware blocks
  const cameraStops = useMemo(
    () => [
      { pos: new THREE.Vector3(-8.5, 4.2, 8.6), target: new THREE.Vector3(-7.5, 0.3, 0) },
      { pos: new THREE.Vector3(-4.2, 3.8, 8.0), target: new THREE.Vector3(-4.2, 0.4, 0) },
      { pos: new THREE.Vector3(0.2, 4.8, 9.2), target: new THREE.Vector3(0.1, 1.4, 0) },
      { pos: new THREE.Vector3(4.5, 3.8, 8.0), target: new THREE.Vector3(4.5, 0.4, 0) },
      { pos: new THREE.Vector3(8.5, 4.2, 8.6), target: new THREE.Vector3(7.5, 0.3, 0) },
      { pos: new THREE.Vector3(0.1, 5.6, 15.8), target: new THREE.Vector3(0.1, 1.2, 0) }
    ],
    []
  );

  useFrame((_, delta) => {
    if (freeOrbit) return;
    const dt = Math.min(delta, 0.05);

    if (selectedId && blockMap[selectedId]) {
      const blk = blockMap[selectedId];
      camera.position.lerp(new THREE.Vector3(...blk.cameraPos), dt * 4);
      lookTarget.current.lerp(new THREE.Vector3(...blk.cameraTarget), dt * 4);
      camera.lookAt(lookTarget.current);
      return;
    }

    const p = THREE.MathUtils.clamp(scrollProgressRef.current, 0, 1);
    const maxSeg = cameraStops.length - 1;
    const scaled = p * maxSeg;
    const idx = Math.min(maxSeg - 1, Math.floor(scaled));
    const localT = scaled - idx;

    const desiredPos = cameraStops[idx].pos.clone().lerp(cameraStops[idx + 1].pos, localT);
    const desiredTarget = cameraStops[idx].target
      .clone()
      .lerp(cameraStops[idx + 1].target, localT);

    camera.position.lerp(desiredPos, dt * 4.5);
    lookTarget.current.lerp(desiredTarget, dt * 4.5);
    camera.lookAt(lookTarget.current);
  });

  return (
    <>
      <fog attach="fog" args={[isDark ? '#09130a' : '#ebe6d7', 16, 36]} />
      <ambientLight intensity={isDark ? 0.6 : 0.95} />
      <directionalLight position={[6, 12, 8]} intensity={1.5} color="#fff4dc" />
      <pointLight position={[0, 6, 4]} intensity={1.5} color="#e5c78a" distance={22} />

      <gridHelper
        args={[32, 32, isDark ? '#6a5b39' : '#968762', isDark ? '#192a1a' : '#cec7b1']}
        position={[0, -1.6, 0]}
      />

      {ARCHITECTURE_BLOCKS.map((block) => (
        <ArchBlockMesh
          key={block.id}
          block={block}
          isHovered={hoveredId === block.id}
          isSelected={selectedId === block.id}
          isDark={isDark}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      {ARCHITECTURE_LINKS.map((link, idx) => (
        <DataFlowLink
          key={idx}
          from={blockMap[link.from]}
          to={blockMap[link.to]}
          color={link.color}
          type={link.type}
          animate={!reducedMotion}
        />
      ))}

      {freeOrbit && (
        <OrbitControls
          enableDamping
          dampingFactor={0.07}
          maxDistance={24}
          minDistance={5}
          target={[0, 1, 0]}
        />
      )}
    </>
  );
};
