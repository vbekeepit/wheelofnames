# Spin the Wheel - Microsoft Teams App

A Microsoft Teams meeting app that randomly selects meeting participants using an interactive spinning wheel.

## Features

- 🎡 **Interactive Wheel** — Visual spinning wheel for participant selection
- 👥 **Auto-populated** — Automatically loads all meeting participants
- 🎨 **Theme Support** — Respects Teams' light/dark/glass/contrast themes
- 📊 **Spin History & Leaderboard** — Per-meeting spin history stored in Supabase; top winners and spinners shown after 10+ spins
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

## Technologies

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool
- **TeamsJS v2** — Teams platform integration
- **Supabase** — Spin history persistence
- **Jest** — Unit testing

## Azure App Registration Setup (required for auto-detecting meeting participants)

The app uses Microsoft Graph to automatically load participants from the current Teams meeting.
This requires a one-time Azure AD app registration by someone with access to the Keepit Entra ID tenant.

### Steps

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**

2. Fill in:
   - **Name**: `The Keepit Roulette`
   - **Supported account types**: `Single tenant only - Keepit AS`
   - **Redirect URI**: Platform = **Single-page application (SPA)**, URI = `https://vbekeepit.github.io/wheelofnames/auth-end.html`

3. Click **Register**. From the overview page, copy:
   - **Application (client) ID**
   - **Directory (tenant) ID**

4. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**
   - Search for and add: `Chat.ReadBasic`
   - No admin consent needed — each user consents on first login

5. Update the code with the new IDs (two places):
   - `src/manifest.json` → `webApplicationInfo.id` and the `resource` URL (replace the client ID in both)
   - `public/auth-start.html` and `public/auth-end.html` → `clientId` value in the MSAL config block
   - `public/auth-start.html` and `public/auth-end.html` → `authority` URL (replace `common` with the tenant ID)

6. Update `src/services/authService.ts` → `AUTH_START_URL` if the domain changes

7. Run `npm run deploy` and push to GitHub Pages

### How it works

- On first open inside a Teams meeting, the app opens a Microsoft login popup (once per user)
- The user consents to `Chat.ReadBasic` — allows reading who is in the current chat/meeting
- The roster loads automatically. On subsequent opens the token is cached — no popup
- **Settings → 🔄 Reload from meeting** fetches a fresh roster at any time
- If Graph fails (e.g. not in Teams, or no permission), the manual **👥 Pick from meeting** picker still works

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
