import { useState, useEffect } from 'react';
import { dialog } from '@microsoft/teams-js';
import type { PeoplePickerResult } from '@microsoft/teams-js';
import type { Participant, UseParticipantsResult } from '@/types/meeting';
import { getGraphToken } from '@/services/authService';
import { getMeetingMembers } from '@/services/graphService';

const STORAGE_KEY = 'spin-the-wheel:participants';
const PICKER_URL = 'https://vbekeepit.github.io/wheelofnames/?mode=picker';

function load(): Participant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Participant[]) : [];
  } catch {
    return [];
  }
}

function save(participants: Participant[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
  } catch {
    // storage unavailable — silent fail
  }
}

export interface UseParticipantsOptions {
  accessToken?: string;
}

export function useParticipants(
  _meetingId: string,
  _userId: string,
  tenantId: string,
  chatId: string,
  _options: UseParticipantsOptions = {}
): UseParticipantsResult {
  const [participants, setParticipantsState] = useState<Participant[]>(load);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    save(participants);
  }, [participants]);

  const setParticipants = (next: Participant[]) => {
    setParticipantsState(next);
    setError(null);
  };

  const selectFromPicker = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      dialog.url.open(
        {
          url: PICKER_URL,
          size: { height: 500, width: 500 },
          title: 'Select participants',
        },
        (sdkResponse) => {
          setIsLoading(false);
          if (sdkResponse.err) {
            setError(sdkResponse.err.message ?? 'People picker failed');
            resolve();
            return;
          }
          const raw = sdkResponse.result;
          if (!raw) { resolve(); return; }

          const picked: PeoplePickerResult[] = typeof raw === 'string'
            ? JSON.parse(raw)
            : (raw as PeoplePickerResult[]);

          if (picked.length === 0) { resolve(); return; }

          const mapped: Participant[] = picked.map((p) => ({
            id: p.objectId,
            displayName: p.displayName ?? p.email ?? p.objectId,
            email: p.email,
          }));
          setParticipantsState((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const merged = [...prev, ...mapped.filter((p) => !existingIds.has(p.id))];
            save(merged);
            return merged;
          });
          resolve();
        }
      );
    });
  };

  const fetchFromMeeting = async (): Promise<void> => {
    if (!chatId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getGraphToken(tenantId);
      const fetched = await getMeetingMembers(chatId, token);
      if (fetched.length > 0) {
        setParticipantsState((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const merged = [...prev, ...fetched.filter((p) => !existingIds.has(p.id))];
          save(merged);
          return merged;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meeting participants');
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async (): Promise<void> => {
    setParticipantsState(load());
  };

  return { participants, isLoading, error, refetch, selectFromPicker, fetchFromMeeting, setParticipants };
}
