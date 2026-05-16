import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  PLAYFIELD, PLAYER_SPEED, SPEED_DECAY, MIN_SPEED_FACTOR, BODY_FOLLOW_SPEED,
  ATTRACT_RADIUS, DETACH_RADIUS, DETACH_TIME,
  CORRECT_SCORE, WRONG_SCORE, COMBO_MAX_MULT,
  COLOR_TYPES, TARGET_PER_GATE,
  GATE_RADIUS, GATE_OFFSET_Z, GATE_SPREAD_X,
  GRACE_PERIOD, DEFAULT_BEHAVIOR,
  WOLF_PROWL_SPEED, WOLF_CHASE_SPEED, WOLF_CHASE_TRIGGER,
  WOLF_BITE_RADIUS, WOLF_BITE_COOLDOWN, WOLF_STUN_TIME,
  BARK_RADIUS, BARK_COOLDOWN, BARK_PUSHBACK,
  roundTime, roundSheepCount, roundWolfCount,
} from '../constants';
import type { Gate, NpcState, Sheep, Stick, Wolf } from '../types';
import type { NpcBehavior } from '../constants';

export interface GameRef {
  headPos: THREE.Vector3;
  headRot: number;
  sheep: Sheep[];
  chain: Sheep[];
  wolves: Wolf[];
  gates: Gate[];

  // Round + scoring
  round: number;
  time: number;
  timeLeft: number;
  score: number;
  combo: number;           // consecutive correct deliveries
  bestCombo: number;
  comboMult: number;       // 1..3
  gameOver: boolean;

  // Bark
  barkCooldown: number;
  barkRequested: boolean;  // edge-triggered: set by UI, consumed by loop
  barkFireT: number;       // d.time at most recent successful bark (for visual wave)
  barkFireX: number;
  barkFireZ: number;

  // Behavior selection (NPC AI mode)
  behavior: NpcBehavior;

  initialized: boolean;
}

export function createGameState(): GameRef {
  return {
    headPos: new THREE.Vector3(0, 0, 6),
    headRot: 0,
    sheep: [],
    chain: [],
    wolves: [],
    gates: [],
    round: 1,
    time: 0,
    timeLeft: roundTime(1),
    score: 0,
    combo: 0,
    bestCombo: 0,
    comboMult: 1,
    gameOver: false,
    barkCooldown: 0,
    barkRequested: false,
    barkFireT: -10,
    barkFireX: 0,
    barkFireZ: 0,
    behavior: DEFAULT_BEHAVIOR,
    initialized: false,
  };
}

let nextId = 1;
function newId() { return nextId++; }

function placeSheep(): THREE.Vector3 {
  for (let attempt = 0; attempt < 30; attempt++) {
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.sqrt(Math.random()) * (PLAYFIELD / 2 - 4);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r - 2;
    if (Math.abs(x) > PLAYFIELD / 2 - 2) continue;
    if (z < -PLAYFIELD / 2 + 4 || z > PLAYFIELD / 2 - 4) continue;
    // keep clear of gates
    if (z < GATE_OFFSET_Z + 4) continue;
    return new THREE.Vector3(x, 0, z);
  }
  return new THREE.Vector3(0, 0, 0);
}

