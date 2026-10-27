/**
 * Secure cookie utility for Gravurtastisch Web Application.
 * Handles reading, writing, and deleting cookies with strict security flags:
 * - SameSite=Lax / None (CSRF protection)
 * - Secure flag (HTTPS transmission only in production)
 * - Path=/ (universal domain availability)
 */

export interface CookieOptions {
  days?: number;
  path?: string;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
}

/**
 * Store a cookie securely in the browser
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;

  const {
    days = 30,
    path = '/',
    secure = typeof window !== 'undefined' && window.location.protocol === 'https:',
    sameSite = 'Lax',
  } = options;

  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }

  const secureFlag = secure ? '; Secure' : '';
  const sameSiteFlag = `; SameSite=${sameSite}`;

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=${path}${sameSiteFlag}${secureFlag}`;
}

/**
 * Retrieve a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }

  return null;
}

/**
 * Delete a cookie by expiring it immediately
 */
export function deleteCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
}

/**
 * Check if a specific cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}
