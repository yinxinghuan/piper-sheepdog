type Locale = 'zh' | 'en';

function detectLocale(): Locale {
  const override = localStorage.getItem('game_locale');
  if (override === 'en' || override === 'zh') return override;
  return 'en';
}

const dict: Record<Locale, Record<string, string>> = {
  zh: {
    title: 'Pied Piper',
    subtitle: '在牧场上吹起口哨，把同色的羊带进对的圈门。',
    tap_to_start: '吹响口哨',
    again: '再来一局',
    score: '得分',
    high: '最高',
    round: '第 {n} 关',
    target: '把 {n} 只 {color} 羊送到 {gate} 圈门',
    gate_left: '左',
    gate_right: '右',
    time_up: '时间到',
    round_clear: '通关',
    leaderboard: '排行榜',
    loading: '加载中…',
    behavior_static: '羊群：静止',
    behavior_wander: '羊群：游荡',
    behavior_flock: '羊群：成群',
  },
  en: {
    title: 'Pied Piper',
    subtitle: 'WHISTLE UP THE CHAIN · DELIVER THE RIGHT COLOR',
    tap_to_start: 'Start whistling',
    again: 'Try again',
    score: 'Score',
    high: 'Best',
    round: 'Round {n}',
    target: 'Bring {n} {color} sheep to the {gate} pen',
    gate_left: 'LEFT',
    gate_right: 'RIGHT',
    time_up: "Time's up",
    round_clear: 'Round clear',
    leaderboard: 'Leaderboard',
    loading: 'Loading…',
    behavior_static: 'Sheep: still',
    behavior_wander: 'Sheep: wander',
    behavior_flock: 'Sheep: flock',
  },
};

let cur: Locale = detectLocale();

export function setLocale(l: Locale) {
  cur = l;
  localStorage.setItem('game_locale', l);
}

export function t(key: string, vars?: { n?: number | string; color?: string; gate?: string }): string {
  const raw = dict[cur][key] ?? dict.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String((vars as any)[k] ?? ''));
}

export function getLocale(): Locale { return cur; }
