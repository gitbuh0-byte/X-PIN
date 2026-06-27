import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
});

const authHash = window.location.hash;
const authHashMatch = authHash.match(/^#(access_token|refresh_token|provider_token|type)=/);
const callbackAuthHashMatch = authHash.match(/^#\/?auth\/callback#(access_token|refresh_token|provider_token|type)=/);
const callbackRawJwtMatch = authHash.match(/^#\/auth\/callback\?([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)(&.*)?$/);
if (window.location.pathname === '/auth/callback' && !authHash.startsWith('#/auth/callback')) {
  const normalizedHashUrl = authHashMatch
    ? `${window.location.origin}/#/auth/callback?${authHash.slice(1)}`
    : `${window.location.origin}/#/auth/callback${window.location.search}${authHash}`;
  window.location.replace(normalizedHashUrl);
} else if (callbackRawJwtMatch) {
  const token = callbackRawJwtMatch[1];
  const rest = callbackRawJwtMatch[2] || '';
  const normalizedHashUrl = `${window.location.origin}/#/auth/callback#access_token=${encodeURIComponent(token)}${rest}`;
  window.location.replace(normalizedHashUrl);
} else if (callbackAuthHashMatch) {
  const normalizedHashUrl = `${window.location.origin}/#/auth/callback?${authHash.slice(callbackAuthHashMatch[0].length)}`;
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
