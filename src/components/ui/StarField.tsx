import React, { useMemo } from 'react';

// ─── StarField ────────────────────────────────────────────────────────────────
// Generates a static SVG star field for atmospheric depth.
// Positioned as a fixed background layer so it appears behind all content.

interface Star {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  animationDelay: string;
  animationDuration: string;
}

function generateStars(count: number): Star[] {
  // Uses Math.random seeded by index for stable, always-positive values
  return Array.from({ length: count }, (_, i) => {
    // LCG pseudo-random from index — all values normalized to [0,1)
    const a = Math.sin(i * 127.1) * 43758.5453123;
    const b = Math.sin(i * 311.7) * 43758.5453123;
    const c = Math.sin(i * 74.3)  * 43758.5453123;
    const frac = (v: number) => v - Math.floor(v); // always [0,1)

    return {
      cx: frac(a) * 100,
      cy: frac(b) * 100,
      r:  0.15 + frac(c) * 0.65,
      opacity: 0.1 + frac(Math.sin(i * 52.9) * 43758.5) * 0.55,
      animationDelay: `${frac(Math.sin(i * 91.3) * 43758.5) * 8}s`,
      animationDuration: `${2.5 + frac(Math.sin(i * 19.7) * 43758.5) * 4}s`,
    };
  });
}

const STARS = generateStars(120);

export const StarField: React.FC = () => {
  const stars = useMemo(() => STARS, []);

  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={`${s.cx}%`}
          cy={`${s.cy}%`}
          r={s.r}
          fill="white"
          opacity={s.opacity}
          style={{
            animation: `pulse ${s.animationDuration} ease-in-out ${s.animationDelay} infinite alternate`,
          }}
        />
      ))}
    </svg>
  );
};

export default StarField;
