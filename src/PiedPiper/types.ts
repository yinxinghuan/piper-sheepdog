import * as THREE from 'three';

export type Phase = 'splash' | 'playing' | 'gameover';

export interface Stick {
  active: boolean;
  x: number;
  y: number;
}

export type NpcState = 'free' | 'chain' | 'returning';

export interface Sheep {
  id: number;
  position: THREE.Vector3;
  homePos: THREE.Vector3;
  rotation: number;
  colorType: number;
  state: NpcState;
  phase: number;
  detachT: number;
  wanderT: number;
  wanderTarget: THREE.Vector3;
}

export type WolfState = 'prowl' | 'chase' | 'stunned';

export interface Wolf {
  id: number;
  position: THREE.Vector3;
  rotation: number;
  state: WolfState;
  stunT: number;
  prowlAngle: number;       // 0..2π — heading around the perimeter
  biteCooldown: number;
}

export interface Gate {
  id: 'left' | 'right';
  position: THREE.Vector3;
  color: number;            // dye color required at this gate this round
  delivered: number;        // count of correct deliveries this round
}

export interface RoundTarget {
  leftColor: number;
  rightColor: number;
  countPerGate: number;
}
