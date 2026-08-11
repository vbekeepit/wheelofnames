import React from 'react';
import type { SpinResult } from '@/services/historyService';
import './SpinLeaderboard.css';

interface LeaderEntry {
  name: string;
  count: number;
}

function computeLeaderboard(history: SpinResult[]): {
  topWinners: LeaderEntry[];
  topSpinners: LeaderEntry[];
} {
  const winnerCounts = new Map<string, number>();
  const spinnerCounts = new Map<string, number>();

  for (const result of history) {
    winnerCounts.set(result.winner_name, (winnerCounts.get(result.winner_name) ?? 0) + 1);
    spinnerCounts.set(result.spun_by, (spinnerCounts.get(result.spun_by) ?? 0) + 1);
  }

  const topWinners = [...winnerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  const topSpinners = [...spinnerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  return { topWinners, topSpinners };
}

const MEDALS = ['🥇', '🥈', '🥉'];

interface SpinLeaderboardProps {
  history: SpinResult[];
}

export const SpinLeaderboard: React.FC<SpinLeaderboardProps> = ({ history }) => {
  if (history.length <= 9) return null;

  const { topWinners, topSpinners } = computeLeaderboard(history);

  return (
    <div className="spin-leaderboard">
      <div className="leaderboard-section">
        <h3 className="leaderboard-title">Top Winners</h3>
        <ol className="leaderboard-list">
          {topWinners.map((entry, i) => (
            <li key={entry.name} className="leaderboard-row">
              <span className="leaderboard-medal">{MEDALS[i]}</span>
              <span className="leaderboard-name">{entry.name}</span>
              <span className="leaderboard-count">{entry.count}×</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="leaderboard-divider" />
      <div className="leaderboard-section">
        <h3 className="leaderboard-title">Top Spinners</h3>
        <ol className="leaderboard-list">
          {topSpinners.map((entry, i) => (
            <li key={entry.name} className="leaderboard-row">
              <span className="leaderboard-medal">{MEDALS[i]}</span>
              <span className="leaderboard-name">{entry.name}</span>
              <span className="leaderboard-count">{entry.count}×</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
