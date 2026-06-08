# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Spin the Wheel** is a Microsoft Teams meeting app that allows users to randomly select meeting participants using an interactive spinning wheel. The app extracts all meeting participants, populates a wheel with their names, and provides a smooth spinning animation to select one participant.

- **Target platform**: Microsoft Teams (meeting tabs, side panels, stage)
- **Tech stack**: React 19, TypeScript, TeamsJS v2, KES UI components
- **Design system**: KES (Keepit Experience System) design tokens and components
- **Optional real-time sync**: Live Share SDK for cross-participant synchronization

## Implementation Phases

This project follows a 6-phase implementation plan:

1. **Foundation & Context Access** (Weeks 1-2) — TeamsJS setup, participant data retrieval
2. **Wheel UI Component** (Weeks 2-3) — SVG wheel rendering, configuration panel
3. **Animation & Interaction** (Week 3) — Spin animation, winner detection
4. **Teams Integration** (Week 4) — Real participant data, configuration persistence
5. **Real-time Sync** (Week 5) — Live Share coordination for multi-user spinning
6. **Polish & Deployment** (Week 6) — Accessibility, performance, documentation

## Common Development Commands

### Setup & Installation
```bash
npm install                           # Install dependencies
npm run dev                           # Start dev server (Vite with hot reload)
npm run build                         # Production build
npm run typecheck                     # TypeScript type checking
```

### Development
```bash
npm run dev                           # Dev server (typically http://localhost:5173)
npm run preview                       # Preview production build locally
```

### Testing
```bash
npm test                              # Run unit tests (Jest)
npm run test:watch                    # Watch mode
npm run test:coverage                 # Coverage report
```

### Code Quality
```bash
npx eslint src                        # Lint TypeScript/JavaScript
npx prettier src --write              # Format code
npx tsc --noEmit                      # Type checking
```

## Project Structure

```
src/
├── components/
│   ├── SpinTheWheel/                 # Main app container
│   │   ├── SpinTheWheel.tsx
│   │   ├── SpinTheWheel.test.tsx
│   │   └── SpinTheWheel.stories.tsx
│   ├── Wheel/                        # Wheel rendering component
│   │   ├── Wheel.tsx                 # SVG wheel rendering
│   │   ├── Wheel.css
│   │   ├── Wheel.test.tsx
│   │   └── Wheel.stories.tsx
│   ├── WheelConfig/                  # Configuration UI
│   │   ├── WheelConfig.tsx
│   │   └── WheelConfig.test.tsx
│   └── WinnerAnnouncement/           # Winner display component
│       ├── WinnerAnnouncement.tsx
│       └── WinnerAnnouncement.css
├── hooks/
│   ├── useMeetingContext.ts          # Teams meeting context retrieval
│   ├── useParticipants.ts            # Participant data management
│   └── useLiveShare.ts               # Live Share synchronization (Phase 5)
├── services/
│   ├── teamsInfoService.ts           # Bot Framework integration
│   ├── realTimeSync.ts               # Live Share coordination
│   └── wheelAnimation.ts             # Animation calculations
├── types/
│   └── meeting.ts                    # TypeScript interfaces for meeting data
├── utils/
│   └── wheelAnimation.ts             # Animation utilities and easing functions
├── App.tsx                           # Root component, TeamsJS initialization
├── App.css
├── manifest.json                     # Teams app manifest
└── main.tsx                          # Entry point

public/
├── index.html
├── manifest.json                     # Teams app manifest (copy for deployment)
└── logo.png

server/                               # (Phase 4+) Bot service for TeamsInfo API
├── bot/
│   └── index.ts                      # Bot service
└── config/
    └── teams.config.ts

```

## Key Architecture Patterns

### 1. Teams Context Initialization
The app initializes TeamsJS on mount in `App.tsx`:
```typescript
useEffect(() => {
  app.initialize().then(() => {
    app.getContext().then(context => {
      // Use context: meeting.id, user.id, user.tenant.id
    });
  });
}, []);
```

### 2. Participant Data Flow
```
useMeetingContext() → get meeting.id, user.id, tenant.id
  ↓
useParticipants(meetingId, userId, tenantId) → fetch participant list
  ↓
<Wheel participants={participants} /> → render and animate
```

### 3. Wheel Spinning Logic
- **SVG-based rendering**: Segments calculated by participant count and rotation angle
- **Animation**: Rollup rotation with easing (ease-out preferred for natural deceleration)
- **Winner detection**: Calculate which segment lands at the top pointer after spin
- **State management**: React hooks (useState for wheel rotation, isSpinning)

### 4. Real-time Sync (Phase 5)
- **Live Share SDK**: Distributed lock to prevent concurrent spins
- **Spin coordination**: Server-seeded randomization for deterministic results
- **Participant updates**: Listen to meeting events (participantJoined/Left) and debounce wheel updates

## Data Types

### Participant
```typescript
interface Participant {
  id: string;
  displayName: string;
  email?: string;
  participantRole?: 'Presenter' | 'Attendee';
  profilePicture?: string;
}
```

