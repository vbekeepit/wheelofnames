import {
  validateConfig,
  getSelectedParticipants,
  updateSelectedParticipants,
  mergeConfigs,
  type WheelConfig,
} from '../configService';
import type { Participant } from '@/types/meeting';

describe('Configuration Service', () => {
  const mockParticipants: Participant[] = [
    { id: '1', displayName: 'Alice', email: 'alice@example.com' },
    { id: '2', displayName: 'Bob', email: 'bob@example.com' },
    { id: '3', displayName: 'Carol', email: 'carol@example.com' },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  describe('validateConfig', () => {
    it('should validate config with valid participants', () => {
      const config: WheelConfig = {
        selectedParticipantIds: ['1', '2'],
      };

      const isValid = validateConfig(config, mockParticipants);

      expect(isValid).toBe(true);
    });

    it('should invalidate config with non-existent participant', () => {
      const config: WheelConfig = {
        selectedParticipantIds: ['1', '999'],
      };

      const isValid = validateConfig(config, mockParticipants);

      expect(isValid).toBe(false);
    });

    it('should validate empty selection as true', () => {
      const config: WheelConfig = {
        selectedParticipantIds: [],
      };

      const isValid = validateConfig(config, mockParticipants);

      expect(isValid).toBe(true);
    });

    it('should validate null config as true', () => {
      const isValid = validateConfig(
        { selectedParticipantIds: [] },
        mockParticipants
      );

      expect(isValid).toBe(true);
    });
  });

  describe('getSelectedParticipants', () => {
    it('should return all participants when no config', () => {
      const selected = getSelectedParticipants(null, mockParticipants);

      expect(selected).toEqual(mockParticipants);
    });

    it('should return all participants when empty selection', () => {
      const config: WheelConfig = { selectedParticipantIds: [] };
      const selected = getSelectedParticipants(config, mockParticipants);

      expect(selected).toEqual(mockParticipants);
    });

    it('should return selected participants', () => {
      const config: WheelConfig = {
        selectedParticipantIds: ['1', '3'],
      };
      const selected = getSelectedParticipants(config, mockParticipants);

      expect(selected).toHaveLength(2);
      expect(selected).toContainEqual(mockParticipants[0]);
      expect(selected).toContainEqual(mockParticipants[2]);
    });
  });

  describe('updateSelectedParticipants', () => {
    it('should create config from participants', () => {
      const selected = [mockParticipants[0], mockParticipants[1]];

      const config = updateSelectedParticipants(selected);

      expect(config.selectedParticipantIds).toEqual(['1', '2']);
      expect(config.lastUpdated).toBeDefined();
      expect(config.lastUpdated).toBeGreaterThan(0);
    });

    it('should handle empty participants', () => {
      const config = updateSelectedParticipants([]);

      expect(config.selectedParticipantIds).toEqual([]);
      expect(config.lastUpdated).toBeDefined();
    });
  });

  describe('mergeConfigs', () => {
    it('should prefer newer config', () => {
      const config1: WheelConfig = {
        selectedParticipantIds: ['1'],
        lastUpdated: 1000,
      };
      const config2: WheelConfig = {
        selectedParticipantIds: ['2'],
        lastUpdated: 2000,
      };

      const merged = mergeConfigs(config1, config2);

      expect(merged).toEqual(config2);
    });

    it('should return config2 when config1 is null', () => {
      const config2: WheelConfig = {
        selectedParticipantIds: ['2'],
        lastUpdated: 2000,
      };

      const merged = mergeConfigs(null, config2);

      expect(merged).toEqual(config2);
    });

    it('should return config1 when config2 is null', () => {
      const config1: WheelConfig = {
        selectedParticipantIds: ['1'],
        lastUpdated: 1000,
      };

      const merged = mergeConfigs(config1, null);

      expect(merged).toEqual(config1);
    });

    it('should return default config when both null', () => {
      const merged = mergeConfigs(null, null);

      expect(merged.selectedParticipantIds).toEqual([]);
      expect(merged.lastUpdated).toBeDefined();
    });
  });
});
