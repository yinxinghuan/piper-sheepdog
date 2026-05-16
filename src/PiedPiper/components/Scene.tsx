import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CAMERA_FOV, CAMERA_POS, PLAYFIELD } from '../constants';
import { Sheep } from './Sheep';
import { Dog } from './Dog';
import { Gate } from './Gate';
import { Wolf } from './Wolf';
import { SceneProps } from './SceneProps';
import { useGameLoop, GameRef, SfxKey, DeliveryInfo } from '../hooks/useGameLoop';
import type { Stick } from '../types';

interface SceneProps_ {
  state: React.MutableRefObject<GameRef>;
  playing: boolean;
  stickRef: React.MutableRefObject<Stick>;
  onScore: (s: number) => void;
  onTime: (t: number) => void;
  onCombo: (combo: number, mult: number) => void;
  onDelivery: (info: DeliveryInfo) => void;
  onWolfHit: (count: number) => void;
  onRoundClear: (round: number) => void;
  onRoundFail: (final: number) => void;
  onBarkUpdate: (cooldown: number) => void;
  playSfx: (k: SfxKey) => void;
  haptic?: (k: 'light' | 'heavy') => void;
}

function FollowCamera({ state }: { state: React.MutableRefObject<GameRef> }) {
  const { camera, size } = useThree();
  const offset = useRef(new THREE.Vector3(...CAMERA_POS));
  const target = useRef(new THREE.Vector3());

  useEffect(() => {
    const head = state.current.headPos;
    camera.position.set(head.x + CAMERA_POS[0], head.y + CAMERA_POS[1], head.z + CAMERA_POS[2]);
    (camera as THREE.PerspectiveCamera).fov = CAMERA_FOV;
    (camera as THREE.PerspectiveCamera).near = 0.1;
    (camera as THREE.PerspectiveCamera).far = 200;
    camera.lookAt(head.x, 0, head.z);
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera, size.width, size.height, state]);

  useFrame(() => {
    const head = state.current.headPos;
    target.current.copy(head).add(offset.current);
    camera.position.lerp(target.current, 0.1);
    camera.lookAt(head.x, 0, head.z);
  });
  return null;
}

// Screen-aligned expanding rings centered on the dog. Uses drei <Html> so the
// DOM container follows the bark fire position in world space, but the visual
// is a CSS-animated <div> with border-radius: 50% — guaranteed to render as a
// true circle on screen no matter the camera angle.
function BarkWave({ state }: { state: React.MutableRefObject<GameRef> }) {
  const [active, setActive] = useState<{ key: number; x: number; z: number } | null>(null);
  const lastFireRef = useRef<number>(-99);

  useFrame(() => {
    const d = state.current;
    if (d.barkFireT !== lastFireRef.current) {
      lastFireRef.current = d.barkFireT;
      const key = Date.now() + Math.random();
      setActive({ key, x: d.barkFireX, z: d.barkFireZ });
      // auto-clear well after the longest CSS animation completes
      const k = key;
      setTimeout(() => setActive(cur => (cur && cur.key === k ? null : cur)), 900);
    }
  });

  if (!active) return null;
  return (
    <Html
      position={[active.x, 0.4, active.z]}
      center
      zIndexRange={[5, 5]}
      style={{ pointerEvents: 'none' }}
    >
      <div className="pp-barkwave" key={active.key}>
        <span className="pp-barkwave__r1" />
        <span className="pp-barkwave__r2" />
      </div>
    </Html>
  );
}

function ActorSync({ state }: { state: React.MutableRefObject<GameRef> }) {
  const leader = useRef<THREE.Group>(null);
  const sheepRefs = useRef<Map<number, THREE.Group>>(new Map());
  const wolfRefs = useRef<Map<number, THREE.Group>>(new Map());

  useFrame(() => {
    const d = state.current;
    if (leader.current) {
      leader.current.position.copy(d.headPos);
      leader.current.rotation.y = d.headRot;
    }
    for (const s of d.sheep) {
      const g = sheepRefs.current.get(s.id);
      if (!g) continue;
      g.position.copy(s.position);
      g.rotation.y = s.rotation;
      g.userData.inChain = s.state === 'chain';
    }
    for (const s of d.chain) {
      const g = sheepRefs.current.get(s.id);
      if (!g) continue;
      g.position.copy(s.position);
      g.rotation.y = s.rotation;
      g.userData.inChain = true;
    }
    for (const w of d.wolves) {
      const g = wolfRefs.current.get(w.id);
      if (!g) continue;
      g.position.copy(w.position);
      g.rotation.y = w.rotation;
      g.userData.stunned = w.state === 'stunned';
    }
  });

  const d = state.current;
  const seen = new Set<number>();
  const sheepRender: typeof d.sheep = [];
  for (const s of d.sheep) { if (!seen.has(s.id)) { seen.add(s.id); sheepRender.push(s); } }
  for (const s of d.chain) { if (!seen.has(s.id)) { seen.add(s.id); sheepRender.push(s); } }

  return (
    <>
      <group ref={leader}>
        <Dog />
      </group>
      {sheepRender.map(s => {
        const matchesLeft = s.colorType === d.gates[0]?.color;
        const matchesRight = s.colorType === d.gates[1]?.color;
        const isTarget = matchesLeft || matchesRight;
        return (
          <group
            key={s.id}
            ref={el => {
              if (el) sheepRefs.current.set(s.id, el);
              else sheepRefs.current.delete(s.id);
            }}
          >
            <Sheep colorType={s.colorType} isTarget={isTarget} />
          </group>
        );
      })}
      {d.wolves.map(w => (
        <group
          key={w.id}
          ref={el => {
            if (el) wolfRefs.current.set(w.id, el);
            else wolfRefs.current.delete(w.id);
          }}
        >
          <Wolf stunned={w.state === 'stunned'} />
        </group>
      ))}
    </>
  );
}

