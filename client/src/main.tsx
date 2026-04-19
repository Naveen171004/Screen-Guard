import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { AppProvider } from './context/AppContext.tsx'
import { SocketProvider } from './context/SocketContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>,
)