function startRound(d: GameRef, round: number) {
  d.round = round;
  d.timeLeft = roundTime(round);
  d.time = 0;
  d.sheep = [];
  d.chain = [];
  d.wolves = [];

  // pick two distinct colors for the two gates
  const a = Math.floor(Math.random() * COLOR_TYPES);
  let b = Math.floor(Math.random() * (COLOR_TYPES - 1));
  if (b >= a) b += 1;
  const leftColor = a;
  const rightColor = b;

  d.gates = [
    { id: 'left',  position: new THREE.Vector3(-GATE_SPREAD_X, 0, GATE_OFFSET_Z), color: leftColor,  delivered: 0 },
    { id: 'right', position: new THREE.Vector3( GATE_SPREAD_X, 0, GATE_OFFSET_Z), color: rightColor, delivered: 0 },
  ];

  // spawn sheep — guarantee at least TARGET_PER_GATE of each gate color, plus distractors.
  const totalSheep = roundSheepCount(round);
  const minTargets = TARGET_PER_GATE;
  for (let i = 0; i < minTargets; i++) d.sheep.push(makeSheep(leftColor, placeSheep()));
  for (let i = 0; i < minTargets; i++) d.sheep.push(makeSheep(rightColor, placeSheep()));
  const remaining = totalSheep - 2 * minTargets;
  for (let i = 0; i < remaining; i++) {
    // distractors: bias toward target colors so the field doesn't feel sparse
    const r = Math.random();
    const c = r < 0.55
      ? (Math.random() < 0.5 ? leftColor : rightColor)
      : Math.floor(Math.random() * COLOR_TYPES);
    d.sheep.push(makeSheep(c, placeSheep()));
  }

  // spawn wolves on the perimeter
  const wolfN = roundWolfCount(round);
  for (let i = 0; i < wolfN; i++) {
    const a = (i / wolfN) * Math.PI * 2 + Math.random() * 0.4;
    const r = PLAYFIELD / 2 - 0.5;
    d.wolves.push({
      id: newId(),
      position: new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r),
      rotation: 0,
      state: 'prowl',
      stunT: 0,
      prowlAngle: a,
      biteCooldown: 0,
    });
  }

  // reset player
  d.headPos.set(0, 0, 8);
  d.headRot = 0;
}

function makeSheep(colorType: number, pos: THREE.Vector3): Sheep {
  return {
    id: newId(),
    position: pos.clone(),
    homePos: pos.clone(),
    rotation: Math.random() * Math.PI * 2,
    colorType,
    state: 'free' as NpcState,
    phase: Math.random() * Math.PI * 2,
    detachT: 0,
    wanderT: 0,
    wanderTarget: pos.clone(),
  };
}

export type SfxKey =
  | 'bleat_short' | 'bleat_chain' | 'bark'
  | 'deliver_good' | 'deliver_bad' | 'whistle'
  | 'wolf_growl' | 'wolf_hit'
  | 'combo_up' | 'round_clear' | 'round_fail';

export interface DeliveryInfo {
  sign: 1 | -1;
  gain: number;
  color: number;
  gate: 'left' | 'right';
  comboMult: number;
}

export interface GameLoopParams {
  state: React.MutableRefObject<GameRef>;
  playing: boolean;
  stick: Stick;
  onScore: (s: number) => void;
  onTime: (t: number) => void;
  onCombo: (combo: number, mult: number) => void;
  onDelivery: (info: DeliveryInfo) => void;
  onWolfHit: (count: number) => void;
  onRoundClear: (round: number) => void;
  onRoundFail: (finalScore: number) => void;
  onBarkUpdate: (cooldown: number) => void;
  playSfx: (key: SfxKey) => void;
  haptic?: (kind: 'light' | 'heavy') => void;
}

