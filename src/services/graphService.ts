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
