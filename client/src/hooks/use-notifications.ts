import { useEffect, useRef } from "react";

interface MessageLike {
  id: number;
  senderId: string;
  content?: string | null;
  type?: string | null;
  createdAt?: Date | string | null;
}

interface UserWithLastMessage {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  lastMessage?: MessageLike | null;
}

const STORAGE_KEY = "zenix-last-seen-msg";

function getStoredIds(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveIds(ids: Record<string, number>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

function getMessagePreviewText(msg: MessageLike): string {
  const type = msg.type || "text";
  if (type === "image") return "📷 Photo";
  if (type === "video") return "🎥 Video";
  if (type === "voice" || type === "audio") return "🎤 Voice message";
  if (type === "document") return "📄 Document";
  const content = msg.content || "";
  if (content.includes("\n\n")) return content.split("\n\n").slice(1).join(" ").slice(0, 80);
  return content.slice(0, 80);
}

export function useMessageNotifications(
  users: UserWithLastMessage[] | undefined,
  currentUserId: string | undefined,
  mutedIds: string[] = []
) {
  const initialized = useRef(false);
  const lastIdsRef = useRef<Record<string, number>>(getStoredIds());

  useEffect(() => {
    if (!users || !currentUserId) return;

    if (!initialized.current) {
      const ids: Record<string, number> = {};
      users.forEach(u => {
        const lm = u.lastMessage;
        if (lm) ids[u.id] = lm.id;
      });
      lastIdsRef.current = { ...lastIdsRef.current, ...ids };
      saveIds(lastIdsRef.current);
      initialized.current = true;
      return;
    }

    users.forEach(u => {
      const lm = u.lastMessage;
      if (!lm) return;
      if (lm.senderId === currentUserId) return;
      if (mutedIds.includes(u.id)) return;

      const lastSeen = lastIdsRef.current[u.id];
      if (lastSeen !== undefined && lm.id > lastSeen) {
        const senderName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Someone";
        const body = getMessagePreviewText(lm);

        if (Notification.permission === "granted") {
          const notif = new Notification(senderName, {
            body,
            icon: u.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random&color=fff`,
            tag: `zenix-msg-${u.id}`,
            silent: false,
          });
          notif.onclick = () => {
            window.focus();
            window.location.href = `/chat/${u.id}`;
          };
        }
      }

      lastIdsRef.current[u.id] = lm.id;
    });

    saveIds(lastIdsRef.current);
  }, [users, currentUserId, mutedIds]);
}
