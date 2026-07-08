import { useState } from 'react';
import { people } from '@microsoft/teams-js';
import type { Participant, UseParticipantsResult } from '@/types/meeting';

export interface UseParticipantsOptions {
  accessToken?: string;
}

export function useParticipants(
  _meetingId: string,
  _userId: string,
  _tenantId: string,
  _options: UseParticipantsOptions = {}
): UseParticipantsResult {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFromPicker = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const results = await people.selectPeople({
        title: 'Select participants for the wheel',
        setSelected: [],
        openOrgWideSearchInChatOrChannel: false,
        singleSelect: false,
      });

      const selected: Participant[] = results.map((p) => ({
        id: p.objectId,
        displayName: p.displayName ?? p.email ?? p.objectId,
        email: p.email,
      }));

      if (selected.length === 0) {
        setError('No participants selected.');
        return;
      }

      setParticipants(selected);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'People picker failed';
      console.error('selectFromPicker error:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async (): Promise<void> => {
    await selectFromPicker();
  };

  return { participants, isLoading, error, refetch, selectFromPicker };
}
