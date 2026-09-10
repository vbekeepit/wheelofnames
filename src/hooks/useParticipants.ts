import { useState, useEffect } from 'react';
import { dialog } from '@microsoft/teams-js';
import type { PeoplePickerResult } from '@microsoft/teams-js';
import type { Participant, UseParticipantsResult } from '@/types/meeting';
import { getGraphToken } from '@/services/authService';
import { getMeetingMembers, filterToOnlineParticipants } from '@/services/graphService';

const STORAGE_KEY = 'spin-the-wheel:participants';
const PICKER_URL = 'https://vbekeepit.github.io/wheelofnames/?mode=picker';

// Base names (no company suffix) of participants permanently excluded from
// selection. We strip everything after the first | – – — separator before
// comparing, so "Anders Dalgaard | Keepit", "Anders Dalgaard", and
// "Anders Dalgaard– Keepit" all resolve to the same key.
const EXCLUDED_BASE_NAMES = new Set([
  'anders dalgaard',
  'vladyslav babak',
  'stas shymanskyi',
  'dmi leadership',
]);

function baseName(displayName: string): string {
  return displayName.split(/\s*[|–—]\s*/)[0].trim().toLowerCase();
}

function excludeBlocked(participants: Participant[]): Participant[] {
  return participants.filter(p => !EXCLUDED_BASE_NAMES.has(baseName(p.displayName)));
}

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
  const [participants, setParticipantsState] = useState<Participant[]>(() => excludeBlocked(load()));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    save(participants);
  }, [participants]);

  const setParticipants = (next: Participant[]) => {
    setParticipantsState(excludeBlocked(next));
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
            // Dialog was closed/cancelled — not an error, just dismiss silently
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
            return excludeBlocked([...prev, ...mapped.filter((p) => !existingIds.has(p.id))]);
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
      const online = excludeBlocked(await filterToOnlineParticipants(fetched, token));
      if (online.length > 0) {
        save(online);
        setParticipantsState(online);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meeting participants');
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async (): Promise<void> => {
    await fetchFromMeeting();
  };

  return { participants, isLoading, error, refetch, selectFromPicker, fetchFromMeeting, setParticipants };
}
