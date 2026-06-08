/**
 * Teams API integration service
 * Handles participant data retrieval from Teams context
 */

import type { Participant } from '@/types/meeting';

/**
 * Fetch participants from Microsoft Graph API
 * Graph endpoint: /me/events/{eventId}/attendees
 */
export async function fetchParticipantsFromGraph(
  meetingId: string,
  accessToken: string
): Promise<Participant[]> {
  try {
    // This would be a real Graph API call in production
    // For now, we'll use a simulated endpoint
    const endpoint = `https://graph.microsoft.com/v1.0/me/calendarview?$search=${meetingId}`;

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Graph response to Participant format
    const participants: Participant[] = (data.value || []).map(
      (item: Record<string, unknown>) => ({
        id: (item.id as string) || '',
        displayName: (item.displayName as string) || 'Unknown',
        email: (item.emailAddress as string) || undefined,
        participantRole: 'Attendee' as const,
      })
    );

    return participants;
  } catch (error) {
    console.error('Graph API participant fetch failed:', error);
    throw error;
  }
}

/**
 * Fetch participants via Teams Bot Framework
 * Uses TeamsInfo.getMeetingParticipant() server-side
 */
export async function fetchParticipantsFromTeamsBot(
  meetingId: string,
  userId: string,
  tenantId: string,
  botServiceUrl: string = '/api/teams'
): Promise<Participant[]> {
  try {
    const response = await fetch(`${botServiceUrl}/participants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingId,
        userId,
        tenantId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Bot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.participants as Participant[];
  } catch (error) {
    console.error('Teams Bot participant fetch failed:', error);
    throw error;
  }
}

/**
 * Hybrid approach: try Graph API first, fallback to Bot API
 */
export async function fetchParticipantsHybrid(
  meetingId: string,
  userId: string,
  tenantId: string,
  accessToken?: string,
  botServiceUrl?: string
): Promise<Participant[]> {
  // Try Graph API if access token is available
  if (accessToken) {
    try {
      console.log('Fetching participants from Graph API...');
      return await fetchParticipantsFromGraph(meetingId, accessToken);
    } catch (graphError) {
      console.warn('Graph API failed, falling back to Bot API:', graphError);
    }
  }

  // Fallback to Bot API
  try {
    console.log('Fetching participants from Teams Bot API...');
    return await fetchParticipantsFromTeamsBot(meetingId, userId, tenantId, botServiceUrl);
  } catch (botError) {
    console.error('Both Graph and Bot API failed:', botError);
    throw new Error('Unable to fetch participants from Teams APIs');
  }
}

/**
 * Get paginated participants (for large meetings)
 */
export async function fetchParticipantsPaginated(
  meetingId: string,
  userId: string,
  tenantId: string,
  pageSize: number = 50
): Promise<Participant[]> {
  const allParticipants: Participant[] = [];
  let pageNumber = 1;
  let hasMore = true;

  while (hasMore && pageNumber <= 10) {
    // Limit to 10 pages max (500 participants)
    try {
      const response = await fetch('/api/teams/participants/paginated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          userId,
          tenantId,
          pageNumber,
          pageSize,
        }),
      });

      if (!response.ok) break;

      const data = await response.json();
      allParticipants.push(...(data.participants || []));

      hasMore = data.hasMore === true;
      pageNumber++;
    } catch (error) {
      console.error(`Error fetching page ${pageNumber}:`, error);
      break;
    }
  }

  return allParticipants;
}

/**
 * Listen to participant join/leave events via bot notifications
 */
export function subscribeToParticipantUpdates(
  meetingId: string,
  onUpdate: (participants: Participant[]) => void,
  onError?: (error: Error) => void
): () => void {
  // In production, this would use a WebSocket or Server-Sent Events
  // For now, we'll use a polling approach

  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/teams/participants/${meetingId}`);
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.participants);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, 5000); // Poll every 5 seconds

  // Return unsubscribe function
  return () => clearInterval(pollInterval);
}

/**
 * Cache participants locally with TTL
 */
export class ParticipantCache {
  private cache: Map<string, { data: Participant[]; timestamp: number }> = new Map();
  private ttl: number; // milliseconds

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  set(key: string, participants: Participant[]): void {
    this.cache.set(key, {
      data: participants,
      timestamp: Date.now(),
    });
  }

  get(key: string): Participant[] | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}
