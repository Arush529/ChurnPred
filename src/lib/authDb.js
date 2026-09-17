// External Backend & MongoDB Authentication Client for ChurnPred
const SESSION_KEY = 'churnpred_auth_session';

/**
 * Check backend and MongoDB connection status
 */
export async function getBackendHealth() {
  try {
    const res = await fetch('/api/auth/health');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      error: err.message
    };
  }
}

/**
 * Seed initial demo account if needed
 */
export async function seedDemoUser() {
  try {
    await getBackendHealth();
  } catch (e) {
    // Silent check
  }
}

async function parseApiResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch (e) {
      // Fall through
    }
  }

  // Handle non-JSON response (e.g. Vite proxy 504 / gateway timeout when backend is offline)
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504 || text.includes('The page c') || text.includes('ECONNREFUSED')) {
      throw new Error('Backend server is offline on port 5000. Please start both frontend and backend by running "npm run dev:all" in your terminal.');
    }
    throw new Error(`Server returned status ${res.status}: ${res.statusText || 'Non-JSON response'}`);
  }
  return { text };
}

/**
 * Register a new user in MongoDB via Backend API
 */
export async function registerUser({ name, email, password, company = 'Enterprise' }) {
  if (!name || !name.trim()) throw new Error('Full Name is required.');
  if (!email || !email.includes('@')) throw new Error('A valid email address is required.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  let res;
  try {
    res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        company: company.trim() || 'Enterprise Org'
      })
    });
  } catch (netErr) {
    throw new Error('Cannot connect to backend server. Make sure it is running via "npm run dev:all".');
  }

  const data = await parseApiResponse(res);
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create user account.');
  }

  // Store active session in localStorage
  const sessionUser = {
    ...data.user,
    token: data.user.token
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

/**
 * Log in an existing user via Backend API
 */
export async function loginUser({ email, password }) {
  if (!email || !password) throw new Error('Please enter both email and password.');

  let res;
  try {
    res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password
      })
    });
  } catch (netErr) {
    throw new Error('Cannot connect to backend server. Make sure it is running via "npm run dev:all".');
  }

  const data = await parseApiResponse(res);
  if (!res.ok) {
    throw new Error(data.error || 'Invalid email or password.');
  }

  // Store active session in localStorage
  const sessionUser = {
    ...data.user,
    token: data.user.token
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

/**
 * Get current active session from localStorage
 */
export function getCurrentUser() {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    return JSON.parse(sessionStr);
  } catch (e) {
    return null;
  }
}

/**
 * Log out user and clear session
 */
export function logoutUser() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error(e);
  }
}

/**
 * Fetch all registered accounts metadata
 */
export async function getAllUsers() {
  try {
    const res = await fetch('/api/auth/users');
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    return [];
  }
}
