import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'remixicon/fonts/remixicon.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dispatch render event for prerenderer
// This tells the prerenderer that the page is ready to be captured
document.dispatchEvent(new Event('render-event'))
