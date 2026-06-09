import React, { useRef, useState, useEffect } from 'react';
import type { Participant } from '@/types/meeting';
import { easing, calculateRotationForSegment, detectWinner, calculateSpinRotation } from '@/utils/wheelAnimation';
import './Wheel.css';

export interface WheelProps {
  participants: Participant[];
  onWinnerSelected?: (winner: Participant, index: number) => void;
  isDisabled?: boolean;
  spinDuration?: number;
  spins?: number;
  enableKeyboardControl?: boolean;
}

export const Wheel: React.FC<WheelProps> = ({
  participants,
  onWinnerSelected,
  isDisabled = false,
  spinDuration = 4000,
  spins = 3,
  enableKeyboardControl = true,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<{ participant: Participant; index: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const segmentCount = Math.max(participants.length, 1);
  const segmentAngle = 360 / segmentCount;

  // Update rotation ref whenever rotation state changes
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // Keyboard control (spacebar to spin)
  useEffect(() => {
    if (!enableKeyboardControl) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.code === 'Space' || event.key === ' ') && !isSpinning && !isDisabled) {
        event.preventDefault();
        spin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, isDisabled, enableKeyboardControl]); // eslint-disable-line react-hooks/exhaustive-deps

  const spin = (): void => {
    if (isSpinning || isDisabled || participants.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    // Generate random offset (0-360 degrees) for variety
    const randomOffset = Math.random() * 360;
    const targetRotation = rotationRef.current + calculateSpinRotation(spins, randomOffset);

    startTimeRef.current = Date.now();

    const animate = (): void => {
      if (!startTimeRef.current || !svgRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easedProgress = easing.easeOut(progress);

      const currentRotation = rotationRef.current + (targetRotation - rotationRef.current) * easedProgress;

      // Update DOM directly for smooth animation
      if (svgRef.current) {
        svgRef.current.style.transform = `rotate(${currentRotation}deg)`;
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        rotationRef.current = targetRotation;
        setRotation(targetRotation);

        const winnerIndex = detectWinner(targetRotation, segmentCount);
        const winnerParticipant = participants[winnerIndex];

        if (winnerParticipant) {
          setWinner({ participant: winnerParticipant, index: winnerIndex });
          onWinnerSelected?.(winnerParticipant, winnerIndex);
        }

        setIsSpinning(false);
        startTimeRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const reset = (): void => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setRotation(0);
    setWinner(null);
    setIsSpinning(false);
    startTimeRef.current = null;
  };

  // For small segment counts, increase text size
  const textSize = segmentCount <= 8 ? 14 : segmentCount <= 16 ? 12 : 10;
  const radius = 150;
  const innerRadius = 30;

  return (
    <div className="wheel-container">
      <div className="wheel-wrapper">
        <svg
          ref={svgRef}
          viewBox="0 0 320 320"
          className={`wheel ${isSpinning ? 'spinning' : ''} ${winner ? 'winner' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Background circle */}
          <circle cx="160" cy="160" r={radius} className="wheel-background" />

          {/* Segments */}
          {participants.map((participant, index) => {
            const startAngle = (index / segmentCount) * 360;
            const endAngle = ((index + 1) / segmentCount) * 360;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = 160 + innerRadius * Math.cos(startRad);
            const y1 = 160 + innerRadius * Math.sin(startRad);
            const x2 = 160 + radius * Math.cos(startRad);
            const y2 = 160 + radius * Math.sin(startRad);
            const x3 = 160 + radius * Math.cos(endRad);
            const y3 = 160 + radius * Math.sin(endRad);
            const x4 = 160 + innerRadius * Math.cos(endRad);
            const y4 = 160 + innerRadius * Math.sin(endRad);

            const largeArc = endAngle - startAngle > 180 ? 1 : 0;

            const pathData = [
              `M ${x1} ${y1}`,
              `L ${x2} ${y2}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x3} ${y3}`,
              `L ${x4} ${y4}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}`,
            ].join(' ');

            // Text positioning
            const midAngle = (startRad + endRad) / 2;
            const textRadius = (innerRadius + radius) / 2;
            const textX = 160 + textRadius * Math.cos(midAngle);
            const textY = 160 + textRadius * Math.sin(midAngle);
            const textAngle = (midAngle * 180) / Math.PI + 90;

            const isWinner = winner?.index === index;

            return (
              <g key={participant.id}>
                <path
                  d={pathData}
                  className={`wheel-segment ${isWinner ? 'winner-segment' : ''}`}
                  style={{
                    fill: `hsl(${(index / segmentCount) * 360}, 70%, 60%)`,
                  }}
                />
                <text
                  x={textX}
                  y={textY}
                  className="wheel-label"
                  style={{
                    fontSize: `${textSize}px`,
                    transform: `rotate(${textAngle}deg)`,
                    transformOrigin: `${textX}px ${textY}px`,
                  }}
                >
                  {participant.displayName.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Center circle */}
          <circle cx="160" cy="160" r={innerRadius} className="wheel-center" />
        </svg>

        {/* Pointer */}
        <div className="wheel-pointer" />
      </div>

      {/* Controls */}
      <div className="wheel-controls">
        <button
          className="spin-button"
          onClick={spin}
          disabled={isSpinning || isDisabled || participants.length === 0}
          aria-label="Spin the wheel"
        >
          {isSpinning ? 'Spinning...' : 'Spin the Wheel'}
        </button>

        {winner && (
          <button className="reset-button" onClick={reset} aria-label="Reset the wheel">
            Reset
          </button>
        )}
      </div>

      {/* Winner display */}
      {winner && (
        <div className="winner-announcement">
          <h2 className="winner-title">🎉 Winner 🎉</h2>
          <p className="winner-name">{winner.participant.displayName}</p>
          {winner.participant.email && <p className="winner-email">{winner.participant.email}</p>}
        </div>
      )}
    </div>
  );
};

export default Wheel;
