import { useCallback, useEffect, useRef, useState } from 'react';
import { useMeetingContext } from '@/hooks/useMeetingContext';
import { useParticipants } from '@/hooks/useParticipants';
import { WheelDisplay } from '@/components/WheelDisplay';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { saveSpinResult, getSpinHistory, type SpinResult } from '@/services/historyService';
import type { Participant } from '@/types/meeting';

const DEV_PARTICIPANTS: Participant[] = [
  { id: 'dev-1', displayName: 'Alice Johnson', participantRole: 'Presenter' },
  { id: 'dev-2', displayName: 'Bob Smith', participantRole: 'Attendee' },
  { id: 'dev-3', displayName: 'Carol Williams', participantRole: 'Attendee' },
  { id: 'dev-4', displayName: 'David Brown', participantRole: 'Attendee' },
  { id: 'dev-5', displayName: 'Emma Davis', participantRole: 'Attendee' },
  { id: 'dev-6', displayName: 'Frank Miller', participantRole: 'Attendee' },
  { id: 'dev-7', displayName: 'Grace Lee', participantRole: 'Attendee' },
  { id: 'dev-8', displayName: 'Henry Wilson', participantRole: 'Attendee' },
];

const DEV_SPIN_HISTORY: SpinResult[] = [
  { meeting_id: 'dev', winner_name: 'Alice Johnson', spun_by: 'Frank Miller',  spun_at: '2026-08-11T09:00:00Z' },
  { meeting_id: 'dev', winner_name: 'Bob Smith',     spun_by: 'Emma Davis',    spun_at: '2026-08-11T09:10:00Z' },
  { meeting_id: 'dev', winner_name: 'Alice Johnson', spun_by: 'Frank Miller',  spun_at: '2026-08-11T09:20:00Z' },
  { meeting_id: 'dev', winner_name: 'Henry Wilson',  spun_by: 'Grace Lee',     spun_at: '2026-08-11T09:30:00Z' },
  { meeting_id: 'dev', winner_name: 'Bob Smith',     spun_by: 'Frank Miller',  spun_at: '2026-08-10T14:00:00Z' },
  { meeting_id: 'dev', winner_name: 'Alice Johnson', spun_by: 'Emma Davis',    spun_at: '2026-08-10T14:10:00Z' },
  { meeting_id: 'dev', winner_name: 'Carol Williams',spun_by: 'Grace Lee',     spun_at: '2026-08-10T14:20:00Z' },
  { meeting_id: 'dev', winner_name: 'Alice Johnson', spun_by: 'Frank Miller',  spun_at: '2026-08-10T14:30:00Z' },
  { meeting_id: 'dev', winner_name: 'Bob Smith',     spun_by: 'Emma Davis',    spun_at: '2026-08-09T11:00:00Z' },
  { meeting_id: 'dev', winner_name: 'David Brown',   spun_by: 'Grace Lee',     spun_at: '2026-08-09T11:10:00Z' },
  { meeting_id: 'dev', winner_name: 'Alice Johnson', spun_by: 'Frank Miller',  spun_at: '2026-08-09T11:20:00Z' },
  { meeting_id: 'dev', winner_name: 'Henry Wilson',  spun_by: 'Alice Johnson', spun_at: '2026-08-09T11:30:00Z' },
];

export default function App() {
  const { context, isLoading: contextLoading } = useMeetingContext();
  const {
    participants,
    isLoading: participantsLoading,
    error: participantsError,
    selectFromPicker,
    fetchFromMeeting,
    setParticipants,
  } = useParticipants(
    context?.meetingId || '',
    context?.userId || '',
    context?.tenantId || '',
    context?.chatId || '',
  );

  // Auto-load from Graph on every open when chatId is available
  useEffect(() => {
    if (context?.chatId) {
      fetchFromMeeting().catch(() => {}); // Silent fail — picker is still available
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.chatId]);

  // In dev mode outside Teams, populate with mock participants so the wheel is visible
  useEffect(() => {
    if (import.meta.env.DEV && !contextLoading && !context && participants.length === 0) {
      setParticipants(DEV_PARTICIPANTS);
    }
  }, [contextLoading, context, participants.length, setParticipants]);

  const [showConfig, setShowConfig] = useState(false);
  const [spinHistory, setSpinHistory] = useState<SpinResult[]>([]);

  const participantsRef = useRef(participants);
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  useEffect(() => {
    if (context?.chatId) {
      getSpinHistory(context.chatId).then(setSpinHistory).catch(() => {});
    }
  }, [context?.chatId]);

  const handleWinnerConfirmed = useCallback(async (winner: Participant) => {
    if (!context?.chatId) return;
    const result = {
      meeting_id: context.chatId,
      winner_name: winner.displayName,
      spun_by: participantsRef.current.find(p => p.id === context.userId)?.displayName
        || context.userDisplayName
        || 'Unknown',
    };
    await saveSpinResult(result).catch(() => {});
    setSpinHistory(prev => [
      { ...result, spun_at: new Date().toISOString() },
      ...prev,
    ]);
  }, [context?.chatId, context?.userId, context?.userDisplayName]);

  const effectiveSpinHistory = import.meta.env.DEV && !context ? DEV_SPIN_HISTORY : spinHistory;

  // Determine theme from context
  const theme = context?.theme || 'default';

  if (contextLoading) {
    return (
      <div className="app-container">
        <div className="loading">
          <p>Initializing Teams context...</p>
        </div>
      </div>
    );
  }

  if (context?.frameContext === 'settings') {
    return (
      <div className="app-container">
        <div className="loading">
          <p>Ready — click <strong>Save</strong> to add Spin the Wheel to your meeting.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`app-container theme-${theme}`}>
        <header className="app-header">
          <h1>Spin the Wheel</h1>
          {participants.length > 0 && (
            <button
              className="settings-icon-button"
              onClick={() => setShowConfig(s => !s)}
              aria-label="Configure participants"
              title="Configure participants"
            >
              ⚙️
            </button>
          )}
        </header>

        <main className="app-main">
          {contextLoading ? (
            <div className="loading">
              <p>Initializing Teams context...</p>
            </div>
          ) : (
            <WheelDisplay
              allParticipants={participants}
              isLoading={participantsLoading}
              error={participantsError}
              onSelectParticipants={selectFromPicker}
              onReloadFromMeeting={context?.chatId ? fetchFromMeeting : undefined}
              onClearParticipants={() => setParticipants([])}
              showConfig={showConfig}
              onConfigClose={() => setShowConfig(false)}
              onWinnerConfirmed={handleWinnerConfirmed}
              spinHistory={effectiveSpinHistory}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
