import {
  calculateSegmentAngle,
  getSegmentCenterAngle,
  calculateRotationForSegment,
  generateSpinSequence,
  detectWinner,
  calculateSpinRotation,
  easing,
} from '../wheelAnimation';

describe('wheelAnimation utilities', () => {
  describe('easing functions', () => {
    it('easeOut should start fast and slow down', () => {
      const t0 = easing.easeOut(0);
      const t05 = easing.easeOut(0.5);
      const t1 = easing.easeOut(1);

      expect(t0).toBe(0);
      expect(t1).toBe(1);
      expect(t05).toBeGreaterThan(0.3); // Should be past halfway due to easing
    });

    it('linear should progress uniformly', () => {
      expect(easing.linear(0)).toBe(0);
      expect(easing.linear(0.5)).toBe(0.5);
      expect(easing.linear(1)).toBe(1);
    });

    it('easeInOut should ease at both ends', () => {
      const t0 = easing.easeInOut(0);
      const t05 = easing.easeInOut(0.5);
      const t1 = easing.easeInOut(1);

      expect(t0).toBe(0);
      expect(t05).toBe(0.5);
      expect(t1).toBe(1);
    });
  });

  describe('calculateSegmentAngle', () => {
    it('should calculate correct angles for segments', () => {
      expect(calculateSegmentAngle(0, 8)).toBe(0);
      expect(calculateSegmentAngle(1, 8)).toBe(45);
      expect(calculateSegmentAngle(4, 8)).toBe(180);
      expect(calculateSegmentAngle(7, 8)).toBe(315);
    });

    it('should work with different segment counts', () => {
      expect(calculateSegmentAngle(1, 4)).toBe(90);
      expect(calculateSegmentAngle(1, 6)).toBe(60);
    });
  });

  describe('getSegmentCenterAngle', () => {
    it('should return center angle of segment', () => {
      const angle = getSegmentCenterAngle(0, 8);
      expect(angle).toBeCloseTo(22.5); // 0 + (360/8)/2
    });

    it('should work for different segments', () => {
      const angle = getSegmentCenterAngle(1, 8);
      expect(angle).toBeCloseTo(67.5); // 45 + 22.5
    });
  });

  describe('calculateRotationForSegment', () => {
    it('should place segment at top (0 degrees)', () => {
      const rotation = calculateRotationForSegment(0, 8);
      // The rotation should point to the opposite direction
      expect(rotation).toBeLessThan(0);
    });

    it('should work for different segments', () => {
      const rotation1 = calculateRotationForSegment(0, 8);
      const rotation2 = calculateRotationForSegment(4, 8);
      expect(rotation1).not.toBe(rotation2);
    });
  });

  describe('generateSpinSequence', () => {
    it('should generate increasing values', () => {
      const sequence = generateSpinSequence(1000);
      expect(sequence.length).toBeGreaterThan(0);
      expect(sequence[0]).toBeLessThanOrEqual(sequence[sequence.length - 1]);
    });

    it('should start at 0 and end near 1', () => {
      const sequence = generateSpinSequence(1000);
      expect(sequence[0]).toBe(0);
      expect(sequence[sequence.length - 1]).toBeCloseTo(1);
    });

    it('should use provided easing function', () => {
      const linearSequence = generateSpinSequence(1000, easing.linear);
      const easeOutSequence = generateSpinSequence(1000, easing.easeOut);

      // easeOut should be slower at the start (lower values at 25% progress)
      expect(linearSequence[Math.floor(linearSequence.length * 0.25)]).toBeLessThan(
        easeOutSequence[Math.floor(easeOutSequence.length * 0.25)]
      );
    });
  });

  describe('detectWinner', () => {
    it('should detect correct winner', () => {
      const winner = detectWinner(0, 8);
      expect(winner).toBe(0);
    });

    it('should handle various rotations', () => {
      expect(detectWinner(45, 8)).toBe(7); // 45 degrees with 8 segments
      expect(detectWinner(90, 8)).toBe(6);
      expect(detectWinner(180, 8)).toBe(4);
    });

    it('should wrap around at 360 degrees', () => {
      const winner1 = detectWinner(0, 8);
      const winner2 = detectWinner(360, 8);
      expect(winner1).toBe(winner2);
    });

    it('should return valid index within bounds', () => {
      for (let rotation = 0; rotation < 360; rotation += 45) {
        const winner = detectWinner(rotation, 8);
        expect(winner).toBeGreaterThanOrEqual(0);
        expect(winner).toBeLessThan(8);
      }
    });
  });

  describe('calculateSpinRotation', () => {
    it('should calculate rotation with spins', () => {
      const rotation = calculateSpinRotation(3, 0);
      expect(rotation).toBe(1080); // 3 * 360
    });

    it('should add random offset', () => {
      const rotation1 = calculateSpinRotation(3, 0);
      const rotation2 = calculateSpinRotation(3, 45);
      expect(rotation2).toBe(rotation1 + 45);
    });

    it('should use default spins', () => {
      const rotation = calculateSpinRotation();
      expect(rotation).toBe(1080); // default 3 spins * 360
    });
  });
});
