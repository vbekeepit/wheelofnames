import { authentication } from '@microsoft/teams-js';

const TOKEN_KEY = 'spin-wheel:graph-token';
const AUTH_START_URL = 'https://vbekeepit.github.io/wheelofnames/auth-start.html';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

function getCachedToken(): string | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const cached: CachedToken = JSON.parse(raw);
    if (Date.now() < cached.expiresAt - 5 * 60 * 1000) return cached.accessToken;
    sessionStorage.removeItem(TOKEN_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedToken(accessToken: string, expiresAt: number): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, expiresAt }));
  } catch {
    // sessionStorage unavailable
  }
}

export async function getGraphToken(tenantId: string): Promise<string> {
  const cached = getCachedToken();
  if (cached) return cached;

  const result = await authentication.authenticate({
    url: `${AUTH_START_URL}?tenantId=${encodeURIComponent(tenantId)}`,
    width: 600,
    height: 535,
  });

  const parsed: { accessToken: string; expiresAt: number } = JSON.parse(result);
  setCachedToken(parsed.accessToken, parsed.expiresAt);
  return parsed.accessToken;
}
