// src/utils/session.js
// 24-Hour Unified Session Manager for User & Admin

export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const USER_SESSION_KEY = 'azpdf_user_session';
export const ADMIN_SESSION_KEY = 'azpdf_admin_session';

/**
 * Save user session to localStorage with a 24-hour expiration timestamp.
 */
export function setUserSession(user) {
  if (!user) {
    clearUserSession();
    return;
  }
  const now = Date.now();
  const sessionData = {
    user,
    loginTime: now,
    expiresAt: now + SESSION_DURATION_MS
  };
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
    window.dispatchEvent(new Event('azpdf_session_change'));
  } catch (e) {
    console.error('Failed to set user session:', e);
  }
}

/**
 * Retrieve active user session.
 * Automatically clears and returns null if the 24-hour window has expired.
 */
export function getUserSession() {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const user = parsed.user || (parsed.email ? parsed : null);
    if (!user || !user.email) return null;

    const now = Date.now();
    const expiresAt = parsed.expiresAt;
    const loginTime = parsed.loginTime;

    // Check 24-hour expiration
    if (expiresAt && now > expiresAt) {
      clearUserSession();
      return null;
    }
    if (loginTime && (now - loginTime > SESSION_DURATION_MS)) {
      clearUserSession();
      return null;
    }

    return user;
  } catch (e) {
    return null;
  }
}

/**
 * Clear user session on explicit logout or account deletion.
 */
export function clearUserSession() {
  try {
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem('azpdf_active_user');
    localStorage.removeItem('azpdf_auth');
    localStorage.removeItem('azpdf_user');
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem('azpdf_active_user');
    window.dispatchEvent(new Event('azpdf_session_change'));
  } catch (e) {
    console.error('Failed to clear user session:', e);
  }
}

/**
 * Save admin session to localStorage with a 24-hour expiration timestamp.
 */
export function setAdminSession(adminData = { role: 'admin', name: 'Administrator' }) {
  const now = Date.now();
  const sessionData = {
    admin: adminData,
    loginTime: now,
    expiresAt: now + SESSION_DURATION_MS
  };
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
    window.dispatchEvent(new Event('azpdf_session_change'));
  } catch (e) {
    console.error('Failed to set admin session:', e);
  }
}

/**
 * Retrieve active admin session.
 * Automatically clears and returns null if the 24-hour window has expired.
 */
export function getAdminSession() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const now = Date.now();
    const expiresAt = parsed.expiresAt;
    const loginTime = parsed.loginTime;

    if (expiresAt && now > expiresAt) {
      clearAdminSession();
      return null;
    }
    if (loginTime && (now - loginTime > SESSION_DURATION_MS)) {
      clearAdminSession();
      return null;
    }

    return parsed.admin || parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Clear admin session on explicit logout.
 */
export function clearAdminSession() {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.dispatchEvent(new Event('azpdf_session_change'));
  } catch (e) {
    console.error('Failed to clear admin session:', e);
  }
}
