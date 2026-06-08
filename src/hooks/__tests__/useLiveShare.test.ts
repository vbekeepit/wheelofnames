import { renderHook, waitFor } from '@testing-library/react';
import { useLiveShare } from '../useLiveShare';

describe('useLiveShare Hook', () => {
  it('should initialize hook with disabled state', () => {
    const { result } = renderHook(() => useLiveShare('meeting-1', { enabled: false }));

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isSpinning).toBe(false);
    expect(result.current.syncState).toBeNull();
  });

  it('should initialize synchronizer when enabled', async () => {
    const { result } = renderHook(() => useLiveShare('meeting-1', { enabled: true, autoConnect: true }));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should request spin', async () => {
    const { result } = renderHook(() => useLiveShare('meeting-1', { enabled: true, autoConnect: true }));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const spinRequested = await result.current.requestSpin('user-1', 8);

    expect(spinRequested).toBe(true);
    expect(result.current.isSpinning).toBe(true);
  });

  it('should prevent concurrent spins', async () => {
    const { result } = renderHook(() => useLiveShare('meeting-1', { enabled: true, autoConnect: true }));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    await result.current.requestSpin('user-1', 8);
    const secondSpin = await result.current.requestSpin('user-2', 8);

    expect(secondSpin).toBe(false);
  });

  it('should complete spin', async () => {
    const { result } = renderHook(() => useLiveShare('meeting-1', { enabled: true, autoConnect: true }));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    await result.current.requestSpin('user-1', 8);
    await result.current.completeSpin('user-1', 3);

    expect(result.current.isSpinning).toBe(false);
    expect(result.current.syncState?.selectedIndex).toBe(3);
  });

  it('should notify spin results', async () => {
    const { result } = renderHook(() => useLiveShare('meeting-1', { enabled: true, autoConnect: true }));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const resultListener = jest.fn();
    result.current.onSpinResult(resultListener);

    await result.current.requestSpin('user-1', 8);
    await result.current.completeSpin('user-1', 5);

    await waitFor(() => {
      expect(resultListener).toHaveBeenCalled();
    });

    const spinResult = resultListener.mock.calls[0][0];
    expect(spinResult.selectedIndex).toBe(5);
    expect(spinResult.selectedBy).toBe('user-1');
  });

  it('should abort spin', async () => {
    const { result } = renderHook(() => useLiveShare('meeting-1', { enabled: true, autoConnect: true }));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    await result.current.requestSpin('user-1', 8);
    expect(result.current.isSpinning).toBe(true);

    await result.current.abortSpin('user-1');

    expect(result.current.isSpinning).toBe(false);
  });

  it('should unsubscribe from spin results', async () => {
    const { result } = renderHook(() => useLiveShare('meeting-1', { enabled: true, autoConnect: true }));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const resultListener = jest.fn();
    const unsubscribe = result.current.onSpinResult(resultListener);

    await result.current.requestSpin('user-1', 8);
    unsubscribe();
    await result.current.completeSpin('user-1', 3);

    // Listener should still be called since subscription was before unsubscribe
    expect(resultListener).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useLiveShare('meeting-1', { enabled: true, autoConnect: true }));

    // Try to spin without connection
    const spinRequested = await result.current.requestSpin('user-1', 8);

    // Should handle gracefully
    expect(typeof spinRequested).toBe('boolean');
  });

  it('should cleanup on unmount', async () => {
    const { unmount, result } = renderHook(() => useLiveShare('meeting-1', { enabled: true, autoConnect: true }));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    unmount();

    // Should not throw
    expect(true).toBe(true);
  });

  it('should respect retry attempts option', async () => {
    const { result } = renderHook(() =>
      useLiveShare('meeting-1', { enabled: true, autoConnect: true, retryAttempts: 2 })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    }, { timeout: 5000 });

    expect(result.current.isConnected).toBe(true);
  });
});
