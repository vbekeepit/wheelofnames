import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { Participant } from '@/types/meeting';
import './Wheel.css';

export interface WheelProps {
  participants: Participant[];
  onWinnerSelected?: (winner: Participant, index: number) => void;
  isDisabled?: boolean;
  spinDuration?: number;
  spins?: number;
  enableKeyboardControl?: boolean;
}

// Obsidian Glass segment tints — dark green glass
const TINTS = [
  'rgba(6,117,74,0.60)',
  'rgba(0,80,50,0.65)',
  'rgba(10,140,85,0.55)',
  'rgba(0,60,38,0.70)',
  'rgba(15,155,95,0.52)',
  'rgba(0,90,58,0.62)',
  'rgba(5,130,80,0.56)',
  'rgba(0,70,44,0.66)',
];

// Virtual canvas coordinate space (physical canvas is 2× for retina)
const V = 300;
const SC = 2;
const OX = 150;
const OY = 150;
const R = 120;
const RI = 22;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3.5);
}

export const Wheel: React.FC<WheelProps> = ({
  participants,
  onWinnerSelected,
  isDisabled = false,
  spinDuration = 4000,
  spins = 5,
  enableKeyboardControl = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef(0);
  const spinningRef = useRef(false);
  const winnerRef = useRef<number | null>(null);
  const participantsRef = useRef(participants);
  const animRef = useRef<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Keep participantsRef current so RAF callbacks always have latest data
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // ── Drawing ─────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;

    const parts = participantsRef.current;
    const n = parts.length;
    const rot = rotRef.current;
    const spinning = spinningRef.current;
    const winIdx = winnerRef.current;

    // Work in virtual 300×300 space
    g.setTransform(SC, 0, 0, SC, 0, 0);
    g.clearRect(0, 0, V, V);

    if (n === 0) return;

    const seg = (Math.PI * 2) / n;
    // Font scales with number of participants so text always fits
    const arcH = (2 * Math.PI * ((RI + R) / 2)) / n;
    const fontSize = Math.max(9, Math.min(18, Math.floor(arcH * 0.52)));

    // Outer glow behind wheel
    const bgGlow = g.createRadialGradient(OX, OY, 0, OX, OY, R + 8);
    bgGlow.addColorStop(0, 'rgba(6,117,74,0.12)');
    bgGlow.addColorStop(1, 'rgba(2,12,7,0)');
    g.save();
    g.beginPath(); g.arc(OX, OY, R + 8, 0, Math.PI * 2);
    g.fillStyle = bgGlow; g.fill();
    g.restore();

    // Solid dark background circle
    g.save();
    const bg = g.createRadialGradient(OX, OY, 0, OX, OY, R);
    bg.addColorStop(0, 'rgba(6,25,15,1)');
    bg.addColorStop(1, 'rgba(2,10,6,1)');
    g.beginPath(); g.arc(OX, OY, R, 0, Math.PI * 2);
    g.fillStyle = bg; g.fill();
    g.restore();

    // Rim ring
    g.save();
    g.beginPath(); g.arc(OX, OY, R + 2.5, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(0,200,100,0.38)';
    g.lineWidth = 4.5;
    g.shadowColor = 'rgba(6,220,120,0.4)';
    g.shadowBlur = 10;
    g.stroke();
    g.restore();

    for (let i = 0; i < n; i++) {
      const a0 = rot + i * seg;
      const a1 = rot + (i + 1) * seg;
      const mid = a0 + seg / 2;
      const win = !spinning && winIdx === i;

      const tracePath = () => {
        g.beginPath();
        g.moveTo(OX + RI * Math.cos(a0), OY + RI * Math.sin(a0));
        g.lineTo(OX + R  * Math.cos(a0), OY + R  * Math.sin(a0));
        g.arc(OX, OY, R,  a0, a1);
        g.lineTo(OX + RI * Math.cos(a1), OY + RI * Math.sin(a1));
        g.arc(OX, OY, RI, a1, a0, true);
        g.closePath();
      };

      // Base fill
      g.save();
      tracePath();
      g.fillStyle = win ? 'rgba(6,117,74,0.82)' : TINTS[i % TINTS.length];
      g.fill();
      g.restore();

      // Specular highlight — outer quarter
      g.save();
      const sx = OX + R * 0.82 * Math.cos(mid);
      const sy = OY + R * 0.82 * Math.sin(mid);
      const spec = g.createRadialGradient(sx, sy, 0, sx, sy, (R - RI) * 0.5);
      spec.addColorStop(0,   'rgba(120,255,190,0.22)');
      spec.addColorStop(0.6, 'rgba(100,255,180,0.05)');
      spec.addColorStop(1,   'rgba(100,255,180,0)');
      tracePath();
      g.fillStyle = spec;
      g.fill();
      g.restore();

      // Segment dividers
      g.save();
      tracePath();
      g.strokeStyle = win ? 'rgba(77,232,160,0.55)' : 'rgba(0,180,90,0.22)';
      g.lineWidth = 0.75;
      g.stroke();
      g.restore();

      // Outer arc highlight
      g.save();
      g.beginPath(); g.arc(OX, OY, R, a0, a1);
      g.strokeStyle = win ? 'rgba(77,232,160,0.80)' : 'rgba(0,200,100,0.35)';
      g.lineWidth = win ? 2 : 1.2;
      if (win) { g.shadowColor = 'rgba(77,232,160,0.9)'; g.shadowBlur = 8; }
      g.stroke();
      g.restore();

      // Label — radial, right-aligned to outer rim
      const labelR = R - 10;
      const tx = OX + labelR * Math.cos(mid);
      const ty = OY + labelR * Math.sin(mid);
      const firstName = parts[i].displayName.split(' ')[0];

      g.save();
      g.translate(tx, ty);
      g.rotate(mid);
      g.font = `${win ? 700 : 600} ${fontSize}px system-ui,-apple-system,sans-serif`;
      g.fillStyle = win ? '#4de8a0' : 'rgba(190,245,220,0.90)';
      g.textAlign = 'right';
      g.textBaseline = 'middle';
      if (win) { g.shadowColor = 'rgba(77,232,160,0.7)'; g.shadowBlur = 6; }
      g.fillText(firstName, 0, 0, (R - RI) * 0.82);
      g.restore();
    }

    // Center hub
    g.save();
    const hub = g.createRadialGradient(OX - RI * 0.3, OY - RI * 0.3, 0, OX, OY, RI);
    hub.addColorStop(0, 'rgba(18,50,32,0.98)');
    hub.addColorStop(1, 'rgba(4,12,8,0.98)');
    g.beginPath(); g.arc(OX, OY, RI, 0, Math.PI * 2);
    g.fillStyle = hub; g.fill();
    g.strokeStyle = 'rgba(6,200,100,0.50)';
    g.lineWidth = 1.2;
    g.shadowColor = 'rgba(6,220,120,0.45)';
    g.shadowBlur = 8;
    g.stroke();
    g.restore();

    // "SPIN" text in hub
    g.save();
    g.font = `700 ${Math.round(RI * 0.56)}px system-ui,-apple-system,sans-serif`;
    g.fillStyle = spinning ? 'rgba(77,232,160,0.45)' : '#4de8a0';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(spinning ? '…' : 'SPIN', OX, OY);
    g.restore();

    // Right-side pointer
    const px = OX + R + 3, py = OY;
    g.save();
    g.beginPath();
    g.moveTo(px,      py);
    g.lineTo(px + 14, py - 8);
    g.lineTo(px + 14, py + 8);
    g.closePath();
    g.fillStyle = '#06754a';
    g.shadowColor = 'rgba(6,220,120,0.65)';
    g.shadowBlur = 10;
    g.fill();
    g.restore();
  }, []);

  // ── Setup canvas ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = V * SC;
    canvas.height = V * SC;
    draw();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when participants change
  useEffect(() => {
    rotRef.current = 0;
    winnerRef.current = null;
    setIsSpinning(false);
    draw();
  }, [participants, draw]);

  // ── Spin ────────────────────────────────────────────────────────────────
  const spin = useCallback(() => {
    if (spinningRef.current || isDisabled || participantsRef.current.length === 0) return;

    spinningRef.current = true;
    winnerRef.current = null;
    setIsSpinning(true);

    const from = rotRef.current;
    const totalSpins = spins + Math.random() * 3;
    const randomStop = Math.random() * Math.PI * 2;
    const to = from + totalSpins * Math.PI * 2 + randomStop;
    let t0: number | null = null;

    const animate = (ts: number) => {
      if (t0 === null) t0 = ts;
      const progress = Math.min((ts - t0) / spinDuration, 1);
      rotRef.current = from + (to - from) * easeOut(progress);
      draw();

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        rotRef.current = to;
        spinningRef.current = false;
        setIsSpinning(false);

        const n = participantsRef.current.length;
        const segAngle = (Math.PI * 2) / n;
        const local = ((-to) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const idx = Math.floor(local / segAngle) % n;
        winnerRef.current = idx;
        draw();

        const winner = participantsRef.current[idx];
        if (winner) onWinnerSelected?.(winner, idx);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [isDisabled, spins, spinDuration, draw, onWinnerSelected]);

  // Keyboard control
  useEffect(() => {
    if (!enableKeyboardControl) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.key === ' ') && !spinningRef.current && !isDisabled) {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enableKeyboardControl, isDisabled, spin]);

  // Cleanup RAF on unmount
  useEffect(() => () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="wheel-container">
      <div className="wheel-wrapper">
        <canvas
          ref={canvasRef}
          className="wheel-canvas"
          onClick={!isDisabled && !isSpinning ? spin : undefined}
          aria-label="Spin the wheel"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') spin(); }}
          style={{ cursor: isSpinning || isDisabled ? 'default' : 'pointer' }}
        />
      </div>
    </div>
  );
};

export default Wheel;
