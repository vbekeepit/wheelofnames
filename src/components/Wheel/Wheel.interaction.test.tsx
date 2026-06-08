import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Wheel } from './Wheel';
import type { Participant } from '@/types/meeting';

const mockParticipants: Participant[] = [
  { id: '1', displayName: 'Alice', email: 'alice@example.com' },
  { id: '2', displayName: 'Bob', email: 'bob@example.com' },
  { id: '3', displayName: 'Carol', email: 'carol@example.com' },
];

describe('Wheel Interaction Tests', () => {
  it('spins when spacebar is pressed', async () => {
    const onWinnerSelected = jest.fn();

    render(
      <Wheel
        participants={mockParticipants}
        onWinnerSelected={onWinnerSelected}
        spinDuration={100}
        enableKeyboardControl={true}
      />
    );

    // Press spacebar
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });

    await waitFor(
      () => {
        expect(onWinnerSelected).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('does not spin on spacebar when spinning is in progress', async () => {
    const onWinnerSelected = jest.fn();

    render(
      <Wheel
        participants={mockParticipants}
        onWinnerSelected={onWinnerSelected}
        spinDuration={500}
        enableKeyboardControl={true}
      />
    );

    const spinButton = screen.getByRole('button', { name: /spin the wheel/i });

    // Start spin
    fireEvent.click(spinButton);
    expect(spinButton).toBeDisabled();

    // Try to spin again with spacebar while already spinning
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });

    // Should only have one winner selection
    await waitFor(
      () => {
        expect(onWinnerSelected).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 }
    );
  });

  it('does not spin on spacebar when keyboard control is disabled', () => {
    const onWinnerSelected = jest.fn();

    render(
      <Wheel
        participants={mockParticipants}
        onWinnerSelected={onWinnerSelected}
        spinDuration={100}
        enableKeyboardControl={false}
      />
    );

    // Press spacebar
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });

    // Should not trigger spin
    expect(onWinnerSelected).not.toHaveBeenCalled();
  });

  it('prevents default spacebar behavior when spinning', () => {
    render(
      <Wheel
        participants={mockParticipants}
        spinDuration={100}
        enableKeyboardControl={true}
      />
    );

    const event = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    fireEvent.keyDown(window, event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('handles multiple rapid clicks without issue', async () => {
    const onWinnerSelected = jest.fn();

    render(
      <Wheel
        participants={mockParticipants}
        onWinnerSelected={onWinnerSelected}
        spinDuration={100}
      />
    );

    const spinButton = screen.getByRole('button', { name: /spin the wheel/i });

    // Rapid clicks
    fireEvent.click(spinButton);
    fireEvent.click(spinButton);
    fireEvent.click(spinButton);

    // Should only have one spin
    await waitFor(
      () => {
        expect(onWinnerSelected).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );
  });

  it('cleans up keyboard event listener on unmount', () => {
    const { unmount } = render(
      <Wheel
        participants={mockParticipants}
        spinDuration={100}
        enableKeyboardControl={true}
      />
    );

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