export function useGameLoop(p: GameLoopParams) {
  const { state, playing, stick, onScore, onTime, onCombo, onWolfHit,
          onRoundClear, onRoundFail, onBarkUpdate, playSfx, haptic } = p;

  if (!state.current.initialized) {
    startRound(state.current, 1);
    state.current.initialized = true;
  }

  useFrame((_, delta) => {
    const d = state.current;
    if (!playing || d.gameOver) return;
    const c = Math.min(delta, 0.05);

    d.time += c;
    d.timeLeft -= c;
    onTime(Math.max(0, d.timeLeft));

    if (d.barkCooldown > 0) {
      d.barkCooldown = Math.max(0, d.barkCooldown - c);
      onBarkUpdate(d.barkCooldown);
    }

    // ===== BARK handling (edge-triggered from UI) =====
    if (d.barkRequested) {
      d.barkRequested = false;
      if (d.barkCooldown <= 0) {
        d.barkCooldown = BARK_COOLDOWN;
        d.barkFireT = d.time;
        d.barkFireX = d.headPos.x;
        d.barkFireZ = d.headPos.z;
        onBarkUpdate(d.barkCooldown);
        playSfx('bark');
        haptic?.('heavy');
        for (const w of d.wolves) {
          const dx = w.position.x - d.headPos.x;
          const dz = w.position.z - d.headPos.z;
          const dist = Math.hypot(dx, dz);
          if (dist < BARK_RADIUS) {
            w.state = 'stunned';
            w.stunT = WOLF_STUN_TIME;
            // shove wolf outward from dog
            const nx = dist > 0.01 ? dx / dist : 1;
            const nz = dist > 0.01 ? dz / dist : 0;
            w.position.x += nx * BARK_PUSHBACK;
            w.position.z += nz * BARK_PUSHBACK;
            w.rotation = Math.atan2(nx, nz);
          }
        }
      }
    }

    // ===== PLAYER MOVEMENT =====
    const chainLen = d.chain.length;
    const factor = Math.max(MIN_SPEED_FACTOR, 1 - SPEED_DECAY * chainLen);
    const sp = PLAYER_SPEED * factor;
    if (stick.active) {
      const dir = new THREE.Vector3(stick.x, 0, stick.y);
      const m = dir.length();
      if (m > 0.1) {
        d.headPos.addScaledVector(dir, sp * c);
        d.headRot = Math.atan2(dir.x, dir.z);
      }
    }
    const halfX = PLAYFIELD / 2 - 1;
    const halfZ = PLAYFIELD / 2 - 1;
    if (d.headPos.x >  halfX) d.headPos.x =  halfX;
    if (d.headPos.x < -halfX) d.headPos.x = -halfX;
    if (d.headPos.z >  halfZ) d.headPos.z =  halfZ;
    if (d.headPos.z < -halfZ - 4) d.headPos.z = -halfZ - 4;

    // ===== CHAIN ATTRACTION =====
    if (d.time > 0.05) {
      for (const s of d.sheep) {
        if (s.state !== 'free') continue;
        const dx = s.position.x - d.headPos.x;
        const dz = s.position.z - d.headPos.z;
        if (dx * dx + dz * dz < ATTRACT_RADIUS * ATTRACT_RADIUS) {
          s.state = 'chain';
          s.detachT = 0;
          d.chain.push(s);
          playSfx('bleat_chain');
          haptic?.('light');
        }
      }
    }

    // ===== CHAIN FOLLOW =====
    d.chain.forEach((seg, i) => {
      const targetObj = i === 0 ? d.headPos : d.chain[i - 1].position;
      const diff = new THREE.Vector3().subVectors(targetObj, seg.position);
      diff.y = 0;
      const dist = diff.length();
      if (dist > 1.0) {
        diff.normalize();
        seg.position.addScaledVector(diff, BODY_FOLLOW_SPEED * c * Math.max(1, dist * 0.6));
        seg.rotation = Math.atan2(diff.x, diff.z);
      }
    });

    // ===== CHAIN DETACH if too far for too long =====
    for (let i = d.chain.length - 1; i >= 0; i--) {
      const seg = d.chain[i];
      const dx = seg.position.x - d.headPos.x;
      const dz = seg.position.z - d.headPos.z;
      const far = dx * dx + dz * dz > DETACH_RADIUS * DETACH_RADIUS;
      if (far) {
        seg.detachT += c;
        if (seg.detachT > DETACH_TIME) {
          seg.state = 'returning';
          seg.detachT = 0;
          d.chain.splice(i, 1);
        }
      } else {
        seg.detachT = Math.max(0, seg.detachT - c * 2);
      }
    }

    // ===== FREE / RETURNING SHEEP BEHAVIORS =====
    for (const s of d.sheep) {
      if (s.state === 'free') freeBehavior(s, c, d);
      else if (s.state === 'returning') {
        const dx = s.homePos.x - s.position.x;
        const dz = s.homePos.z - s.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.2) {
          s.state = 'free';
          s.detachT = 0;
        } else {
          const nx = dx / dist, nz = dz / dist;
          s.position.x += nx * 2.4 * c;
          s.position.z += nz * 2.4 * c;
          s.rotation = Math.atan2(nx, nz);
        }
      }
    }

    // ===== WOLF AI =====
    if (d.time > GRACE_PERIOD) {
      for (const w of d.wolves) {
        if (w.biteCooldown > 0) w.biteCooldown = Math.max(0, w.biteCooldown - c);
        if (w.state === 'stunned') {
          w.stunT -= c;
          if (w.stunT <= 0) w.state = 'prowl';
          continue;
        }
        const dx = d.headPos.x - w.position.x;
        const dz = d.headPos.z - w.position.z;
        const distToDog = Math.hypot(dx, dz);
        // chase trigger only if player has chain (otherwise wolves wander harmlessly)
        if (d.chain.length > 0 && distToDog < WOLF_CHASE_TRIGGER) {
          w.state = 'chase';
        } else {
          w.state = 'prowl';
        }
        if (w.state === 'prowl') {
          // walk along perimeter — increment angle, position at fixed radius.
          w.prowlAngle += (WOLF_PROWL_SPEED / (PLAYFIELD / 2)) * c;
          const r = PLAYFIELD / 2 - 0.5;
          const tx = Math.cos(w.prowlAngle) * r;
          const tz = Math.sin(w.prowlAngle) * r;
          // ease toward the perimeter target
          w.position.x += (tx - w.position.x) * 1.4 * c;
          w.position.z += (tz - w.position.z) * 1.4 * c;
          const hdx = tx - w.position.x;
          const hdz = tz - w.position.z;
          w.rotation = Math.atan2(hdx, hdz);
        } else if (w.state === 'chase') {
          if (distToDog > 0.01) {
            const nx = dx / distToDog;
            const nz = dz / distToDog;
            w.position.x += nx * WOLF_CHASE_SPEED * c;
            w.position.z += nz * WOLF_CHASE_SPEED * c;
            w.rotation = Math.atan2(nx, nz);
          }
        }
      }
    }

    // ===== WOLF BITE — break the back half of the chain on contact =====
    if (d.time > GRACE_PERIOD) {
      for (const w of d.wolves) {
        if (w.state === 'stunned' || w.biteCooldown > 0) continue;
        // wolf doesn't snap at the dog — it's the chain it goes for
        for (let i = 0; i < d.chain.length; i++) {
          const seg = d.chain[i];
          const dx = seg.position.x - w.position.x;
          const dz = seg.position.z - w.position.z;
          if (dx * dx + dz * dz < WOLF_BITE_RADIUS * WOLF_BITE_RADIUS) {
            // scatter from index i onward (back half) — they flee home
            const lost = d.chain.splice(i);
            for (const s of lost) {
              s.state = 'returning';
              s.detachT = 0;
              // give them a kick away from the wolf
              const ldx = s.position.x - w.position.x;
              const ldz = s.position.z - w.position.z;
              const ld = Math.hypot(ldx, ldz);
              if (ld > 0.01) {
                s.position.x += (ldx / ld) * 1.5;
                s.position.z += (ldz / ld) * 1.5;
              }
            }
            w.biteCooldown = WOLF_BITE_COOLDOWN;
            // wolf retreats slightly so it doesn't camp the chain
            w.state = 'prowl';
            w.position.x -= (dx / Math.max(0.01, Math.hypot(dx, dz))) * 2.5;
            w.position.z -= (dz / Math.max(0.01, Math.hypot(dx, dz))) * 2.5;
            // reset combo on hit
            d.combo = 0;
            d.comboMult = 1;
            onCombo(0, 1);
            onWolfHit(lost.length);
            playSfx('wolf_hit');
            haptic?.('heavy');
            break;
          }
        }
      }
    }

    // ===== GATE DELIVERY =====
    for (const g of d.gates) {
      for (let i = d.chain.length - 1; i >= 0; i--) {
        const seg = d.chain[i];
        const dx = seg.position.x - g.position.x;
        const dz = seg.position.z - g.position.z;
        if (dx * dx + dz * dz < GATE_RADIUS * GATE_RADIUS) {
          deliverOne(d, seg, g, p);
          d.chain.splice(i, 1);
          const sidx = d.sheep.indexOf(seg);
          if (sidx >= 0) d.sheep.splice(sidx, 1);
        }
      }
    }

    // ===== ROUND CLEAR / FAIL =====
    const leftDone = d.gates[0].delivered >= TARGET_PER_GATE;
    const rightDone = d.gates[1].delivered >= TARGET_PER_GATE;
    if (leftDone && rightDone) {
      const bonus = Math.round(Math.max(0, d.timeLeft));
      d.score += bonus;
      onScore(d.score);
      playSfx('round_clear');
      haptic?.('heavy');
      onRoundClear(d.round);
      startRound(d, d.round + 1);
    } else if (d.timeLeft <= 0 && d.time > GRACE_PERIOD) {
      d.gameOver = true;
      playSfx('round_fail');
      haptic?.('heavy');
      onRoundFail(d.score);
    }
  });
}

