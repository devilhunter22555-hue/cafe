import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CustomerProvider } from './context/CustomerContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter><CustomerProvider><App /></CustomerProvider></BrowserRouter>
  </StrictMode>,
)
