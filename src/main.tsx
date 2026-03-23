import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthSessionProvider } from './auth/AuthSessionContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthSessionProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthSessionProvider>
  </StrictMode>,
)
