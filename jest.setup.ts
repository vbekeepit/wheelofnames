import '@testing-library/jest-dom';

// Mock @microsoft/teams-js
jest.mock('@microsoft/teams-js', () => ({
  app: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getContext: jest.fn().mockResolvedValue({
      meeting: {
        id: 'mock-meeting-id',
        title: 'Mock Meeting',
      },
      user: {
        id: 'mock-user-id',
        displayName: 'Mock User',
        tenantId: 'mock-tenant-id',
      },
      frameContext: 'sidePanel',
      app: {
        theme: 'default',
      },
    }),
    registerOnThemeChangeHandler: jest.fn(),
  },
}));

// Mock @microsoft/live-share
jest.mock('@microsoft/live-share', () => ({
  LiveShareClient: jest.fn(),
}));
