import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'

// Configuração do Auth0 (Applications > sua SPA e APIs > sua API)
const AUTH0_DOMAIN = "dev-vlbhbshl7b1pxe8e.us.auth0.com"
const AUTH0_CLIENT_ID = "Crpd23BOSB8wodfqgphMHA16oteWzVK2"
const AUTH0_AUDIENCE = "https://dev-vlbhbshl7b1pxe8e.us.auth0.com/api/v2/"

createRoot(document.getElementById('root')).render(
  <Auth0Provider
    domain={AUTH0_DOMAIN}
    clientId={AUTH0_CLIENT_ID}
    cacheLocation="localstorage"
    authorizationParams={{
      audience: AUTH0_AUDIENCE,
      redirect_uri: window.location.origin
    }}
  >
    <App />
  </Auth0Provider>,
)
