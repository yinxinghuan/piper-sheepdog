// Per-round atmospheric presets. Cycled by `(round - 1) % len`. Each preset
// drives lights, fog, and ground tints in Scene.tsx, plus an optional extra
// (fireflies / mist / etc).

export type EnvironmentExtra = 'fireflies' | 'mist' | null;

export interface EnvironmentPreset {
  id: 'noon' | 'golden' | 'dusk' | 'night';
  name: string;                 // shown on the round-clear banner ("DUSK")
  ambient: { color: string; intensity: number };
  directional: { color: string; intensity: number; position: [number, number, number] };
  hemisphere: { sky: string; ground: string; intensity: number };
  fog: { color: string; near: number; far: number };
  pasture: { outerBg: string; outerRing: string; main: string; inner: string; tuft: string };
  pollenColor: string;          // ambient particle tint
  extra: EnvironmentExtra;
}

export const ENVIRONMENTS: EnvironmentPreset[] = [
  {
    id: 'noon',
    name: 'NOON',
    ambient: { color: '#ffffff', intensity: 0.6 },
    directional: { color: '#fff4d8', intensity: 1.55, position: [18, 38, 8] },
    hemisphere: { sky: '#c3e0a2', ground: '#5a6948', intensity: 0.42 },
    fog: { color: '#bcd2a8', near: 36, far: 82 },
    pasture: {
      outerBg:   '#5d7548',
      outerRing: '#43592f',
      main:      '#7a9462',
      inner:     '#8aa471',
      tuft:      '#5d7548',
    },
    pollenColor: '#fff8d0',
    extra: null,
  },
  {
    id: 'golden',
    name: 'GOLDEN HOUR',
    ambient: { color: '#ffd28a', intensity: 0.55 },
    directional: { color: '#ffa86a', intensity: 1.65, position: [-22, 22, 10] },
    hemisphere: { sky: '#f4c084', ground: '#3a3024', intensity: 0.45 },
    fog: { color: '#d8a874', near: 30, far: 78 },
    pasture: {
      outerBg:   '#6c6238',
      outerRing: '#4a3f22',
      main:      '#9a8c4e',
      inner:     '#b09a55',
      tuft:      '#6c6238',
    },
    pollenColor: '#fff0c0',
    extra: null,
  },
  {
    id: 'dusk',
    name: 'DUSK',
    ambient: { color: '#a09cd0', intensity: 0.45 },
    directional: { color: '#ff6f5c', intensity: 0.95, position: [-26, 12, -6] },
    hemisphere: { sky: '#8a7eb2', ground: '#1c2236', intensity: 0.5 },
    fog: { color: '#5a4e7a', near: 22, far: 66 },
    pasture: {
      outerBg:   '#3e3b58',
      outerRing: '#262538',
      main:      '#525574',
      inner:     '#6a6c8e',
      tuft:      '#3e3b58',
    },
    pollenColor: '#ffd1a0',
    extra: 'mist',
  },
  {
    id: 'night',
    name: 'NIGHT',
    ambient: { color: '#7a8cb0', intensity: 0.32 },
    directional: { color: '#b8c8ff', intensity: 0.75, position: [12, 28, -10] },
    hemisphere: { sky: '#3a4870', ground: '#0e131c', intensity: 0.35 },
    fog: { color: '#1c2336', near: 18, far: 56 },
    pasture: {
      outerBg:   '#1d2a36',
      outerRing: '#101620',
      main:      '#2e3e4e',
      inner:     '#3c4e60',
      tuft:      '#243240',
    },
    pollenColor: '#cfe0ff',
    extra: 'fireflies',
  },
];

export function envForRound(round: number): EnvironmentPreset {
  return ENVIRONMENTS[(round - 1) % ENVIRONMENTS.length];
}

export function nextEnvForRound(round: number): EnvironmentPreset {
  return envForRound(round + 1);
}
