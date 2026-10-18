import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { User } from "@shared/schema";

export function useCurrentUser() {
  return useQuery({
    queryKey: [api.users.me.path],
    queryFn: async () => {
      const res = await fetch(api.users.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.users.me.responses[200].parse(await res.json());
    },
  });
}

export function useUsers(search?: string) {
  return useQuery({
    queryKey: [api.users.list.path, search],
    queryFn: async () => {
      const url = search 
        ? `${api.users.list.path}?search=${encodeURIComponent(search)}` 
        : api.users.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.users.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.users.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
