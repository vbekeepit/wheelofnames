import type { Participant } from '@/types/meeting';

interface GraphMember {
  '@odata.type': string;
  id: string;
  userId?: string;
  displayName?: string;
  email?: string;
  roles?: string[];
}

interface GraphMembersResponse {
  value: GraphMember[];
  '@odata.nextLink'?: string;
}

interface PresenceRecord {
  id: string;
  activity: string;
}

const ACTIVE_ACTIVITIES = new Set(['InAMeeting', 'InAConferenceCall', 'InACall', 'Presenting']);

export async function filterToActiveParticipants(
  participants: Participant[],
  token: string
): Promise<Participant[]> {
  if (participants.length === 0) return participants;
  try {
    const resp = await fetch(
      'https://graph.microsoft.com/v1.0/communications/getPresencesByUserId',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: participants.map(p => p.id) }),
      }
    );
    if (!resp.ok) return participants; // Presence.Read.All not yet consented — show all

    const data: { value: PresenceRecord[] } = await resp.json();
    const activityById = new Map(data.value.map(p => [p.id, p.activity]));

    const active = participants.filter(p => {
      const activity = activityById.get(p.id);
      // Unknown presence (external/guest users) → include; known but not in meeting → exclude
      return !activity || ACTIVE_ACTIVITIES.has(activity);
    });

    // Fallback: don't return empty list (e.g. before anyone has joined)
    return active.length > 0 ? active : participants;
  } catch {
    return participants;
  }
}

export async function getMeetingMembers(chatId: string, token: string): Promise<Participant[]> {
  const participants: Participant[] = [];
  let url: string | undefined =
    `https://graph.microsoft.com/v1.0/chats/${encodeURIComponent(chatId)}/members`;

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Graph API error ${response.status}: ${response.statusText}`);
    }

    const data: GraphMembersResponse = await response.json();

    for (const member of data.value) {
      if (!member.displayName) continue;
      participants.push({
        id: member.userId ?? member.id,
        displayName: member.displayName,
        email: member.email,
        participantRole: member.roles?.includes('owner') ? 'Presenter' : 'Attendee',
      });
    }

    url = data['@odata.nextLink'];
  }

  return participants;
}
