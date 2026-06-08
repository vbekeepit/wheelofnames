import { MonitoringService, initializeMonitoring, getMonitoring } from '../monitoring';

describe('Monitoring Service', () => {
  let monitoring: MonitoringService;

  beforeEach(() => {
    monitoring = new MonitoringService('/test-endpoint', true);
  });

  afterEach(() => {
    monitoring.stop();
  });

  describe('Session Management', () => {
    it('should generate unique session ID', () => {
      const sessionId = monitoring.getSessionId();

      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should return same session ID', () => {
      const id1 = monitoring.getSessionId();
      const id2 = monitoring.getSessionId();

      expect(id1).toBe(id2);
    });
  });

  describe('Error Tracking', () => {
    it('should track error events', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('OK', { status: 200 })
      );

      monitoring.trackError('Test error', 'medium', 'test_context');
      await monitoring.flush();

      expect(fetchSpy).toHaveBeenCalled();
      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options?.body as string);

      expect(body.events).toHaveLength(1);
      expect(body.events[0].type).toBe('error');
      expect(body.events[0].data.message).toBe('Test error');
      expect(body.events[0].data.severity).toBe('medium');

      fetchSpy.mockRestore();
    });

    it('should track critical errors immediately', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('OK', { status: 200 })
      );

      monitoring.trackError('Critical error', 'critical');

      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('OK', { status: 200 })
      );

      monitoring.trackPerformance('spin_duration', 1234, 'ms', 5000);
      await monitoring.flush();

      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options?.body as string);

      expect(body.events[0].type).toBe('performance');
      expect(body.events[0].data.metric).toBe('spin_duration');
      expect(body.events[0].data.value).toBe(1234);

      fetchSpy.mockRestore();
    });

    it('should warn when threshold exceeded', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      monitoring.trackPerformance('spin_duration', 6000, 'ms', 5000);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance threshold exceeded')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('User Action Tracking', () => {
    it('should track user actions', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('OK', { status: 200 })
      );

      monitoring.trackAction('spin', 1234, true);
      await monitoring.flush();

      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options?.body as string);

      expect(body.events[0].type).toBe('user_action');
      expect(body.events[0].data.action).toBe('spin');
      expect(body.events[0].data.success).toBe(true);

      fetchSpy.mockRestore();
    });

    it('should track spin event', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('OK', { status: 200 })
      );

      monitoring.trackSpin('user-1', 'meeting-1', 3, 2000);
      await monitoring.flush();

      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options?.body as string);

      expect(body.events.length).toBeGreaterThan(0);

      fetchSpy.mockRestore();
    });
  });

  describe('Event Batching', () => {
    it('should batch events', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('OK', { status: 200 })
      );

      for (let i = 0; i < 5; i++) {
        monitoring.trackAction(`action_${i}`);
      }

      // Should not flush yet (batch size is 10)
      expect(fetchSpy).not.toHaveBeenCalled();

      await monitoring.flush();

      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should auto-flush on batch size reached', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('OK', { status: 200 })
      );

      // Add 10 events to trigger auto-flush
      for (let i = 0; i < 10; i++) {
        monitoring.trackAction(`action_${i}`);
      }

      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      monitoring.trackAction('test');
      await monitoring.flush();

      // Events should be re-queued on error
      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should handle HTTP errors', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('Error', { status: 500 })
      );

      monitoring.trackAction('test');
      await monitoring.flush();

      // Events should be re-queued on HTTP error
      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('Global Instance', () => {
    it('should initialize global monitoring', () => {
      const instance = initializeMonitoring('/api/telemetry', true);

      expect(instance).toBeDefined();
      expect(instance.getSessionId()).toBeDefined();

      instance.stop();
    });

    it('should get global monitoring instance', () => {
      const instance1 = getMonitoring();
      const instance2 = getMonitoring();

      expect(instance1).toBe(instance2);

      instance1.stop();
    });
  });
});
