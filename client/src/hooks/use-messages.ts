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
    refetchInterval: 2000,
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

    // Optimistic update — message appears instantly before server confirms
    onMutate: async (newMsg) => {
      const queryKey = [api.messages.list.path, newMsg.receiverId];
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

      const optimisticMessage: Message = {
        id: Date.now(), // temp id
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

      queryClient.setQueryData<Message[]>(queryKey, (old) =>
        old ? [...old, optimisticMessage] : [optimisticMessage]
      );

      return { previousMessages, queryKey };
    },

    onError: (_err, _newMsg, context: any) => {
      // Roll back on error
      if (context?.previousMessages !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousMessages);
      }
    },

    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({
        queryKey: [api.messages.list.path, newMessage.receiverId],
      });
      queryClient.invalidateQueries({
        queryKey: [api.messages.list.path, newMessage.senderId],
      });
    },
  });
}
