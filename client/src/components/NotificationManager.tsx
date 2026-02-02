import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/hooks/use-users";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Message } from "@shared/schema";

export function NotificationManager() {
  const { data: currentUser } = useCurrentUser();
  const lastMessageIdRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on first user interaction if needed, 
  // but browsers usually allow programmatic play if user has interacted with the site.
  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
  }, []);

  // Poll for ALL recent messages to detect new ones for notifications
  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages/all"],
    queryFn: async () => {
      const res = await fetch("/api/messages/recent", { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!currentUser,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!messages || messages.length === 0 || !currentUser) return;

    // Filter messages where current user is receiver and it's new
    const incomingMessages = messages.filter(
      (m) => m.receiverId === currentUser.id && m.senderId !== currentUser.id
    );

    if (incomingMessages.length > 0) {
      const latestMsg = incomingMessages[incomingMessages.length - 1];
      
      // If we haven't tracked a last message ID yet, set it and don't notify
      if (lastMessageIdRef.current === null) {
        lastMessageIdRef.current = latestMsg.id;
        return;
      }

      // If there's a new message ID we haven't seen
      if (latestMsg.id > lastMessageIdRef.current) {
        lastMessageIdRef.current = latestMsg.id;

        // Play sound
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
        }

        // Show browser notification if permitted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("New Message", {
            body: latestMsg.content.substring(0, 100),
            icon: "/favicon.ico"
          });
        }
      }
    }
  }, [messages, currentUser]);

  return null;
}
