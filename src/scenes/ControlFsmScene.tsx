import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { FSM_STATES, FsmStateName } from '../sim/fsmSim';
import { useTheme } from '../context/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ControlFsmSceneProps {
  currentState: FsmStateName;
  prevState: FsmStateName;
  transitionTrigger: number;
  resetFlashTrigger: number;
  onSelectState: (state: FsmStateName) => void;
}

const STATE_POSITIONS: Record<FsmStateName, [number, number, number]> = {
  IDLE: [-3.4, 0.2, 1.7],
  REQUEST: [-2.1, 1.5, -1.9],
  MEASURE: [1.9, 1.7, -1.9],
  EVALUATE: [3.5, 0.3, 1.2],
  DISPLAY: [0.1, -0.9, 2.8]
};

const TRANSITION_ORDER: { from: FsmStateName; to: FsmStateName; label: string; color: string }[] = [
  { from: 'IDLE', to: 'REQUEST', label: 'sample_tick', color: '#22d3ee' },
  { from: 'REQUEST', to: 'MEASURE', label: 'req_done', color: '#10b981' },
  { from: 'MEASURE', to: 'EVALUATE', label: 'data_ready', color: '#f59e0b' },
  { from: 'EVALUATE', to: 'DISPLAY', label: '1 cycle', color: '#a855f7' },
  { from: 'DISPLAY', to: 'IDLE', label: 'lcd_done', color: '#94a3b8' }
];

function buildTransitionCurve(from: FsmStateName, to: FsmStateName): THREE.CatmullRomCurve3 {
  const a = new THREE.Vector3(...STATE_POSITIONS[from]);
  const b = new THREE.Vector3(...STATE_POSITIONS[to]);
  const dir = b.clone().sub(a).normalize();
  const start = a.clone().addScaledVector(dir, 0.72);
  const end = b.clone().addScaledVector(dir, -0.78);
  const mid = start.clone().lerp(end, 0.5);
  // Arc slightly outward & upward for crisp readability
  const radial = mid.clone().setY(0).normalize();
  mid.addScaledVector(radial, 0.65);
  mid.y += 0.35;
  return new THREE.CatmullRomCurve3([start, mid, end]);
}

