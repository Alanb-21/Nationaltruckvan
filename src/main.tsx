import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if (import.meta.env.DEV) {
  // handles for the Playwright QA scripts in qa/
  import('./tour/tourStore').then((m) => Object.assign(window, { __tour: m.useTour }))
  import('./store').then((m) => Object.assign(window, { __demo: m.useDemo }))
}
