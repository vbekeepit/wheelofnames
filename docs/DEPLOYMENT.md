# Spin the Wheel - Deployment Guide

This guide covers building, testing, and deploying the Spin the Wheel Teams app to production.

## Prerequisites

- Node.js v18+
- npm v9+
- Microsoft Teams account with admin access
- Azure subscription (for hosting)
- Microsoft Entra ID (Azure AD) tenant

## Build & Optimization

### Development Build

```bash
npm run dev
```

Starts Vite dev server with hot module replacement:
- Port: 5173
- URL: http://localhost:5173

### Production Build

```bash
npm run build
```

Optimizes bundle:
- Input: `src/`
- Output: `dist/`
- Target: Chrome 100+, Safari 15+, Firefox 91+
- Format: ES modules (primary) + CommonJS (fallback)

### Bundle Size Targets

| Artifact | Target | Actual |
|----------|--------|--------|
| Main JS bundle | <100 KB | TBD |
| CSS bundle | <20 KB | TBD |
| Total (gzipped) | <120 KB | TBD |

#### Size Analysis

```bash
npm run build
du -sh dist/

# Analyze bundle
npx webpack-bundle-analyzer dist/
```

## Testing

### Unit Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Generate coverage report
```

**Coverage targets**: >80% for critical paths
- Hooks: `useMeetingContext`, `useParticipants`, `useLiveShare`
- Services: `teamsApiService`, `configService`, `realTimeSync`
- Utilities: `wheelAnimation`, `performance`, `accessibility`

### E2E Tests

```bash
npm run test:e2e                    # Run all tests
npm run test:e2e:screenshot         # Visual regression
npm run test:e2e:style              # Layout/style tests
npx playwright show-report          # View results
```

**Test scenarios**:
- Spin wheel with mock participants
- Configuration persistence
- Keyboard controls (spacebar)
- Real-time sync across windows
- Error recovery and retry logic

## Teams App Deployment

### Step 1: Create App Package

```bash
# 1. Update manifest.json with your app ID and domain
cat src/manifest.json

# 2. Create deployment package
mkdir -p dist/teams-app
cp src/manifest.json dist/teams-app/
cp public/icon-color.png dist/teams-app/
cp public/icon-outline.png dist/teams-app/

# 3. Zip for Teams
cd dist/teams-app
zip -r ../SpinTheWheel.zip .
cd ..
```

**Package contents**:
- `manifest.json` - App configuration (required)
- `icon-color.png` - 192x192 color icon (required)
- `icon-outline.png` - 32x32 outline icon (required)

### Step 2: Register Azure App

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "App registrations"
3. Click "New registration"
4. Fill in:
   - Name: "Spin the Wheel Teams App"
   - Supported account types: "Accounts in this organizational directory only"
5. Click "Register"
6. Copy the **Application (client) ID**
7. Navigate to "Certificates & secrets"
8. Create a new client secret (copy value)

### Step 3: Configure Manifest

Update `src/manifest.json`:

```json
{
  "id": "{{MICROSOFT_APP_ID}}",
  "webApplicationInfo": {
    "id": "{{MICROSOFT_APP_ID}}",
    "resource": "https://{{DOMAIN}}"
  },
  "validDomains": ["{{DOMAIN}}"]
}
```

Replace:
- `{{MICROSOFT_APP_ID}}`: Your app registration ID from Step 2
- `{{DOMAIN}}`: Your hosting domain (e.g., `spinwheel.contoso.com`)

### Step 4: Hosting Setup

#### Option A: Azure Static Web Apps (Recommended)

```bash
# 1. Create Static Web App in Azure Portal
# 2. Connect GitHub repo (auto-builds on push)
# 3. Get deployment token
# 4. Set environment variables:
#    - DOMAIN: your-static-app.azurestaticapps.net
#    - TELEMETRY_ENDPOINT: /api/telemetry

# 5. Deploy
npm run build
# Azure automatically deploys dist/ folder
```

**Pros**: Serverless, auto-scaling, integrated CI/CD
**Cons**: Limited to static hosting (APIs via functions)

#### Option B: Azure App Service

```bash
# 1. Create App Service in Azure Portal
# 2. Create deployment credentials
# 3. Deploy via Git or ZIP

# Option 1: Git deployment
git remote add azure <your-deployment-url>
git push azure main

# Option 2: ZIP deployment
npm run build
az webapp deployment source config-zip \
  --resource-group <rg> \
  --name <app-name> \
  --src <path-to-dist.zip>
