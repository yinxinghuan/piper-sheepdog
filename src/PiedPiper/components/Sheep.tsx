import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { DYE_PALETTE } from '../constants';

interface SheepProps {
  colorType: number;
  isTarget?: boolean;
  scale?: number;
}

// Top-down chunky sheep: white woolly body (rounded box) with three dye patches
// in the round's colors, plus a small dark head poking forward and four little
// hooves. Bobs while idle, hops faster when in the chain (parent group sets
// `userData.inChain`).
export function Sheep({ colorType, isTarget = false, scale = 1 }: SheepProps) {
  const dye = DYE_PALETTE[colorType % DYE_PALETTE.length];
  const bounceRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    const g = bounceRef.current;
    if (!g) return;
    const speed = (g.parent?.userData.inChain ? 6 : 3);
    const t = clock.getElapsedTime() * speed + phase;
    g.position.y = Math.abs(Math.sin(t)) * 0.35;
    g.rotation.z = Math.sin(t) * 0.06;
  });

  return (
    <group scale={scale}>
      {/* contact shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.65, 24]} />
        <meshBasicMaterial color="#1c2a1c" transparent opacity={0.35} />
      </mesh>
      <group ref={bounceRef}>
        {/* main wool body — wide rounded box reads as round from top-down */}
        <RoundedBox args={[1.05, 0.9, 1.2]} radius={0.42} smoothness={5}
                    position={[0, 0.55, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#fdf6e3" roughness={0.95} />
        </RoundedBox>
        {/* dye patches — three small spheres in the round color, top-down visible */}
        <mesh position={[-0.28, 0.95, 0.10]} castShadow>
          <sphereGeometry args={[0.22, 16, 12]} />
          <meshStandardMaterial color={dye} roughness={0.8} />
        </mesh>
        <mesh position={[0.32, 0.95, -0.10]} castShadow>
          <sphereGeometry args={[0.18, 16, 12]} />
          <meshStandardMaterial color={dye} roughness={0.8} />
        </mesh>
        <mesh position={[0.05, 0.95, 0.32]} castShadow>
          <sphereGeometry args={[0.14, 14, 10]} />
          <meshStandardMaterial color={dye} roughness={0.8} />
        </mesh>
        {/* head — dark sphere poking forward */}
        <mesh position={[0, 0.6, 0.62]} castShadow>
          <sphereGeometry args={[0.32, 18, 14]} />
          <meshStandardMaterial color="#2a1f1a" roughness={0.75} />
        </mesh>
        {/* muzzle */}
        <mesh position={[0, 0.5, 0.86]} castShadow>
          <sphereGeometry args={[0.16, 12, 10]} />
          <meshStandardMaterial color="#3a2c25" roughness={0.85} />
        </mesh>
        {/* eyes */}
        <mesh position={[-0.13, 0.72, 0.84]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[ 0.13, 0.72, 0.84]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.4} />
        </mesh>
        {/* ears */}
        <mesh position={[-0.22, 0.72, 0.55]} rotation={[0, 0, -0.5]} castShadow>
          <coneGeometry args={[0.10, 0.22, 8]} />
          <meshStandardMaterial color="#2a1f1a" />
        </mesh>
        <mesh position={[ 0.22, 0.72, 0.55]} rotation={[0, 0,  0.5]} castShadow>
          <coneGeometry args={[0.10, 0.22, 8]} />
          <meshStandardMaterial color="#2a1f1a" />
        </mesh>
        {/* hooves */}
        {([[-0.30, -0.42], [0.30, -0.42], [-0.30, 0.42], [0.30, 0.42]] as const).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.08, z]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.16, 8]} />
            <meshStandardMaterial color="#2a1f1a" roughness={0.85} />
          </mesh>
        ))}
        {/* target ribbon — a little flag if this sheep matches the active round
            color, so the player can read which sheep to grab from afar. */}
        {isTarget && (
          <mesh position={[0, 1.35, 0]} rotation={[0, 0.6, 0]}>
            <planeGeometry args={[0.42, 0.22]} />
            <meshStandardMaterial color={dye} side={THREE.DoubleSide} emissive={dye} emissiveIntensity={0.35} />
          </mesh>
        )}
      </group>
    </group>
  );
}
