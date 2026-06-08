import React, { useEffect, useState } from 'react';
import type { Participant } from '@/types/meeting';
import './WinnerAnnouncement.css';

export interface WinnerAnnouncementProps {
  winner: Participant;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const WinnerAnnouncement: React.FC<WinnerAnnouncementProps> = ({
  winner,
  onDismiss,
  autoHide = true,
  autoHideDelay = 8000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoHide) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [autoHide, autoHideDelay, onDismiss]);

  if (!isVisible) return null;

  const handleDismiss = (): void => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div className="winner-announcement-overlay">
      <div className="winner-announcement-card">
        <div className="winner-emoji">🎉</div>

        <h2 className="winner-announcement-title">Winner Selected!</h2>

        <div className="winner-details">
          <p className="winner-announcement-name">{winner.displayName}</p>
          {winner.participantRole && (
            <p className="winner-announcement-role">{winner.participantRole}</p>
          )}
          {winner.email && <p className="winner-announcement-email">{winner.email}</p>}
        </div>

        <div className="winner-announcement-actions">
          <button className="dismiss-button" onClick={handleDismiss} aria-label="Dismiss announcement">
            Next Spin
          </button>
        </div>

        <div className="winner-announcement-progress">
          <div
            className="progress-bar"
            style={{
              animation: `progress ${autoHideDelay}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WinnerAnnouncement;
