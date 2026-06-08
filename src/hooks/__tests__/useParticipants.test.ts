import { renderHook, waitFor } from '@testing-library/react';
import { useParticipants } from '../useParticipants';

describe('useParticipants', () => {
  it('should return mock participants', async () => {
    const { result } = renderHook(() =>
      useParticipants('test-meeting-id', 'test-user-id', 'test-tenant-id')
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.participants.length).toBe(0);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.participants.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('should have correct participant structure', async () => {
    const { result } = renderHook(() =>
      useParticipants('test-meeting-id', 'test-user-id', 'test-tenant-id')
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const participant = result.current.participants[0];
    expect(participant).toHaveProperty('id');
    expect(participant).toHaveProperty('displayName');
    expect(participant).toHaveProperty('email');
    expect(participant).toHaveProperty('participantRole');
  });

  it('should handle missing context', async () => {
    const { result } = renderHook(() => useParticipants('', '', ''));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error).toContain('Missing required context');
  });

  it('should refetch participants', async () => {
    const { result } = renderHook(() =>
      useParticipants('test-meeting-id', 'test-user-id', 'test-tenant-id')
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCount = result.current.participants.length;

    await result.current.refetch();

    expect(result.current.participants.length).toBe(initialCount);
  });
});
