import { apiClient } from './client';

export async function requestDevToken(payload: Record<string, any>): Promise<{ access_token: string }> {
  return apiClient<{ access_token: string }>('/api/dev/token', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function initKeycloakSSO(): void {
  const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
  const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'government-interoperability';
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'interoperability-api';
  
  const authUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    window.location.origin + '/my-applications'
  )}&response_type=code&scope=openid`;

  window.location.href = authUrl;
}