### Meeting Context (from TeamsJS)
```typescript
interface MeetingContext {
  meetingId: string;
  meetingTitle: string;
  user: {
    id: string;
    displayName: string;
    tenantId: string;
  };
  frameContext: 'content' | 'sidePanel' | 'meetingStage' | 'meetingDetailsTab';
}
```

## Teams Manifest Configuration

Key manifest settings (`public/manifest.json`):
- **Configurable tabs**: enabled for meeting context (meetingDetailsTab, meetingSidePanel, meetingStage)
- **Permissions**: identity, messageTeamMembers
- **Web app info**: Microsoft Entra ID app registration ID
- **Valid domains**: The domain where the app is hosted

## Critical APIs & Integration Points

### TeamsJS (App Context)
```typescript
import { app } from '@microsoft/teams-js';

app.initialize();
app.getContext();           // Get meeting.id, user.id, user.tenant.id
app.registerOnThemeChangeHandler((theme) => {...}); // Handle theme changes
```

### Participant Data (Hybrid Approach)
- **Primary**: Microsoft Graph API endpoint for complete roster (if auth available)
- **Fallback**: Bot Framework `TeamsInfo.getMeetingParticipant()` for individual lookups
- **Limitation**: Bot API limited to <350 participants per meeting

### Real-time Updates (Phase 5)
- **Live Share SDK** for distributed state synchronization across meeting participants
- **Meeting bot events** for participant join/leave notifications

## Testing Strategy

### Unit Tests (Jest)
- **Wheel animation logic**: Verify rotation calculations, winner selection
- **Hooks**: Test useMeetingContext, useParticipants with mocked Teams context
- **Components**: Snapshot tests for rendering, prop changes

### Integration Tests
- **Teams context flow**: Mock `app.getContext()` and verify component renders
- **Participant list fetch**: Mock bot API and verify wheel population

### Manual Testing
- Use Teams desktop/web app with a real meeting
- Test with various participant counts (10, 50, 100, 300+)
- Verify theme switching (light/dark/glass/contrast)
- Test real-time sync with multiple browser windows

## Build & Deployment

### Development
```bash
npm run dev              # Vite dev server with hot reload
```

### Production
```bash
npm run build            # Build to dist/ folder
npm run preview          # Test production build locally
```

### Teams Deployment
1. Build the app: `npm run build`
2. Host the dist/ folder on a web server (Azure Static Web Apps, Azure App Service, etc.)
3. Package Teams app: Create `.zip` with `manifest.json`, `icon-color.png`, `icon-outline.png`
4. Sideload or publish to Teams app catalog

### CI/CD (GitHub Actions)
- Auto-build on push to main branch
- Run tests and type checking
- Deploy to staging/production environments

## Key Dependencies

- **@microsoft/teams-js** (v2.31+) — Teams platform integration
- **@microsoft/live-share** (v0.9+) — Real-time synchronization
- **React** (v19) — UI framework
- **TypeScript** (v5.9+) — Type safety
- **@keepit/ui-custom-components** — KES design system components
- **Vite** — Build tool (fast dev server)
- **Jest** — Unit testing
- **Storybook** (optional) — Component development

## Theme Integration

The app respects Teams' light/dark/glass/contrast themes via TeamsJS:
```typescript
app.registerOnThemeChangeHandler((theme) => {
  document.documentElement.setAttribute('data-teams-theme', theme);
});
```

Use CSS custom properties from KES:
```css
background-color: var(--color-background-primary);
color: var(--color-text-primary);
```

## Error Handling & Graceful Degradation

- **Missing meeting context**: Show fallback UI for testing
- **API failures**: Use cached data or mock participants
- **Network issues**: Retry with exponential backoff
- **Large rosters (300+ participants)**: Switch from SVG to canvas rendering
- **Permission issues**: Show helpful error messages

## Common Patterns & Gotchas

1. **TeamsJS initialization**: Must call `app.initialize()` before `app.getContext()`
2. **Context availability**: `meeting.id` not available in all frame contexts (test in intended context)
3. **Real-time participant updates**: Debounce updates to avoid re-renders during spinning
4. **Spin locking**: Use Live Share distributed locks, not just local state
5. **Winner announcement**: Broadcast to all participants, not just the person who clicked "Spin"
6. **Theme colors**: Always fallback to accessible defaults if CSS variables unavailable
7. **Icon generation**: KES icons from `@keepit/ui-custom-components/icons/*`

## Development Tips

- **Mock Teams context**: Create a mock `getContext()` for local development without Teams
- **Test with Storybook**: Isolate component development from Teams integration
- **Playwright for E2E**: Test the wheel animation and participant selection flows
- **TypeScript strict mode**: Enable for type safety, use `satisfies` keyword for better inference

## References & Resources

- **Implementation Plan**: See root project notes for 6-phase breakdown
- **Teams JS SDK**: https://learn.microsoft.com/en-us/javascript/api/@microsoft/teams-js/
- **React Aria**: https://react-spectrum.adobe.com/react-aria/components.html
- **KES Design System**: [Figma](https://www.figma.com/files/1173964848701545203/project/73353638/Library)
- **Live Share SDK**: https://learn.microsoft.com/en-us/javascript/api/@microsoft/live-share/
- **Microsoft Graph API**: https://learn.microsoft.com/en-us/graph/api/
