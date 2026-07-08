import { useState, useEffect } from 'react';
import type { Participant, UseParticipantsResult } from '@/types/meeting';

const STORAGE_KEY = 'spin-the-wheel:participants';

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
  _tenantId: string,
  _options: UseParticipantsOptions = {}
): UseParticipantsResult {
  const [participants, setParticipants] = useState<Participant[]>(load);
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    save(participants);
  }, [participants]);

  const selectFromPicker = async (): Promise<void> => {
    // people.selectPeople() is not available in sidePanel context;
    // participant management is handled via the inline editor in WheelDisplay.
    setError(null);
  };

  const refetch = async (): Promise<void> => {
    setParticipants(load());
  };

  return { participants, isLoading, error, refetch, selectFromPicker, setParticipants };
}
