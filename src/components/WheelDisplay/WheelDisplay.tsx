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
  onSetParticipants?: (participants: Participant[]) => void;
}

function parseNames(raw: string): Participant[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((name, i) => ({ id: `manual-${i}`, displayName: name }));
}

export const WheelDisplay: React.FC<WheelDisplayProps> = ({
  allParticipants,
  isLoading = false,
  error = null,
  onSetParticipants,
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>(allParticipants);
  const [showConfig, setShowConfig] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [nameInput, setNameInput] = useState(allParticipants.map((p) => p.displayName).join('\n'));

  const handleWinnerSelected = (w: Participant) => setWinner(w);
  const handleParticipantsChange = (p: Participant[]) => setSelectedParticipants(p);
  const handleWinnerDismiss = () => setWinner(null);

  const handleAddNames = () => {
    const parsed = parseNames(nameInput);
    if (parsed.length > 0) onSetParticipants?.(parsed);
  };

  if (isLoading) {
    return <div className="wheel-display loading"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="wheel-display error"><h2>Error</h2><p>{error}</p></div>;
  }

  if (allParticipants.length === 0) {
    return (
      <div className="wheel-display empty">
        <h2>Add participants</h2>
        <p>Enter one name per line.</p>
        <textarea
          className="name-input"
          rows={8}
          placeholder={'Alice\nBob\nCarol'}
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleAddNames(); }}
        />
        <button
          className="select-participants-button"
          onClick={handleAddNames}
          disabled={nameInput.trim().length === 0}
        >
          Add to wheel
        </button>
      </div>
    );
  }

  const displayParticipants = selectedParticipants.length > 0 ? selectedParticipants : allParticipants;

  return (
    <div className="wheel-display">
      <div className="wheel-display-main">
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
