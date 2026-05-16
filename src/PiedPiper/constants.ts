// Pied Piper — Sheepdog theme constants.
// Built on the Penguin Rescue engine.

export const PLAYFIELD = 36;             // wider field for more breathing room
export const PLAYER_SPEED = 12;
export const SPEED_DECAY = 0.025;
export const MIN_SPEED_FACTOR = 0.36;
export const BODY_FOLLOW_SPEED = 3.2;

export const ATTRACT_RADIUS = 4.2;
export const DETACH_RADIUS = 9.0;
export const DETACH_TIME = 2.8;

// Round timing — scaled with round number in useGameLoop.
export const BASE_ROUND_TIME = 70;       // seconds for round 1
export const ROUND_TIME_BONUS = 5;       // +N seconds per round, capped
export const ROUND_TIME_CAP_INCS = 4;    // stops scaling after this many rounds
export const CORRECT_SCORE = 10;
export const WRONG_SCORE = -5;
export const COMBO_MAX_MULT = 3;

// Each round picks 2 colors out of this pool and assigns one to each gate.
export const COLOR_TYPES = 4;
export const TARGET_PER_GATE = 3;        // need 3 of each color → 6 deliveries per round

// Field NPC counts per round, scaled with round number.
export const NPC_BASE_COUNT = 12;        // round 1
export const NPC_PER_ROUND_BONUS = 1;    // +N per round, capped
export const NPC_COUNT_CAP = 18;

// Wolves spawn count per round.
export const WOLF_BASE_COUNT = 1;
export const WOLF_PER_ROUND_BONUS_EVERY = 2;  // +1 wolf every N rounds
export const WOLF_CAP = 3;

// Wolf AI
export const WOLF_PROWL_SPEED = 2.2;
export const WOLF_CHASE_SPEED = 4.6;
export const WOLF_CHASE_TRIGGER = 13;    // dog distance triggers chase
export const WOLF_BITE_RADIUS = 1.4;     // distance for chain hit
export const WOLF_BITE_COOLDOWN = 2.0;   // s before wolf can bite again
export const WOLF_STUN_TIME = 2.8;       // s frozen after bark

// Bark
export const BARK_RADIUS = 8.5;
export const BARK_COOLDOWN = 4.0;
export const BARK_PUSHBACK = 5;          // units shoved away

export const GATE_RADIUS = 2.8;
export const GATE_OFFSET_Z = -14;
export const GATE_SPREAD_X = 10;

export const GRACE_PERIOD = 1.5;

// Camera — identical setup to Penguin Rescue.
export const CAMERA_POS: [number, number, number] = [0, 22, 9.4];
export const CAMERA_FOV = 50;

export const DYE_PALETTE = [
  '#d8453e', // red
  '#3d7ad2', // blue
  '#e8c54a', // yellow
  '#4faa5b', // green
];

export const DYE_NAME = ['Red', 'Blue', 'Yellow', 'Green'];

export type NpcBehavior = 'static' | 'wander' | 'flock';
export const DEFAULT_BEHAVIOR: NpcBehavior = 'wander';

export function roundTime(round: number): number {
  return BASE_ROUND_TIME + ROUND_TIME_BONUS * Math.min(round - 1, ROUND_TIME_CAP_INCS);
}
export function roundSheepCount(round: number): number {
  return Math.min(NPC_COUNT_CAP, NPC_BASE_COUNT + NPC_PER_ROUND_BONUS * (round - 1));
}
export function roundWolfCount(round: number): number {
  return Math.min(WOLF_CAP, WOLF_BASE_COUNT + Math.floor((round - 1) / WOLF_PER_ROUND_BONUS_EVERY));
}
