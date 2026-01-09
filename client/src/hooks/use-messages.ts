import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertMessage, Message } from "@shared/schema";

export function useMessages(userId: number) {
  return useQuery({
    queryKey: [api.messages.list.path, userId],
    queryFn: async () => {
      const url = buildUrl(api.messages.list.path, { userId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!userId,
    refetchInterval: 2000, // Poll every 2 seconds for real-time feel
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertMessage) => {
      const res = await fetch(api.messages.send.path, {
        method: api.messages.send.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
           const error = api.messages.send.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to send message");
      }
      return api.messages.send.responses[201].parse(await res.json());
    },
    onSuccess: (newMessage) => {
      // Invalidate the specific conversation query to show new message immediately
      queryClient.invalidateQueries({ 
        queryKey: [api.messages.list.path, newMessage.receiverId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [api.messages.list.path, newMessage.senderId] 
      });
    },
  });
}
