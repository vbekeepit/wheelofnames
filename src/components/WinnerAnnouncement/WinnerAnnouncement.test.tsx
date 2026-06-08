import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WinnerAnnouncement } from './WinnerAnnouncement';
import type { Participant } from '@/types/meeting';

const mockWinner: Participant = {
  id: '1',
  displayName: 'Alice Johnson',
  email: 'alice@example.com',
  participantRole: 'Presenter',
};

describe('WinnerAnnouncement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders winner announcement with correct information', () => {
    render(<WinnerAnnouncement winner={mockWinner} autoHide={false} />);

    expect(screen.getByText('Winner Selected!')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Presenter')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('displays emoji and animations', () => {
    const { container } = render(<WinnerAnnouncement winner={mockWinner} autoHide={false} />);

    const emoji = container.querySelector('.winner-emoji');
    expect(emoji).toBeInTheDocument();
    expect(emoji?.textContent).toContain('🎉');
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn();

    render(
      <WinnerAnnouncement winner={mockWinner} onDismiss={onDismiss} autoHide={false} />
    );

    const dismissButton = screen.getByRole('button', { name: /next spin/i });
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-hides after delay', async () => {
    const onDismiss = jest.fn();

    const { container } = render(
      <WinnerAnnouncement
        winner={mockWinner}
        onDismiss={onDismiss}
        autoHide={true}
        autoHideDelay={100}
      />
    );

    expect(screen.getByText('Winner Selected!')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(onDismiss).toHaveBeenCalled();
        expect(container.querySelector('.winner-announcement-overlay')).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('does not auto-hide when autoHide is false', async () => {
    render(<WinnerAnnouncement winner={mockWinner} autoHide={false} />);

    expect(screen.getByText('Winner Selected!')).toBeInTheDocument();

    // Wait a bit and check it's still there
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(screen.getByText('Winner Selected!')).toBeInTheDocument();
  });

  it('handles winner without email', () => {
    const winnerNoEmail: Participant = {
      id: '1',
      displayName: 'Bob Smith',
      participantRole: 'Attendee',
    };

    render(<WinnerAnnouncement winner={winnerNoEmail} autoHide={false} />);

    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('Attendee')).toBeInTheDocument();
    expect(screen.queryByText(/example.com/)).not.toBeInTheDocument();
  });

  it('handles winner without role', () => {
    const winnerNoRole: Participant = {
      id: '1',
      displayName: 'Carol White',
      email: 'carol@example.com',
    };

    render(<WinnerAnnouncement winner={winnerNoRole} autoHide={false} />);

    expect(screen.getByText('Carol White')).toBeInTheDocument();
    expect(screen.getByText('carol@example.com')).toBeInTheDocument();
  });

  it('renders overlay for modal effect', () => {
    const { container } = render(<WinnerAnnouncement winner={mockWinner} autoHide={false} />);

    const overlay = container.querySelector('.winner-announcement-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('snapshot test - renders correctly', () => {
    const { container } = render(<WinnerAnnouncement winner={mockWinner} autoHide={false} />);
    expect(container).toMatchSnapshot();
  });
});
