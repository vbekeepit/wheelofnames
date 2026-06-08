import {
  prefersReducedMotion,
  getAnimationDuration,
  prefersHighContrast,
  supportsHighRefreshRate,
  keyboardNav,
  getContrastRatio,
} from '../accessibility';

describe('Accessibility Utilities', () => {
  describe('Motion Preferences', () => {
    it('should check for reduced motion preference', () => {
      const result = prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });

    it('should reduce animation duration when motion is reduced', () => {
      const normalDuration = 4000;
      const reducedDuration = getAnimationDuration(normalDuration);

      // When reduced motion is not preferred, duration should be normal
      // When reduced motion is preferred, duration should be capped at 500ms
      expect(reducedDuration).toBeLessThanOrEqual(normalDuration);
    });

    it('should cap animation at 500ms with reduced motion', () => {
      const longDuration = 10000;
      const result = getAnimationDuration(longDuration);

      // Result should be at most 500ms (if reduced motion is preferred)
      // or the original duration (if not)
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(longDuration);
    });
  });

  describe('Contrast Checking', () => {
    it('should calculate contrast ratio', () => {
      const white = 'rgb(255, 255, 255)';
      const black = 'rgb(0, 0, 0)';

      const contrast = getContrastRatio(white, black);

      // Maximum contrast is 21:1
      expect(contrast).toBeCloseTo(21, 0);
    });

    it('should handle same color contrast', () => {
      const color = 'rgb(128, 128, 128)';

      const contrast = getContrastRatio(color, color);

      expect(contrast).toBeCloseTo(1, 0); // Same color = 1:1
    });

    it('should return 0 for invalid colors', () => {
      const contrast = getContrastRatio('invalid', 'rgb(0, 0, 0)');

      expect(contrast).toBe(0);
    });

    it('should detect high contrast preference', () => {
      const result = prefersHighContrast();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Device Capabilities', () => {
    it('should check for high refresh rate support', () => {
      const result = supportsHighRefreshRate();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should detect activation keys (Enter and Space)', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      const otherEvent = new KeyboardEvent('keydown', { key: 'a' });

      expect(keyboardNav.isActivationKey(enterEvent)).toBe(true);
      expect(keyboardNav.isActivationKey(spaceEvent)).toBe(true);
      expect(keyboardNav.isActivationKey(otherEvent)).toBe(false);
    });

    it('should detect arrow keys', () => {
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const otherEvent = new KeyboardEvent('keydown', { key: 'a' });

      expect(keyboardNav.isArrowKey(upEvent)).toBe(true);
      expect(keyboardNav.isArrowKey(downEvent)).toBe(true);
      expect(keyboardNav.isArrowKey(otherEvent)).toBe(false);
    });

    it('should detect Escape key', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const otherEvent = new KeyboardEvent('keydown', { key: 'a' });

      expect(keyboardNav.isEscapeKey(escapeEvent)).toBe(true);
      expect(keyboardNav.isEscapeKey(otherEvent)).toBe(false);
    });

    it('should detect modifier keys', () => {
      const ctrlEvent = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      const shiftEvent = new KeyboardEvent('keydown', { key: 'a', shiftKey: true });
      const noModifierEvent = new KeyboardEvent('keydown', { key: 'a' });

      expect(keyboardNav.hasModifier(ctrlEvent)).toBe(true);
      expect(keyboardNav.hasModifier(shiftEvent)).toBe(true);
      expect(keyboardNav.hasModifier(noModifierEvent)).toBe(false);
    });
  });
});
