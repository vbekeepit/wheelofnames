import { useEffect, useState, useRef } from 'react';
import type { Participant, UseParticipantsResult } from '@/types/meeting';
import { fetchParticipantsHybrid, ParticipantCache, subscribeToParticipantUpdates } from '@/services/teamsApiService';

// Fallback mock participants for development/testing
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

// Shared participant cache (5-minute TTL)
const participantCache = new ParticipantCache(300);

export interface UseParticipantsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCache?: boolean;
  accessToken?: string;
}

export function useParticipants(
  meetingId: string,
  userId: string,
  tenantId: string,
  options: UseParticipantsOptions = {}
): UseParticipantsResult {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableCache = true,
    accessToken,
  } = options;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cacheKey = `${meetingId}:${tenantId}`;

  const fetchParticipants = async (useCache = true): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required context
      if (!meetingId || !userId || !tenantId) {
        throw new Error('Missing required context: meetingId, userId, or tenantId');
      }

      // Check cache first
      if (useCache && enableCache) {
        const cached = participantCache.get(cacheKey);
        if (cached && cached.length > 0) {
          console.log('Using cached participants');
          setParticipants(cached);
          setIsLoading(false);
          return;
        }
      }

      // Try to fetch from Teams APIs
      console.log('Fetching participants from Teams...');
      const fetchedParticipants = await fetchParticipantsHybrid(
        meetingId,
        userId,
        tenantId,
        accessToken
      );

      if (fetchedParticipants.length === 0) {
        throw new Error('No participants returned from Teams API');
      }

      // Cache the result
      if (enableCache) {
        participantCache.set(cacheKey, fetchedParticipants);
      }

      setParticipants(fetchedParticipants);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch participants';
      console.error('Participants fetch error:', err);
      setError(errorMessage);

      // Fallback to mock data in development
      if (import.meta.env.DEV) {
        console.warn('Using mock participants (development fallback)');
        setParticipants(MOCK_PARTICIPANTS);
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async (skipCache = false): Promise<void> => {
    if (skipCache) {
      participantCache.invalidate(cacheKey);
    }
    await fetchParticipants(!skipCache);
  };

  // Initial fetch
  useEffect(() => {
    if (meetingId && userId && tenantId) {
      fetchParticipants(true);
    }
  }, [meetingId, userId, tenantId]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !meetingId) return;

    refreshTimerRef.current = setInterval(() => {
      fetchParticipants(true);
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, meetingId]);

  // Subscribe to participant updates
  useEffect(() => {
    if (!meetingId) return;

    try {
      unsubscribeRef.current = subscribeToParticipantUpdates(
        meetingId,
        (updatedParticipants) => {
          setParticipants(updatedParticipants);
          if (enableCache) {
            participantCache.set(cacheKey, updatedParticipants);
          }
        },
        (error) => {
          console.warn('Participant update subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to subscribe to participant updates:', err);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [meetingId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    participants,
    isLoading,
    error,
    refetch,
  };
}
