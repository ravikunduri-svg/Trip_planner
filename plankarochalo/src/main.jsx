import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import './index.css'
import App from './App.jsx'

posthog.init('phc_Bz4Brt2tSUsxyi2Gc2Fmu8pcqMhaiRAxtnWtCoRNsPdi', {
  api_host: 'https://us.posthog.com',
  capture_pageview: true,
  capture_pageleave: true,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
