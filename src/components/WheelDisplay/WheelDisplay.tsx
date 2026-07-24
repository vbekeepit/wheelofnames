import React, { useState, useEffect } from 'react';
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
  onReloadFromMeeting?: () => Promise<void>;
  onClearParticipants?: () => void;
  showConfig?: boolean;
  onConfigClose?: () => void;
}

export const WheelDisplay: React.FC<WheelDisplayProps> = ({
  allParticipants,
  isLoading = false,
  error = null,
  onSelectParticipants,
  onReloadFromMeeting,
  onClearParticipants,
  showConfig = false,
  onConfigClose,
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>(allParticipants);
  const [winner, setWinner] = useState<Participant | null>(null);

  // Keep selectedParticipants in sync with allParticipants:
  // auto-select newcomers, remove anyone no longer in the list
  useEffect(() => {
    const allIds = new Set(allParticipants.map(p => p.id));
    setSelectedParticipants(prev => {
      const stillPresent = prev.filter(p => allIds.has(p.id));
      const prevIds = new Set(stillPresent.map(p => p.id));
      const newcomers = allParticipants.filter(p => !prevIds.has(p.id));
      if (newcomers.length === 0 && stillPresent.length === prev.length) return prev;
      return [...stillPresent, ...newcomers];
    });
  }, [allParticipants]);

  const handleWinnerSelected = (w: Participant) => setWinner(w);
  const handleParticipantsChange = (p: Participant[]) => setSelectedParticipants(p);
  const handleWinnerDismiss = () => setWinner(null);
  const handleClear = () => { setSelectedParticipants([]); onClearParticipants?.(); };

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
        {showConfig && (
          <div className="wheel-display-config">
            <WheelConfig
              allParticipants={allParticipants}
              selectedParticipants={selectedParticipants}
              onParticipantsChange={handleParticipantsChange}
              onClose={onConfigClose}
              onSelectParticipants={onSelectParticipants}
              onReloadFromMeeting={onReloadFromMeeting}
              onClearParticipants={handleClear}
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
        />
      )}
    </div>
  );
};

export default WheelDisplay;
