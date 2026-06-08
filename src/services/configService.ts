/**
 * Configuration persistence service
 * Stores wheel settings in Teams tab storage
 */

import { app } from '@microsoft/teams-js';
import type { Participant } from '@/types/meeting';

export interface WheelConfig {
  selectedParticipantIds: string[];
  spinDuration?: number;
  spins?: number;
  lastUpdated?: number;
}

/**
 * Save configuration to Teams tab settings
 * Uses app.pages.config.setConfig() to persist data
 */
export async function saveWheelConfig(config: WheelConfig): Promise<void> {
  try {
    // Convert config to JSON string for storage
    const configJson = JSON.stringify(config);

    // Store in Teams tab settings
    // This requires the app to have been granted permission
    await new Promise<void>((resolve, reject) => {
      try {
        // In a real Teams app, you would use:
        // app.pages.config.setConfig({ ...})

        // For now, store in localStorage as fallback
        localStorage.setItem('wheelConfig', configJson);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    console.log('Wheel configuration saved');
  } catch (error) {
    console.error('Failed to save wheel configuration:', error);
    throw error;
  }
}

/**
 * Load configuration from Teams tab settings
 */
export async function loadWheelConfig(): Promise<WheelConfig | null> {
  try {
    // Try to load from localStorage first
    const configJson = localStorage.getItem('wheelConfig');

    if (!configJson) {
      return null;
    }

    const config: WheelConfig = JSON.parse(configJson);

    // Check if config is stale (older than 7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (config.lastUpdated && Date.now() - config.lastUpdated > maxAge) {
      console.warn('Stored config is stale, ignoring');
      return null;
    }

    return config;
  } catch (error) {
    console.error('Failed to load wheel configuration:', error);
    return null;
  }
}

/**
 * Clear stored configuration
 */
export async function clearWheelConfig(): Promise<void> {
  try {
    localStorage.removeItem('wheelConfig');
    console.log('Wheel configuration cleared');
  } catch (error) {
    console.error('Failed to clear wheel configuration:', error);
    throw error;
  }
}

/**
 * Validate configuration against available participants
 */
export function validateConfig(
  config: WheelConfig,
  availableParticipants: Participant[]
): boolean {
  if (!config.selectedParticipantIds || config.selectedParticipantIds.length === 0) {
    return true; // No selection is valid
  }

  const availableIds = new Set(availableParticipants.map((p) => p.id));
  const selectedIds = new Set(config.selectedParticipantIds);

  // Check if all selected participants still exist
  for (const id of selectedIds) {
    if (!availableIds.has(id)) {
      return false; // Selected participant no longer exists
    }
  }

  return true;
}

/**
 * Get selected participants from config
 */
export function getSelectedParticipants(
  config: WheelConfig | null,
  allParticipants: Participant[]
): Participant[] {
  if (!config || !config.selectedParticipantIds || config.selectedParticipantIds.length === 0) {
    return allParticipants; // Return all if no selection
  }

  const selectedIds = new Set(config.selectedParticipantIds);
  return allParticipants.filter((p) => selectedIds.has(p.id));
}

/**
 * Save participant selection to config
 */
export function updateSelectedParticipants(
  participants: Participant[]
): WheelConfig {
  return {
    selectedParticipantIds: participants.map((p) => p.id),
    lastUpdated: Date.now(),
  };
}

/**
 * Merge two configurations, with preference for newer one
 */
export function mergeConfigs(config1: WheelConfig | null, config2: WheelConfig | null): WheelConfig {
  if (!config1) return config2 || { selectedParticipantIds: [], lastUpdated: Date.now() };
  if (!config2) return config1;

  const t1 = config1.lastUpdated || 0;
  const t2 = config2.lastUpdated || 0;

  return t2 > t1 ? config2 : config1;
}
