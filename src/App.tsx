import { useMeetingContext } from '@/hooks/useMeetingContext';
import { useParticipants } from '@/hooks/useParticipants';

export default function App() {
  const { context, isLoading: contextLoading, error: contextError } = useMeetingContext();
  const { participants, isLoading: participantsLoading, error: participantsError } = useParticipants(
    context?.meetingId || '',
    context?.userId || '',
    context?.tenantId || ''
  );

  if (contextLoading) {
    return (
      <div className="app-container">
        <div className="loading">
          <p>Initializing Teams context...</p>
        </div>
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="app-container">
        <div className="error">
          <h2>Error</h2>
          <p>{contextError}</p>
          <p className="error-hint">This app requires Teams meeting context. Please open it from within a Teams meeting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container theme-${context?.theme || 'default'}`}>
      <header className="app-header">
        <h1>Spin the Wheel</h1>
        <p className="subtitle">Select a meeting participant</p>
      </header>

      <main className="app-main">
        {participantsLoading ? (
          <div className="loading">
            <p>Loading participants...</p>
          </div>
        ) : participantsError ? (
          <div className="error">
            <h2>Error Loading Participants</h2>
            <p>{participantsError}</p>
          </div>
        ) : (
          <div className="content">
            <div className="meeting-info">
              <p>Meeting: <strong>{context?.meetingTitle || 'Teams Meeting'}</strong></p>
              <p>Participants: <strong>{participants.length}</strong></p>
            </div>

            <div className="participants-preview">
              <h2>Meeting Participants</h2>
              <ul className="participants-list">
                {participants.map((participant) => (
                  <li key={participant.id} className="participant-item">
                    <span className="participant-name">{participant.displayName}</span>
                    {participant.participantRole && (
                      <span className="participant-role">{participant.participantRole}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="placeholder">
              <p>🎡 Wheel component will be rendered here in Phase 2</p>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p className="phase-indicator">Phase 1: Foundation & Context Access</p>
      </footer>
    </div>
  );
}
