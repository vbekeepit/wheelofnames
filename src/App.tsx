import { useEffect, useState } from 'react';
import { useMeetingContext } from '@/hooks/useMeetingContext';
import { useParticipants } from '@/hooks/useParticipants';
import { WheelDisplay } from '@/components/WheelDisplay';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App() {
  const { context, isLoading: contextLoading, error: contextError } = useMeetingContext();
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

  const [showConfig, setShowConfig] = useState(false);

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
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