```

**Pros**: More control, can run bot service
**Cons**: Higher cost, more maintenance

### Step 5: Sideload in Teams

For testing before publishing:

1. Open Microsoft Teams
2. Go to "Apps" → "Manage your apps"
3. Click "Upload a custom app"
4. Select your `SpinTheWheel.zip` file
5. Click "Add"

The app now appears in your Teams sidebar.

## Production Checklist

- [ ] **Security**
  - [ ] HTTPS/TLS enabled
  - [ ] API endpoints authenticated
  - [ ] Secrets in environment variables (not in code)
  - [ ] CORS properly configured
  - [ ] Rate limiting on APIs

- [ ] **Performance**
  - [ ] Bundle size < 120 KB (gzipped)
  - [ ] First contentful paint < 2s
  - [ ] Spin animation 60 FPS
  - [ ] No memory leaks detected

- [ ] **Accessibility**
  - [ ] WCAG 2.1 AA compliant
  - [ ] Keyboard navigation working
  - [ ] Screen reader tested
  - [ ] Color contrast ≥ 4.5:1

- [ ] **Testing**
  - [ ] Unit test coverage > 80%
  - [ ] E2E tests passing
  - [ ] Real Teams meeting tested
  - [ ] Network failure scenarios tested

- [ ] **Documentation**
  - [ ] README.md complete
  - [ ] Deployment guide ready
  - [ ] API endpoints documented
  - [ ] Error codes documented

- [ ] **Monitoring**
  - [ ] Error tracking configured
  - [ ] Performance metrics enabled
  - [ ] Alerts set up for critical errors
  - [ ] Telemetry endpoint verified

- [ ] **Compliance**
  - [ ] Privacy policy URL set
  - [ ] Terms of use URL set
  - [ ] Developer support info provided
  - [ ] App icon and descriptions correct

## Environment Variables

Create `.env.production`:

```env
# Teams App
VITE_APP_ID={{MICROSOFT_APP_ID}}
VITE_APP_PASSWORD={{CLIENT_SECRET}}
VITE_BOT_ID={{BOT_APP_ID}}
VITE_DOMAIN=https://your-domain.com

# APIs
VITE_TELEMETRY_ENDPOINT=/api/telemetry
VITE_TEAMS_BOT_ENDPOINT=/api/teams

# Feature Flags
VITE_ENABLE_LIVE_SHARE=true
VITE_ENABLE_MONITORING=true
VITE_ENABLE_ANALYTICS=true
```

## Monitoring & Alerts

### Application Insights (Azure)

```bash
# 1. Create Application Insights in Azure Portal
# 2. Get instrumentation key
# 3. Initialize in src/main.tsx:

import { initializeMonitoring } from '@/services/monitoring';
initializeMonitoring('/api/telemetry', true);

# 4. Set up alerts for:
#    - Error rate > 5%
#    - Response time > 5s
#    - Failed wheel spins
```

### Key Metrics to Track

- **Error tracking**
  - Uncaught exceptions
  - API failures
  - Teams context failures
  - Live Share connection issues

- **Performance**
  - Spin animation duration
  - API response times
  - Page load time
  - Memory usage

- **User engagement**
  - Spins per meeting
  - Configuration changes
  - Error recovery success rate

## Troubleshooting

### Manifest Validation Errors

```bash
# Validate manifest
npx @microsoft/teams-manifest-validator dist/teams-app/manifest.json
```

### Teams App Won't Load

1. Check manifest.json exists
2. Verify app ID matches Azure registration
3. Confirm domain is accessible
4. Check CORS headers
5. Review Teams desktop logs: `%appdata%\Microsoft\Teams\logs.txt`

### Performance Issues

1. Check bundle size: `npm run build && du -sh dist/`
2. Profile animations: Browser DevTools Performance tab
3. Check for memory leaks: DevTools Memory tab
4. Analyze network requests: DevTools Network tab

## Rollback

To revert to previous version:

```bash
# Azure Static Web Apps
az staticwebapp backends create \
  --name <app-name> \
  --resource-group <rg> \
  --environment-name production

# Azure App Service
git revert <commit-hash>
git push azure main
```

## Support & Documentation

- **Teams App Help**: https://support.microsoft.com/en-us/office/add-apps-to-your-teams-in-microsoft-teams-6b5aa0b5-0eef-4e73-ba8f-0d85dc78ccf5
- **Manifest Schema**: https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema
- **Teams JS SDK**: https://learn.microsoft.com/en-us/javascript/api/overview/msteams-client
- **Live Share SDK**: https://learn.microsoft.com/en-us/javascript/api/@microsoft/live-share
