import { useEffect, useRef, useState } from 'react';
import { SpinSynchronizer, NetworkResilience, type SyncState, type SpinResult } from '@/services/realTimeSync';

export interface UseLiveShareOptions {
  enabled?: boolean;
  autoConnect?: boolean;
  retryAttempts?: number;
}

export interface UseLiveShareResult {
  isConnected: boolean;
  isSpinning: boolean;
  syncState: SyncState | null;
  error: string | null;
  requestSpin: (userId: string, participantCount: number) => Promise<boolean>;
  completeSpin: (userId: string, selectedIndex: number) => Promise<void>;
  abortSpin: (userId: string) => Promise<void>;
  onSpinResult: (callback: (result: SpinResult) => void) => () => void;
}

export function useLiveShare(
  meetingId: string,
  options: UseLiveShareOptions = {}
): UseLiveShareResult {
  const { enabled = true, autoConnect = true, retryAttempts = 3 } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const synchronizerRef = useRef<SpinSynchronizer | null>(null);
  const resilienceRef = useRef<NetworkResilience | null>(null);
  const stateUnsubscribeRef = useRef<(() => void) | null>(null);
  const resultListenersRef = useRef<Set<(result: SpinResult) => void>>(new Set());

  // Initialize synchronizer
  useEffect(() => {
    if (!enabled || !autoConnect || !meetingId) return;

    const initializeSynchronizer = async (): Promise<void> => {
      try {
        setError(null);

        synchronizerRef.current = new SpinSynchronizer();
        resilienceRef.current = new NetworkResilience(retryAttempts);

        // Initialize with retry logic
        await resilienceRef.current.executeWithRetry(
          () => synchronizerRef.current!.initialize(meetingId),
          (attempt, err) => {
            console.warn(`Live Share initialization attempt ${attempt} failed:`, err);
          }
        );

        // Subscribe to state changes
        if (synchronizerRef.current) {
          stateUnsubscribeRef.current = synchronizerRef.current.onStateChange((newState) => {
            setSyncState(newState);
          });

          // Subscribe to spin results
          synchronizerRef.current.onSpinResult((result) => {
            resultListenersRef.current.forEach((listener) => listener(result));
          });
        }

        setIsConnected(true);
        console.log('Live Share synchronizer initialized');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Live Share';
        setError(errorMessage);
        console.error('Live Share initialization error:', err);
        setIsConnected(false);
      }
    };

    initializeSynchronizer();

    return () => {
      if (stateUnsubscribeRef.current) {
        stateUnsubscribeRef.current();
      }
      synchronizerRef.current?.disconnect();
    };
  }, [enabled, autoConnect, meetingId, retryAttempts]);

  const requestSpin = async (userId: string, participantCount: number): Promise<boolean> => {
    if (!synchronizerRef.current || !isConnected) {
      setError('Live Share not connected');
      return false;
    }

    try {
      const success = await synchronizerRef.current.requestSpin(userId, participantCount);
      if (!success) {
        setError('Spin already in progress');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request spin';
      setError(errorMessage);
      console.error('Request spin error:', err);
      return false;
    }
  };

  const completeSpin = async (userId: string, selectedIndex: number): Promise<void> => {
    if (!synchronizerRef.current || !isConnected) {
      throw new Error('Live Share not connected');
    }

    try {
      await synchronizerRef.current.completeSpin(userId, selectedIndex);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete spin';
      setError(errorMessage);
      console.error('Complete spin error:', err);
      throw err;
    }
  };

  const abortSpin = async (userId: string): Promise<void> => {
    if (!synchronizerRef.current || !isConnected) {
      return;
    }

    try {
      await synchronizerRef.current.abortSpin(userId);
      setError(null);
    } catch (err) {
      console.error('Abort spin error:', err);
    }
  };

  const onSpinResult = (callback: (result: SpinResult) => void): (() => void) => {
    resultListenersRef.current.add(callback);
    return () => resultListenersRef.current.delete(callback);
  };

  return {
    isConnected,
    isSpinning: syncState?.isSpinning ?? false,
    syncState,
    error,
    requestSpin,
    completeSpin,
    abortSpin,
    onSpinResult,
  };
}
