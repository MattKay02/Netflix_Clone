/*
  WHY THIS FILE EXISTS:
  main.tsx is the application entry point. Its only job is to mount the React
  tree into the DOM and wrap it with the required providers.

  PROVIDER ORDER — this matters. See ARCHITECTURE.md for the full rationale.

  <BrowserRouter>           React Router — outermost so any provider can navigate
    <QueryProvider>         TanStack Query — server state cache
      <ModalProvider>       React Context — ephemeral UI state (which modal is open)
        <App />             Routes + pages
      </ModalProvider>
    </QueryProvider>
  </BrowserRouter>

  StrictMode is kept on for development. It double-invokes effects and renders
  to surface bugs. It has no impact on production builds.
*/

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider'
import { ModalProvider } from './contexts/ModalContext'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>,
)
