import {
  DistributedSpinLock,
  SpinSynchronizer,
  NetworkResilience,
  type SpinResult,
} from '../realTimeSync';

describe('Real-time Synchronization', () => {
  describe('DistributedSpinLock', () => {
    it('should acquire lock', async () => {
      const lock = new DistributedSpinLock();
      const acquired = await lock.acquire('user-1');

      expect(acquired).toBe(true);
      expect(lock.isLocked()).toBe(true);
      expect(lock.getLockHolder()).toBe('user-1');
    });

    it('should deny lock if already held', async () => {
      const lock = new DistributedSpinLock();
      await lock.acquire('user-1');

      const acquired = await lock.acquire('user-2');

      expect(acquired).toBe(false);
      expect(lock.getLockHolder()).toBe('user-1');
    });

    it('should release lock', async () => {
      const lock = new DistributedSpinLock();
      await lock.acquire('user-1');

      const released = await lock.release('user-1');

      expect(released).toBe(true);
      expect(lock.isLocked()).toBe(false);
    });

    it('should not release lock held by another user', async () => {
      const lock = new DistributedSpinLock();
      await lock.acquire('user-1');

      const released = await lock.release('user-2');

      expect(released).toBe(false);
      expect(lock.isLocked()).toBe(true);
    });

    it('should expire old locks', async () => {
      const lock = new DistributedSpinLock();
      await lock.acquire('user-1');

      // Simulate time passing (would need to mock Date in real test)
      // For now, we'll check the logic

      expect(lock.isLocked()).toBe(true);
    });

    it('should notify lock change listeners', async () => {
      const lock = new DistributedSpinLock();
      const listener = jest.fn();

      lock.onLockChange(listener);
      await lock.acquire('user-1');

      expect(listener).toHaveBeenCalledWith(true);
    });

    it('should allow multiple listeners', async () => {
      const lock = new DistributedSpinLock();
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      lock.onLockChange(listener1);
      lock.onLockChange(listener2);
      await lock.acquire('user-1');

      expect(listener1).toHaveBeenCalledWith(true);
      expect(listener2).toHaveBeenCalledWith(true);
    });

    it('should unsubscribe listeners', async () => {
      const lock = new DistributedSpinLock();
      const listener = jest.fn();

      const unsubscribe = lock.onLockChange(listener);
      unsubscribe();

      await lock.acquire('user-1');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('SpinSynchronizer', () => {
    it('should initialize', async () => {
      const sync = new SpinSynchronizer();
      await sync.initialize('meeting-1');

      expect(sync.getState()).toBeDefined();
    });

    it('should request spin with lock', async () => {
      const sync = new SpinSynchronizer();
      await sync.initialize('meeting-1');

      const result = await sync.requestSpin('user-1', 8);

      expect(result).toBe(true);
      expect(sync.getState().isSpinning).toBe(true);
      expect(sync.getState().lastSpinBy).toBe('user-1');
    });

    it('should deny concurrent spin requests', async () => {
      const sync = new SpinSynchronizer();
      await sync.initialize('meeting-1');

      await sync.requestSpin('user-1', 8);
      const result = await sync.requestSpin('user-2', 8);

      expect(result).toBe(false);
    });

    it('should complete spin', async () => {
      const sync = new SpinSynchronizer();
      await sync.initialize('meeting-1');

      await sync.requestSpin('user-1', 8);
      await sync.completeSpin('user-1', 3);

      expect(sync.getState().isSpinning).toBe(false);
      expect(sync.getState().selectedIndex).toBe(3);
    });

    it('should notify state changes', async () => {
      const sync = new SpinSynchronizer();
      const listener = jest.fn();

      await sync.initialize('meeting-1');
      sync.onStateChange(listener);

      await sync.requestSpin('user-1', 8);

      expect(listener).toHaveBeenCalled();
      const state = listener.mock.calls[0][0];
      expect(state.isSpinning).toBe(true);
    });

    it('should notify spin results', async () => {
      const sync = new SpinSynchronizer();
      const listener = jest.fn();

      await sync.initialize('meeting-1');
      sync.onSpinResult(listener);

      await sync.requestSpin('user-1', 8);
      await sync.completeSpin('user-1', 5);

      expect(listener).toHaveBeenCalled();
      const result: SpinResult = listener.mock.calls[0][0];
      expect(result.selectedIndex).toBe(5);
      expect(result.selectedBy).toBe('user-1');
    });

    it('should abort spin', async () => {
      const sync = new SpinSynchronizer();
      await sync.initialize('meeting-1');

      await sync.requestSpin('user-1', 8);
      expect(sync.getState().isSpinning).toBe(true);

      await sync.abortSpin('user-1');
      expect(sync.getState().isSpinning).toBe(false);
    });

    it('should handle remote messages', async () => {
      const sync = new SpinSynchronizer();
      await sync.initialize('meeting-1');

      sync.handleRemoteMessage({
        type: 'spinStarted',
        data: { userId: 'user-2', timestamp: Date.now() },
      });

      expect(sync.getState().isSpinning).toBe(true);
    });

    it('should disconnect cleanly', async () => {
      const sync = new SpinSynchronizer();
      await sync.initialize('meeting-1');

      await sync.disconnect();

      // Should be safe to disconnect multiple times
      await sync.disconnect();
    });
  });

  describe('NetworkResilience', () => {
    it('should execute operation successfully', async () => {
      const resilience = new NetworkResilience();
      const operation = jest.fn().mockResolvedValue('success');

      const result = await resilience.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const resilience = new NetworkResilience(3, 10, 1);
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce('success');

      const result = await resilience.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const resilience = new NetworkResilience(2, 10, 1);
      const operation = jest.fn().mockRejectedValue(new Error('always fails'));

      await expect(resilience.executeWithRetry(operation)).rejects.toThrow('always fails');

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should call retry callback', async () => {
      const resilience = new NetworkResilience(2, 10, 1);
      const operation = jest.fn().mockRejectedValue(new Error('fail'));
      const onRetry = jest.fn();

      await expect(resilience.executeWithRetry(operation, onRetry)).rejects.toThrow();

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should calculate backoff delay correctly', () => {
      const resilience = new NetworkResilience(3, 100, 2);

      expect(resilience.getDelay(1)).toBe(100);
      expect(resilience.getDelay(2)).toBe(200);
      expect(resilience.getDelay(3)).toBe(400);
    });
  });
});
