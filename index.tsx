import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
});

const authHash = window.location.hash;
const authHashMatch = authHash.match(/^#(access_token|refresh_token|provider_token|type)=/);
if (window.location.pathname === '/auth/callback' && !authHash.startsWith('#/auth/callback')) {
  const normalizedHashUrl = authHashMatch
    ? `${window.location.origin}/#/auth/callback?${authHash.slice(1)}`
    : `${window.location.origin}/#/auth/callback${window.location.search}${authHash}`;
  window.location.replace(normalizedHashUrl);
} else if (authHashMatch) {
  const normalizedHashUrl = `${window.location.origin}/#/auth/callback?${authHash.slice(1)}`;
  window.location.replace(normalizedHashUrl);
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Critical Failure: Root element not found.");
}
