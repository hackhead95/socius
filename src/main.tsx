import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { App } from './app/App';
import { applyTheme, useUi } from './app/ui-store';
import { AppErrorBoundary } from './app/ErrorBoundary';
import { installErrorLog } from './features/errorlog/install';

// Error log (Help > Error log): uncaught errors, context for entries. Before anything else can fail.
installErrorLog();

// Apply the saved theme before the first paint to avoid a flash.
applyTheme(useUi.getState().theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
