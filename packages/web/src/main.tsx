import React from 'react';
import ReactDOM from 'react-dom/client';
import { initTelegram } from './lib/telegram';
import App from './App';
import './index.css';

// Dark mode initialization
const saved = localStorage.getItem('theme');
if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

initTelegram();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
