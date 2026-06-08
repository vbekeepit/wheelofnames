import { ParticipantCache } from '../teamsApiService';
import type { Participant } from '@/types/meeting';

describe('Teams API Service', () => {
  describe('ParticipantCache', () => {
    it('should cache participants', () => {
      const cache = new ParticipantCache(300);
      const mockParticipants: Participant[] = [
        { id: '1', displayName: 'Alice', email: 'alice@example.com' },
        { id: '2', displayName: 'Bob', email: 'bob@example.com' },
      ];

      cache.set('meeting-1', mockParticipants);
      const cached = cache.get('meeting-1');

      expect(cached).toEqual(mockParticipants);
    });

    it('should return null for non-existent key', () => {
      const cache = new ParticipantCache(300);

      const cached = cache.get('non-existent');

      expect(cached).toBeNull();
    });

    it('should invalidate expired cache', async () => {
      const cache = new ParticipantCache(1); // 1 second TTL
      const mockParticipants: Participant[] = [
        { id: '1', displayName: 'Alice', email: 'alice@example.com' },
      ];

      cache.set('meeting-1', mockParticipants);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const cached = cache.get('meeting-1');

      expect(cached).toBeNull();
    });

    it('should clear all cache', () => {
      const cache = new ParticipantCache(300);
      const mockParticipants: Participant[] = [
        { id: '1', displayName: 'Alice', email: 'alice@example.com' },
      ];

      cache.set('meeting-1', mockParticipants);
      cache.set('meeting-2', mockParticipants);

      cache.clear();

      expect(cache.get('meeting-1')).toBeNull();
      expect(cache.get('meeting-2')).toBeNull();
    });

    it('should invalidate specific key', () => {
      const cache = new ParticipantCache(300);
      const mockParticipants: Participant[] = [
        { id: '1', displayName: 'Alice', email: 'alice@example.com' },
      ];

      cache.set('meeting-1', mockParticipants);
      cache.set('meeting-2', mockParticipants);

      cache.invalidate('meeting-1');

      expect(cache.get('meeting-1')).toBeNull();
      expect(cache.get('meeting-2')).toEqual(mockParticipants);
    });

    it('should return same instance within TTL', () => {
      const cache = new ParticipantCache(300);
      const mockParticipants: Participant[] = [
        { id: '1', displayName: 'Alice', email: 'alice@example.com' },
      ];

      cache.set('meeting-1', mockParticipants);
      const cached1 = cache.get('meeting-1');
      const cached2 = cache.get('meeting-1');

      expect(cached1).toBe(cached2); // Same reference
    });

    it('should handle default TTL', () => {
      const cache = new ParticipantCache(); // Default 300 seconds
      const mockParticipants: Participant[] = [
        { id: '1', displayName: 'Alice', email: 'alice@example.com' },
      ];

      cache.set('meeting-1', mockParticipants);
      const cached = cache.get('meeting-1');

      expect(cached).toEqual(mockParticipants);
    });
  });
});
