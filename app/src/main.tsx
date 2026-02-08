import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Simple error handler
window.onerror = function (message) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<div style="padding:20px;color:red;font-family:monospace;"><h2>Error</h2><p>' + message + '</p></div>';
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

