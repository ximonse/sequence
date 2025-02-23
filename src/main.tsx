import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx'; // ✅ Fixed import to TypeScript file

createRoot(document.getElementById('root') as HTMLElement).render( // ✅ Fixed TypeScript issue
  <StrictMode>
    <App />
  </StrictMode>,
);
