import Keycloak from 'keycloak-js';

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM || 'government-interoperability';
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'interoperability-api';

export const keycloak = new Keycloak({
  url: keycloakUrl,
  realm: keycloakRealm,
  clientId: keycloakClientId,
});

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

export async function initKeycloak(): Promise<boolean> {
  if (isInitialized) return keycloak.authenticated || false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Use no onLoad — do NOT auto-redirect to Keycloak on startup.
      // The user explicitly clicks "Sign in" to trigger the login redirect.
      // This prevents a crash when Keycloak is not yet running.
      const authenticated = await keycloak.init({
        pkceMethod: 'S256',
        checkLoginIframe: false,
        enableLogging: import.meta.env.DEV,
      });
      isInitialized = true;
      return authenticated;
    } catch (err) {
      console.warn('Keycloak initialization error (check if Keycloak is running at ' + keycloakUrl + '):', err);
      isInitialized = true;
      return false;
    }
  })();

  return initPromise;
}

export async function getValidToken(): Promise<string | null> {
  if (!keycloak.authenticated) return null;
  try {
    // Refresh token if expiring within 30 seconds
    await keycloak.updateToken(30);
    return keycloak.token || null;
  } catch (err) {
    console.warn('Failed to refresh Keycloak token:', err);
    return null;
  }
}
