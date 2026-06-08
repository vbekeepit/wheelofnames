import { useEffect, useState } from 'react';
import { app } from '@microsoft/teams-js';
import type { MeetingContext, UseMeetingContextResult } from '@/types/meeting';

export function useMeetingContext(): UseMeetingContextResult {
  const [context, setContext] = useState<MeetingContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeTeamsContext = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize TeamsJS
        await app.initialize();

        // Get context from Teams
        const teamsContext = await app.getContext();

        // Validate required fields
        if (!teamsContext.meeting?.id) {
          throw new Error('Meeting context not available. This app requires Teams meeting context.');
        }

        if (!teamsContext.user?.id) {
          throw new Error('User context not available.');
        }

        // Normalize context
        const meetingContext: MeetingContext = {
          meetingId: teamsContext.meeting.id,
          meetingTitle: teamsContext.meeting.title,
          userId: teamsContext.user.id,
          userDisplayName: teamsContext.user.displayName,
          tenantId: teamsContext.user.tenantId,
          frameContext: (teamsContext.frameContext as MeetingContext['frameContext']) || 'content',
          theme: teamsContext.app.theme as MeetingContext['theme'],
          isReady: true,
        };

        setContext(meetingContext);

        // Register theme change handler
        app.registerOnThemeChangeHandler((newTheme) => {
          setContext((prev) => (prev ? { ...prev, theme: newTheme as MeetingContext['theme'] } : null));
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Teams context';
        setError(errorMessage);
        console.error('Teams context initialization error:', err);

        // In development, create a mock context for testing
        if (import.meta.env.DEV) {
          console.warn('Using mock context for development');
          const mockContext: MeetingContext = {
            meetingId: 'mock-meeting-id',
            meetingTitle: 'Test Meeting',
            userId: 'mock-user-id',
            userDisplayName: 'Test User',
            tenantId: 'mock-tenant-id',
            frameContext: 'sidePanel',
            theme: 'default',
            isReady: true,
          };
          setContext(mockContext);
          setError(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeTeamsContext();
  }, []);

  return { context, isLoading, error };
}
