// Static scenery props for the pasture: pond, hay bales, boulders, trees,
// barn silhouette, rail fence, flower patches, dirt path. None of these
// collide — they're purely visual to make the field feel like a place rather
// than an empty disc.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { PLAYFIELD } from '../constants';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ---------------- Pond -------------------
function Pond({ position, radius }: { position: [number, number, number]; radius: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    ringRef.current.scale.set(1 + Math.sin(t * 1.2) * 0.04, 1, 1 + Math.cos(t * 1.2) * 0.04);
  });
  return (
    <group position={position}>
      {/* base water — muted blue-gray, low sat so it doesn't compete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color="#5c7a85" roughness={0.45} metalness={0.05} />
      </mesh>
      {/* highlight ring — subtle */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[radius * 0.62, radius * 0.78, 48]} />
        <meshStandardMaterial color="#7b97a2" transparent opacity={0.4} />
      </mesh>
      {/* lily pads — sage */}
      {[0.55, 0.30, -0.40].map((px, i) => (
        <mesh
          key={i}
          position={[px * radius, 0.06, ((i % 2) - 0.5) * radius * 0.6]}
          rotation={[-Math.PI / 2, 0, i]}
        >
          <circleGeometry args={[0.45 + i * 0.05, 16]} />
          <meshStandardMaterial color="#4e6240" roughness={0.85} />
        </mesh>
      ))}
      {/* muddy bank — warm earth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[radius * 1.0, radius * 1.18, 48]} />
        <meshStandardMaterial color="#7a6442" roughness={1} />
      </mesh>
    </group>
  );
}

// ---------------- Hay bale ----------------
function HayBale({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 1.1, 18]} />
        <meshStandardMaterial color="#dbb35e" roughness={0.92} />
      </mesh>
      {/* end-cap darker rings */}
      <mesh position={[0, 0.5, 0.56]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.40, 0.58, 18]} />
        <meshStandardMaterial color="#9d7a35" />
      </mesh>
      <mesh position={[0, 0.5, -0.56]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.40, 0.58, 18]} />
        <meshStandardMaterial color="#9d7a35" />
      </mesh>
      {/* twine band */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.05, 18]} />
        <meshStandardMaterial color="#88321f" />
      </mesh>
    </group>
  );
}

// ---------------- Boulder cluster ----------
function Boulder({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const rand = useMemo(() => {
    const r = seeded(position[0] * 13 + position[2] * 7 + 11);
    return { a: r(), b: r(), c: r(), d: r(), e: r() };
  }, [position]);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow rotation={[rand.a, rand.b, rand.c]}>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshStandardMaterial color="#7e7568" roughness={0.95} />
      </mesh>
      <mesh position={[0.55 + rand.d * 0.2, 0.30, -0.20]} castShadow>
        <sphereGeometry args={[0.32, 10, 8]} />
        <meshStandardMaterial color="#8e8576" roughness={0.95} />
      </mesh>
      <mesh position={[-0.40, 0.25, 0.40 + rand.e * 0.2]} castShadow>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshStandardMaterial color="#6f6759" roughness={0.95} />
      </mesh>
    </group>
  );
}

// Unified vegetation palette (low-saturation sage/olive). Defined once so all
// trees + bushes pull from the same family — keeps the scene visually
// coherent. The earlier high-sat #4faa5b style is gone except where the dye
// palette (gameplay) needs to pop.
const FOLIAGE = {
  oakBase:   '#5d7548',   // mid sage
  oakLight:  '#7a8e5e',
  oakDark:   '#3f5234',
  oakTop:    '#94a574',
  pine1:     '#446044',   // muted forest green
  pine2:     '#4f6a4a',
  pine3:     '#5d7855',
  pineTop:   '#7b9572',
  birch1:    '#92a772',   // pale olive
  birch2:    '#a8b984',
  birch3:    '#7d9265',
  bushGreen: ['#4e6240', '#5d7548', '#3f5234', '#6b8156'] as const,
  trunkDark: '#3e2f1f',
  trunkLight:'#5c4528',
  bark:      '#6b5132',
};

