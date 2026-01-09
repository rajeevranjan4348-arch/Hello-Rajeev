import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertCall } from "@shared/schema";

export function useCalls() {
  return useQuery({
    queryKey: [api.calls.list.path],
    queryFn: async () => {
      const res = await fetch(api.calls.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch calls");
      return api.calls.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000,
  });
}

export function useCreateCall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { calleeId: number, type: 'video' | 'voice' }) => {
      const res = await fetch(api.calls.create.path, {
        method: api.calls.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to start call");
      return api.calls.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.calls.list.path] });
    },
  });
}
