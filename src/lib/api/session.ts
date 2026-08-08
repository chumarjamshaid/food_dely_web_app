// Session management utilities for anonymous users
// Stores session_id in localStorage to maintain cart session across requests

const SESSION_ID_KEY = 'cart_session_id';

/**
 * Get the stored session ID from localStorage
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(SESSION_ID_KEY);
}

/** Return the stable anonymous checkout identity, creating it on first use. */
export function getOrCreateSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  const existing = getSessionId();
  if (existing) return existing;
  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  setSessionId(generated);
  return generated;
}

/**
 * Store the session ID in localStorage
 */
export function setSessionId(sessionId: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (sessionId) {
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  } else {
    localStorage.removeItem(SESSION_ID_KEY);
  }
}

/**
 * Clear the stored session ID
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(SESSION_ID_KEY);
}

/**
 * Check if user is authenticated (has auth token)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return !!localStorage.getItem('auth_token');
}
