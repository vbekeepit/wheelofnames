import React, { useRef, useState } from 'react';
import type { Participant } from '@/types/meeting';
import './WinnerAnnouncement.css';

export interface WinnerAnnouncementProps {
  winner: Participant;
  onDismiss?: () => void;
}

const EMOJIS = ['👑', '🏆', '🎯', '🎰', '⭐', '🌟', '🎖️', '🥇', '🎊', '🍀'];

const MESSAGES = [
  'The Keepit Roulette has spoken!',
  'Keepit picks you!',
  'You can\'t Keepit from winning!',
  'The Keepit oracle decides!',
  'Keepit real — you\'re the one!',
  'Keepit spinning… and you won!',
  'The wheel Keepits it fair!',
  'Keepit lucky!',
  'Destiny, Keepit style!',
  'The Keepit wheel never lies!',
  'Keepit going — you\'re chosen!',
  'Fortune Keepits favouring you!',
];

export const WinnerAnnouncement: React.FC<WinnerAnnouncementProps> = ({
  winner,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const message = useRef(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]).current;
  const emoji = useRef(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]).current;

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div className="wa-overlay" onClick={handleDismiss}>
      <div className="wa-card" onClick={(e) => e.stopPropagation()}>

        {/* Floating sparks */}
        <span className="wa-spark wa-spark-1" aria-hidden="true" />
        <span className="wa-spark wa-spark-2" aria-hidden="true" />
        <span className="wa-spark wa-spark-3" aria-hidden="true" />
        <span className="wa-spark wa-spark-4" aria-hidden="true" />
        <span className="wa-spark wa-spark-5" aria-hidden="true" />
        <span className="wa-spark wa-spark-6" aria-hidden="true" />

        <div className="wa-crown" aria-hidden="true">{emoji}</div>

        <p className="wa-message">{message}</p>

        <p className="wa-name" aria-live="assertive">{winner.displayName.replace(' | Keepit', '')}</p>

        {winner.participantRole && (
          <p className="wa-role">{winner.participantRole}</p>
        )}

        <br />
        <button className="wa-button" onClick={handleDismiss}>
          Close
        </button>
      </div>
    </div>
  );
};

export default WinnerAnnouncement;
