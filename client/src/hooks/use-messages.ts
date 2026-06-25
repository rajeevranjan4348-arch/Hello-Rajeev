import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertMessage, Message } from "@shared/schema";

export function useMessages(userId: string) {
  return useQuery({
    queryKey: [api.messages.list.path, userId],
    queryFn: async () => {
      const url = buildUrl(api.messages.list.path, { userId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!userId,
    refetchInterval: 800, // Reduced from 2000ms → 800ms for snappier feel
    staleTime: 0,
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

    onMutate: async (newMsg) => {
      const queryKey = [api.messages.list.path, newMsg.receiverId];

      // Stop any in-flight refetch so it doesn't overwrite our optimistic data
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

      const tempId = -Date.now(); // negative so it never collides with real IDs
      const optimisticMessage: Message = {
        id: tempId,
        senderId: newMsg.senderId,
        receiverId: newMsg.receiverId ?? null,
        groupId: null,
        content: newMsg.content,
        type: newMsg.type ?? "text",
        isEdited: null,
        isDeleted: null,
        readAt: null,
        expiresAt: null,
        createdAt: new Date(),
      };

      // Instantly add to cache — user sees message right away
      queryClient.setQueryData<Message[]>(queryKey, (old) =>
        old ? [...old, optimisticMessage] : [optimisticMessage]
      );

      return { previousMessages, queryKey, tempId };
    },

    onError: (_err, _newMsg, context: any) => {
      // Roll back if server rejected
      if (context?.previousMessages !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousMessages);
      }
    },

    onSuccess: (realMessage, _vars, context: any) => {
      // Swap the optimistic placeholder with the real server message
      // — no full refetch needed, no flicker
      queryClient.setQueryData<Message[]>(context.queryKey, (old) =>
        old
          ? old.map((m) => (m.id === context.tempId ? realMessage : m))
          : [realMessage]
      );

      // Also refresh the sender's side (for cross-device sync)
      queryClient.invalidateQueries({
        queryKey: [api.messages.list.path, realMessage.senderId],
        refetchType: "none", // don't force an immediate fetch, let polling handle it
      });
    },
  });
}
