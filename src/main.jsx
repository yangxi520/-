import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Remove the legacy PWA worker. It used to serve an old cached index before
// the new bundle could load, which made the custom domain appear out of date.
const removeLegacyServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ('caches' in globalThis) {
      const cacheNames = await globalThis.caches.keys();
      await Promise.all(cacheNames.map((cacheName) => globalThis.caches.delete(cacheName)));
    }
  } catch (error) {
    console.warn('Unable to remove legacy service worker:', error);
  }
};

void removeLegacyServiceWorkers();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
