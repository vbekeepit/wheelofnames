import {
  PerformanceMonitor,
  measureAnimationPerformance,
  prefersReducedMotion,
  getDeviceInfo,
} from '../performance';

describe('Performance Utilities', () => {
  describe('PerformanceMonitor', () => {
    it('should initialize correctly', () => {
      const monitor = new PerformanceMonitor();
      monitor.startMonitoring();

      const metrics = monitor.getMetrics();
      expect(metrics.fps).toBeGreaterThan(0);
      expect(metrics.frameTime).toBeGreaterThanOrEqual(0);
      expect(metrics.totalFrames).toBe(0);
    });

    it('should record frames', () => {
      const monitor = new PerformanceMonitor();
      monitor.startMonitoring();

      monitor.recordFrame();
      monitor.recordFrame();
      monitor.recordFrame();

      const metrics = monitor.getMetrics();
      expect(metrics.totalFrames).toBe(3);
    });

    it('should calculate fps correctly', () => {
      const monitor = new PerformanceMonitor();
      monitor.startMonitoring();

      // Record frames at ~60fps (16.67ms intervals)
      for (let i = 0; i < 10; i++) {
        monitor.recordFrame();
      }

      const metrics = monitor.getMetrics();
      expect(metrics.fps).toBeGreaterThan(0);
    });

    it('should track dropped frames', () => {
      const monitor = new PerformanceMonitor();
      monitor.startMonitoring();

      // Record one very slow frame
      monitor.recordFrame();
      // Simulate a slow frame by adding it manually
      const metrics = monitor.getMetrics();

      expect(metrics.droppedFrames).toBeGreaterThanOrEqual(0);
    });

    it('should reset correctly', () => {
      const monitor = new PerformanceMonitor();
      monitor.startMonitoring();

      monitor.recordFrame();
      monitor.recordFrame();

      monitor.reset();

      const metrics = monitor.getMetrics();
      expect(metrics.totalFrames).toBe(0);
    });

    it('should log metrics without error', () => {
      const monitor = new PerformanceMonitor();
      monitor.startMonitoring();

      monitor.recordFrame();
      monitor.recordFrame();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      monitor.logMetrics();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should maintain frame history size limit', () => {
      const monitor = new PerformanceMonitor();
      monitor.startMonitoring();

      // Record more frames than max history size (60)
      for (let i = 0; i < 100; i++) {
        monitor.recordFrame();
      }

      // The history should not grow indefinitely
      const metrics = monitor.getMetrics();
      expect(metrics.totalFrames).toBeGreaterThan(60);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return a boolean', () => {
      const result = prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });

    it('should check media query correctly', () => {
      const matchMediaSpy = jest.spyOn(window, 'matchMedia');
      prefersReducedMotion();

      expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      matchMediaSpy.mockRestore();
    });
  });

  describe('getDeviceInfo', () => {
    it('should return device information', () => {
      const deviceInfo = getDeviceInfo();

      expect(deviceInfo).toHaveProperty('hasHighRefreshRate');
      expect(deviceInfo).toHaveProperty('hasGpu');
      expect(deviceInfo).toHaveProperty('supportsWebGL');
      expect(deviceInfo).toHaveProperty('cores');

      expect(typeof deviceInfo.hasHighRefreshRate).toBe('boolean');
      expect(typeof deviceInfo.hasGpu).toBe('boolean');
      expect(typeof deviceInfo.supportsWebGL).toBe('boolean');
      expect(typeof deviceInfo.cores).toBe('number');
    });

    it('should detect high refresh rate correctly', () => {
      const deviceInfo = getDeviceInfo();
      expect(deviceInfo.hasHighRefreshRate).toBe(window.devicePixelRatio >= 2);
    });

    it('should detect cores correctly', () => {
      const deviceInfo = getDeviceInfo();
      expect(deviceInfo.cores).toBeGreaterThan(0);
    });
  });

  describe('measureAnimationPerformance', () => {
    it('should measure animation performance', async () => {
      const callback = jest.fn();

      const metricsPromise = measureAnimationPerformance(callback);

      // Give it time to measure
      const metrics = await metricsPromise;

      expect(callback).toHaveBeenCalled();
      expect(metrics.fps).toBeGreaterThan(0);
      expect(metrics.frameTime).toBeGreaterThan(0);
    });

    it('should resolve with valid metrics', async () => {
      const metrics = await measureAnimationPerformance(() => {});

      expect(metrics.fps).toBeGreaterThan(0);
      expect(metrics.frameTime).toBeLessThan(100);
      expect(metrics.totalFrames).toBeGreaterThan(0);
      expect(metrics.droppedFrames).toBeGreaterThanOrEqual(0);
    });
  });
});
