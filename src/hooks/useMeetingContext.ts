import { useEffect, useState } from 'react';
import { app, pages } from '@microsoft/teams-js';
import type { MeetingContext, UseMeetingContextResult } from '@/types/meeting';

const APP_URL = 'https://vbekeepit.github.io/wheelofnames/';

export function useMeetingContext(): UseMeetingContextResult {
  const [context, setContext] = useState<MeetingContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeTeamsContext = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await app.initialize();
        const teamsContext = await app.getContext();

        // Attempt to register tab configuration. pages.config APIs throw when
        // called outside the settings context, so use try-catch as the definitive
        // detector — isSupported() and frameContext are unreliable in sidePanel.
        let registeredAsConfig = false;
        try {
          await pages.config.setConfig({
            contentUrl: APP_URL,
            entityId: 'spin-the-wheel',
            suggestedDisplayName: 'Spin the Wheel',
            websiteUrl: APP_URL,
          });
          pages.config.setValidityState(true);
          registeredAsConfig = true;
        } catch {
          // Not in the settings context — proceed with normal meeting init
        }

        const frameContext = ((teamsContext.page?.frameContext as string) ?? 'sidePanel') as MeetingContext['frameContext'];

        const meetingContext: MeetingContext = {
          // meeting.id is not always available; chat.id is the meeting thread fallback
          meetingId: teamsContext.meeting?.id ?? teamsContext.chat?.id ?? '',
          meetingTitle: ((teamsContext.meeting as unknown) as Record<string, unknown>)?.title as string ?? '',
          userId: teamsContext.user?.id ?? '',
          userDisplayName: teamsContext.user?.displayName ?? '',
          tenantId: teamsContext.user?.tenant?.id ?? '',
          frameContext: registeredAsConfig ? 'settings' : frameContext,
          theme: (teamsContext.app?.theme ?? 'default') as MeetingContext['theme'],
          isReady: true,
        };

        setContext(meetingContext);

        app.registerOnThemeChangeHandler((newTheme) => {
          setContext((prev) => (prev ? { ...prev, theme: newTheme as MeetingContext['theme'] } : null));
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Teams context';
        setError(errorMessage);
        console.error('Teams context initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTeamsContext();
  }, []);

  return { context, isLoading, error };
}