// ---------------- Oak (big leafy) ---------
function Oak({ position, scale = 1, rot = 0 }:
             { position: [number, number, number]; scale?: number; rot?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rot, 0]}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.52, 2.8, 10]} />
        <meshStandardMaterial color={FOLIAGE.trunkLight} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <coneGeometry args={[0.72, 0.4, 12]} />
        <meshStandardMaterial color={FOLIAGE.trunkDark} roughness={1} />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[1.65, 16, 14]} />
        <meshStandardMaterial color={FOLIAGE.oakBase} roughness={0.9} />
      </mesh>
      <mesh position={[0.95, 3.55, 0.4]} castShadow>
        <sphereGeometry args={[1.20, 14, 12]} />
        <meshStandardMaterial color={FOLIAGE.oakLight} roughness={0.9} />
      </mesh>
      <mesh position={[-0.85, 3.45, -0.30]} castShadow>
        <sphereGeometry args={[1.05, 14, 12]} />
        <meshStandardMaterial color={FOLIAGE.oakDark} roughness={0.9} />
      </mesh>
      <mesh position={[0.10, 3.95, -0.80]} castShadow>
        <sphereGeometry args={[0.85, 12, 10]} />
        <meshStandardMaterial color={FOLIAGE.oakLight} roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.3, 0]} castShadow>
        <sphereGeometry args={[0.65, 12, 10]} />
        <meshStandardMaterial color={FOLIAGE.oakTop} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ---------------- Pine (tall conifer) ----
function Pine({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.20, 0.34, 2.8, 8]} />
        <meshStandardMaterial color={FOLIAGE.bark} roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.4, 0]} castShadow>
        <coneGeometry args={[1.55, 1.6, 14]} />
        <meshStandardMaterial color={FOLIAGE.pine1} roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <coneGeometry args={[1.25, 1.4, 12]} />
        <meshStandardMaterial color={FOLIAGE.pine2} roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.7, 0]} castShadow>
        <coneGeometry args={[0.95, 1.3, 10]} />
        <meshStandardMaterial color={FOLIAGE.pine3} roughness={0.9} />
      </mesh>
      <mesh position={[0, 5.7, 0]} castShadow>
        <coneGeometry args={[0.55, 1.0, 8]} />
        <meshStandardMaterial color={FOLIAGE.pineTop} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ---------------- Birch (slender pale) ----
function Birch({ position, scale = 1, rot = 0 }:
               { position: [number, number, number]; scale?: number; rot?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rot, 0]}>
      {/* slim white trunk with dark bands */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 3.2, 8]} />
        <meshStandardMaterial color="#f0ead8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.6, 0.0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.08, 8]} />
        <meshStandardMaterial color="#3a3025" />
      </mesh>
      <mesh position={[0, 1.4, 0.0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.06, 8]} />
        <meshStandardMaterial color="#3a3025" />
      </mesh>
      <mesh position={[0, 2.4, 0.0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.05, 8]} />
        <meshStandardMaterial color="#3a3025" />
      </mesh>
      {/* light airy canopy */}
      <mesh position={[0, 3.4, 0]} castShadow>
        <sphereGeometry args={[1.10, 12, 10]} />
        <meshStandardMaterial color={FOLIAGE.birch1} roughness={0.9} />
      </mesh>
      <mesh position={[0.55, 3.6, 0.2]} castShadow>
        <sphereGeometry args={[0.80, 12, 10]} />
        <meshStandardMaterial color={FOLIAGE.birch2} roughness={0.9} />
      </mesh>
      <mesh position={[-0.45, 3.5, -0.15]} castShadow>
        <sphereGeometry args={[0.65, 10, 8]} />
        <meshStandardMaterial color={FOLIAGE.birch3} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ---------------- Stump (dead snag) ------
function Stump({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.7, 10]} />
        <meshStandardMaterial color="#4a3220" roughness={1} />
      </mesh>
      {/* inner rings */}
      <mesh position={[0, 0.71, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.42, 16]} />
        <meshStandardMaterial color="#8a6b3e" />
      </mesh>
      <mesh position={[0, 0.715, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.20, 0.32, 16]} />
        <meshStandardMaterial color="#5a3f22" />
      </mesh>
    </group>
  );
}

