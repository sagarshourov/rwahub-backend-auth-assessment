import { API_BASE_URL } from './apiBase';

// Session token is only used as a bearer credential, never a source of user identity.
// In-memory session means reloading requires another sign-in (safer than persistent JWT storage).
let accessToken: string | null = null;
export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => { accessToken = token; };

export async function authRequest(path: string, body: unknown) {
  const response = await fetch(`${API_BASE_URL}/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Authentication failed (${response.status})`);
  return data as { token: string; user: any; message?: string };
}
