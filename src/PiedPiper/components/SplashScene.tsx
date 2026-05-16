// Pure SVG/CSS splash. No 3D canvas. Two-layer pastoral hill scene with
// barn, tree clumps, sheep flock, and a sheepdog. Execution refined: better
// curves, larger characters, layered foliage, proper barn proportions,
// atmospheric perspective.
import { useState } from 'react';
import { t } from '../i18n';

interface Puff {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

export function SplashScene({ onStart, highScore }: { onStart: () => void; highScore: number }) {
  const [puffs] = useState<Puff[]>(() =>
    Array.from({ length: 42 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: -Math.random() * 18,
      duration: 13 + Math.random() * 12,
      size: 5 + Math.random() * 9,
    }))
  );

  return (
    <div className="pp-splash">
      <div className="pp-splash__sky" />
      <div className="pp-splash__sun" />

      <div className="pp-splash__pollen">
        {puffs.map(f => (
          <div
            key={f.id}
            className="pp-splash__puff"
            style={{
              left: `${f.x}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.duration}s`,
            }}
          />
        ))}
      </div>

      {/* pasture plane — equivalent to PR's ice plane */}
      <div className="pp-splash__pasture" />

      {/* back hill — atmospheric layer, slow horizontal drift */}
      <div className="pp-splash__hills pp-splash__hills--back">
        <svg viewBox="0 0 1600 240" preserveAspectRatio="none" width="200%" height="100%">
          <defs>
            <linearGradient id="back-hill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6b8556" stopOpacity=".85" />
              <stop offset="100%" stopColor="#4a6440" stopOpacity=".95" />
            </linearGradient>
          </defs>
          <path
            d="M0,240 C160,140 320,160 480,150 C640,140 760,170 920,148 C1080,128 1220,170 1380,150 C1480,140 1560,160 1600,158 L1600,240 Z"
            fill="url(#back-hill)"
          />
        </svg>
      </div>

      {/* front hill + props */}
      <div className="pp-splash__hills pp-splash__hills--front">
        <svg viewBox="0 0 800 280" preserveAspectRatio="xMidYMax meet" width="100%" height="100%">
          <defs>
            <linearGradient id="front-hill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"  stopColor="#5e8348" />
              <stop offset="55%" stopColor="#456832" />
              <stop offset="100%" stopColor="#2f4d22" />
            </linearGradient>
            <linearGradient id="hill-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a4422" stopOpacity=".55" />
              <stop offset="100%" stopColor="#1a2e14" stopOpacity=".75" />
            </linearGradient>
            <linearGradient id="barn-wall" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7d6444" />
              <stop offset="100%" stopColor="#523c24" />
            </linearGradient>
            <linearGradient id="barn-roof" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#52453a" />
              <stop offset="100%" stopColor="#2c2520" />
            </linearGradient>
          </defs>

          {/* hill silhouette — gentle undulation, two layers for depth */}
          <path
            d="M0,280 C140,210 240,225 360,210 C500,193 620,222 800,212 L800,280 Z"
            fill="url(#hill-shadow)"
          />
          <path
            d="M0,280 C140,196 240,212 360,196 C500,178 620,212 800,202 L800,280 Z"
            fill="url(#front-hill)"
          />

          {/* far-left tree clump — three layered crowns with a trunk */}
          <g transform="translate(96,182)">
            {/* cast shadow on hill */}
            <ellipse cx="6" cy="38" rx="48" ry="6" fill="#1a2e14" opacity=".5" />
            {/* trunk */}
            <rect x="-4" y="0" width="10" height="22" fill="#3a2410" />
            {/* foliage — darker base, midtone, highlight cluster */}
            <ellipse cx="-22" cy="-2" rx="22" ry="20" fill="#243f1c" />
            <ellipse cx="22" cy="-4"  rx="24" ry="22" fill="#365a28" />
            <ellipse cx="0"  cy="-18" rx="26" ry="22" fill="#446e30" />
            <ellipse cx="14" cy="-22" rx="14" ry="12" fill="#5d8d3e" opacity=".85" />
          </g>

          {/* mid-right tree clump — smaller, sits lower on the hill */}
          <g transform="translate(710,196)">
            <ellipse cx="0" cy="36" rx="42" ry="5" fill="#1a2e14" opacity=".5" />
            <rect x="-4" y="0" width="8" height="20" fill="#3a2410" />
            <ellipse cx="-18" cy="-2" rx="20" ry="18" fill="#243f1c" />
            <ellipse cx="18"  cy="-4" rx="22" ry="20" fill="#365a28" />
            <ellipse cx="0"   cy="-16" rx="22" ry="20" fill="#446e30" />
          </g>

          {/* barn — proper gable, planks, hayloft window, ground shadow */}
          <g transform="translate(545,138)">
            {/* ground shadow */}
            <ellipse cx="0" cy="92" rx="78" ry="8" fill="#1a2e14" opacity=".55" />
            {/* walls */}
            <rect x="-60" y="22" width="120" height="68" fill="url(#barn-wall)" />
            {/* corner trim */}
            <rect x="-62" y="22" width="4" height="68" fill="#332010" />
            <rect x="58"  y="22" width="4" height="68" fill="#332010" />
            {/* gable roof — two slopes meeting at a ridge */}
            <polygon points="-68,22 0,-18 68,22" fill="url(#barn-roof)" />
            {/* roof underside / fascia */}
            <rect x="-68" y="20" width="136" height="5" fill="#1d1814" />
            {/* ridge cap */}
            <rect x="-66" y="-20" width="132" height="3" fill="#0e0a08" />
            {/* big front door */}
            <rect x="-15" y="50" width="30" height="40" fill="#1d130a" />
            <rect x="-15" y="50" width="30" height="3" fill="#0e0805" />
            <rect x="-1" y="50" width="2" height="40" fill="#3a2918" />
            {/* hayloft window in gable */}
            <rect x="-9" y="0" width="18" height="14" fill="#1d130a" />
            <rect x="-9" y="6" width="18" height="2" fill="#d6cda8" />
            <rect x="-1" y="0" width="2" height="14" fill="#d6cda8" />
            {/* vertical plank seams across the wall */}
            {[-46, -32, -18, -4, 10, 24, 38, 50].map((px, i) => (
              <rect key={i} x={px - 1} y="22" width="1.5" height="68" fill="#332010" opacity=".55" />
            ))}
          </g>

          {/* sheep flock — 5 sheep, grouped near the center, sized for read */}
          {[
            { x: 260, y: 230, s: 1.0 },
            { x: 300, y: 234, s: 0.95 },
            { x: 340, y: 232, s: 1.05 },
            { x: 380, y: 236, s: 0.92 },
            { x: 220, y: 234, s: 0.88 },
          ].map((sh, i) => (
            <g key={i} transform={`translate(${sh.x},${sh.y}) scale(${sh.s})`}>
              {/* shadow under hoof */}
              <ellipse cx="0" cy="11" rx="16" ry="3" fill="#1a2e14" opacity=".45" />
              {/* fluffy wool body — cloud-of-bumps silhouette */}
              <g fill="#f6efdc">
                <ellipse cx="-7" cy="-3" rx="9" ry="7" />
                <ellipse cx="0"  cy="-5" rx="9" ry="7.5" />
                <ellipse cx="8"  cy="-3" rx="9" ry="7" />
                <ellipse cx="-3" cy="2"  rx="11" ry="6" />
                <ellipse cx="6"  cy="2"  rx="10" ry="6" />
              </g>
              {/* dye patch — neutral cream tone so colors stay reserved for gameplay */}
              <ellipse cx="-2" cy="-2" rx="5" ry="3.5" fill="#dfd1a8" />
              {/* head */}
              <ellipse cx="13" cy="-2" rx="5.5" ry="4.5" fill="#2a1f1a" />
              {/* ear */}
              <polygon points="11,-7 9,-3 14,-5" fill="#2a1f1a" />
              {/* eye glint */}
              <circle cx="15" cy="-3" r="1.1" fill="#fff" />
              {/* tiny feet */}
              <rect x="-5" y="7" width="2.4" height="4" fill="#2a1f1a" />
              <rect x="3"  y="7" width="2.4" height="4" fill="#2a1f1a" />
            </g>
          ))}

          {/* sheepdog — biggest single character, front-and-center hero */}
          <g transform="translate(140,236)">
            {/* shadow */}
            <ellipse cx="2" cy="14" rx="28" ry="4.5" fill="#1a2e14" opacity=".55" />
            {/* body — black */}
            <ellipse cx="-2" cy="0" rx="24" ry="11" fill="#1a1410" />
            {/* white chest blaze */}
            <ellipse cx="14" cy="2" rx="9" ry="8" fill="#f4ecd8" />
            {/* white belly stripe */}
            <ellipse cx="-2" cy="4" rx="16" ry="4" fill="#f4ecd8" />
            {/* head */}
            <ellipse cx="20" cy="-4" rx="9" ry="8" fill="#1a1410" />
            {/* muzzle (white) */}
            <ellipse cx="26" cy="-2" rx="5" ry="3.5" fill="#f4ecd8" />
            {/* nose */}
            <circle cx="30" cy="-2" r="1.6" fill="#0a0a0a" />
            {/* eye + eye highlight */}
            <circle cx="22" cy="-6" r="1.4" fill="#fff" />
            <circle cx="22" cy="-6" r="0.7" fill="#0a0a0a" />
            {/* ears — one forward, one back */}
            <polygon points="15,-12 14,-4 22,-8" fill="#1a1410" />
            <polygon points="20,-12 22,-4 26,-9" fill="#1a1410" />
            {/* gold collar — the leader marker, picked up by the in-game dog too */}
            <ellipse cx="16" cy="-1" rx="6" ry="2.4" fill="#ffd84a" stroke="#9a7a18" strokeWidth=".6" />
            {/* tail — perked up */}
            <path
              d="M -22 -2 Q -34 -10 -34 -22"
              stroke="#1a1410"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="-34" cy="-22" r="3.5" fill="#f4ecd8" />
            {/* legs hint */}
            <rect x="-12" y="9" width="4" height="6" fill="#1a1410" />
            <rect x="6"   y="9" width="4" height="6" fill="#1a1410" />
            <rect x="-2"  y="9" width="4" height="6" fill="#1a1410" />
          </g>

          {/* foreground grass blades — softens the hill edge */}
          <g stroke="#3a5b28" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".75">
            <path d="M 30 274 q 3 -10 0 -22" />
            <path d="M 38 276 q -3 -8 2 -18" />
            <path d="M 480 276 q 2 -10 -1 -22" />
            <path d="M 488 278 q -2 -8 3 -16" />
            <path d="M 760 276 q -2 -10 2 -22" />
          </g>
        </svg>
      </div>

      <div className="pp-splash__content">
        <h1 className="pp-splash__title">
          <span className="pp-splash__title-emph">Pied</span>
          <span className="pp-splash__title-emph pp-splash__title-emph--accent">Piper</span>
        </h1>
        <p className="pp-splash__subtitle">{t('subtitle')}</p>

        {highScore > 0 && (
          <div className="pp-splash__best">
            <span className="pp-splash__best-label">BEST</span>
            <span className="pp-splash__best-value">{highScore}</span>
          </div>
        )}

        <button className="pp-splash__cta" onPointerDown={onStart}>
          <span className="pp-splash__cta-text">{t('tap_to_start')}</span>
          <span className="pp-splash__cta-pulse" aria-hidden />
        </button>
      </div>
    </div>
  );
}
