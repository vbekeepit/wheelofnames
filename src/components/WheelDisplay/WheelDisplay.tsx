import React, { useState } from 'react';
import type { Participant } from '@/types/meeting';
import { Wheel } from '@/components/Wheel';
import { WheelConfig } from '@/components/WheelConfig';
import { WinnerAnnouncement } from '@/components/WinnerAnnouncement';
import './WheelDisplay.css';

export interface WheelDisplayProps {
  allParticipants: Participant[];
  isLoading?: boolean;
  error?: string | null;
  onSelectParticipants?: () => void;
}

export const WheelDisplay: React.FC<WheelDisplayProps> = ({
  allParticipants,
  isLoading = false,
  error = null,
  onSelectParticipants,
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>(allParticipants);
  const [showConfig, setShowConfig] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);

  const handleWinnerSelected = (w: Participant) => setWinner(w);
  const handleParticipantsChange = (p: Participant[]) => setSelectedParticipants(p);
  const handleWinnerDismiss = () => setWinner(null);

  if (isLoading) {
    return <div className="wheel-display loading"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="wheel-display error"><h2>Error</h2><p>{error}</p></div>;
  }

  if (allParticipants.length === 0) {
    return (
      <div className="wheel-display empty">
        <h2>No participants yet</h2>
        {onSelectParticipants ? (
          <>
            <p>Pick people from the meeting roster to spin the wheel.</p>
            <button className="select-participants-button" onClick={onSelectParticipants}>
              Pick from meeting
            </button>
          </>
        ) : (
          <p>Open this app inside a Teams meeting to get started.</p>
        )}
      </div>
    );
  }

  const displayParticipants = selectedParticipants.length > 0 ? selectedParticipants : allParticipants;

  return (
    <div className="wheel-display">
      <div className="wheel-display-main">
        <div className="wheel-display-header">
          <div className="wheel-display-header-buttons">
            <button
              className="config-button"
              onClick={() => setShowConfig(!showConfig)}
              aria-label={showConfig ? 'Hide participant settings' : 'Show participant settings'}
            >
              {showConfig ? '✓ Done' : '⚙️ Settings'}
            </button>
            {onSelectParticipants && (
              <button className="picker-button" onClick={onSelectParticipants}>
                👥 Pick from meeting
              </button>
            )}
          </div>
          <p className="wheel-hint">Press <kbd>Space</kbd> or click to spin</p>
        </div>

        {showConfig && (
          <div className="wheel-display-config">
            <WheelConfig
              allParticipants={allParticipants}
              selectedParticipants={selectedParticipants}
              onParticipantsChange={handleParticipantsChange}
              onClose={() => setShowConfig(false)}
            />
          </div>
        )}

        {!showConfig && (
          <div className="wheel-display-content">
            <Wheel
              participants={displayParticipants}
              onWinnerSelected={handleWinnerSelected}
              spinDuration={4000}
              spins={3}
              enableKeyboardControl={true}
            />
          </div>
        )}
      </div>

      {winner && (
        <WinnerAnnouncement
          winner={winner}
          onDismiss={handleWinnerDismiss}
          autoHide={true}
          autoHideDelay={6000}
        />
      )}
    </div>
  );
};

export default WheelDisplay;
