import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PickerDialog } from './components/PickerDialog/PickerDialog';
import './App.css';

const isPicker = new URLSearchParams(window.location.search).get('mode') === 'picker';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isPicker ? <PickerDialog /> : <App />}
  </React.StrictMode>
);
