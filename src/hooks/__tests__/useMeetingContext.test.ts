import { renderHook, waitFor } from '@testing-library/react';
import { useMeetingContext } from '../useMeetingContext';
import { app } from '@microsoft/teams-js';

jest.mock('@microsoft/teams-js');

describe('useMeetingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize and return meeting context', async () => {
    (app.initialize as jest.Mock).mockResolvedValueOnce(undefined);
    (app.getContext as jest.Mock).mockResolvedValueOnce({
      meeting: {
        id: 'test-meeting-id',
        title: 'Test Meeting',
      },
      user: {
        id: 'test-user-id',
        displayName: 'Test User',
        tenantId: 'test-tenant-id',
      },
      frameContext: 'sidePanel',
      app: {
        theme: 'default',
      },
    });

    const { result } = renderHook(() => useMeetingContext());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.context).toBeDefined();
    expect(result.current.context?.meetingId).toBe('test-meeting-id');
    expect(result.current.context?.userId).toBe('test-user-id');
    expect(result.current.context?.isReady).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle error when meeting context is missing', async () => {
    (app.initialize as jest.Mock).mockResolvedValueOnce(undefined);
    (app.getContext as jest.Mock).mockResolvedValueOnce({
      user: {
        id: 'test-user-id',
        displayName: 'Test User',
        tenantId: 'test-tenant-id',
      },
      app: { theme: 'default' },
      // meeting is missing
    });

    const { result } = renderHook(() => useMeetingContext());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error).toContain('Meeting context not available');
  });

  it('should register theme change handler', async () => {
    (app.initialize as jest.Mock).mockResolvedValueOnce(undefined);
    (app.getContext as jest.Mock).mockResolvedValueOnce({
      meeting: { id: 'test-meeting-id', title: 'Test Meeting' },
      user: { id: 'test-user-id', displayName: 'Test User', tenantId: 'test-tenant-id' },
      frameContext: 'sidePanel',
      app: { theme: 'default' },
    });

    renderHook(() => useMeetingContext());

    await waitFor(() => {
      expect(app.registerOnThemeChangeHandler).toHaveBeenCalled();
    });
  });
});
