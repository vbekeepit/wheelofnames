/**
 * Monitoring and analytics service for production telemetry
 * Tracks errors, performance, and user interactions
 */

export interface TelemetryEvent {
  type: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  meetingId?: string;
  data?: Record<string, unknown>;
}

export interface ErrorEvent extends TelemetryEvent {
  type: 'error';
  data: {
    message: string;
    stack?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: string;
  };
}

export interface PerformanceEvent extends TelemetryEvent {
  type: 'performance';
  data: {
    metric: string;
    value: number;
    unit: string;
    threshold?: number;
  };
}

export interface UserActionEvent extends TelemetryEvent {
  type: 'user_action';
  data: {
    action: string;
    duration?: number;
    success: boolean;
  };
}

/**
 * Central monitoring service
 */
export class MonitoringService {
  private sessionId: string;
  private enabled: boolean;
  private eventQueue: TelemetryEvent[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private endpoint: string;

  constructor(endpoint: string = '/api/telemetry', enabled: boolean = true) {
    this.sessionId = this.generateSessionId();
    this.endpoint = endpoint;
    this.enabled = enabled;

    if (enabled) {
      this.startFlushTimer();
      this.setupErrorHandlers();
    }
  }

  /**
   * Track an error event
   */
  trackError(
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: string,
    stack?: string
  ): void {
    if (!this.enabled) return;

    const event: ErrorEvent = {
      type: 'error',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data: {
        message,
        stack: stack || new Error().stack,
        severity,
        context,
      },
    };

    this.queueEvent(event);

    // Flush critical errors immediately
    if (severity === 'critical') {
      this.flush();
    }
  }

  /**
   * Track performance metric
   */
  trackPerformance(
    metric: string,
    value: number,
    unit: string = 'ms',
    threshold?: number
  ): void {
    if (!this.enabled) return;

    const event: PerformanceEvent = {
      type: 'performance',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data: {
        metric,
        value,
        unit,
        threshold,
      },
    };

    this.queueEvent(event);

    // Warn if threshold exceeded
    if (threshold && value > threshold) {
      console.warn(`Performance threshold exceeded: ${metric} = ${value}${unit} (threshold: ${threshold}${unit})`);
    }
  }

  /**
   * Track user action
   */
  trackAction(action: string, duration?: number, success: boolean = true, userId?: string, meetingId?: string): void {
    if (!this.enabled) return;

    const event: UserActionEvent = {
      type: 'user_action',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId,
      meetingId,
      data: {
        action,
        duration,
        success,
      },
    };

    this.queueEvent(event);
  }

  /**
   * Track spin event
   */
  trackSpin(userId: string, meetingId: string, selectedIndex: number, duration: number): void {
    this.trackAction('spin_completed', duration, true, userId, meetingId);
    this.trackPerformance('spin_duration', duration, 'ms', 5000); // Warn if > 5s
  }

  /**
   * Set user context
   */
  setUserContext(userId: string, meetingId?: string): void {
    // Could be used to tag all subsequent events
    console.log(`User context set: ${userId}${meetingId ? ` in meeting ${meetingId}` : ''}`);
  }

  /**
   * Queue event for batching
   */
  private queueEvent(event: TelemetryEvent): void {
    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush queued events to endpoint
   */
  async flush(): Promise<void> {
    if (!this.enabled || this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
      });

      if (!response.ok) {
        console.error(`Telemetry flush failed: ${response.status}`);
        // Re-queue events on failure
        this.eventQueue.unshift(...eventsToSend);
      }
    } catch (error) {
      console.error('Telemetry flush error:', error);
      // Re-queue events on error
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  /**
   * Setup error handlers to track uncaught errors
   */
  private setupErrorHandlers(): void {
    // Track uncaught errors
    window.addEventListener('error', (event) => {
      this.trackError(event.message, 'high', 'uncaught_error', event.error?.stack);
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        event.reason?.message || String(event.reason),
        'high',
        'unhandled_rejection',
        event.reason?.stack
      );
    });
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
    this.enabled = false;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * Global monitoring instance
 */
let globalMonitoring: MonitoringService | null = null;

/**
 * Initialize global monitoring
 */
export function initializeMonitoring(endpoint?: string, enabled?: boolean): MonitoringService {
  globalMonitoring = new MonitoringService(endpoint, enabled);
  return globalMonitoring;
}

/**
 * Get global monitoring instance
 */
export function getMonitoring(): MonitoringService {
  if (!globalMonitoring) {
    globalMonitoring = new MonitoringService();
  }
  return globalMonitoring;
}

/**
 * React Hook for performance tracking
 */
export function usePerformanceTracking(componentName: string): {
  trackMetric: (metricName: string, value: number, unit?: string) => void;
  trackAction: (actionName: string, duration?: number, success?: boolean) => void;
} {
  const monitoring = getMonitoring();

  return {
    trackMetric: (metricName: string, value: number, unit = 'ms') => {
      monitoring.trackPerformance(`${componentName}.${metricName}`, value, unit);
    },
    trackAction: (actionName: string, duration?: number, success = true) => {
      monitoring.trackAction(`${componentName}.${actionName}`, duration, success);
    },
  };
}
