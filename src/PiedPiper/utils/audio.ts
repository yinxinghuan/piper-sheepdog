// Lightweight Web Audio engine: procedural SFX + procedural BGM swell.
// Procedural keeps the bundle small and avoids licensing concerns. Calls are
// no-op before the first user gesture (browsers require interaction).

type SfxKey =
  | 'bleat_short' | 'bleat_chain' | 'bark'
  | 'deliver_good' | 'deliver_bad' | 'whistle'
  | 'wolf_growl' | 'wolf_hit'
  | 'combo_up' | 'round_clear' | 'round_fail';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bgmGain: GainNode | null = null;
let bgmTimer: number | null = null;
let bgmWanderId: number | null = null;
// (was: bgmNodes for the old drone-style BGM; new BGM is stateless one-shot notes)

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  return ctx;
}

export async function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') await c.resume();
}

function envelope(node: GainNode, peak: number, attack: number, decay: number, t0: number) {
  node.gain.setValueAtTime(0, t0);
  node.gain.linearRampToValueAtTime(peak, t0 + attack);
  node.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

function tone(freq: number, type: OscillatorType, dur: number, peak: number, t0: number, glideTo?: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t0 + dur);
  envelope(g, peak, 0.01, dur, t0);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, peak: number, t0: number, lp = 2000) {
  if (!ctx || !master) return;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = lp;
  const g = ctx.createGain();
  envelope(g, peak, 0.005, dur, t0);
  src.connect(filt).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

export function playSfx(key: SfxKey) {
  const c = ensureCtx();
  if (!c || !master) return;
  if (c.state === 'suspended') c.resume();
  const t = c.currentTime;
  switch (key) {
    case 'bleat_short':
      // soft sheep bleat
      tone(420, 'sawtooth', 0.16, 0.14, t, 300);
      tone(610, 'triangle', 0.10, 0.08, t + 0.04, 420);
      break;
    case 'bleat_chain':
      // happier bleat with a rising flick when a sheep joins the chain
      tone(540, 'square', 0.10, 0.16, t, 720);
      tone(820, 'triangle', 0.08, 0.10, t + 0.06, 1000);
      break;
    case 'bark':
      // Procedural dog bark — sawtooth glide through a throat bandpass plus
      // noise burst gives that "WOOF" character. Two barks 130ms apart.
      dogWoof(t + 0.00);
      dogWoof(t + 0.13);
      break;
    case 'wolf_growl':
      tone(160, 'sawtooth', 0.30, 0.22, t, 100);
      noise(0.25, 0.10, t, 700);
      break;
    case 'wolf_hit':
      // sharper than a wrong-delivery thud — a wolf-bite snarl
      tone(220, 'sawtooth', 0.20, 0.30, t, 80);
      tone(140, 'sawtooth', 0.18, 0.22, t + 0.05, 60);
      noise(0.25, 0.18, t, 1100);
      break;
    case 'combo_up':
      // ascending triple-note — combo tier up
      tone(880, 'triangle', 0.10, 0.20, t,        1100);
      tone(1320,'triangle', 0.10, 0.22, t + 0.08, 1600);
      tone(1760,'triangle', 0.16, 0.24, t + 0.16, 2200);
      break;
    case 'whistle':
      tone(1400, 'sine', 0.18, 0.18, t, 2200);
      tone(1900, 'sine', 0.12, 0.10, t + 0.10, 2400);
      break;
    case 'deliver_good':
      // bright two-note chime — successful delivery
      tone(880, 'triangle', 0.12, 0.22, t,        1100);
      tone(1320, 'triangle', 0.18, 0.20, t + 0.10, 1500);
      break;
    case 'deliver_bad':
      // dull thud for wrong-color or wrong-gate delivery
      tone(180, 'sine',  0.22, 0.30, t, 60);
      noise(0.18, 0.16, t, 900);
      break;
    case 'round_clear':
      // fanfare arpeggio
      tone(660, 'triangle', 0.18, 0.24, t,           880);
      tone(990, 'triangle', 0.18, 0.24, t + 0.14,   1320);
      tone(1320,'triangle', 0.24, 0.24, t + 0.28,   1760);
      break;
    case 'round_fail':
      tone(660, 'triangle', 0.30, 0.22, t,          440);
      tone(440, 'triangle', 0.30, 0.22, t + 0.20,   330);
      tone(330, 'triangle', 0.45, 0.22, t + 0.40,   180);
      break;
  }
}

// One realistic-ish dog bark — saw-glide body + bandpass formant + noise burst.
function dogWoof(t: number) {
  if (!ctx || !master) return;
  // randomize within a small range so consecutive barks aren't identical
  const startF = 620 + Math.random() * 140;     // 620..760 Hz
  const endF   = 130 + Math.random() *  50;     // 130..180 Hz
  const dur    = 0.18 + Math.random() * 0.04;   // 0.18..0.22 s

  // body — sawtooth glide
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(startF, t);
  osc.frequency.exponentialRampToValueAtTime(endF, t + dur * 0.6);
  // throat bandpass — pitch-sweeping formant
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.Q.value = 2.6;
  filt.frequency.setValueAtTime(1400, t);
  filt.frequency.exponentialRampToValueAtTime(720, t + dur * 0.8);
  // amplitude envelope — sharp attack, exponential decay
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.48, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  osc.connect(filt).connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);

  // breath / chest noise — gives the bark its "rasp"
  const nBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * (dur + 0.05)), ctx.sampleRate);
  const data = nBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const nSrc = ctx.createBufferSource();
  nSrc.buffer = nBuf;
  const nFilt = ctx.createBiquadFilter();
  nFilt.type = 'bandpass';
  nFilt.Q.value = 1.6;
  nFilt.frequency.value = 2200;
  const nG = ctx.createGain();
  nG.gain.setValueAtTime(0, t);
  nG.gain.linearRampToValueAtTime(0.16, t + 0.005);
  nG.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);
  nSrc.connect(nFilt).connect(nG).connect(master);
  nSrc.start(t);
  nSrc.stop(t + dur + 0.06);

  // sub kick — a tiny low-thump under the bark gives it some weight
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(160, t);
  sub.frequency.exponentialRampToValueAtTime(60, t + 0.10);
  const sG = ctx.createGain();
  sG.gain.setValueAtTime(0, t);
  sG.gain.linearRampToValueAtTime(0.20, t + 0.004);
  sG.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
  sub.connect(sG).connect(master);
  sub.start(t);
  sub.stop(t + 0.14);
}

