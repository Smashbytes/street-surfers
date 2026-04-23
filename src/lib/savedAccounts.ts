// Lightweight store for "remembered" Supabase sessions so the user can
// switch between multiple passenger accounts (e.g. their own staff account
// and their child's scholar account) without signing out of either.
//
// Tokens already live in localStorage under Supabase's own key — this just
// keeps a parallel record for the *other* accounts the user has signed
// into on this device. No new threat surface.

const STORAGE_KEY = 'street_surfers_saved_accounts';

export interface SavedAccount {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  passengerType: string | null; // 'scholar' | 'staff' | null
  refreshToken: string;
  accessToken: string;
  savedAt: string; // ISO
}

function safeParse(raw: string | null): SavedAccount[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a) => a && typeof a.userId === 'string' && typeof a.refreshToken === 'string'
    );
  } catch {
    return [];
  }
}

export function listSavedAccounts(): SavedAccount[] {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveAccount(account: SavedAccount): void {
  if (typeof window === 'undefined') return;
  const existing = listSavedAccounts().filter((a) => a.userId !== account.userId);
  const next = [...existing, { ...account, savedAt: new Date().toISOString() }];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function removeSavedAccount(userId: string): void {
  if (typeof window === 'undefined') return;
  const next = listSavedAccounts().filter((a) => a.userId !== userId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearSavedAccounts(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// Marker localStorage key set when the user taps "Add another account" so
// that a successful sign-in on /auth knows to preserve the previous session
// before swapping it out (rather than silently overwriting it).
const ADDITIVE_KEY = 'street_surfers_additive_signin';

export function setAdditiveSignIn(prev: SavedAccount): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADDITIVE_KEY, JSON.stringify(prev));
}

export function consumeAdditiveSignIn(): SavedAccount | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(ADDITIVE_KEY);
  if (!raw) return null;
  window.localStorage.removeItem(ADDITIVE_KEY);
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.refreshToken === 'string') {
      return parsed as SavedAccount;
    }
    return null;
  } catch {
    return null;
  }
}

export function isAdditiveSignInPending(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ADDITIVE_KEY) !== null;
}
