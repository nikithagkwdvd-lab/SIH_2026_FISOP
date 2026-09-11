import { getValidToken } from '../auth/keycloak';

// In dev, leave empty so requests go through Vite's proxy (localhost:3000/api -> localhost:8000/api)
// In production, set VITE_API_BASE_URL to your deployed backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  idempotencyKey?: string;
  skipAuth?: boolean;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { idempotencyKey, skipAuth = false, headers: customHeaders, ...restOptions } = options;

  const headers = new Headers(customHeaders || {});

  if (!headers.has('Content-Type') && !(restOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (idempotencyKey) {
    headers.set('Idempotency-Key', idempotencyKey);
  }

  if (!skipAuth) {
    let token = await getValidToken();
    
    // Fallback to dev token if in dev mode and Keycloak is offline
    if (!token && import.meta.env.DEV) {
      const savedDevAuth = localStorage.getItem('fisop_dev_auth');
      if (savedDevAuth) {
        try {
          const parsed = JSON.parse(savedDevAuth);
          token = parsed.token;
          if (!token && parsed.user) {
            const tokenRes = await fetch('/api/dev/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sub: parsed.user.sub,
                username: parsed.user.username,
                roles: parsed.user.roles,
                email: parsed.user.email,
                preferred_username: parsed.user.preferred_username,
                department_code: parsed.user.department_code ?? null,
              }),
            });
            if (tokenRes.ok) {
              const tokenData = await tokenRes.json();
              token = tokenData.access_token;
              localStorage.setItem(
                'fisop_dev_auth',
                JSON.stringify({ user: parsed.user, token })
              );
            }
          }
        } catch {}
      }
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network connection failed';
    throw new ApiError(message, 0);
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    let errorData: unknown = null;
    try {
      errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null) {
        const d = errorData as Record<string, unknown>;
        if (typeof d.detail === 'string') {
          errorDetail = d.detail;
        } else if (Array.isArray(d.detail)) {
          errorDetail = d.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(', ');
        }
      }
    } catch {
      // response is not JSON
    }

    throw new ApiError(errorDetail, response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