// ---------------- Bush (low foliage clump) -----------
// Tint is restricted to the sage/olive family — decorative bushes never
// borrow from the dye palette. Optional cream/lavender wildflower dots may be
// shown via `accent` (gameplay-neutral hues).
function Bush({ position, scale = 1, tint = '#5d7548', accent }:
              { position: [number, number, number]; scale?: number; tint?: string; accent?: string }) {
  const rand = useMemo(() => {
    const r = seeded(position[0] * 17 + position[2] * 23 + 5);
    return { a: r(), b: r(), c: r(), d: r() };
  }, [position]);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.65, 12, 10]} />
        <meshStandardMaterial color={tint} roughness={0.95} />
      </mesh>
      <mesh position={[0.45 + rand.a * 0.2, 0.30, -0.20]} castShadow>
        <sphereGeometry args={[0.42, 10, 8]} />
        <meshStandardMaterial color={shade(tint, -10)} roughness={0.95} />
      </mesh>
      <mesh position={[-0.40, 0.32, 0.45 + rand.b * 0.2]} castShadow>
        <sphereGeometry args={[0.38, 10, 8]} />
        <meshStandardMaterial color={shade(tint, +10)} roughness={0.95} />
      </mesh>
      <mesh position={[-0.10 + rand.c * 0.3, 0.62, -0.45]} castShadow>
        <sphereGeometry args={[0.30, 10, 8]} />
        <meshStandardMaterial color={shade(tint, +6)} roughness={0.95} />
      </mesh>
      {accent && (
        <>
          <mesh position={[0.32 + rand.d * 0.2, 0.78, 0.10]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={accent} roughness={0.6} />
          </mesh>
          <mesh position={[-0.20, 0.74, 0.32]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={accent} roughness={0.6} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Cheap shade helper — shifts an #rrggbb hex by a small lightness delta.
function shade(hex: string, delta: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const adj = (v: number) => Math.max(0, Math.min(255, v + delta));
  return '#' + [adj(r), adj(g), adj(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ---------------- Cattail clump (pond edge)
function Cattail({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2;
        const x = Math.cos(a) * 0.18;
        const z = Math.sin(a) * 0.18;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 1.1, 5]} />
              <meshStandardMaterial color="#5a7a40" />
            </mesh>
            <mesh position={[0, 1.05, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.06, 0.30, 8]} />
              <meshStandardMaterial color="#5d4022" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ---------------- Flower patch ----------
function FlowerPatch({ position, color, n = 10 }: { position: [number, number, number]; color: string; n?: number }) {
  const blossoms = useMemo(() => {
    const rand = seeded(position[0] * 31 + position[2] * 19 + 7);
    return Array.from({ length: n }, () => ({
      x: (rand() - 0.5) * 1.4,
      z: (rand() - 0.5) * 1.4,
      s: 0.06 + rand() * 0.10,
    }));
  }, [position, n]);
  return (
    <group position={position}>
      {blossoms.map((b, i) => (
        <mesh key={i} position={[b.x, 0.05, b.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[b.s, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------- Barn (weathered wood, proper gable roof) ----
// Walls: 7 wide (X) × 4 tall (Y) × 5 deep (Z). Roof is a gable along the long
// axis: two slanted slate panels meeting at a ridge, with triangular gable
// end-walls at +X and -X. No more rotated pyramid that didn't line up.
function Barn({ position }: { position: [number, number, number] }) {
  const W = 7, H = 4, D = 5;             // wall dims
  const RIDGE_RISE = 2.0;                // peak above wall top
  const slope = Math.atan2(RIDGE_RISE, D / 2);
  const panelLen = Math.hypot(D / 2, RIDGE_RISE);
  const overhang = 0.25;

  // Triangle gable shape (in shape XY plane). x = ±D/2 along the eave, y = up.
  const gableShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-D / 2, 0);
    s.lineTo( D / 2, 0);
    s.lineTo(    0, RIDGE_RISE);
    s.lineTo(-D / 2, 0);
    return s;
  }, [D, RIDGE_RISE]);

  return (
    <group position={position}>
      {/* walls */}
      <RoundedBox
        args={[W, H, D]} radius={0.12} smoothness={3}
        position={[0, H / 2, 0]} castShadow receiveShadow
      >
        <meshStandardMaterial color="#6e5a3e" roughness={0.95} />
      </RoundedBox>

      {/* gable end walls — close the triangular gap above the wall, both ends */}
      <mesh position={[ W / 2 - 0.001, H, 0]} rotation={[0,  Math.PI / 2, 0]}>
        <shapeGeometry args={[gableShape]} />
        <meshStandardMaterial color="#6e5a3e" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-W / 2 + 0.001, H, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <shapeGeometry args={[gableShape]} />
        <meshStandardMaterial color="#6e5a3e" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* roof — two slanted slate panels meeting along the ridge (X axis) */}
      <mesh
        position={[0, H + RIDGE_RISE / 2, -(D / 4)]}
        rotation={[ slope, 0, 0]}
        castShadow
      >
        <boxGeometry args={[W + overhang * 2, 0.18, panelLen + overhang * 2]} />
        <meshStandardMaterial color="#3a3530" roughness={0.95} />
      </mesh>
      <mesh
        position={[0, H + RIDGE_RISE / 2,  (D / 4)]}
        rotation={[-slope, 0, 0]}
        castShadow
      >
        <boxGeometry args={[W + overhang * 2, 0.18, panelLen + overhang * 2]} />
        <meshStandardMaterial color="#3a3530" roughness={0.95} />
      </mesh>

      {/* ridge cap — slim long box along the peak */}
      <mesh position={[0, H + RIDGE_RISE + 0.06, 0]} castShadow>
        <boxGeometry args={[W + overhang * 2, 0.12, 0.34]} />
        <meshStandardMaterial color="#2a2620" />
      </mesh>

      {/* big front door — dark walnut */}
      <mesh position={[0, 1.4, D / 2 + 0.06]} castShadow>
        <boxGeometry args={[2.4, 2.8, 0.1]} />
        <meshStandardMaterial color="#3a2a1c" roughness={0.95} />
      </mesh>

      {/* hayloft window in the front gable */}
      <mesh position={[0, H + RIDGE_RISE * 0.4, 0.001]} rotation={[0, 0, 0]}>
        {/* but actually the front gable is at +X, so put the window there */}
      </mesh>
      <mesh position={[W / 2 + 0.05, H + RIDGE_RISE * 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.9, 0.9, 0.05]} />
        <meshStandardMaterial color="#3a2a1c" />
      </mesh>

      {/* eave trim — cream beam tucked under the slopes (low-sat, neutral) */}
      <mesh position={[0, H, -D / 2]} castShadow>
        <boxGeometry args={[W + overhang * 2, 0.18, 0.16]} />
        <meshStandardMaterial color="#d6cda8" roughness={0.9} />
      </mesh>
      <mesh position={[0, H,  D / 2]} castShadow>
        <boxGeometry args={[W + overhang * 2, 0.18, 0.16]} />
        <meshStandardMaterial color="#d6cda8" roughness={0.9} />
      </mesh>

      {/* vertical plank shadows on the front face */}
      {[-2.4, -1.2, 1.2, 2.4].map((px, i) => (
        <mesh key={i} position={[px, H / 2, D / 2 + 0.001]}>
          <boxGeometry args={[0.04, H - 0.2, 0.04]} />
          <meshStandardMaterial color="#4d3a25" />
        </mesh>
      ))}
    </group>
  );
}

// ---------------- Wooden post fence (just posts) -----------
// No rails. Boundary path is shaped by a noise function so the overall outline
// is an irregular blob — not a circle. Posts vary in height, thickness, tilt,
// rotation, and spacing. Some sections are tightly packed, some have wide gaps
// (open to the meadow). One section near the gates is intentionally sparse so
// it doesn't visually wall off the pens.
function PostFence({ baseRadius }: { baseRadius: number }) {
  const posts = useMemo(() => {
    const rand = seeded(8124);
    // Noise: layered sines for an organic non-circular outline.
    const noiseR = (a: number) =>
      baseRadius
      + 1.6 * Math.sin(a * 1.4 + 0.3)
      + 1.1 * Math.sin(a * 2.7 - 1.1)
      + 0.7 * Math.sin(a * 4.1 + 2.0)
      - 0.5 * Math.cos(a * 0.9);

    // Walk around the circle. Spacing is variable (0.9 to 1.8 units between
    // posts). Some intervals get skipped entirely to leave open "gaps".
    const arr: { x: number; z: number; h: number; thick: number; tiltX: number; tiltZ: number; rotY: number; tint: number; isBroken: boolean }[] = [];
    let a = 0;
    let safety = 0;
    while (a < Math.PI * 2 - 0.02 && safety++ < 600) {
      const r = noiseR(a);
      // skip the gate lane window (so the pens read clearly)
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r - 1.5; // shift fence shape south a touch
      const inGateLane = z < -10 && Math.abs(x) < 13;
      // chance of leaving an organic gap (open boundary)
      const gapRoll = rand();
      const shouldGap = gapRoll < 0.06 && a > 0.5; // ~6% gaps
      if (!inGateLane && !shouldGap) {
        const jx = (rand() - 0.5) * 0.6;
        const jz = (rand() - 0.5) * 0.6;
        // Mix three height archetypes so the silhouette feels really uneven.
        // 25% "marker" stakes: very tall and thin
        // 35% medium posts
        // 25% chunky low fence posts
        // 15% stubs / weathered nubs
        const archetype = rand();
        let h: number, thick: number;
        if (archetype < 0.25) {
          h     = 1.90 + rand() * 0.85;   // 1.90..2.75
          thick = 0.045 + rand() * 0.04;  // 0.045..0.085 — slim markers
        } else if (archetype < 0.60) {
          h     = 1.10 + rand() * 0.70;   // 1.10..1.80
          thick = 0.10 + rand() * 0.06;
        } else if (archetype < 0.85) {
          h     = 0.55 + rand() * 0.50;   // 0.55..1.05 — chunky low posts
          thick = 0.18 + rand() * 0.10;   // 0.18..0.28 — fat
        } else {
          h     = 0.20 + rand() * 0.25;   // 0.20..0.45 — weathered stubs
          thick = 0.20 + rand() * 0.12;   // wide and squat
        }
        arr.push({
          x: x + jx,
          z: z + jz,
          h,
          thick,
          tiltX: (rand() - 0.5) * 0.26,
          tiltZ: (rand() - 0.5) * 0.26,
          rotY: rand() * Math.PI * 2,
          tint: Math.floor(rand() * 4),
          isBroken: rand() < 0.07,
        });
      } else if (shouldGap) {
        a += 0.35 + rand() * 0.45;                       // skip ahead a chunk
        continue;
      }
      // variable spacing — measure along the noisy path tangentially
      const step = (0.05 + rand() * 0.07);
      a += step;
    }
    return arr;
  }, [baseRadius]);

  const tints = ['#7e5b32', '#6c4d28', '#8a6840', '#5e4220'];

  return (
    <group>
      {posts.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.h / 2, p.z]}
          rotation={[p.tiltX, p.rotY, p.tiltZ]}
          castShadow
        >
          {p.isBroken ? (
            // snapped post — leans more, top is conical
            <coneGeometry args={[p.thick * 0.9, p.h * 0.85, 6]} />
          ) : (
            <cylinderGeometry args={[p.thick * 0.85, p.thick, p.h, 6]} />
          )}
          <meshStandardMaterial color={tints[p.tint]} roughness={0.98} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------- Birds ------------------
function Birds() {
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (a.current) {
      a.current.position.set(Math.cos(t * 0.18) * 22, 11 + Math.sin(t * 0.5) * 0.8, Math.sin(t * 0.18) * 22);
      a.current.rotation.y = t * 0.18 + Math.PI / 2;
    }
    if (b.current) {
      b.current.position.set(Math.cos(t * 0.13 + 2) * 16, 13 + Math.sin(t * 0.6) * 0.6, Math.sin(t * 0.13 + 2) * 16);
      b.current.rotation.y = t * 0.13 + 2 + Math.PI / 2;
    }
  });
  const Bird = () => (
    <group>
      <mesh>
        <coneGeometry args={[0.12, 0.5, 4]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* wings — two flat triangles */}
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.10, 0.6, 3]} />
        <meshStandardMaterial color="#1a1a1a" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.35, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.10, 0.6, 3]} />
        <meshStandardMaterial color="#1a1a1a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
  return (
    <>
      <group ref={a}><Bird /></group>
      <group ref={b}><Bird /></group>
    </>
  );
}

// ---------------- Pollen / dandelion -----
function Pollen() {
  const COUNT = 120;
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * PLAYFIELD * 1.4;
      arr[i * 3 + 1] = Math.random() * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * PLAYFIELD * 1.4;
    }
    return arr;
  }, []);
  const velocities = useMemo(() => {
    const arr = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 2 + 0] = 0.3 + Math.random() * 0.4;   // rise speed (slow upward drift)
      arr[i * 2 + 1] = (Math.random() - 0.5) * 0.4; // side drift
    }
    return arr;
  }, []);
  useFrame((_, delta) => {
    const p = ref.current;
    if (!p) return;
    const arr = p.geometry.attributes.position.array as Float32Array;
    const c = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      const xi = i * 3, yi = i * 3 + 1, zi = i * 3 + 2;
      arr[yi] += velocities[i * 2 + 0] * c;
      arr[xi] += velocities[i * 2 + 1] * c;
      if (arr[yi] > 8) {
        arr[yi] = 0.2;
        arr[xi] = (Math.random() - 0.5) * PLAYFIELD * 1.4;
        arr[zi] = (Math.random() - 0.5) * PLAYFIELD * 1.4;
      }
      if (Math.abs(arr[xi]) > PLAYFIELD * 0.8) {
        arr[xi] = (Math.random() - 0.5) * PLAYFIELD * 1.4;
      }
    }
    p.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#fff8d0"
        size={0.30}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}

// ---------------- Combined export ----------
// Hand-composed pasture with named zones. Each zone has its own personality
// instead of a uniform sprinkle of trees + bushes. Zones overlap a bit but
// stay biased: lots of trees in the WEST grove, very few in the SE meadow,
// hay bales clustered in the SW barnyard, etc.
//
//   N (z = -18..-15)  → Gate plaza: clean approach to the pens, 1 lone oak.
//   NE (x>0, z<-3)    → Sparse meadow + flower patch + a couple of birches.
//   E (x = +5..+12)   → Pond cluster: cattails, lily pads, 1 oak by the bank.
//   SE (x>0, z>4)     → Rocky outcrop: boulders + scattered tall pines.
//   S (-4<x<4, z>4)   → Open meadow: dirt path + flowers + 1 stump.
//   SW (x<-2, z>3)    → Barnyard: hay bales clustered, fence posts denser here.
//   W (x<-6, |z|<8)   → Deep grove: heavy pine + oak cluster, dark canopy.
//   NW (x<-3, z<-3)   → Wildflower thicket: birches + flowering bushes.
export function SceneProps() {
  const groves = useMemo(() => buildGroves(), []);

  return (
    <>
      {/* approach path */}
      <mesh position={[-1.2, 0.01, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.6, 22]} />
        <meshStandardMaterial color="#a8895e" roughness={1} />
      </mesh>
      <mesh position={[ 1.2, 0.01, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.6, 22]} />
        <meshStandardMaterial color="#a8895e" roughness={1} />
      </mesh>

      <Pond position={[7, 0, -2]} radius={3.0} />
      {([
        [ 4.0, 0,  -2.0], [ 5.0, 0,   0.8], [ 9.5, 0,  -3.4],
        [ 7.6, 0,  -4.8], [ 4.4, 0,  -0.4], [ 9.6, 0,  -0.6],
      ] as [number, number, number][]).map((p, i) => <Cattail key={`cat_${i}`} position={p} />)}

      {groves.trees.map((t, i) => {
        if (t.type === 'oak')   return <Oak   key={`oak_${i}`}   position={t.p} scale={t.s} rot={t.rot} />;
        if (t.type === 'pine')  return <Pine  key={`pine_${i}`}  position={t.p} scale={t.s} />;
        return                          <Birch key={`birch_${i}`} position={t.p} scale={t.s} rot={t.rot} />;
      })}
      {groves.bushes.map((b, i) => (
        <Bush key={`bush_${i}`} position={b.p} scale={b.s} tint={b.tint} accent={b.accent} />
      ))}
      {groves.stumps.map((s, i) => (
        <Stump key={`stump_${i}`} position={s.p} rot={s.rot} />
      ))}
      {groves.flowers.map((f, i) => (
        <FlowerPatch key={`flower_${i}`} position={f.p} color={f.color} n={f.n} />
      ))}
      {groves.boulders.map((b, i) => (
        <Boulder key={`boulder_${i}`} position={b.p} scale={b.s} />
      ))}
      {groves.hay.map((h, i) => (
        <HayBale key={`hay_${i}`} position={[h.p[0], 0, h.p[2]]} rotation={h.rot} />
      ))}

      <PostFence baseRadius={PLAYFIELD / 2 + 1.2} />

      <Barn position={[0, 0, -22]} />
      <Birds />
      <Pollen />
    </>
  );
}

// Hand-tuned zone composition. Returns one entry per object — call site does
// the rendering. Each zone is grouped so dense regions actually look dense,
// and open regions stay open.
function buildGroves() {
  const rand = seeded(901322);
  const trees: { type: 'oak' | 'pine' | 'birch'; p: [number, number, number]; s: number; rot: number }[] = [];
  const bushes: { p: [number, number, number]; s: number; tint: string; accent?: string }[] = [];
  const stumps: { p: [number, number, number]; rot: number }[] = [];
  const flowers: { p: [number, number, number]; color: string; n: number }[] = [];
  const boulders: { p: [number, number, number]; s: number }[] = [];
  const hay: { p: [number, number, number]; rot: number }[] = [];

  // helpers ---------------------------------------------------------------
  const jit = (n: number) => (rand() - 0.5) * 2 * n;
  function addCluster(cx: number, cz: number, radius: number, items: Array<() => void>) {
    // run each placement function — items themselves call addX with offsets
    for (const fn of items) fn();
    void cx; void cz; void radius; // (kept for documentation of cluster anchor)
  }

  function addTree(type: 'oak' | 'pine' | 'birch', x: number, z: number, s: number) {
    trees.push({ type, p: [x, 0, z], s, rot: rand() * Math.PI * 2 });
  }
  function addBush(x: number, z: number, s: number, tint: string, accent?: string) {
    bushes.push({ p: [x, 0, z], s, tint, accent });
  }
  function addStump(x: number, z: number) {
    stumps.push({ p: [x, 0, z], rot: rand() * Math.PI * 2 });
  }
  function addFlower(x: number, z: number, color: string, n = 12) {
    flowers.push({ p: [x, 0, z], color, n });
  }
  function addBoulder(x: number, z: number, s: number) {
    boulders.push({ p: [x, 0, z], s });
  }
  function addHay(x: number, z: number, rot: number) {
    hay.push({ p: [x, 0, z], rot });
  }

  // Decorative palette — kept STRICTLY out of the dye palette so the saturated
  // dye colors are reserved for gameplay signals only (sheep marks, gate banners).
  const SAGE = FOLIAGE.bushGreen;       // four green tones
  const CREAM = '#e8dcb2';              // pale cream wildflower
  const LAVENDER = '#b9a3c4';           // dusty lavender (low sat)
  const ROSE = '#c98a8a';               // dusty old rose (NOT dye red)
  const sageRand = () => SAGE[Math.floor(rand() * SAGE.length)];

  // ---- W: Deep grove ----------------------------------------------------
  addCluster(-14, 0, 6, [
    () => addTree('pine', -15.5 + jit(0.5), -2 + jit(1.0), 1.30),
    () => addTree('pine', -16.2 + jit(0.6), -5 + jit(1.0), 1.40),
    () => addTree('oak',  -14.5 + jit(0.5),  1 + jit(1.0), 1.30),
    () => addTree('oak',  -16.5 + jit(0.5),  4 + jit(1.0), 1.20),
    () => addTree('pine', -13.5 + jit(0.4),  6 + jit(0.8), 1.15),
    () => addTree('oak',  -14.0 + jit(0.5), -8 + jit(0.8), 1.40),
    () => addTree('pine', -13.0 + jit(0.4), -10 + jit(0.8), 1.20),
    () => addTree('birch', -11.5 + jit(0.4), 3 + jit(0.6), 0.95),
    () => addTree('birch', -12.0 + jit(0.4), -3 + jit(0.6), 0.90),
    () => addBush(-11 + jit(0.5),  0 + jit(0.8), 1.1, sageRand()),
    () => addBush(-12 + jit(0.5), -5 + jit(0.8), 1.0, sageRand()),
    () => addBush(-13 + jit(0.5),  7 + jit(0.6), 1.2, sageRand()),
    () => addBush(-10.5 + jit(0.5), 5 + jit(0.6), 0.9, sageRand()),
    () => addStump(-10, -1),
  ]);

  // ---- NW: Wildflower thicket -------------------------------------------
  addCluster(-9, -8, 5, [
    () => addTree('birch', -8.5 + jit(0.4), -8 + jit(0.6), 1.05),
    () => addTree('birch', -10.5 + jit(0.4), -10 + jit(0.6), 0.95),
    () => addTree('birch', -7 + jit(0.4), -10 + jit(0.6), 1.00),
    () => addBush(-8 + jit(0.3), -7 + jit(0.4), 1.0, sageRand(), CREAM),
    () => addBush(-9.5 + jit(0.3), -9 + jit(0.4), 0.95, sageRand(), LAVENDER),
    () => addBush(-7.5 + jit(0.3), -8.5 + jit(0.4), 0.85, sageRand()),
    () => addFlower(-9, -7, CREAM, 14),
    () => addFlower(-7.5, -10, LAVENDER, 10),
  ]);

  // ---- N: Gate plaza ----------------------------------------------------
  addTree('oak', 5, -12, 1.30);
  addBush(-4.5, -11.5, 0.9, sageRand());

  // ---- NE: Sparse meadow ------------------------------------------------
  addCluster(8, -8, 4, [
    () => addTree('birch', 8 + jit(0.3), -8 + jit(0.5), 1.00),
    () => addTree('birch', 11 + jit(0.3), -9 + jit(0.5), 0.95),
    () => addFlower(9, -7, ROSE, 12),
    () => addBush(10.5 + jit(0.3), -8 + jit(0.4), 0.9, sageRand(), ROSE),
    () => addBush(9 + jit(0.3), -9 + jit(0.4), 0.8, sageRand()),
  ]);

  // ---- SE: Rocky outcrop ------------------------------------------------
  addCluster(11, 6, 5, [
    () => addBoulder(12, 5, 1.10),
    () => addBoulder(13, 7, 0.85),
    () => addBoulder(11, 8, 0.75),
    () => addBoulder(14, 4, 0.95),
    () => addBoulder(10, 6, 0.65),
    () => addTree('pine', 13 + jit(0.3), 9 + jit(0.4), 1.30),
    () => addTree('pine', 15 + jit(0.3), 6 + jit(0.4), 1.15),
    () => addBush(11.5 + jit(0.3), 5 + jit(0.3), 0.75, sageRand()),
  ]);

  // ---- S: Open meadow + path ------------------------------------------
  addStump(-4, 8);
  addFlower(4, 10, CREAM, 14);
  addFlower(-3, 12, LAVENDER, 10);
  addBush(3 + jit(0.4), 13 + jit(0.4), 0.85, sageRand());
  addTree('oak', -6, 12, 1.20);

  // ---- SW: Barnyard ----------------------------------------------------
  addCluster(-9, 5, 4, [
    () => addHay(-9, 5, 0.4),
    () => addHay(-7.5, 4, 1.2),
    () => addHay(-10, 6.5, 0.8),
    () => addHay(-8, 7, 0.2),
    () => addStump(-6.5, 6),
    () => addTree('oak', -11, 8, 1.10),
    () => addTree('oak', -7, 9, 0.95),
    () => addBush(-9 + jit(0.3), 7 + jit(0.3), 0.9, sageRand()),
    () => addBush(-6 + jit(0.3), 5 + jit(0.3), 0.75, sageRand()),
  ]);

  // ---- E: Pond fringe + a couple of trees ------------------------------
  addTree('oak', 9, 2, 1.20);
  addBush(4.5, -1, 0.7, sageRand());
  addBush(10, -5, 0.85, sageRand());
  addFlower(8, -6, CREAM, 10);

  // ---- Outer-rim forest patches (clusters, not a uniform ring) ---------
  for (const patch of [
    { cx: -16, cz: -13, a: ['oak', 'pine', 'birch'] as const },
    { cx:  -3, cz: -17, a: ['oak', 'oak', 'pine'] as const },
    { cx:  15, cz: -13, a: ['pine', 'oak'] as const },
    { cx:  18, cz:  -2, a: ['pine', 'oak', 'oak'] as const },
    { cx:  16, cz:  12, a: ['oak', 'birch'] as const },
    { cx:  -2, cz:  17, a: ['oak', 'pine'] as const },
    { cx: -16, cz:  12, a: ['pine', 'oak'] as const },
  ]) {
    for (const type of patch.a) {
      const ox = patch.cx + jit(1.3);
      const oz = patch.cz + jit(1.3);
      const s = type === 'pine'
        ? 1.10 + rand() * 0.35
        : type === 'oak'
        ? 1.20 + rand() * 0.40
        : 0.95 + rand() * 0.25;
      addTree(type, ox, oz, s);
    }
    addBush(patch.cx + jit(1.5), patch.cz + jit(1.5), 0.85, sageRand());
  }

  return { trees, bushes, stumps, flowers, boulders, hay };
}
