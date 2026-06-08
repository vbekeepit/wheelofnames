// Easing functions for smooth animations
export const easing = {
  easeOut: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  linear: (t: number): number => t,
};

export type EasingFunction = (t: number) => number;

// Calculate the angle (in degrees) for a segment based on index and total count
export function calculateSegmentAngle(index: number, totalSegments: number): number {
  return (index / totalSegments) * 360;
}

// Calculate the center angle of a segment
export function getSegmentCenterAngle(index: number, totalSegments: number): number {
  const segmentAngle = 360 / totalSegments;
  return calculateSegmentAngle(index, totalSegments) + segmentAngle / 2;
}

// Calculate rotation needed to place a segment at the top (0 degrees)
export function calculateRotationForSegment(selectedIndex: number, totalSegments: number): number {
  const centerAngle = getSegmentCenterAngle(selectedIndex, totalSegments);
  return -centerAngle;
}

// Generate spin sequence with easing
export function generateSpinSequence(
  duration: number,
  easingFunc: EasingFunction = easing.easeOut
): number[] {
  const frames: number[] = [];
  const frameCount = Math.ceil(duration / 16); // ~60fps at 16ms per frame

  for (let i = 0; i <= frameCount; i++) {
    const progress = i / frameCount;
    const easedProgress = easingFunc(progress);
    frames.push(easedProgress);
  }

  return frames;
}

// Calculate winner based on final rotation
export function detectWinner(finalRotation: number, totalSegments: number): number {
  // Normalize rotation to 0-360 range
  let normalized = finalRotation % 360;
  if (normalized < 0) normalized += 360;

  // Invert because wheel rotates, but we read from top
  normalized = (360 - normalized) % 360;

  // Calculate segment size
  const segmentSize = 360 / totalSegments;

  // Find which segment is at the top pointer (0 degrees)
  const selectedIndex = Math.floor(normalized / segmentSize) % totalSegments;

  return Math.max(0, Math.min(selectedIndex, totalSegments - 1));
}

// Calculate rotation for spinning animation
export function calculateSpinRotation(spins: number = 3, randomOffset: number = 0): number {
  return spins * 360 + randomOffset;
}
