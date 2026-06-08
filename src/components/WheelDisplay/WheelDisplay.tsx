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
}

export const WheelDisplay: React.FC<WheelDisplayProps> = ({
  allParticipants,
  isLoading = false,
  error = null,
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>(allParticipants);
  const [showConfig, setShowConfig] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);

  const handleWinnerSelected = (selectedWinner: Participant): void => {
    setWinner(selectedWinner);
  };

  const handleParticipantsChange = (participants: Participant[]): void => {
    setSelectedParticipants(participants);
  };

  const handleWinnerDismiss = (): void => {
    setWinner(null);
  };

  if (isLoading) {
    return (
      <div className="wheel-display loading">
        <p>Loading meeting participants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wheel-display error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (allParticipants.length === 0) {
    return (
      <div className="wheel-display empty">
        <h2>No Participants</h2>
        <p>There are no meeting participants to spin the wheel with.</p>
      </div>
    );
  }

  const displayParticipants = selectedParticipants.length > 0 ? selectedParticipants : allParticipants;

  return (
    <div className="wheel-display">
      <div className="wheel-display-main">
        {/* Control Button */}
        <div className="wheel-display-header">
          <button
            className="config-button"
            onClick={() => setShowConfig(!showConfig)}
            aria-label={showConfig ? 'Hide participant settings' : 'Show participant settings'}
          >
            {showConfig ? '✓ Done' : '⚙️ Settings'}
          </button>
          <p className="wheel-hint">Press <kbd>Space</kbd> or click to spin</p>
        </div>

        {/* Config Panel */}
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

        {/* Wheel */}
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

      {/* Winner Announcement */}
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
