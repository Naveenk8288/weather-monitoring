import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createFpgaChipTexture,
  createPcbTexture,
  createRainPadTexture,
  drawLcdCanvas
} from './proceduralTextures';

interface Basys3BoardProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  ledHeat?: boolean;
  ledHumidity?: boolean;
  ledRain?: boolean;
  clockPulseId?: number;
}

export const Basys3Board: React.FC<Basys3BoardProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  ledHeat = false,
  ledHumidity = false,
  ledRain = false,
  clockPulseId = 0
}) => {
  const pcbTexture = useMemo(() => createPcbTexture(), []);
  const chipTexture = useMemo(() => createFpgaChipTexture(), []);
  const pulseLedRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const pulseIntensity = useRef(0.5);

  useEffect(() => {
    pulseIntensity.current = 3.5;
  }, [clockPulseId]);

  useEffect(() => {
    return () => {
      pcbTexture.dispose();
      chipTexture.dispose();
    };
  }, [pcbTexture, chipTexture]);

  useFrame((_, delta) => {
    if (pulseLedRef.current) {
      pulseIntensity.current = THREE.MathUtils.lerp(pulseIntensity.current, 0.7, Math.min(1, delta * 5));
      pulseLedRef.current.emissiveIntensity = pulseIntensity.current;
    }
  });

  const switchPositions = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 16; i++) {
      arr.push(-1.8 + i * 0.24);
    }
    return arr;
  }, []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Main Basys 3 PCB */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.14, 3.1]} />
        <meshStandardMaterial
          map={pcbTexture}
          roughness={0.42}
          metalness={0.2}
        />
      </mesh>

      {/* Corner Brass Mounting Holes */}
      {[
        [-1.98, 0.08, -1.34],
        [1.98, 0.08, -1.34],
        [-1.98, 0.08, 1.34],
        [1.98, 0.08, 1.34]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1, 0.032, 10, 20]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}

      {/* Central Xilinx Artix-7 XC7A35T QFP Package */}
      <group position={[0, 0.14, -0.05]}>
        <mesh castShadow>
          <boxGeometry args={[1.05, 0.14, 1.05]} />
          <meshStandardMaterial map={chipTexture} roughness={0.35} metalness={0.3} />
        </mesh>
        {/* QFP metallic gull-wing pin strips along all 4 sides */}
        <mesh position={[0, -0.03, 0.56]}>
          <boxGeometry args={[0.92, 0.04, 0.08]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.03, -0.56]}>
          <boxGeometry args={[0.92, 0.04, 0.08]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.56, -0.03, 0]}>
          <boxGeometry args={[0.08, 0.04, 0.92]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.56, -0.03, 0]}>
          <boxGeometry args={[0.08, 0.04, 0.92]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* 4-Digit 7-Segment Display Module (lower-left) */}
      <group position={[-1.12, 0.14, 0.78]}>
        <mesh>
          <boxGeometry args={[1.1, 0.12, 0.42]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.2} />
        </mesh>
        {[-0.36, -0.12, 0.12, 0.36].map((x, idx) => (
          <mesh key={idx} position={[x, 0.065, 0]}>
            <boxGeometry args={[0.16, 0.02, 0.24]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ef4444"
              emissiveIntensity={ledHeat ? 2.2 : 1.1}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* 5 Pushbuttons in Cross Formation (right side — BTNC center reset) */}
      <group position={[1.28, 0.12, 0.65]}>
        {[
          { p: [0, 0, 0], c: '#f59e0b' },
          { p: [0, 0, -0.26], c: '#64748b' },
          { p: [0, 0, 0.26], c: '#64748b' },
          { p: [-0.26, 0, 0], c: '#64748b' },
          { p: [0.26, 0, 0], c: '#64748b' }
        ].map((btn, i) => (
          <group key={i} position={btn.p as [number, number, number]}>
            <mesh>
              <boxGeometry args={[0.16, 0.06, 0.16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.05, 12]} />
              <meshStandardMaterial color={btn.c} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 16 Slide Switches & 16 Status LEDs along bottom edge */}
      {switchPositions.map((x, idx) => {
        const isHeatLed = idx === 15;
        const isHumLed = idx === 14;
        const isRainLed = idx === 13;
        const isPwrLed = idx === 0;
        const ledColor = isHeatLed
          ? ledHeat
            ? '#ef4444'
            : '#331515'
          : isHumLed
            ? ledHumidity
              ? '#3b82f6'
              : '#13223b'
            : isRainLed
              ? ledRain
                ? '#22d3ee'
                : '#0f2c34'
              : isPwrLed
                ? '#10b981'
                : '#1e3a2f';
        const lit = (isHeatLed && ledHeat) || (isHumLed && ledHumidity) || (isRainLed && ledRain) || isPwrLed;
        return (
          <group key={idx} position={[x, 0.11, 1.24]}>
            {/* Switch housing */}
            <mesh>
              <boxGeometry args={[0.12, 0.09, 0.22]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>
            {/* Switch toggle nub */}
            <mesh position={[0, 0.07, idx % 3 === 0 ? -0.04 : 0.04]}>
              <boxGeometry args={[0.06, 0.08, 0.07]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Status LED directly above switch */}
            <mesh position={[0, -0.01, -0.22]}>
              <boxGeometry args={[0.08, 0.04, 0.05]} />
              <meshStandardMaterial
                color={ledColor}
                emissive={lit ? ledColor : '#000000'}
                emissiveIntensity={lit ? 2.4 : 0}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* 4 PMOD Dual-Row Headers (Left: JA/JB, Right: JC/JXADC) */}
      {[
        [-2.08, 0.14, -0.55],
        [-2.08, 0.14, 0.35],
        [2.08, 0.14, -0.55],
        [2.08, 0.14, 0.35]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.18, 0.16, 0.65]} />
          <meshStandardMaterial color="#111827" roughness={0.6} />
        </mesh>
      ))}

      {/* Top Connectors: VGA (blue), Micro-USB UART (silver), Power Barrel */}
      <mesh position={[0.95, 0.22, -1.38]}>
        <boxGeometry args={[0.72, 0.3, 0.36]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[-0.75, 0.14, -1.44]}>
        <boxGeometry args={[0.36, 0.14, 0.28]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[-1.45, 0.18, -1.38]}>
        <boxGeometry args={[0.32, 0.22, 0.38]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Clock Heartbeat Cyan LED near USB */}
      <mesh position={[-0.3, 0.11, -1.25]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial
          ref={pulseLedRef}
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

/**
 * Iconic blue DHT11 Temperature & Humidity sensor on breakout PCB
 */
export const Dht11Sensor: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Breakout PCB */}
      <mesh castShadow>
        <boxGeometry args={[0.95, 0.08, 1.35]} />
        <meshStandardMaterial color="#0f2942" roughness={0.45} metalness={0.2} />
      </mesh>
      {/* Blue DHT11 Perforated Enclosure */}
      <mesh position={[0, 0.26, -0.14]} castShadow>
        <boxGeometry args={[0.76, 0.44, 0.92]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.32} metalness={0.1} />
      </mesh>
      {/* Front Grid Perforations */}
      {[-0.22, 0, 0.22].map((x) =>
        [-0.28, -0.08, 0.12].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.485, z - 0.1]}>
            <boxGeometry args={[0.14, 0.02, 0.12]} />
            <meshStandardMaterial color="#082f49" roughness={0.8} />
          </mesh>
        ))
      )}
      {/* 4.7k Pull-Up SMD Resistor + Data Status LED */}
      <mesh position={[-0.25, 0.07, 0.46]}>
        <boxGeometry args={[0.14, 0.05, 0.08]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.25, 0.07, 0.46]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>
      {/* 3 Metallic Header Pins (VCC, DATA, GND) */}
      {[-0.18, 0, 0.18].map((x, i) => (
        <mesh key={i} position={[x, 0.04, 0.78]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.28, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Rain Sensor Module (Gold-trace raindrop pad + LM393 comparator board)
 */
export const RainSensorModule: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  rainActive?: boolean;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, rainActive = false }) => {
  const padTex = useMemo(() => createRainPadTexture(), []);

  useEffect(() => {
    return () => padTex.dispose();
  }, [padTex]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Sensing Pad */}
      <mesh castShadow rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.05, 0.07, 1.5]} />
        <meshStandardMaterial map={padTex} roughness={0.3} metalness={0.55} />
      </mesh>

      {/* Water droplets on pad when rain is active */}
      {rainActive && (
        <group rotation={[-0.25, 0, 0]} position={[0, 0.06, 0]}>
          {[
            [-0.22, 0, -0.3],
            [0.18, 0, -0.15],
            [-0.1, 0, 0.25],
            [0.24, 0, 0.35],
            [0.02, 0, -0.45]
          ].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]} scale={[1, 0.45, 1]}>
              <sphereGeometry args={[0.1, 14, 14]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#22d3ee"
                emissiveIntensity={0.8}
                roughness={0.05}
                metalness={0.1}
                transparent
                opacity={0.88}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Companion LM393 Comparator Mini-PCB */}
      <group position={[0.92, -0.08, 0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.58, 0.07, 0.85]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.45} />
        </mesh>
        {/* Blue Trimpot Potentiometer */}
        <mesh position={[0, 0.14, -0.1]}>
          <boxGeometry args={[0.26, 0.22, 0.26]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </mesh>
        {/* DO Rain Alert LED */}
        <mesh position={[0.14, 0.07, 0.25]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial
            color={rainActive ? '#22d3ee' : '#1e293b'}
            emissive={rainActive ? '#22d3ee' : '#000000'}
            emissiveIntensity={rainActive ? 2.8 : 0}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};

/**
 * 16x2 HD44780 Character LCD Module with dynamic CanvasTexture readout
 */
export const Lcd16x2Module: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  line1: string;
  line2: string;
  alertTint?: 'normal' | 'hot' | 'cold' | 'alert';
}> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  line1,
  line2,
  alertTint = 'normal'
}) => {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 160;
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return { canvas: c, texture: t };
  }, []);

  useEffect(() => {
    drawLcdCanvas(canvas, line1, line2, alertTint);
    texture.needsUpdate = true;
  }, [canvas, texture, line1, line2, alertTint]);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Green Backing PCB */}
      <mesh castShadow>
        <boxGeometry args={[2.9, 1.35, 0.1]} />
        <meshStandardMaterial color="#0f5132" roughness={0.45} metalness={0.2} />
      </mesh>
      {/* Matte Black Metal LCD Bezel */}
      <mesh position={[0, -0.02, 0.14]} castShadow>
        <boxGeometry args={[2.56, 0.96, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.65} />
      </mesh>
      {/* Glowing 16x2 Active Display Glass */}
      <mesh position={[0, -0.02, 0.25]}>
        <planeGeometry args={[2.32, 0.72]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.65}
          roughness={0.18}
        />
      </mesh>
      {/* 16 Gold Header Pins along top */}
      {Array.from({ length: 16 }).map((_, idx) => (
        <mesh key={idx} position={[-1.12 + idx * 0.13, 0.56, 0.06]}>
          <cylinderGeometry args={[0.022, 0.022, 0.08, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Tri-color Alert LED Indicator Pod (Heat Red, Humidity Blue, Rain Cyan)
 */
export const AlertLedPod: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  heat: boolean;
  humidity: boolean;
  rain: boolean;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], heat, humidity, rain }) => {
  const leds = [
    { x: -0.68, on: heat, color: '#ef4444', offColor: '#451a1a' },
    { x: 0, on: humidity, color: '#3b82f6', offColor: '#172554' },
    { x: 0.68, on: rain, color: '#22d3ee', offColor: '#164e63' }
  ];

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[2.1, 0.16, 0.62]} />
        <meshStandardMaterial color="#111b2e" roughness={0.4} metalness={0.4} />
      </mesh>
      {leds.map((led, idx) => (
        <group key={idx} position={[led.x, 0.16, 0]}>
          {/* Chrome LED collar */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.08, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* LED Dome */}
          <mesh position={[0, 0.08, 0]}>
            <capsuleGeometry args={[0.12, 0.12, 8, 16]} />
            <meshStandardMaterial
              color={led.on ? led.color : led.offColor}
              emissive={led.on ? led.color : '#000000'}
              emissiveIntensity={led.on ? 3.2 : 0}
              roughness={0.18}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * Glowing 3D curved jumper wire with animated data packet sphere traveling along it
 */
export const GlowingWire: React.FC<{
  points: [number, number, number][];
  color: string;
  speed?: number;
  phaseOffset?: number;
  radius?: number;
  animate?: boolean;
}> = ({ points, color, speed = 0.45, phaseOffset = 0, radius = 0.028, animate = true }) => {
  const { curve, geometry } = useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(...p));
    const c = new THREE.CatmullRomCurve3(vectors);
    const g = new THREE.TubeGeometry(c, 36, radius, 8, false);
    return { curve: c, geometry: g };
  }, [points, radius]);

  const pulseRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame(({ clock }) => {
    if (!animate || !pulseRef.current) return;
    const t = (clock.getElapsedTime() * speed + phaseOffset) % 1;
    const pos = curve.getPointAt(t);
    pulseRef.current.position.copy(pos);
  });

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.95}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
      {animate && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[radius * 2.5, 10, 10]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={color}
            emissiveIntensity={3.2}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
};
