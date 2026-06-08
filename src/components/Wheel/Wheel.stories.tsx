import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Wheel } from './Wheel';
import type { Participant } from '@/types/meeting';

const mockParticipants: Participant[] = [
  { id: '1', displayName: 'Alice Johnson', email: 'alice@example.com', participantRole: 'Presenter' },
  { id: '2', displayName: 'Bob Smith', email: 'bob@example.com', participantRole: 'Attendee' },
  { id: '3', displayName: 'Carol White', email: 'carol@example.com', participantRole: 'Attendee' },
  { id: '4', displayName: 'David Brown', email: 'david@example.com', participantRole: 'Attendee' },
  { id: '5', displayName: 'Eve Davis', email: 'eve@example.com', participantRole: 'Attendee' },
  { id: '6', displayName: 'Frank Miller', email: 'frank@example.com', participantRole: 'Attendee' },
  { id: '7', displayName: 'Grace Lee', email: 'grace@example.com', participantRole: 'Attendee' },
  { id: '8', displayName: 'Henry Wilson', email: 'henry@example.com', participantRole: 'Attendee' },
];

const manyParticipants: Participant[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  displayName: `Participant ${i + 1}`,
  email: `participant${i + 1}@example.com`,
  participantRole: i === 0 ? 'Presenter' : 'Attendee',
}));

const meta = {
  title: 'Components/Wheel',
  component: Wheel,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Wheel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper to show winner state
function InteractiveWheel(props: React.ComponentProps<typeof Wheel>) {
  const [winner, setWinner] = useState<Participant | null>(null);

  return (
    <div>
      <Wheel
        {...props}
        onWinnerSelected={(selectedWinner) => {
          setWinner(selectedWinner);
        }}
      />
      {winner && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#f0f8ff',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <p>Selected: <strong>{winner.displayName}</strong></p>
        </div>
      )}
    </div>
  );
}

export const Default: Story = {
  render: (props) => <InteractiveWheel {...props} />,
  args: {
    participants: mockParticipants,
    spinDuration: 4000,
    spins: 3,
  },
};

export const FewParticipants: Story = {
  render: (props) => <InteractiveWheel {...props} />,
  args: {
    participants: mockParticipants.slice(0, 4),
    spinDuration: 3000,
    spins: 2,
  },
};

export const ManyParticipants: Story = {
  render: (props) => <InteractiveWheel {...props} />,
  args: {
    participants: manyParticipants,
    spinDuration: 5000,
    spins: 4,
  },
};

export const Disabled: Story = {
  render: (props) => <Wheel {...props} />,
  args: {
    participants: mockParticipants,
    isDisabled: true,
  },
};

export const NoParticipants: Story = {
  render: (props) => <Wheel {...props} />,
  args: {
    participants: [],
  },
};

export const FastSpin: Story = {
  render: (props) => <InteractiveWheel {...props} />,
  args: {
    participants: mockParticipants,
    spinDuration: 1500,
    spins: 2,
  },
};

export const SlowSpin: Story = {
  render: (props) => <InteractiveWheel {...props} />,
  args: {
    participants: mockParticipants,
    spinDuration: 8000,
    spins: 5,
  },
};
