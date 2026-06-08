import { useEffect, useState } from 'react';
import type { Participant, UseParticipantsResult } from '@/types/meeting';

// Mock participants for Phase 1 development
const MOCK_PARTICIPANTS: Participant[] = [
  { id: '1', displayName: 'Alice Johnson', email: 'alice@example.com', participantRole: 'Presenter' },
  { id: '2', displayName: 'Bob Smith', email: 'bob@example.com', participantRole: 'Attendee' },
  { id: '3', displayName: 'Carol White', email: 'carol@example.com', participantRole: 'Attendee' },
  { id: '4', displayName: 'David Brown', email: 'david@example.com', participantRole: 'Attendee' },
  { id: '5', displayName: 'Eve Davis', email: 'eve@example.com', participantRole: 'Attendee' },
  { id: '6', displayName: 'Frank Miller', email: 'frank@example.com', participantRole: 'Attendee' },
  { id: '7', displayName: 'Grace Lee', email: 'grace@example.com', participantRole: 'Attendee' },
  { id: '8', displayName: 'Henry Wilson', email: 'henry@example.com', participantRole: 'Attendee' },
];

export function useParticipants(meetingId: string, userId: string, tenantId: string): UseParticipantsResult {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Phase 1: Mock data implementation
      // In Phase 4, replace with:
      // 1. Try Graph API: /me/events/{eventId}/attendees
      // 2. Fallback to Bot API: TeamsInfo.getMeetingParticipant()

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!meetingId || !userId || !tenantId) {
        throw new Error('Missing required context: meetingId, userId, or tenantId');
      }

      // For Phase 1, return mock participants
      setParticipants(MOCK_PARTICIPANTS);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch participants';
      setError(errorMessage);
      console.error('Participants fetch error:', err);

      // Fallback to mock data on error in development
      if (import.meta.env.DEV) {
        setParticipants(MOCK_PARTICIPANTS);
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (meetingId && userId && tenantId) {
      fetchParticipants();
    }
  }, [meetingId, userId, tenantId]);

  return {
    participants,
    isLoading,
    error,
    refetch: fetchParticipants,
  };
}