const StateSphereNode: React.FC<{
  name: FsmStateName;
  code: string;
  color: string;
  position: [number, number, number];
  isActive: boolean;
  animate: boolean;
  onClick: () => void;
}> = ({ name, code, color, position, isActive, animate, onClick }) => {
  const ring1Ref = useRef<THREE.Mesh | null>(null);
  const ring2Ref = useRef<THREE.Mesh | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (sphereRef.current) {
      const targetScale = isActive ? 1.18 + (animate ? Math.sin(t * 4) * 0.04 : 0) : 0.92;
      sphereRef.current.scale.setScalar(
        THREE.MathUtils.lerp(sphereRef.current.scale.x, targetScale, Math.min(1, delta * 8))
      );
    }
    if (animate && ring1Ref.current && ring2Ref.current) {
      ring1Ref.current.rotation.z += delta * (isActive ? 1.8 : 0.3);
      ring1Ref.current.rotation.x += delta * (isActive ? 0.9 : 0.15);
      ring2Ref.current.rotation.y -= delta * (isActive ? 1.4 : 0.25);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={sphereRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.58, 32, 32]} />
        <meshStandardMaterial
          color={isActive ? color : '#1e293b'}
          emissive={color}
          emissiveIntensity={isActive ? 2.1 : 0.35}
          roughness={0.2}
          metalness={0.35}
          toneMapped={false}
        />
      </mesh>

      {/* Orbital glow rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.82, isActive ? 0.032 : 0.014, 12, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 2.5 : 0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[0.96, isActive ? 0.022 : 0.01, 10, 48]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={isActive ? 1.8 : 0.15}
          transparent
          opacity={isActive ? 0.85 : 0.25}
          toneMapped={false}
        />
      </mesh>

      <Html position={[0, -0.95, 0]} center distanceFactor={10} zIndexRange={[15, 0]}>
        <button
          type="button"
          onClick={onClick}
          className={`whitespace-nowrap rounded-lg border px-2.5 py-1 font-mono text-xs transition-all ${
            isActive
              ? 'border-cyan-300 bg-slate-950/95 font-bold text-white shadow-glow-cyan'
              : 'border-slate-700/80 bg-slate-950/80 text-slate-300 hover:border-cyan-400/50'
          }`}
        >
          <span>{name}</span>{' '}
          <span className="ml-1 rounded bg-white/10 px-1 py-0.5 text-[10px]" style={{ color }}>
            {code}
          </span>
        </button>
      </Html>
    </group>
  );
};

export const ControlFsmScene: React.FC<ControlFsmSceneProps> = ({
  currentState,
  prevState,
  transitionTrigger,
  resetFlashTrigger,
  onSelectState
}) => {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();

  const transitions = useMemo(
    () =>
      TRANSITION_ORDER.map((tr) => {
        const curve = buildTransitionCurve(tr.from, tr.to);
        const geo = new THREE.TubeGeometry(curve, 36, 0.032, 8, false);
        const tip = curve.getPointAt(0.97);
        const tangent = curve.getTangentAt(0.97).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
        const mid = curve.getPointAt(0.5);
        return { ...tr, curve, geo, tip, quat, mid };
      }),
    []
  );

  useEffect(() => {
    return () => {
      transitions.forEach((t) => t.geo.dispose());
    };
  }, [transitions]);

  // Traveling glowing token along active transition curve
  const tokenRef = useRef<THREE.Mesh | null>(null);
  const progressRef = useRef<number>(1);
  const activeCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);

  // Async reset shockwave ring on IDLE
  const resetRingRef = useRef<THREE.Mesh | null>(null);
  const resetRingProgress = useRef<number>(1);

  useEffect(() => {
    if (prevState === currentState) {
      progressRef.current = 1;
      return;
    }
    const found = transitions.find((t) => t.from === prevState && t.to === currentState);
    if (found) {
      activeCurveRef.current = found.curve;
    } else {
      // Direct arc (e.g. Async Reset jumping straight to IDLE from any state!)
      activeCurveRef.current = buildTransitionCurve(prevState, currentState);
    }
    progressRef.current = 0;
  }, [currentState, prevState, transitionTrigger, transitions]);

  useEffect(() => {
    if (resetFlashTrigger > 0) {
      resetRingProgress.current = 0;
    }
  }, [resetFlashTrigger]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (tokenRef.current) {
      if (progressRef.current < 1 && activeCurveRef.current) {
        progressRef.current = Math.min(1, progressRef.current + dt * (reducedMotion ? 8 : 2.4));
        const pos = activeCurveRef.current.getPointAt(progressRef.current);
        tokenRef.current.position.copy(pos);
        tokenRef.current.visible = true;
      } else {
        tokenRef.current.visible = false;
      }
    }

    if (resetRingRef.current) {
      if (resetRingProgress.current < 1) {
        resetRingProgress.current = Math.min(1, resetRingProgress.current + dt * 2.2);
        const s = 0.7 + resetRingProgress.current * 2.6;
        resetRingRef.current.scale.set(s, s, s);
        const mat = resetRingRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - resetRingProgress.current) * 0.9;
        resetRingRef.current.visible = true;
      } else {
        resetRingRef.current.visible = false;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={isDark ? 0.55 : 0.9} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} />
      <pointLight position={[0, 4, 2]} intensity={1.6} color="#22d3ee" distance={16} />

      <gridHelper
        args={[18, 18, isDark ? '#6a5b39' : '#968762', isDark ? '#192a1a' : '#cec7b1']}
        position={[0, -2.2, 0]}
      />

      {/* 5 Glowing FSM State Spheres */}
      {FSM_STATES.map((st) => (
        <StateSphereNode
          key={st.name}
          name={st.name}
          code={st.code}
          color={st.color}
          position={STATE_POSITIONS[st.name]}
          isActive={currentState === st.name}
          animate={!reducedMotion}
          onClick={() => onSelectState(st.name)}
        />
      ))}

      {/* Curved Labeled Transition Arrows */}
      {transitions.map((tr) => {
        const isNextEdge = tr.from === currentState;
        return (
          <group key={`${tr.from}-${tr.to}`}>
            <mesh geometry={tr.geo}>
              <meshStandardMaterial
                color={tr.color}
                emissive={tr.color}
                emissiveIntensity={isNextEdge ? 2.0 : 0.45}
                transparent
                opacity={isNextEdge ? 1 : 0.55}
                toneMapped={false}
              />
            </mesh>
            <mesh position={tr.tip} quaternion={tr.quat}>
              <coneGeometry args={[0.11, 0.26, 10]} />
              <meshStandardMaterial
                color={tr.color}
                emissive={tr.color}
                emissiveIntensity={isNextEdge ? 2.4 : 0.6}
                toneMapped={false}
              />
            </mesh>
            <Html position={[tr.mid.x, tr.mid.y + 0.25, tr.mid.z]} center distanceFactor={11} zIndexRange={[10, 0]}>
              <div
                className={`pointer-events-none whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] backdrop-blur ${
                  isNextEdge
                    ? 'border-cyan-300/70 bg-slate-950/95 text-cyan-200'
                    : 'border-slate-700/60 bg-slate-950/70 text-slate-400'
                }`}
              >
                {tr.label}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Traveling Glowing Token Sphere */}
      <mesh ref={tokenRef} visible={false}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#22d3ee"
          emissiveIntensity={3.8}
          toneMapped={false}
        />
      </mesh>

      {/* Async Reset Shockwave Ring around IDLE */}
      <mesh
        ref={resetRingRef}
        position={STATE_POSITIONS.IDLE}
        rotation={[Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry args={[0.55, 0.72, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      <OrbitControls
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minDistance={5.5}
        maxDistance={13.5}
        target={[0, 0.4, 0.4]}
      />
    </>
  );
};
