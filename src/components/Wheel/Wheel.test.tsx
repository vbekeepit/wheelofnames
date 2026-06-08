import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Wheel } from './Wheel';
import type { Participant } from '@/types/meeting';

const mockParticipants: Participant[] = [
  { id: '1', displayName: 'Alice Johnson', email: 'alice@example.com' },
  { id: '2', displayName: 'Bob Smith', email: 'bob@example.com' },
  { id: '3', displayName: 'Carol White', email: 'carol@example.com' },
];

describe('Wheel Component', () => {
  it('renders the wheel with participants', () => {
    render(<Wheel participants={mockParticipants} />);

    const spinButton = screen.getByRole('button', { name: /spin the wheel/i });
    expect(spinButton).toBeInTheDocument();
  });

  it('displays all participant names on the wheel', () => {
    const { container } = render(<Wheel participants={mockParticipants} />);
    const labels = container.querySelectorAll('.wheel-label');

    expect(labels.length).toBeGreaterThan(0);
  });

  it('disables spin button when disabled prop is true', () => {
    render(<Wheel participants={mockParticipants} isDisabled={true} />);

    const spinButton = screen.getByRole('button', { name: /spin the wheel/i });
    expect(spinButton).toBeDisabled();
  });

  it('disables spin button when no participants', () => {
    render(<Wheel participants={[]} />);

    const spinButton = screen.getByRole('button', { name: /spin the wheel/i });
    expect(spinButton).toBeDisabled();
  });

  it('calls onWinnerSelected callback when spin completes', async () => {
    const onWinnerSelected = jest.fn();

    render(
      <Wheel
        participants={mockParticipants}
        onWinnerSelected={onWinnerSelected}
        spinDuration={100} // Short duration for testing
      />
    );

    const spinButton = screen.getByRole('button', { name: /spin the wheel/i });
    fireEvent.click(spinButton);

    await waitFor(
      () => {
        expect(onWinnerSelected).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    expect(onWinnerSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        displayName: expect.any(String),
      }),
      expect.any(Number)
    );
  });

  it('shows winner announcement after spinning', async () => {
    render(
      <Wheel
        participants={mockParticipants}
        spinDuration={100} // Short duration for testing
      />
    );

    const spinButton = screen.getByRole('button', { name: /spin the wheel/i });
    fireEvent.click(spinButton);

    await waitFor(
      () => {
        expect(screen.getByText(/winner/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('displays reset button after winning', async () => {
    render(
      <Wheel
        participants={mockParticipants}
        spinDuration={100} // Short duration for testing
      />
    );

    const spinButton = screen.getByRole('button', { name: /spin the wheel/i });
    fireEvent.click(spinButton);

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('resets the wheel when reset button is clicked', async () => {
    const { container } = render(
      <Wheel
        participants={mockParticipants}
        spinDuration={100} // Short duration for testing
      />
    );

    const spinButton = screen.getByRole('button', { name: /spin the wheel/i });
    fireEvent.click(spinButton);

    await waitFor(
      () => {
        expect(screen.getByText(/winner/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    expect(screen.queryByText(/winner/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /spin the wheel/i })).not.toBeDisabled();
  });

  it('prevents spinning while already spinning', async () => {
    const onWinnerSelected = jest.fn();

    render(
      <Wheel
        participants={mockParticipants}
        onWinnerSelected={onWinnerSelected}
        spinDuration={500}
      />
    );

    const spinButton = screen.getByRole('button', { name: /spin the wheel/i });

    // Click spin
    fireEvent.click(spinButton);
    expect(spinButton).toBeDisabled();

    // Try to click again while spinning
    fireEvent.click(spinButton);

    // Should still only have one call
    await waitFor(
      () => {
        expect(onWinnerSelected).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 }
    );
  });

  it('snapshot test - renders correctly', () => {
    const { container } = render(<Wheel participants={mockParticipants} />);
    expect(container).toMatchSnapshot();
  });
});
