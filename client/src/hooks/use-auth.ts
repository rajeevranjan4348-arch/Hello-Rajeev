import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { getAuthHeaders, clearStoredUserId } from "@/lib/auth-utils";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  clearStoredUserId();
  // Try OTP logout first (session-based), then fall back to Replit OIDC logout
  try {
    const res = await fetch("/api/otp/logout", {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (res.ok) {
      window.location.href = "/login";
      return;
    }
  } catch {
    // ignore, fall through to Replit logout
  }
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
