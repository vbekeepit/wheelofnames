/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration respecting user preference
 */
export function getAnimationDuration(normalDuration: number): number {
  if (prefersReducedMotion()) {
    return Math.min(normalDuration, 500); // Max 500ms for animations
  }
  return normalDuration;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Check if device has capability to display high refresh rate animations
 */
export function supportsHighRefreshRate(): boolean {
  return window.devicePixelRatio >= 2 || window.matchMedia('(min-height: 720px)').matches;
}

/**
 * ARIA live region announcements
 */
export const liveRegions = {
  /**
   * Announce that a spin has started
   */
  announceSpinStart: (participantName?: string): void => {
    const message = participantName ? `Spinning for ${participantName}` : 'Spinning the wheel';
    announceToScreenReader(message);
  },

  /**
   * Announce winner selection
   */
  announceWinner: (winnerName: string): void => {
    announceToScreenReader(`Winner selected: ${winnerName}`);
  },

  /**
   * Announce participant count
   */
  announceParticipantCount: (count: number): void => {
    const label = count === 1 ? 'participant' : 'participants';
    announceToScreenReader(`${count} ${label} in the wheel`);
  },

  /**
   * Announce error message
   */
  announceError: (errorMessage: string): void => {
    announceToScreenReader(`Error: ${errorMessage}`, 'assertive');
  },
};

/**
 * Announce message to screen readers
 */
function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only'; // Visually hidden but accessible to screen readers
  liveRegion.textContent = message;

  document.body.appendChild(liveRegion);

  // Remove after announcement
  setTimeout(() => {
    liveRegion.remove();
  }, 1000);
}

/**
 * Enhanced focus management
 */
export const focusManagement = {
  /**
   * Trap focus within a modal
   */
  trapFocusInModal: (modalElement: HTMLElement): (() => void) => {
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    modalElement.addEventListener('keydown', handleKeyDown);

    return () => {
      modalElement.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * Move focus to element and announce
   */
  moveFocusTo: (element: HTMLElement, announce?: string): void => {
    element.focus();
    if (announce) {
      announceToScreenReader(announce);
    }
  },

  /**
   * Restore focus to previously focused element
   */
  getRestoreFocus: (): (() => void) => {
    const previouslyFocused = document.activeElement as HTMLElement;
    return () => {
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  },
};

/**
 * Color contrast checker
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseRgb(color1);
  const rgb2 = parseRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const luminance1 = calculateLuminance(rgb1);
  const luminance2 = calculateLuminance(rgb2);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return null;

  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}

function calculateLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Keyboard navigation helpers
 */
export const keyboardNav = {
  /**
   * Check if key is Enter or Space
   */
  isActivationKey: (event: KeyboardEvent): boolean => {
    return event.key === 'Enter' || event.key === ' ';
  },

  /**
   * Check if key is arrow key
   */
  isArrowKey: (event: KeyboardEvent): boolean => {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
  },

  /**
   * Check if key is Escape
   */
  isEscapeKey: (event: KeyboardEvent): boolean => {
    return event.key === 'Escape';
  },

  /**
   * Check if modifier key is pressed (Ctrl, Alt, Shift, Cmd)
   */
  hasModifier: (event: KeyboardEvent): boolean => {
    return event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;
  },
};

/**
 * Accessibility testing checklist
 */
export const a11yChecklist = {
  /**
   * Check for proper heading hierarchy
   */
  checkHeadingHierarchy: (): boolean => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(
      (h) => parseInt(h.tagName[1], 10)
    );

    for (let i = 1; i < headings.length; i++) {
      // Heading level should not skip more than one level
      if (headings[i] - headings[i - 1] > 1) {
        return false;
      }
    }

    return true;
  },

  /**
   * Check for images with alt text
   */
  checkImageAltText: (): boolean => {
    const images = document.querySelectorAll('img:not([role="presentation"])');
    return Array.from(images).every((img) => img.hasAttribute('alt') && img.getAttribute('alt') !== '');
  },

  /**
   * Check for buttons with accessible labels
   */
  checkButtonLabels: (): boolean => {
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons).every((btn) => {
      const hasText = btn.textContent?.trim().length ?? 0 > 0;
      const hasAriaLabel = btn.hasAttribute('aria-label');
      return hasText || hasAriaLabel;
    });
  },

  /**
   * Check for proper color contrast
   */
  checkColorContrast: (): boolean => {
    // This is a simplified check; real implementation would be more thorough
    const elements = document.querySelectorAll('button, a, p, span');
    const MIN_CONTRAST = 4.5; // AA standard for normal text

    for (const el of elements) {
      const computed = window.getComputedStyle(el);
      const color = computed.color;
      const backgroundColor = computed.backgroundColor;

      const contrast = getContrastRatio(color, backgroundColor);
      if (contrast < MIN_CONTRAST) {
        console.warn(`Low contrast detected on element:`, el);
        return false;
      }
    }

    return true;
  },
};
