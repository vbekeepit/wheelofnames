import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WheelConfig } from './WheelConfig';
import type { Participant } from '@/types/meeting';

const mockParticipants: Participant[] = [
  { id: '1', displayName: 'Alice Johnson', email: 'alice@example.com', participantRole: 'Presenter' },
  { id: '2', displayName: 'Bob Smith', email: 'bob@example.com', participantRole: 'Attendee' },
  { id: '3', displayName: 'Carol White', email: 'carol@example.com', participantRole: 'Attendee' },
];

describe('WheelConfig Component', () => {
  it('renders configuration panel', () => {
    render(
      <WheelConfig
        allParticipants={mockParticipants}
        selectedParticipants={mockParticipants}
        onParticipantsChange={jest.fn()}
      />
    );

    expect(screen.getByText(/configure participants/i)).toBeInTheDocument();
  });

  it('displays all participants in the list', () => {
    render(
      <WheelConfig
        allParticipants={mockParticipants}
        selectedParticipants={[]}
        onParticipantsChange={jest.fn()}
      />
    );

    mockParticipants.forEach((participant) => {
      expect(screen.getByText(participant.displayName)).toBeInTheDocument();
    });
  });

  it('allows selecting participants', () => {
    const onParticipantsChange = jest.fn();

    render(
      <WheelConfig
        allParticipants={mockParticipants}
        selectedParticipants={[]}
        onParticipantsChange={onParticipantsChange}
      />
    );

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    expect(onParticipantsChange).toHaveBeenCalled();
  });

  it('allows deselecting participants', () => {
    const onParticipantsChange = jest.fn();

    render(
      <WheelConfig
        allParticipants={mockParticipants}
        selectedParticipants={[mockParticipants[0]]}
        onParticipantsChange={onParticipantsChange}
      />
    );

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    expect(onParticipantsChange).toHaveBeenCalled();
  });

  it('select all button selects all participants', () => {
    const onParticipantsChange = jest.fn();

    render(
      <WheelConfig
        allParticipants={mockParticipants}
        selectedParticipants={[]}
        onParticipantsChange={onParticipantsChange}
      />
    );

    const selectAllButton = screen.getByRole('button', { name: /select all/i });
    fireEvent.click(selectAllButton);

    expect(onParticipantsChange).toHaveBeenCalledWith(mockParticipants);
  });

  it('deselect all button deselects all participants', () => {
    const onParticipantsChange = jest.fn();

    render(
      <WheelConfig
        allParticipants={mockParticipants}
        selectedParticipants={mockParticipants}
        onParticipantsChange={onParticipantsChange}
      />
    );

    const deselectAllButton = screen.getByRole('button', { name: /deselect all/i });
    fireEvent.click(deselectAllButton);

    expect(onParticipantsChange).toHaveBeenCalledWith([]);
  });

  it('filters participants by search term', () => {
    render(
      <WheelConfig
        allParticipants={mockParticipants}
        selectedParticipants={[]}
        onParticipantsChange={jest.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search participants/i);
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
  });

  it('displays selection count', () => {
    render(
      <WheelConfig
        allParticipants={mockParticipants}
        selectedParticipants={[mockParticipants[0], mockParticipants[1]]}
        onParticipantsChange={jest.fn()}
      />
    );

    expect(screen.getByText(/2 of 3 selected/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();

    render(
      <WheelConfig
        allParticipants={mockParticipants}
        selectedParticipants={[]}
        onParticipantsChange={jest.fn()}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close configuration/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('snapshot test - renders correctly', () => {
    const { container } = render(
      <WheelConfig
        allParticipants={mockParticipants}
        selectedParticipants={[]}
        onParticipantsChange={jest.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
