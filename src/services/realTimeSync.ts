/**
 * Real-time synchronization service using Live Share SDK
 * Handles distributed spin locking and state coordination
 */

export interface SyncState {
  isSpinning: boolean;
  lastSpinBy: string;
  lastSpinAt: number;
  selectedIndex: number | null;
}

export interface SpinResult {
  selectedIndex: number;
  selectedBy: string;
  timestamp: number;
}

/**
 * Distributed lock for preventing concurrent spins
 * Uses a simple mutex pattern with timeout
 */
export class DistributedSpinLock {
  private lockHolder: string | null = null;
  private lockTimestamp: number = 0;
  private lockTimeout: number = 5000; // 5 seconds
  private lockListeners: Set<(state: boolean) => void> = new Set();

  async acquire(userId: string): Promise<boolean> {
    const now = Date.now();

    // Check if lock is held and not expired
    if (this.lockHolder && now - this.lockTimestamp < this.lockTimeout) {
      return false; // Lock is held by someone else
    }

    // Acquire lock
    this.lockHolder = userId;
    this.lockTimestamp = now;
    this.notifyListeners(true);

    return true;
  }

  async release(userId: string): Promise<boolean> {
    if (this.lockHolder !== userId) {
      return false; // Not the lock holder
    }

    // Release lock
    this.lockHolder = null;
    this.lockTimestamp = 0;
    this.notifyListeners(false);

    return true;
  }

  isLocked(): boolean {
    const now = Date.now();
    // Check if lock is expired
    if (this.lockHolder && now - this.lockTimestamp >= this.lockTimeout) {
      this.lockHolder = null;
      return false;
    }
    return !!this.lockHolder;
  }

  getLockHolder(): string | null {
    return this.isLocked() ? this.lockHolder : null;
  }

  onLockChange(listener: (isLocked: boolean) => void): () => void {
    this.lockListeners.add(listener);
    return () => this.lockListeners.delete(listener);
  }

  private notifyListeners(isLocked: boolean): void {
    this.lockListeners.forEach((listener) => listener(isLocked));
  }

  reset(): void {
    this.lockHolder = null;
    this.lockTimestamp = 0;
    this.lockListeners.clear();
  }
}

/**
 * Spin state synchronizer
 * Coordinates spin events across participants
 */
export class SpinSynchronizer {
  private lock: DistributedSpinLock;
  private state: SyncState = {
    isSpinning: false,
    lastSpinBy: '',
    lastSpinAt: 0,
    selectedIndex: null,
  };
  private stateListeners: Set<(state: SyncState) => void> = new Set();
  private spinResultListeners: Set<(result: SpinResult) => void> = new Set();
  private messageQueue: Array<{ type: string; data: unknown }> = [];
  private isConnected = false;

  constructor() {
    this.lock = new DistributedSpinLock();
  }

  /**
   * Initialize synchronizer (would connect to Live Share in real implementation)
   */
  async initialize(meetingId: string): Promise<void> {
    console.log(`Initializing spin synchronizer for meeting: ${meetingId}`);

    // In a real implementation, this would:
    // 1. Connect to Live Share session
    // 2. Register message handlers
    // 3. Load initial state
    // 4. Setup heartbeat

    this.isConnected = true;
  }

  /**
   * Request spin with distributed locking
   */
  async requestSpin(userId: string, participantCount: number): Promise<boolean> {
    // Try to acquire lock
    const hasLock = await this.lock.acquire(userId);

    if (!hasLock) {
      console.warn(`Spin denied for ${userId}: Lock held by ${this.lock.getLockHolder()}`);
      return false;
    }

    // Broadcast spin started event
    this.broadcastMessage({
      type: 'spinStarted',
      data: {
        userId,
        timestamp: Date.now(),
      },
    });

    // Update local state
    this.state.isSpinning = true;
    this.state.lastSpinBy = userId;
    this.state.lastSpinAt = Date.now();
    this.notifyStateChange();

    return true;
  }

  /**
   * Complete spin with winner
   */
  async completeSpin(userId: string, selectedIndex: number): Promise<void> {
    // Verify lock holder
    if (this.lock.getLockHolder() !== userId) {
      console.error(`Spin completion denied: ${userId} does not hold lock`);
      return;
    }

    const result: SpinResult = {
      selectedIndex,
      selectedBy: userId,
      timestamp: Date.now(),
    };

    // Broadcast spin result to all participants
    this.broadcastMessage({
      type: 'spinCompleted',
      data: result,
    });

    // Update state
    this.state.isSpinning = false;
    this.state.selectedIndex = selectedIndex;
    this.notifyStateChange();
    this.notifySpinResult(result);

    // Release lock
    await this.lock.release(userId);
  }

  /**
   * Abort spin (in case of error or timeout)
   */
  async abortSpin(userId: string): Promise<void> {
    if (this.lock.getLockHolder() !== userId) {
      return;
    }

    this.broadcastMessage({
      type: 'spinAborted',
      data: {
        userId,
        timestamp: Date.now(),
      },
    });

    this.state.isSpinning = false;
    this.notifyStateChange();
    await this.lock.release(userId);
  }

  /**
   * Broadcast message to all participants
   */
  private broadcastMessage(message: { type: string; data: unknown }): void {
    if (!this.isConnected) {
      // Queue message if not connected
      this.messageQueue.push(message);
      return;
    }

    // In real implementation, send via Live Share
    console.log('Broadcasting message:', message);
  }

  /**
   * Handle incoming message from another participant
   */
  handleRemoteMessage(message: { type: string; data: unknown }): void {
    console.log('Received remote message:', message);

    switch (message.type) {
      case 'spinStarted':
        this.state.isSpinning = true;
        this.notifyStateChange();
        break;

      case 'spinCompleted': {
        const result = message.data as SpinResult;
        this.state.isSpinning = false;
        this.state.selectedIndex = result.selectedIndex;
        this.notifyStateChange();
        this.notifySpinResult(result);
        break;
      }

      case 'spinAborted':
        this.state.isSpinning = false;
        this.notifyStateChange();
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Get current state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Check if spin is locked
   */
  isSpinLocked(): boolean {
    return this.lock.isLocked();
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: SyncState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Subscribe to spin results
   */
  onSpinResult(listener: (result: SpinResult) => void): () => void {
    this.spinResultListeners.add(listener);
    return () => this.spinResultListeners.delete(listener);
  }

  private notifyStateChange(): void {
    this.stateListeners.forEach((listener) => listener(this.getState()));
  }

  private notifySpinResult(result: SpinResult): void {
    this.spinResultListeners.forEach((listener) => listener(result));
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    this.lock.reset();
    this.stateListeners.clear();
    this.spinResultListeners.clear();
    this.messageQueue = [];
    this.isConnected = false;
  }
}

/**
 * Handle network failures with retry logic
 */
export class NetworkResilience {
  private maxRetries: number;
  private retryDelay: number;
  private retryBackoff: number;

  constructor(maxRetries: number = 3, retryDelayMs: number = 1000, backoff: number = 1.5) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelayMs;
    this.retryBackoff = backoff;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Attempt ${attempt} failed:`, lastError.message);

        onRetry?.(attempt, lastError);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(this.retryBackoff, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Calculate backoff delay
   */
  getDelay(attempt: number): number {
    return this.retryDelay * Math.pow(this.retryBackoff, attempt - 1);
  }
}
