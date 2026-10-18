export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

const USER_ID_KEY = "zenix_auth_user_id";

export function getStoredUserId(): string | null {
  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredUserId(id: string): void {
  try {
    localStorage.setItem(USER_ID_KEY, id);
  } catch {
    // ignore
  }
}

export function clearStoredUserId(): void {
  try {
    localStorage.removeItem(USER_ID_KEY);
  } catch {
    // ignore
  }
}

export function getAuthHeaders(): Record<string, string> {
  const userId = getStoredUserId();
  if (!userId) return {};
  return {
    Authorization: `Bearer ${userId}`,
    "x-user-id": userId,
  };
}

// Redirect to login with a toast notification
export function redirectToLogin(toast?: (options: { title: string; description: string; variant: string }) => void) {
  clearStoredUserId();
  if (toast) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
  }
  setTimeout(() => {
    window.location.href = "/login";
  }, 500);
}
