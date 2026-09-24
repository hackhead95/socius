import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { App } from './app/App';
import { applyTheme, useUi } from './app/ui-store';
import { AppErrorBoundary } from './app/ErrorBoundary';
import { installErrorLog, reactRootErrorOptions } from './features/errorlog/install';
import { registerMenuKnowledge } from './app/menuKnowledge';

// Error log (Help > Error log): uncaught errors, context for entries. Before anything else can fail.
installErrorLog();

// The Socius assistant's knowledge of the menus comes from the real menu model.
registerMenuKnowledge();

// Apply the saved theme before the first paint to avoid a flash.
applyTheme(useUi.getState().theme);

// React reports errors at the root too: errors caught by boundaries other than Socius's own (which log
// themselves), errors nothing caught, and errors React recovered from. All go to the error log.
createRoot(document.getElementById('root')!, reactRootErrorOptions).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
