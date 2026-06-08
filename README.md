# Spin the Wheel - Microsoft Teams App

A Microsoft Teams meeting app that randomly selects meeting participants using an interactive spinning wheel.

## Features

- 🎡 **Interactive Wheel** — Visual spinning wheel for participant selection
- 👥 **Auto-populated** — Automatically loads all meeting participants
- 🎨 **Theme Support** — Respects Teams' light/dark/glass/contrast themes
- 🔄 **Real-time Sync** — Synchronized across all meeting participants (Phase 5)
- ⚡ **Fast & Smooth** — Optimized animations and responsive design

## Quick Start

### Prerequisites

- Node.js v18+ and npm
- Microsoft Teams (desktop or web)
- Azure app registration for Teams integration

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server at `http://localhost:5173`. The app requires Teams context, so you'll need to:

1. Create an Azure app registration
2. Update `src/manifest.json` with your app ID and domain
3. Sideload the app into Teams for testing

### Testing

```bash
npm test                # Run unit tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Build

```bash
npm run build          # Production build
npm run preview        # Preview production build
```

## Project Structure

```
src/
├── components/        # React components
├── hooks/            # Custom React hooks (Teams, participant data)
├── types/            # TypeScript interfaces
├── App.tsx           # Root component
├── manifest.json     # Teams app manifest
└── main.tsx          # Entry point
```

## Implementation Phases

1. **Phase 1** (Current) — Foundation & context access
2. **Phase 2** — Wheel UI component
3. **Phase 3** — Animation & interaction
4. **Phase 4** — Teams integration with real participant data
5. **Phase 5** — Real-time synchronization
6. **Phase 6** — Polish & deployment

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guidance.

## Technologies

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool
- **TeamsJS v2** — Teams platform integration
- **KES UI** — Design system components
- **Jest** — Unit testing

## Development Guidelines

- Strict TypeScript with no `any`
- Components follow KES design patterns
- Tests required for new features (>80% coverage)
- Use CSS custom properties from KES design tokens

## Troubleshooting

### App won't load in Teams

- Check that manifest.json has correct app ID and domain
- Ensure the app is sideloaded or published in your Teams tenant
- In development, make sure the app is accessible from the Teams client's network

### Missing meeting context

- App must be opened from within a Teams meeting
- The meeting context initialization in `useMeetingContext` provides a fallback mock context in development

## Resources

- [CLAUDE.md](./CLAUDE.md) — Development guidance
- [Microsoft Teams SDK](https://learn.microsoft.com/en-us/javascript/api/@microsoft/teams-js/)
- [KES Design System](https://keepit.supernova-docs.io/)