function deliverOne(d: GameRef, seg: Sheep, gate: Gate, p: GameLoopParams) {
  const correct = seg.colorType === gate.color;
  if (correct) {
    d.combo += 1;
    if (d.combo > d.bestCombo) d.bestCombo = d.combo;
    const newMult = Math.min(COMBO_MAX_MULT, 1 + Math.floor(d.combo / 3));
    const tier = newMult > d.comboMult;
    d.comboMult = newMult;
    const gain = CORRECT_SCORE * d.comboMult;
    d.score += gain;
    gate.delivered += 1;
    p.onScore(d.score);
    p.onCombo(d.combo, d.comboMult);
    p.onDelivery({ sign: 1, gain, color: seg.colorType, gate: gate.id, comboMult: d.comboMult });
    p.playSfx(tier ? 'combo_up' : 'deliver_good');
    p.haptic?.('light');
  } else {
    d.combo = 0;
    d.comboMult = 1;
    d.score = Math.max(0, d.score + WRONG_SCORE);
    p.onScore(d.score);
    p.onCombo(0, 1);
    p.onDelivery({ sign: -1, gain: WRONG_SCORE, color: seg.colorType, gate: gate.id, comboMult: 1 });
    p.playSfx('deliver_bad');
    p.haptic?.('heavy');
  }
}

