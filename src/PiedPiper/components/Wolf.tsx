import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

interface WolfProps {
  stunned?: boolean;
}

// Grey lean canine — predator silhouette distinct from the sheepdog: taller,
// thinner, no white markings, glowing yellow eyes when not stunned.
export function Wolf({ stunned = false }: WolfProps) {
  const bounceRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const eyeMatL = useRef<THREE.MeshStandardMaterial>(null);
  const eyeMatR = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bounceRef.current) {
      bounceRef.current.position.y = stunned ? -0.04 : Math.abs(Math.sin(t * 9)) * 0.20;
      bounceRef.current.rotation.z = stunned ? 0.35 : Math.sin(t * 9) * 0.05;
    }
    if (tailRef.current) {
      tailRef.current.rotation.y = stunned ? 0 : Math.sin(t * 10) * 0.4;
    }
    if (eyeMatL.current && eyeMatR.current) {
      const target = stunned ? 0 : 0.85;
      eyeMatL.current.emissiveIntensity += (target - eyeMatL.current.emissiveIntensity) * 0.2;
      eyeMatR.current.emissiveIntensity = eyeMatL.current.emissiveIntensity;
    }
  });

  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshBasicMaterial color="#1c2014" transparent opacity={0.45} />
      </mesh>
      <group ref={bounceRef}>
        {/* body — leaner than dog */}
        <RoundedBox args={[0.72, 0.62, 1.55]} radius={0.26} smoothness={5}
                    position={[0, 0.5, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#5a5650" roughness={0.85} />
        </RoundedBox>
        {/* back ridge — darker stripe so it reads as a wolf */}
        <RoundedBox args={[0.18, 0.55, 1.2]} radius={0.06} smoothness={4}
                    position={[0, 0.78, 0]} castShadow>
          <meshStandardMaterial color="#2e2a25" roughness={0.85} />
        </RoundedBox>
        {/* head */}
        <RoundedBox args={[0.48, 0.48, 0.6]} radius={0.18} smoothness={5}
                    position={[0, 0.58, 0.92]} castShadow>
          <meshStandardMaterial color="#4a4641" roughness={0.85} />
        </RoundedBox>
        {/* long muzzle */}
        <RoundedBox args={[0.26, 0.24, 0.5]} radius={0.10} smoothness={4}
                    position={[0, 0.48, 1.28]} castShadow>
          <meshStandardMaterial color="#3a3631" roughness={0.85} />
        </RoundedBox>
        {/* nose */}
        <mesh position={[0, 0.52, 1.55]} castShadow>
          <sphereGeometry args={[0.07, 12, 10]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        {/* eyes — glowing yellow when active */}
        <mesh position={[-0.12, 0.70, 1.20]} castShadow>
          <sphereGeometry args={[0.060, 10, 10]} />
          <meshStandardMaterial ref={eyeMatL} color="#ffdc4a" emissive="#ffa820" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[ 0.12, 0.70, 1.20]} castShadow>
          <sphereGeometry args={[0.060, 10, 10]} />
          <meshStandardMaterial ref={eyeMatR} color="#ffdc4a" emissive="#ffa820" emissiveIntensity={0.8} />
        </mesh>
        {/* pointed ears */}
        <mesh position={[-0.18, 0.94, 0.84]} rotation={[0.1, 0, -0.15]} castShadow>
          <coneGeometry args={[0.10, 0.36, 4]} />
          <meshStandardMaterial color="#3e3a35" />
        </mesh>
        <mesh position={[ 0.18, 0.94, 0.84]} rotation={[0.1, 0,  0.15]} castShadow>
          <coneGeometry args={[0.10, 0.36, 4]} />
          <meshStandardMaterial color="#3e3a35" />
        </mesh>
        {/* tail — long and bushy */}
        <mesh ref={tailRef} position={[0, 0.55, -0.86]} castShadow>
          <group>
            <mesh position={[0, 0, -0.22]}>
              <cylinderGeometry args={[0.07, 0.05, 0.5, 8]} />
              <meshStandardMaterial color="#3e3a35" />
            </mesh>
            <mesh position={[0, 0, -0.50]}>
              <sphereGeometry args={[0.13, 12, 10]} />
              <meshStandardMaterial color="#5a5650" />
            </mesh>
          </group>
        </mesh>
        {/* legs */}
        {([[-0.22, -0.55], [0.22, -0.55], [-0.22, 0.55], [0.22, 0.55]] as const).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.18, z]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.36, 8]} />
            <meshStandardMaterial color="#3a3631" roughness={0.85} />
          </mesh>
        ))}
        {/* stun stars — three little spinning marks above the head when stunned */}
        {stunned && <StunStars />}
      </group>
    </group>
  );
}

function StunStars() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 5;
  });
  return (
    <group ref={ref} position={[0, 1.5, 0.5]}>
      {[0, 1, 2].map(i => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.35, Math.sin(a) * 0.1, Math.sin(a) * 0.35]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#ffd84a" emissive="#ffd84a" emissiveIntensity={1.0} />
          </mesh>
        );
      })}
    </group>
  );
}
