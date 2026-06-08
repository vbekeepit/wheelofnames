import React, { useState } from 'react';
import type { Participant } from '@/types/meeting';
import './WheelConfig.css';

export interface WheelConfigProps {
  allParticipants: Participant[];
  selectedParticipants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  onClose?: () => void;
}

export const WheelConfig: React.FC<WheelConfigProps> = ({
  allParticipants,
  selectedParticipants,
  onParticipantsChange,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredParticipants = allParticipants.filter((p) =>
    p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const toggleParticipant = (participant: Participant): void => {
    const isSelected = selectedParticipants.some((p) => p.id === participant.id);

    if (isSelected) {
      onParticipantsChange(selectedParticipants.filter((p) => p.id !== participant.id));
    } else {
      onParticipantsChange([...selectedParticipants, participant]);
    }
  };

  const selectAll = (): void => {
    onParticipantsChange(allParticipants);
  };

  const deselectAll = (): void => {
    onParticipantsChange([]);
  };

  const selectedIds = new Set(selectedParticipants.map((p) => p.id));

  return (
    <div className="wheel-config">
      <div className="config-header">
        <h2>Configure Participants</h2>
        {onClose && (
          <button className="close-button" onClick={onClose} aria-label="Close configuration">
            ✕
          </button>
        )}
      </div>

      <div className="config-content">
        {/* Search */}
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search participants"
          />
        </div>

        {/* Quick actions */}
        <div className="quick-actions">
          <button
            className="action-button action-all"
            onClick={selectAll}
            disabled={selectedIds.size === allParticipants.length}
          >
            Select All
          </button>
          <button
            className="action-button action-none"
            onClick={deselectAll}
            disabled={selectedIds.size === 0}
          >
            Deselect All
          </button>
          <span className="selection-count">
            {selectedIds.size} of {allParticipants.length} selected
          </span>
        </div>

        {/* Participant list */}
        <div className="participants-section">
          {filteredParticipants.length > 0 ? (
            <div className="participants-grid">
              {filteredParticipants.map((participant) => (
                <label key={participant.id} className="participant-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(participant.id)}
                    onChange={() => toggleParticipant(participant)}
                    aria-label={`Select ${participant.displayName}`}
                  />
                  <span className="checkbox-custom" />
                  <div className="participant-info">
                    <span className="participant-name">{participant.displayName}</span>
                    {participant.participantRole && (
                      <span className="participant-role">{participant.participantRole}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No participants found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with confirmation */}
      <div className="config-footer">
        <p className="info-text">
          The wheel will contain {selectedIds.size > 0 ? selectedIds.size : 'no'} participant
          {selectedIds.size !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default WheelConfig;
