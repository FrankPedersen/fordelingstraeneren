import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './app/App';
import './ui/styles.css';

const root = createRoot(document.getElementById('root')!);
let updateSW: (reloadPage?: boolean) => Promise<void> = async () => {};

function render(updateReady: boolean) {
  root.render(
    <StrictMode>
      <App updateReady={updateReady} onUpdate={() => void updateSW(true)} />
    </StrictMode>,
  );
}

render(false);
// Ny version: vis en knap i stedet for at genindlæse midt i en session.
updateSW = registerSW({ onNeedRefresh: () => render(true) });
