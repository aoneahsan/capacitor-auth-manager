import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { auth } from 'capacitor-auth-manager';

// Configure auth before app starts
auth.configure({
  providers: {
    google: {
      clientId:
        import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
    },
    github: {
      clientId:
        import.meta.env.VITE_GITHUB_CLIENT_ID || 'your-github-client-id',
    },
    facebook: {
      appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'your-facebook-app-id',
    },
    microsoft: {
      clientId:
        import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'your-microsoft-client-id',
    },
  },
  persistence: 'local',
  enableLogging: true,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