function freeBehavior(s: Sheep, c: number, d: GameRef) {
  s.phase += c * 1.2;
  if (d.behavior === 'static') {
    const dx = s.homePos.x - s.position.x;
    const dz = s.homePos.z - s.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      s.position.x += dx * 0.05 * 60 * c;
      s.position.z += dz * 0.05 * 60 * c;
    }
    return;
  }
  if (d.behavior === 'wander') {
    s.wanderT -= c;
    if (s.wanderT <= 0) {
      s.wanderT = 1.6 + Math.random() * 2.4;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.8;
      s.wanderTarget.set(
        s.homePos.x + Math.cos(a) * r,
        0,
        s.homePos.z + Math.sin(a) * r,
      );
    }
    const dx = s.wanderTarget.x - s.position.x;
    const dz = s.wanderTarget.z - s.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      const nx = dx / dist, nz = dz / dist;
      s.position.x += nx * 0.8 * c;
      s.position.z += nz * 0.8 * c;
      s.rotation = Math.atan2(nx, nz);
    }
    return;
  }
  // flock: drift toward centroid of same-color free neighbors
  let cx = 0, cz = 0, cnt = 0;
  for (const o of d.sheep) {
    if (o === s || o.state !== 'free' || o.colorType !== s.colorType) continue;
    const dx = o.position.x - s.position.x;
    const dz = o.position.z - s.position.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < 6 * 6) { cx += o.position.x; cz += o.position.z; cnt++; }
  }
  let tx = s.position.x + Math.cos(s.phase * 0.4 + s.homePos.x * 0.4) * 1.0;
  let tz = s.position.z + Math.sin(s.phase * 0.4 + s.homePos.z * 0.4) * 1.0;
  if (cnt > 0) {
    tx = (cx / cnt + s.homePos.x) / 2;
    tz = (cz / cnt + s.homePos.z) / 2;
  }
  s.position.x += (tx - s.position.x) * 0.8 * c;
  s.position.z += (tz - s.position.z) * 0.8 * c;
}
