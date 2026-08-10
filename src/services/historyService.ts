const SUPABASE_URL = 'https://rgtltbraadmpgnmzoygy.supabase.co/rest/v1/spin_results';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJndGx0YnJhYWRtcGdubXpveWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNDkxNDQsImV4cCI6MjEwMTkyNTE0NH0.Ko2C1t9cKMSrIanV8g9itGeNM8Gc3iVKsgunhuAGDH8';

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export interface SpinResult {
  id?: number;
  meeting_id: string;
  winner_name: string;
  spun_at?: string;
  spun_by: string;
}

export async function saveSpinResult(
  result: Omit<SpinResult, 'id' | 'spun_at'>
): Promise<void> {
  await fetch(SUPABASE_URL, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify(result),
  });
}

export async function getSpinHistory(meetingId: string): Promise<SpinResult[]> {
  const resp = await fetch(
    `${SUPABASE_URL}?meeting_id=eq.${encodeURIComponent(meetingId)}&order=spun_at.desc&limit=50`,
    { headers: HEADERS }
  );
  if (!resp.ok) return [];
  return resp.json();
}
