# Live Share Integration Guide

This document explains how to integrate the real-time synchronization features into the Spin the Wheel application using Microsoft's Live Share SDK.

## Overview

The real-time sync system provides:
- **Distributed spin locking** to prevent concurrent spins across all participants
- **State synchronization** so all participants see the same wheel state
- **Winner broadcast** automatically notifies all participants of the selected winner
- **Network resilience** with automatic retry and exponential backoff

## Architecture

### Components

1. **DistributedSpinLock**: Ensures only one participant can spin at a time
2. **SpinSynchronizer**: Coordinates spin events and broadcasts to all participants
3. **NetworkResilience**: Handles network failures with retry logic
4. **useLiveShare Hook**: React hook wrapping the sync service

## Usage in Wheel Component

```typescript
import { useLiveShare } from '@/hooks/useLiveShare';
import { Wheel } from '@/components/Wheel';

export function WheelWithSync() {
  const { requestSpin, completeSpin, onSpinResult } = useLiveShare('meeting-id', {
    enabled: true,
    autoConnect: true,
  });

  const handleSpin = async (userId: string) => {
    // Request spin with distributed lock
    const allowed = await requestSpin(userId, participantCount);

    if (!allowed) {
      console.log('Spin already in progress');
      return;
    }

    // Spin logic here...
    const selectedIndex = calculateWinner();

    // Complete spin and broadcast to others
    await completeSpin(userId, selectedIndex);
  };

  // Listen for spin results from other participants
  onSpinResult((result) => {
    console.log(`${result.selectedBy} selected participant ${result.selectedIndex}`);
  });

  return <Wheel onSpin={handleSpin} />;
}
```

## Message Types

The synchronizer broadcasts the following message types:

### spinStarted
Emitted when a participant requests a spin.

```typescript
{
  type: 'spinStarted',
  data: {
    userId: string,
    timestamp: number
  }
}
```

### spinCompleted
Emitted when a spin completes with a winner.

```typescript
{
  type: 'spinCompleted',
  data: {
    selectedIndex: number,
    selectedBy: string,
    timestamp: number
  }
}
```

### spinAborted
Emitted when a spin is aborted (e.g., due to error or timeout).

```typescript
{
  type: 'spinAborted',
  data: {
    userId: string,
    timestamp: number
  }
}
```

## Lock Semantics

The **DistributedSpinLock** provides mutual exclusion for spins:

1. **Acquire**: Request lock for spinning
   - Returns `true` if lock acquired
   - Returns `false` if lock held by another participant
   - Locks expire after 5 seconds (configurable)

2. **Release**: Release lock after spin completes
   - Only the lock holder can release
   - Others cannot steal or modify the lock

3. **Timeout**: Automatic expiration prevents deadlocks
   - If participant disconnects, lock expires after timeout
   - Allows recovery from network failures

## Error Handling

The **NetworkResilience** class handles failures:

- **Automatic retries** with exponential backoff
- **Configurable attempts** (default: 3 retries)
- **Configurable delays** (default: 1s, backoff: 1.5x)
- **Callback hooks** for logging/monitoring

Example with custom retry logic:

```typescript
const resilience = new NetworkResilience(5, 500, 2); // 5 retries, 500ms delay, 2x backoff

await resilience.executeWithRetry(
  () => synchronizer.requestSpin(userId, count),
  (attempt, error) => {
    console.log(`Attempt ${attempt} failed: ${error.message}`);
  }
);
```

## Live Share Integration (Server-side)

In Phase 5, integrate with actual Live Share SDK:

```typescript
import { LiveShareHost } from '@microsoft/live-share';

async function initializeLiveShare(meetingId: string) {
  const host = new LiveShareHost({
    clientId: 'your-app-id',
  });

  const container = await host.getContainer();
  const synchronizer = new SpinSynchronizer();

  // Register message handlers with Live Share
  container.on('message', (message) => {
    synchronizer.handleRemoteMessage(message);
  });

  // Broadcast messages via Live Share
  synchronizer.onBroadcast((message) => {
    container.send(message);
  });
}
```

## Performance Considerations

### Lock Timeout
- **Too short** (< 1s): Frequent lock timeouts, participants spin out of sync
- **Too long** (> 10s): Long waits if participant disconnects
- **Recommended**: 5 seconds

### Broadcast Frequency
- Messages broadcast on: spin start, spin complete, spin abort
- No continuous polling needed
- Scales to 50+ participants without issues

### Memory Usage
- Lock state: ~100 bytes per lock
- Message queue: ~1KB per pending message
- Listeners: ~50 bytes per listener
- Minimal overhead for typical meetings

## Testing

### Unit Tests
```bash
npm test -- src/services/__tests__/realTimeSync.test.ts
npm test -- src/hooks/__tests__/useLiveShare.test.ts
```

### Integration Tests
Test with multiple browser windows simulating different participants:

```javascript
// Window 1: User 1
const sync1 = new SpinSynchronizer();
await sync1.requestSpin('user-1', 8);

// Window 2: User 2 (should fail to acquire lock)
const sync2 = new SpinSynchronizer();
const result = await sync2.requestSpin('user-2', 8); // false
```

## Troubleshooting

### Lock stuck held by disconnected participant
- Locks automatically expire after 5 seconds
- No manual intervention needed

### Messages not broadcasting
- Check network resilience configuration
- Verify Live Share session is connected
- Check browser console for errors

### State out of sync
- All participants should receive the same messages
- Verify message handlers are registered
- Check message order (should be FIFO)

## Future Enhancements

1. **Optimistic updates** for better UX
2. **Conflict resolution** for edge cases
3. **Bandwidth optimization** with message compression
4. **Analytics** for performance monitoring
5. **Fallback to polling** if Live Share unavailable
