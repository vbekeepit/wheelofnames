import { useMeetingContext } from '@/hooks/useMeetingContext';
import { useParticipants } from '@/hooks/useParticipants';
import { WheelDisplay } from '@/components/WheelDisplay';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App() {
  const { context, isLoading: contextLoading, error: contextError } = useMeetingContext();
  const { participants, isLoading: participantsLoading, error: participantsError, selectFromPicker, setParticipants } = useParticipants(
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
              onClearParticipants={() => setParticipants([])}
            />
          )}
        </main>

        <footer className="app-footer">
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
