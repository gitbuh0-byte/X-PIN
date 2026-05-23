import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
});

if (window.location.pathname === '/auth/callback' && !window.location.hash.startsWith('#/auth/callback')) {
  const normalizedHashUrl = `${window.location.origin}/#/auth/callback${window.location.search}`;
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
