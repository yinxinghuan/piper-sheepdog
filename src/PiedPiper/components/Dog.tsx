import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

// Border-collie style sheepdog. Player-controlled leader of the chain.
// Reads from top-down as a longer, lower silhouette than the sheep, with a
// distinct black-and-white split so the head direction is obvious.
export function Dog() {
  const bounceRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 7 + phase;
    const g = bounceRef.current;
    if (g) {
      g.position.y = Math.abs(Math.sin(t)) * 0.25;
      g.rotation.z = Math.sin(t) * 0.04;
    }
    const tail = tailRef.current;
    if (tail) {
      tail.rotation.y = Math.sin(clock.getElapsedTime() * 14) * 0.7;
    }
  });

  return (
    <group>
      {/* shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshBasicMaterial color="#1c2a1c" transparent opacity={0.45} />
      </mesh>
      <group ref={bounceRef}>
        {/* main body — black */}
        <RoundedBox args={[0.85, 0.7, 1.45]} radius={0.32} smoothness={5}
                    position={[0, 0.45, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#161616" roughness={0.7} />
        </RoundedBox>
        {/* white chest patch */}
        <RoundedBox args={[0.6, 0.55, 0.45]} radius={0.22} smoothness={4}
                    position={[0, 0.45, 0.50]} castShadow>
          <meshStandardMaterial color="#f4ecd8" roughness={0.85} />
        </RoundedBox>
        {/* white back stripe */}
        <RoundedBox args={[0.18, 0.6, 1.0]} radius={0.08} smoothness={4}
                    position={[0, 0.7, 0]} castShadow>
          <meshStandardMaterial color="#f4ecd8" roughness={0.85} />
        </RoundedBox>
        {/* head */}
        <RoundedBox args={[0.55, 0.55, 0.6]} radius={0.22} smoothness={5}
                    position={[0, 0.55, 0.85]} castShadow>
          <meshStandardMaterial color="#161616" roughness={0.7} />
        </RoundedBox>
        {/* muzzle — white */}
        <RoundedBox args={[0.32, 0.30, 0.36]} radius={0.12} smoothness={4}
                    position={[0, 0.42, 1.12]} castShadow>
          <meshStandardMaterial color="#f4ecd8" roughness={0.85} />
        </RoundedBox>
        {/* nose */}
        <mesh position={[0, 0.50, 1.28]} castShadow>
          <sphereGeometry args={[0.07, 12, 10]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        {/* eyes */}
        <mesh position={[-0.13, 0.66, 1.12]} castShadow>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[ 0.13, 0.66, 1.12]} castShadow>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[-0.13, 0.66, 1.16]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        <mesh position={[ 0.13, 0.66, 1.16]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        {/* ears — triangles pointing back */}
        <mesh position={[-0.20, 0.86, 0.78]} rotation={[0.2, 0, -0.2]} castShadow>
          <coneGeometry args={[0.12, 0.30, 4]} />
          <meshStandardMaterial color="#161616" />
        </mesh>
        <mesh position={[ 0.20, 0.86, 0.78]} rotation={[0.2, 0,  0.2]} castShadow>
          <coneGeometry args={[0.12, 0.30, 4]} />
          <meshStandardMaterial color="#161616" />
        </mesh>
        {/* tail */}
        <mesh ref={tailRef} position={[0, 0.55, -0.78]} castShadow>
          <group>
            <mesh position={[0, 0, -0.18]}>
              <cylinderGeometry args={[0.06, 0.06, 0.36, 8]} />
              <meshStandardMaterial color="#161616" />
            </mesh>
            <mesh position={[0, 0, -0.38]}>
              <sphereGeometry args={[0.09, 12, 10]} />
              <meshStandardMaterial color="#f4ecd8" />
            </mesh>
          </group>
        </mesh>
        {/* paws */}
        {([[-0.28, -0.48], [0.28, -0.48], [-0.28, 0.48], [0.28, 0.48]] as const).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.08, z]} castShadow>
            <cylinderGeometry args={[0.10, 0.10, 0.18, 10]} />
            <meshStandardMaterial color="#f4ecd8" roughness={0.85} />
          </mesh>
        ))}
        {/* gold collar — makes the leader glow distinct from a regular dog */}
        <mesh position={[0, 0.36, 0.62]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.30, 0.05, 6, 18]} />
          <meshStandardMaterial color="#ffd84a" emissive="#ffd84a" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
}
