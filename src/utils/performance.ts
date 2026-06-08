/**
 * Performance monitoring utility for the spinning wheel animation.
 * Helps identify bottlenecks and ensure 60fps target.
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  totalFrames: number;
}

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTimestamp = 0;
  private frameTimeHistory: number[] = [];
  private maxHistorySize = 60;
  private targetFps = 60;

  startMonitoring(): void {
    this.frameCount = 0;
    this.lastTimestamp = performance.now();
    this.frameTimeHistory = [];
  }

  recordFrame(): void {
    const currentTimestamp = performance.now();
    const frameTime = currentTimestamp - this.lastTimestamp;

    this.frameCount++;
    this.frameTimeHistory.push(frameTime);

    if (this.frameTimeHistory.length > this.maxHistorySize) {
      this.frameTimeHistory.shift();
    }

    this.lastTimestamp = currentTimestamp;
  }

  getMetrics(): PerformanceMetrics {
    const totalFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    const avgFrameTime = totalFrameTime / this.frameTimeHistory.length;
    const targetFrameTime = 1000 / this.targetFps; // ~16.67ms for 60fps

    const droppedFrames = this.frameTimeHistory.filter((time) => time > targetFrameTime).length;
    const fps = 1000 / (avgFrameTime || 16.67);

    return {
      fps: Math.round(fps),
      frameTime: Math.round(avgFrameTime * 10) / 10,
      droppedFrames,
      totalFrames: this.frameCount,
    };
  }

  logMetrics(): void {
    const metrics = this.getMetrics();
    const status = metrics.fps >= 55 ? '✓' : '⚠️';
    console.log(
      `${status} Performance: ${metrics.fps}fps | Frame time: ${metrics.frameTime}ms | Dropped: ${metrics.droppedFrames}/${metrics.totalFrames}`
    );
  }

  reset(): void {
    this.frameCount = 0;
    this.lastTimestamp = 0;
    this.frameTimeHistory = [];
  }
}

// Browser API-based performance measurement
export function measureAnimationPerformance(callback: () => void): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const monitor = new PerformanceMonitor();
    monitor.startMonitoring();

    let animationFrameId: number;
    const startTime = performance.now();
    const measurementDuration = 2000; // 2 seconds

    const measure = (): void => {
      monitor.recordFrame();
      const elapsed = performance.now() - startTime;

      if (elapsed < measurementDuration) {
        animationFrameId = requestAnimationFrame(measure);
      } else {
        callback();
        resolve(monitor.getMetrics());
      }
    };

    animationFrameId = requestAnimationFrame(measure);
  });
}

// Check if device prefers reduced motion
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Get device info for performance tuning
export interface DeviceInfo {
  hasHighRefreshRate: boolean;
  hasGpu: boolean;
  supportsWebGL: boolean;
  cores: number;
}

export function getDeviceInfo(): DeviceInfo {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  return {
    hasHighRefreshRate: window.devicePixelRatio >= 2,
    hasGpu: !!gl,
    supportsWebGL: !!gl,
    cores: navigator.hardwareConcurrency || 4,
  };
}
