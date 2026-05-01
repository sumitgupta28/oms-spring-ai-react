import React from 'react'
import ReactDOM from 'react-dom/client'
import keycloak from './keycloak'
import App from './App'
import './index.css'

keycloak
  .init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  })
  .then((authenticated) => {
    if (authenticated) {
      ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      )
    } else {
      keycloak.login()
    }
  })
  .catch(() => {
    console.error('Keycloak initialization failed')
  })
