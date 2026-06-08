import { useMeetingContext } from '@/hooks/useMeetingContext';
import { useParticipants } from '@/hooks/useParticipants';
import { WheelDisplay } from '@/components/WheelDisplay';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App() {
  const { context, isLoading: contextLoading, error: contextError } = useMeetingContext();
  const { participants, isLoading: participantsLoading, error: participantsError } = useParticipants(
    context?.meetingId || '',
    context?.userId || '',
    context?.tenantId || ''
  );

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
    <ErrorBoundary>
      <div className={`app-container theme-${theme}`}>
        <header className="app-header">
          <h1>Spin the Wheel</h1>
          <p className="subtitle">{context?.meetingTitle || 'Select a meeting participant'}</p>
        </header>

        <main className="app-main">
          {contextLoading ? (
            <div className="loading">
              <p>Initializing Teams context...</p>
            </div>
          ) : contextError ? (
            <div className="error">
              <h2>Unable to Initialize</h2>
              <p>{contextError}</p>
              <p className="error-hint">
                This app requires Teams meeting context. Please open it from within a Teams meeting.
              </p>
            </div>
          ) : (
            <WheelDisplay
              allParticipants={participants}
              isLoading={participantsLoading}
              error={participantsError}
            />
          )}
        </main>

        <footer className="app-footer">
          <p className="phase-indicator">Phase 4: Teams Integration</p>
          {participants.length > 0 && (
            <p className="participant-count">
              {participants.length} participant{participants.length !== 1 ? 's' : ''} loaded
            </p>
          )}
        </footer>
      </div>
    </ErrorBoundary>
  );
}
