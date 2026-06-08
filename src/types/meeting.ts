export interface Participant {
  id: string;
  displayName: string;
  email?: string;
  participantRole?: 'Presenter' | 'Attendee';
  profilePicture?: string;
}

export interface MeetingContext {
  meetingId: string;
  meetingTitle?: string;
  userId: string;
  userDisplayName: string;
  tenantId: string;
  frameContext: 'content' | 'sidePanel' | 'meetingStage' | 'meetingDetailsTab';
  theme?: 'default' | 'dark' | 'light' | 'contrast';
  isReady: boolean;
  error?: string;
}

export interface UseMeetingContextResult {
  context: MeetingContext | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseParticipantsResult {
  participants: Participant[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
