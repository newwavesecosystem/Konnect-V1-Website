import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const msg = String(event?.message || '')
      const filename = String(event?.filename || '')
      if (
        msg.includes('Bridge that has been shut down') ||
        filename.startsWith('chrome-extension://')
      ) {
        event.stopImmediatePropagation()
      }
    },
    true
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
