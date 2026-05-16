import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GATE_RADIUS, DYE_PALETTE, TARGET_PER_GATE } from '../constants';

interface GateProps {
  position: [number, number, number];
  side: 'left' | 'right';
  color: number;            // dye this gate accepts
  delivered: number;        // count delivered so far this round
}

// Wooden pen archway painted in the gate's accepted dye. A row of pip markers
// on top shows progress toward TARGET_PER_GATE. Both gates always glow; only
// the colors differ.
export function Gate({ position, side, color, delivered }: GateProps) {
  const dye = DYE_PALETTE[color];
  const ringRef = useRef<THREE.Mesh>(null);
  const bannerRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.35 + Math.sin(t * 2 + (side === 'left' ? 0 : Math.PI)) * 0.18;
    }
    if (bannerRef.current) {
      bannerRef.current.rotation.y = Math.sin(t * 1.5) * 0.04;
    }
  });

  const woodLight = '#8b6b43';
  const woodDark  = '#5c4527';
  const tilt = side === 'left' ? 0.12 : -0.12;

  return (
    <group position={position} rotation={[0, tilt, 0]}>
      {/* floor glow ring */}
      <mesh ref={ringRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[GATE_RADIUS * 0.4, GATE_RADIUS, 36]} />
        <meshStandardMaterial
          color={dye}
          emissive={dye}
          emissiveIntensity={0.4}
          transparent
          opacity={0.62}
        />
      </mesh>
      {/* wooden rim */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[GATE_RADIUS - 0.15, GATE_RADIUS + 0.05, 32]} />
        <meshStandardMaterial color={woodDark} />
      </mesh>
      {/* posts */}
      <mesh position={[-GATE_RADIUS * 0.98, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 2.6, 10]} />
        <meshStandardMaterial color={woodLight} roughness={0.9} />
      </mesh>
      <mesh position={[ GATE_RADIUS * 0.98, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 2.6, 10]} />
        <meshStandardMaterial color={woodLight} roughness={0.9} />
      </mesh>
      {/* top beam */}
      <mesh position={[0, 2.65, 0]} castShadow>
        <boxGeometry args={[GATE_RADIUS * 2.3, 0.26, 0.36]} />
        <meshStandardMaterial color={woodDark} roughness={0.9} />
      </mesh>
      {/* painted banner */}
      <mesh ref={bannerRef} position={[0, 2.15, 0.18]} castShadow>
        <boxGeometry args={[GATE_RADIUS * 1.85, 0.78, 0.10]} />
        <meshStandardMaterial color={dye} emissive={dye} emissiveIntensity={0.40} roughness={0.85} />
      </mesh>
      {/* delivery pip markers — one circle per slot, filled when delivered */}
      {Array.from({ length: TARGET_PER_GATE }).map((_, i) => {
        const filled = i < delivered;
        const span = GATE_RADIUS * 1.4;
        const step = span / (TARGET_PER_GATE - 1);
        const px = -span / 2 + i * step;
        return (
          <mesh key={i} position={[px, 2.15, 0.30]}>
            <cylinderGeometry args={[0.13, 0.13, 0.05, 16]} />
            <meshStandardMaterial
              color={filled ? '#fff8e0' : '#1c1612'}
              emissive={filled ? '#fff8e0' : '#000'}
              emissiveIntensity={filled ? 0.7 : 0}
            />
          </mesh>
        );
      })}
      {/* side slats */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[GATE_RADIUS * 1.08 * side, 0.7, 0]} castShadow>
          <boxGeometry args={[0.08, 1.2, 0.16]} />
          <meshStandardMaterial color={woodLight} />
        </mesh>
      ))}
    </group>
  );
}
