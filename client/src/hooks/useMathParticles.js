import { useMemo } from 'react';

const MATH_SYMBOLS = ['π', '∑', '√', '∞', '∫', 'α', 'Ω', 'λ', '+', 'fx'];

function createParticles(count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    symbol: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 14 + Math.random() * 24,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * 8,
    opacityStart: 0.1 + Math.random() * 0.4,
    opacityEnd: 0.3 + Math.random() * 0.5,
  }));
}

/**
 * Custom hook that generates an array of math symbol particles.
 * The array is memoized and only regenerates when `count` changes.
 *
 * @param {number} count - Number of particles to generate (default 20)
 * @returns {Array} Array of particle objects with id, symbol, left, top, size, duration, delay
 *
 * @example
 * const particles = useMathParticles(20);
 *
 * // Then in JSX:
 * // <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: -1 }}>
 * //   {particles.map(p => (
 * //     <span key={p.id} className="particle-bg" style={{ left: `${p.left}%`, top: `${p.top}%`, fontSize: `${p.size}px`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}>
 * //       {p.symbol}
 * //     </span>
 * //   ))}
 * // </div>
 */
export default function useMathParticles(count = 20) {
  return useMemo(() => createParticles(count), [count]);
}

export { MATH_SYMBOLS };
