import { useEffect, useState } from 'react';
import { app, people, dialog } from '@microsoft/teams-js';
import type { PeoplePickerResult } from '@microsoft/teams-js';

export function PickerDialog() {
  const [status, setStatus] = useState('Opening people picker…');

  useEffect(() => {
    const run = async () => {
      try {
        await app.initialize();
        const results: PeoplePickerResult[] = await people.selectPeople({
          title: 'Select participants for the wheel',
          singleSelect: false,
          openOrgWideSearchInChatOrChannel: false,
        });
        dialog.url.submit(results);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatus(`Could not open people picker: ${msg}`);
        // Give user a moment to read the error, then close
        setTimeout(() => dialog.url.submit(null), 3000);
      }
    };
    run();
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'inherit' }}>
      <p style={{ color: '#555', fontSize: '1rem' }}>{status}</p>
    </div>
  );
}