export function Scene(props: SceneProps_) {
  const { state } = props;

  useGameLoop({
    state,
    playing: props.playing,
    stick: props.stickRef.current,
    onScore: props.onScore,
    onTime: props.onTime,
    onCombo: props.onCombo,
    onDelivery: props.onDelivery,
    onWolfHit: props.onWolfHit,
    onRoundClear: props.onRoundClear,
    onRoundFail: props.onRoundFail,
    onBarkUpdate: props.onBarkUpdate,
    playSfx: props.playSfx,
    haptic: props.haptic,
  });

  const [, force] = useState(0);
  const lastSizes = useRef({ s: -1, c: -1, w: -1, r: -1, ld: -1, rd: -1, lc: -1, rc: -1 });
  useFrame(() => {
    const d = state.current;
    const ld = d.gates[0]?.delivered ?? -1;
    const rd = d.gates[1]?.delivered ?? -1;
    const lc = d.gates[0]?.color ?? -1;
    const rc = d.gates[1]?.color ?? -1;
    if (
      d.sheep.length !== lastSizes.current.s ||
      d.chain.length !== lastSizes.current.c ||
      d.wolves.length !== lastSizes.current.w ||
      d.round !== lastSizes.current.r ||
      ld !== lastSizes.current.ld || rd !== lastSizes.current.rd ||
      lc !== lastSizes.current.lc || rc !== lastSizes.current.rc
    ) {
      lastSizes.current = {
        s: d.sheep.length, c: d.chain.length, w: d.wolves.length,
        r: d.round, ld, rd, lc, rc,
      };
      force(x => x + 1);
    }
  });

  const d = state.current;

  return (
    <>
      <FollowCamera state={state} />
      <fog attach="fog" args={['#9fb695', PLAYFIELD * 1.0, PLAYFIELD * 2.3]} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[18, 38, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-bias={-0.0008}
      />
      <hemisphereLight args={['#b0c098', '#5a6948', 0.42]} />

      {/* far green background — muted olive */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[PLAYFIELD * 4, PLAYFIELD * 4]} />
        <meshStandardMaterial color="#5d7548" />
      </mesh>
      {/* outer pasture ring — slightly darker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[PLAYFIELD / 2 + 2.5, PLAYFIELD / 2 + 14, 64]} />
        <meshStandardMaterial color="#43592f" />
      </mesh>
      {/* main pasture disc — sage */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[PLAYFIELD / 2 + 4, 64]} />
        <meshStandardMaterial color="#7a9462" roughness={0.95} />
      </mesh>
      {/* inner slightly lighter patch */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[PLAYFIELD / 2 - 2, 48]} />
        <meshStandardMaterial color="#8aa471" roughness={0.92} />
      </mesh>
      {/* scattered grass tuft planes */}
      {[
        { x: -7, z:  3, rot: 0.4,  len: 3.2, w: 0.9 },
        { x:  5, z: -6, rot: 1.7,  len: 2.6, w: 0.8 },
        { x:  8, z:  6, rot: -0.6, len: 3.0, w: 0.7 },
        { x: -3, z: -9, rot: 2.6,  len: 2.4, w: 0.6 },
        { x:  2, z:  9, rot: 0.9,  len: 2.0, w: 0.5 },
        { x: -9, z: -2, rot: 1.2,  len: 1.8, w: 0.5 },
        { x: 11, z:  1, rot: 0.3,  len: 2.4, w: 0.6 },
        { x:-12, z:  9, rot: 2.0,  len: 2.0, w: 0.5 },
      ].map((c, i) => (
        <mesh
          key={`tuft_${i}`}
          rotation={[-Math.PI / 2, 0, c.rot]}
          position={[c.x, 0.01, c.z]}
        >
          <planeGeometry args={[c.w, c.len]} />
          <meshStandardMaterial color="#5d7548" transparent opacity={0.55} />
        </mesh>
      ))}

      {/* all the static decorative props (pond, hay, boulders, trees, barn,
          rail fence, flowers, pollen, birds) */}
      <SceneProps />

      {/* gates */}
      {d.gates.map(g => (
        <Gate
          key={g.id}
          position={[g.position.x, 0, g.position.z]}
          side={g.id}
          color={g.color}
          delivered={g.delivered}
        />
      ))}

      <BarkWave state={state} />
      <ActorSync state={state} />
    </>
  );
}
