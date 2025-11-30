import { signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Lightweight helper to sign out quickly: attempt server-side signout then immediately
// call next-auth signOut without redirect and force client-side navigation to /login.
export async function fastSignOut(router?: { replace: (url: string) => void }) {
  try {
    // Try to notify the server to destroy any session state/cookies.
    // This is best-effort; if it fails we still proceed to client-side sign out.
    await fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => {});
  } catch (_e) {
    // ignore
  }

  try {
    // Ask next-auth to clear client session, but avoid its redirect which can be slow.
    await signOut({ redirect: false }).catch(() => {});
  } catch (_e) {
    // ignore
  }

  // Immediately navigate to login page. Use replace to avoid keeping the protected page in history.
  try {
    router?.replace('/login');
  } catch (_e) {
    // Fallback: try full reload to login page
    try {
      window.location.href = '/login';
    } catch (_e2) {
      // noop
    }
  }

  // Small toast to give feedback
  try {
    toast.success('Desconectado');
  } catch (_e) {
    // noop
  }
}

export default fastSignOut;
