import { authentication } from '@microsoft/teams-js';

const CLIENT_ID = '1729cc2c-d54b-4615-8e4d-8a3460fb3f00';
const SCOPE = 'Chat.ReadBasic Presence.Read.All offline_access';
const AUTH_START_URL = 'https://vbekeepit.github.io/wheelofnames/auth-start.html';
const TOKEN_KEY = 'spin-wheel:graph-token';
const REFRESH_KEY = 'spin-wheel:refresh-token';
// Bump this string whenever SCOPE changes — clears the cached access token so
// the refresh-token flow picks up the new scope on next app open.
const SCOPE_VERSION_KEY = 'spin-wheel:scope-v';
const SCOPE_VERSION = '2';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

function getCachedToken(): string | null {
  try {
    // If the scope changed since the token was issued, evict it so the
    // refresh-token flow runs with the updated scope.
    if (localStorage.getItem(SCOPE_VERSION_KEY) !== SCOPE_VERSION) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(SCOPE_VERSION_KEY, SCOPE_VERSION);
      return null;
    }
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const cached: CachedToken = JSON.parse(raw);
    if (Date.now() < cached.expiresAt - 5 * 60 * 1000) return cached.accessToken;
    localStorage.removeItem(TOKEN_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedToken(accessToken: string, expiresAt: number): void {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, expiresAt }));
  } catch { /* storage unavailable */ }
}

function setRefreshToken(refreshToken: string): void {
  try {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch { /* storage unavailable */ }
}

async function tryRefreshToken(tenantId: string): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const resp = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          scope: SCOPE,
        }),
      }
    );
    if (!resp.ok) { localStorage.removeItem(REFRESH_KEY); return null; }
    const data = await resp.json();
    if (data.error) { localStorage.removeItem(REFRESH_KEY); return null; }
    const expiresAt = Date.now() + data.expires_in * 1000;
    setCachedToken(data.access_token, expiresAt);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

/** True only when a valid access token is in cache — meaning auto-fetch can
 *  run with zero chance of showing a popup. We deliberately do not count a
 *  refresh token here: we cannot know whether it is still valid without
 *  actually trying it, so we leave that for the user-triggered Autopick path. */
export function hasTokenCached(): boolean {
  try {
    return !!getCachedToken();
  } catch {
    return false;
  }
}

export async function getGraphToken(tenantId: string): Promise<string> {
  const cached = getCachedToken();
  if (cached) return cached;

  const silent = await tryRefreshToken(tenantId);
  if (silent) return silent;

  // First-time or expired refresh token — show auth popup once
  const result = await authentication.authenticate({
    url: `${AUTH_START_URL}?tenantId=${encodeURIComponent(tenantId)}`,
    width: 600,
    height: 535,
  });

  const parsed: { accessToken: string; expiresAt: number; refreshToken?: string | null } =
    JSON.parse(result);
  setCachedToken(parsed.accessToken, parsed.expiresAt);
  if (parsed.refreshToken) setRefreshToken(parsed.refreshToken);
  return parsed.accessToken;
}
