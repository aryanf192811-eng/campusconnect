import React, { useEffect, useRef, useState } from 'react';

/**
 * HeartbeatLine — ECG-style animated SVG strip
 * activityLevel: 0–100, drives spike amplitude
 */
export function HeartbeatLine({ activityLevel = 30 }) {
  const [points, setPoints] = useState('');
  const frameRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const W = 1000;
    const H = 40;
    const MID = H / 2;
    const amplitude = Math.max(4, (activityLevel / 100) * 18);
    const spikeInterval = Math.max(80, 200 - activityLevel * 1.5);

    const generate = () => {
      tRef.current += 2;
      const t = tRef.current;
      const pts = [];
      for (let x = 0; x <= W; x += 4) {
        const phase = (x + t) / 20;
        // Baseline sine wave
        let y = MID + Math.sin(phase) * (amplitude * 0.3);
        // Spike every spikeInterval px
        const mod = (x + t) % spikeInterval;
        if (mod < 30) {
          const spikePeak = 1 - mod / 30;
          if (mod < 5) {
            y = MID + spikePeak * amplitude * 0.5;
          } else if (mod < 10) {
            y = MID - spikePeak * amplitude;
          } else if (mod < 18) {
            y = MID + spikePeak * amplitude * 1.5;
          } else {
            y = MID - spikePeak * amplitude * 0.3;
          }
        }
        pts.push(`${x},${y.toFixed(1)}`);
      }
      setPoints(pts.join(' '));
      frameRef.current = requestAnimationFrame(generate);
    };

    frameRef.current = requestAnimationFrame(generate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [activityLevel]);

  return (
    <svg
      viewBox="0 0 1000 40"
      preserveAspectRatio="none"
      style={{ width: '100%', height: '40px', display: 'block' }}
    >
      {/* Gradient mask — fades at edges */}
      <defs>
        <linearGradient id="hb-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--bg-card)" stopOpacity="1" />
          <stop offset="8%" stopColor="var(--bg-card)" stopOpacity="0" />
          <stop offset="92%" stopColor="var(--bg-card)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--bg-card)" stopOpacity="1" />
        </linearGradient>
        <mask id="hb-mask">
          <rect width="1000" height="40" fill="white" />
          <rect width="1000" height="40" fill="url(#hb-fade)" />
        </mask>
      </defs>

      {/* Flat midline */}
      <line x1="0" y1="20" x2="1000" y2="20"
        stroke="var(--brand)" strokeWidth="0.5" opacity="0.15" />

      {/* The heartbeat line */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
        mask="url(#hb-mask)"
      />
    </svg>
  );
}