// BGM — bright pentatonic folk loop. Triangle melody over a simple sine bass
// pulse on the downbeat. Keeps the field feeling alive without droning.
let bgmRunning = false;
let bgmNextNoteT = 0;
let bgmStep = 0;
let bgmPeak = 0.045;

// Major pentatonic melody in C (semitones above C5).
// 16-step phrase, repeats. Triangle wave gives a soft folk-flute timbre.
const PHRASE_MELODY = [0, 4, 7, 4,    9, 7, 4, 2,    0, 4, 7, 9,    7, 4, 2, 0];
const PHRASE_LEN = 16;
const BPM = 112;
const STEP_T = 60 / BPM / 2; // 8th-notes ≈ 0.27s

function midi(sm: number, rootMidi = 72): number {
  // rootMidi 72 = C5
  return 440 * Math.pow(2, (rootMidi + sm - 69) / 12);
}

function pluckNote(freq: number, t: number, dur: number, vol: number) {
  if (!ctx || !master || !bgmGain) return;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(bgmGain);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function bassNote(freq: number, t: number, dur: number, vol: number) {
  if (!ctx || !master || !bgmGain) return;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
  o.connect(g).connect(bgmGain);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Schedule a window of notes ahead of the current time so the loop sounds
// rhythmically tight regardless of timer jitter.
function scheduleBgmAhead() {
  if (!ctx || !bgmRunning) return;
  const horizon = ctx.currentTime + 0.5;
  while (bgmNextNoteT < horizon) {
    const stepIx = bgmStep % PHRASE_LEN;
    // melody — sometimes drop a beat to give the phrase air
    if (stepIx !== 3 && stepIx !== 11) {
      const sm = PHRASE_MELODY[stepIx];
      pluckNote(midi(sm), bgmNextNoteT, STEP_T * 1.4, bgmPeak * 0.95);
      // soft octave-up echo to brighten
      if (stepIx % 4 === 0) {
        pluckNote(midi(sm + 12), bgmNextNoteT, STEP_T * 0.6, bgmPeak * 0.40);
      }
    }
    // bass — pulse on beats 1, 5, 9, 13 of the phrase
    if (stepIx % 4 === 0) {
      const root = stepIx < 8 ? 0 : 5;   // I → IV over 8 beats
      bassNote(midi(root, 48), bgmNextNoteT, STEP_T * 3.4, bgmPeak * 0.8);
    }
    bgmNextNoteT += STEP_T;
    bgmStep++;
  }
}

export function startBgm(volume = 0.045) {
  const c = ensureCtx();
  if (!c || !master) return;
  if (c.state === 'suspended') c.resume();
  stopBgm();

  bgmGain = c.createGain();
  bgmGain.gain.value = 0;
  bgmGain.connect(master);
  // fade in over 1.5s
  bgmGain.gain.linearRampToValueAtTime(volume, c.currentTime + 1.5);

  bgmPeak = volume;
  bgmRunning = true;
  bgmStep = 0;
  bgmNextNoteT = c.currentTime + 0.05;

  // scheduling loop: every 250ms top up the look-ahead buffer.
  bgmTimer = window.setInterval(() => scheduleBgmAhead(), 250) as unknown as number;
  scheduleBgmAhead();
}

export function stopBgm() {
  bgmRunning = false;
  if (bgmTimer !== null) { window.clearInterval(bgmTimer); bgmTimer = null; }
  if (bgmWanderId !== null) { window.clearInterval(bgmWanderId); bgmWanderId = null; }
  if (bgmGain && ctx) {
    bgmGain.gain.cancelScheduledValues(ctx.currentTime);
    bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    const g = bgmGain;
    setTimeout(() => {
      g.disconnect();
    }, 700);
    bgmGain = null;
  }
}
