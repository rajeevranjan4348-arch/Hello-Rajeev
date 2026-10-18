import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { useUser, useCurrentUser } from "@/hooks/use-users";
import { Avatar } from "@/components/Avatar";
import { Layout } from "@/components/Layout";
import { Link, useRoute } from "wouter";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  Paperclip,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  Lock as LockIcon,
  Camera,
  Image as ImageIcon,
  Search,
  BellOff,
  Wallpaper,
  Eraser,
  UserCircle,
  FileText,
  MailCheck,
  ShieldAlert,
  Reply,
  Mic,
  Square,
  Smile,
  File,
  CheckCheck,
  Check,
  Copy,
  Star,
  Forward,
  X,
  Info,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import RecordRTC from "recordrtc";
import { io, Socket } from "socket.io-client";
// @ts-ignore
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";
import { api } from "@shared/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ContactInfo } from "@/components/ContactInfo";
import { QueryErrorState } from "@/components/QueryErrorState";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const userId = params?.id || "0";

  const { data: user } = useUser(userId);
  const { data: currentUser } = useCurrentUser();
  const { data: messages, isLoading, isError, refetch, isFetching } = useMessages(userId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { toast } = useToast();

  const [content, setContent] = useState("");
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isCheckingFollow, setIsCheckingFollow] = useState(true);
  const [showContactInfo, setShowContactInfo] = useState(false);

  useEffect(() => {
    const checkFollow = async () => {
      try {
        const res = await fetch(`/api/contacts/check/${userId}`);
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      } catch (err) {
        console.error("Failed to check follow status", err);
      } finally {
        setIsCheckingFollow(false);
      }
    };
    if (currentUser) checkFollow();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    try {
      await apiRequest("POST", `/api/contacts/follow/${userId}`);
      setIsFollowing(true);
      toast({ title: "Now following" });
    } catch (err) {
      toast({ title: "Follow failed", variant: "destructive" });
    }
  };

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
    null,
  );
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [wallpaper, setWallpaper] = useState(
    () => localStorage.getItem(`wallpaper-${userId}`) || "",
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [reactions, setReactions] = useState<{ [msgId: number]: string }>(() => {
    try { return JSON.parse(localStorage.getItem(`reactions-${userId}`) || "{}"); } catch { return {}; }
  });
  const [starredMsgs, setStarredMsgs] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("zenix-starred-msgs") || "[]"); } catch { return []; }
  });
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isTypingVisible, setIsTypingVisible] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Real-time Socket.IO connection for typing indicators and live sync
  useEffect(() => {
    if (!currentUser || !userId) return;

    const socket: Socket = io(window.location.origin, {
      query: { userId: currentUser.id },
    });
    socketRef.current = socket;

    socket.on("user-typing", ({ from, isTyping }: { from: string; isTyping: boolean }) => {
      if (from === userId) {
        setIsTypingVisible(isTyping);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        if (isTyping) {
          // Safety timeout if user abruptly stops or disconnects
          typingTimerRef.current = setTimeout(() => {
            setIsTypingVisible(false);
          }, 3500);
        }
      }
    });

    socket.on("new-message", ({ senderId }: { senderId: string }) => {
      if (senderId === userId) {
        setIsTypingVisible(false);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        queryClient.invalidateQueries({ queryKey: [api.messages.list.path, userId] });
      }
    });

    return () => {
      if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.emit("typing", { to: userId, isTyping: false });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser?.id, userId]);

  useEffect(() => {
    if (isTypingVisible) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isTypingVisible]);

  const lastTapRef = useRef<{ id: number; time: number } | null>(null);
  const [doubleTapHeartId, setDoubleTapHeartId] = useState<number | null>(null);

  const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🙏"];

  const addReaction = (msgId: number, emoji: string) => {
    const next = { ...reactions, [msgId]: emoji };
    setReactions(next);
    localStorage.setItem(`reactions-${userId}`, JSON.stringify(next));
    setSelectedMessageId(null);
    setShowReactionPicker(false);
  };

  const toggleStar = (msgId: number) => {
    const next = starredMsgs.includes(msgId)
      ? starredMsgs.filter(id => id !== msgId)
      : [...starredMsgs, msgId];
    setStarredMsgs(next);
    localStorage.setItem("zenix-starred-msgs", JSON.stringify(next));
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast({ title: "Copied to clipboard" });
    setSelectedMessageId(null);
  };

  const QUICK_REPLIES = ["👍", "😂", "❤️", "OK", "Thanks!", "On my way!", "Yes", "No", "😊", "🙏"];

  const sendQuickReply = (text: string) => {
    if (!currentUser) return;
    if (window.navigator.vibrate) window.navigator.vibrate(20);
    if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
    socketRef.current?.emit("typing", { to: userId, isTyping: false });
    socketRef.current?.emit("send-message", { to: userId, content: text });
    sendMessage({
      senderId: currentUser.id,
      receiverId: userId,
      content: text,
      type: "text",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContent(val);

    if (!socketRef.current || !currentUser) return;

    if (val.trim().length > 0) {
      socketRef.current.emit("typing", { to: userId, isTyping: true });

      if (localTypingTimeoutRef.current) {
        clearTimeout(localTypingTimeoutRef.current);
      }
      localTypingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typing", { to: userId, isTyping: false });
      }, 2500);
    } else {
      if (localTypingTimeoutRef.current) {
        clearTimeout(localTypingTimeoutRef.current);
      }
      socketRef.current.emit("typing", { to: userId, isTyping: false });
    }
  };

  const handleDoubleTap = (msg: Message) => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && last.id === msg.id && now - last.time < 350) {
      // Double tap — react with ❤️
      addReaction(msg.id, "❤️");
      setDoubleTapHeartId(msg.id);
      if (window.navigator.vibrate) window.navigator.vibrate(30);
      setTimeout(() => setDoubleTapHeartId(null), 800);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { id: msg.id, time: now };
    }
  };
  const docInputRef = useRef<HTMLInputElement>(null);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => {
      const next = prev + emojiData.emoji;
      if (socketRef.current && currentUser) {
        socketRef.current.emit("typing", { to: userId, isTyping: true });
        if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
        localTypingTimeoutRef.current = setTimeout(() => {
          socketRef.current?.emit("typing", { to: userId, isTyping: false });
        }, 2500);
      }
      return next;
    });
    setShowEmojiPicker(false);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Swipe logic
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<{ [key: number]: number }>({});

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "gif" | "document" | "audio") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const msgType = type === "gif" ? "image" : type;
      sendMessage(
        {
          senderId: currentUser!.id,
          receiverId: userId,
          content: base64Data,
          type: msgType,
        },
        {
          onSuccess: () => {
            toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} sent` });
            setShowMediaOptions(false);
            if (e.target) e.target.value = "";
          },
          onError: () => {
            toast({ title: "Failed to send file", variant: "destructive" });
          },
        },
      );
    };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new RecordRTC(stream, { type: "audio" });
      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      toast({ title: "Microphone Access Denied", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;
    recorderRef.current.stopRecording(async () => {
      const blob = recorderRef.current!.getBlob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        sendMessage(
          {
            senderId: currentUser!.id,
            receiverId: userId,
            content: base64Audio,
            type: "voice",
          },
          {
            onSuccess: () => toast({ title: "Voice message sent" }),
          },
        );
      };
      setIsRecording(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    });
  };

  const handleTouchStart = (
    msgId: number,
    e: React.TouchEvent | React.MouseEvent,
  ) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setTouchStartX(clientX);

    longPressTimer.current = setTimeout(() => {
      setSelectedMessageId(msgId);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 500);
  };

  const handleTouchMove = (msgId: number, e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;

    // Only allow right swipe for reply
    if (diff > 0) {
      const offset = Math.min(diff, 80);
      setSwipeOffset({ [msgId]: offset });
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchEnd = (msg: Message) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    if (swipeOffset[msg.id] >= 60) {
      setReplyingTo(msg);
      if (window.navigator.vibrate) window.navigator.vibrate(30);
    }

    setSwipeOffset({});
    setTouchStartX(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!content.trim() || !currentUser) return;

    const messageContent = content.trim();
    const replyPrefix = replyingTo
      ? `Replying to: "${replyingTo.content.substring(0, 50)}..."\n\n`
      : "";

    // Clear typing indicator and notify recipient immediately
    if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
    socketRef.current?.emit("typing", { to: userId, isTyping: false });
    socketRef.current?.emit("send-message", { to: userId, content: replyPrefix + messageContent });

    // Clear input INSTANTLY — don't wait for server
    setContent("");
    setReplyingTo(null);

    sendMessage({
      senderId: currentUser.id,
      receiverId: userId,
      content: replyPrefix + messageContent,
      type: "text",
    });
  };

  const handleUpdate = async (id: number) => {
    if (!editContent.trim()) return;
    try {
      await apiRequest("PATCH", `/api/messages/${id}`, {
        content: editContent.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      setEditingId(null);
      toast({ title: "Message updated" });
    } catch (err) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/messages/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      toast({ title: "Message deleted" });
    } catch (err) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleClearChat = async () => {
    try {
      await apiRequest("DELETE", `/api/chat/${userId}/clear`);
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      toast({ title: "Chat cleared" });
    } catch (err) {
      toast({ title: "Failed to clear chat", variant: "destructive" });
    }
  };

  const handleDeleteChat = async () => {
    try {
      await apiRequest("DELETE", `/api/chat/${userId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Chat deleted" });
      window.location.href = "/";
    } catch (err) {
      toast({ title: "Failed to delete chat", variant: "destructive" });
    }
  };

  if (!user || !currentUser) return null;

  return (
    <Layout showNav={false}>
      <div className="flex flex-col h-[100dvh] overflow-hidden relative bg-background">
        <header className="px-4 py-3 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-[100] w-full h-16 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-visible">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
            </Link>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowContactInfo(true)}
            >
              <Avatar
                name={`${user.firstName} ${user.lastName}`}
                src={user.profileImageUrl}
                size="sm"
                isOnline={user.isOnline || false}
              />
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-sm leading-tight truncate max-w-[120px] sm:max-w-[180px]">
                  {user.firstName} {user.lastName}
                </h3>
                {isTypingVisible ? (
                  <span className="text-[11px] font-semibold text-primary leading-none flex items-center gap-1 animate-pulse">
                    <span>typing</span>
                    <span className="flex items-center gap-0.5 mt-0.5">
                      <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {user.isOnline ? "online" : `last seen ${user.lastSeen ? format(new Date(user.lastSeen), 'h:mm a') : 'recently'}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Link href={`/call/${user.id}?type=voice`}>
              <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                <Video className="w-5 h-5" />
              </button>
            </Link>
            <Link href={`/call/${user.id}?type=video`}>
              <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                <Phone className="w-5 h-5" />
              </button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-muted transition-colors outline-none">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl p-2 shadow-xl border-border bg-background/95 backdrop-blur-md"
              >
                <DropdownMenuItem 
                  className="rounded-xl flex items-center gap-3 py-3 cursor-pointer"
                  onClick={() => setShowContactInfo(true)}
                >
                  <UserCircle className="w-4 h-4" />
                  <span className="font-medium">View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                  <Search className="w-4 h-4" />
                  <span className="font-medium">Search Messages</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                  <BellOff className="w-4 h-4" />
                  <span className="font-medium">Mute Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const url = prompt(
                      "Enter HD Wallpaper URL (e.g. from Unsplash):",
                    );
                    if (url !== null) {
                      setWallpaper(url);
                      localStorage.setItem(`wallpaper-${userId}`, url);
                    }
                  }}
                  className="rounded-xl flex items-center gap-3 py-3 cursor-pointer"
                >
                  <Wallpaper className="w-4 h-4" />
                  <span className="font-medium">Wallpaper</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={handleClearChat}
                  className="rounded-xl flex items-center gap-3 py-3 cursor-pointer"
                >
                  <Eraser className="w-4 h-4" />
                  <span className="font-medium">Clear Chat</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteChat}
                  className="rounded-xl flex items-center gap-3 py-3 cursor-pointer text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium">Delete Chat</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer text-destructive">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="font-medium">Block / Report</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Export Chat</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                  <MailCheck className="w-4 h-4" />
                  <span className="font-medium">Mark as Unread</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {showContactInfo && (
          <ContactInfo userId={userId} onClose={() => setShowContactInfo(false)} />
        )}

        <div
          className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-slate-50/50 dark:bg-black/20 overscroll-contain"
          style={
            wallpaper
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${wallpaper})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {}
          }
        >
          {isCheckingFollow ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !isFollowing ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-8 bg-background/40 backdrop-blur-sm rounded-3xl">
              <div className="p-6 bg-primary/10 rounded-full">
                <LockIcon className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">
                  Privacy Restriction
                </h2>
                <p className="text-muted-foreground mt-2 max-w-xs">
                  You can only view and send messages once you follow this
                  person.
                </p>
              </div>
              <button
                onClick={handleFollow}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
              >
                Follow to Message
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <QueryErrorState
              title="Couldn't load messages"
              description="This conversation couldn't be loaded. Check your connection and try again."
              onRetry={refetch}
              isRetrying={isFetching}
              className="mx-4 my-8"
            />
          ) : messages?.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(messages || []).map((msg, idx, arr) => {
                const isMe = msg.senderId === currentUser.id;
                const showAvatar =
                  !isMe &&
                  (idx === 0 || arr[idx - 1]?.senderId !== msg.senderId);
                const isEditing = editingId === msg.id;
                const currentOffset = swipeOffset[msg.id] || 0;

                // Date separator logic
                const msgDate = new Date((msg as any).timestamp || msg.createdAt || Date.now());
                const prevMsg = idx > 0 ? arr[idx - 1] : null;
                const prevMsgDate = prevMsg ? new Date((prevMsg as any).timestamp || prevMsg.createdAt || Date.now()) : null;
                const isNewDay = !prevMsgDate || msgDate.toDateString() !== prevMsgDate.toDateString();

                return (
                  <div key={msg.id} className="flex flex-col gap-1">
                    {isNewDay && (
                      <div className="flex justify-center my-4">
                        <span className="px-3 py-1 rounded-lg bg-muted/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur-sm border border-border/40">
                          {format(msgDate, 'MMMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex gap-2 max-w-[80%] relative group/msg",
                        isMe ? "ml-auto flex-row-reverse" : "",
                      )}
                      onClick={() => handleDoubleTap(msg)}
                      onMouseDown={(e) => handleTouchStart(msg.id, e)}
                      onMouseUp={() => handleTouchEnd(msg)}
                      onMouseLeave={() => handleTouchEnd(msg)}
                      onTouchStart={(e) => handleTouchStart(msg.id, e)}
                      onTouchMove={(e) => handleTouchMove(msg.id, e)}
                      onTouchEnd={() => handleTouchEnd(msg)}
                    >
                      {!isMe && (
                        <div className="w-8 flex-shrink-0">
                          {showAvatar && (
                            <Avatar
                              name={`${user.firstName} ${user.lastName}`}
                              src={user.profileImageUrl}
                              size="sm"
                            />
                          )}
                        </div>
                      )}

                      <div className="relative flex items-center">
                        {/* Double-tap ❤️ animation */}
                        {doubleTapHeartId === msg.id && (
                          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <span className="text-4xl animate-ping-once select-none">❤️</span>
                          </div>
                        )}
                        {currentOffset > 20 && (
                          <div className="absolute -left-10 text-primary animate-in fade-in zoom-in duration-200">
                            <Reply className="w-5 h-5" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "p-3.5 rounded-2xl shadow-sm text-sm relative group transition-all cursor-pointer",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-white dark:bg-zinc-800 text-foreground rounded-tl-sm border border-border/50",
                            selectedMessageId === msg.id &&
                              "ring-4 ring-primary/30 scale-[1.02]",
                          )}
                          style={{ transform: `translateX(${currentOffset}px)` }}
                          onClick={() => setReplyingTo(msg)}
                        >
                          {msg.content.startsWith('Replying to: "') && (
                            <div className="mb-2 p-2 bg-black/10 rounded-lg border-l-4 border-primary/50 italic text-xs">
                              {msg.content.split("\n\n")[0]}
                            </div>
                          )}
                          {isEditing ? (
                            <div className="space-y-2 min-w-[200px]">
                              <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-white/10 p-2 rounded border border-white/20 outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleUpdate(msg.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-[10px] uppercase font-bold opacity-70"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdate(msg.id)}
                                  className="text-[10px] uppercase font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {msg.type === "voice" || msg.type === "audio" ? (
                                <div className="flex items-center gap-3 py-1">
                                  <div className="p-2 bg-white/20 rounded-full">
                                    <Mic className="w-4 h-4" />
                                  </div>
                                  <audio src={msg.content} controls className="h-8 w-40" />
                                </div>
                              ) : msg.type === "image" ? (
                                <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/20">
                                  <img src={msg.content} alt="Sent photo" className="max-w-full max-h-64 object-contain" />
                                </div>
                              ) : msg.type === "video" ? (
                                <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/20">
                                  <video src={msg.content} controls className="max-w-full max-h-64" />
                                </div>
                              ) : msg.type === "document" ? (
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50 min-w-[200px]">
                                  <div className="p-2 bg-orange-500 rounded-lg text-white">
                                    <File className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-foreground">Document</p>
                                    <a 
                                      href={msg.content} 
                                      download="document" 
                                      className="text-[10px] text-primary hover:underline font-bold uppercase"
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <p>
                                  {msg.content.includes("\n\n")
                                    ? msg.content.split("\n\n").slice(1).join("\n\n")
                                    : msg.content}
                                </p>
                              )}
                              <div className="flex items-center justify-between gap-4 mt-1">
                                <div className="flex items-center gap-1">
                                  {starredMsgs.includes(msg.id) && (
                                    <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                  )}
                                  <span
                                    className={cn(
                                      "text-[10px] opacity-70 flex items-center gap-1",
                                      isMe
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {msg.isEdited === "true" && <span className="italic">(edited)</span>}
                                    {msg.createdAt &&
                                      format(new Date(msg.createdAt), "h:mm a")}
                                  </span>
                                </div>
                                {isMe && (
                                  <span className="flex-shrink-0">
                                    {msg.readAt ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                                    ) : (
                                      <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/50" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        {/* Reaction bubble */}
                        {reactions[msg.id] && (
                          <div className={cn(
                            "absolute -bottom-3 text-sm px-1.5 py-0.5 rounded-full bg-background border border-border shadow-sm cursor-pointer hover:scale-110 transition-transform",
                            isMe ? "left-2" : "right-2"
                          )}
                          onClick={() => addReaction(msg.id, reactions[msg.id])}
                          >
                            {reactions[msg.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Real-time Typing Indicator Bubble */}
          {isTypingVisible && (
            <div className="flex items-end gap-2 px-1 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <Avatar
                name={`${user?.firstName} ${user?.lastName}`}
                src={user?.profileImageUrl}
                size="sm"
                className="w-7 h-7 mb-0.5 flex-shrink-0 shadow-sm"
              />
              <div className="flex flex-col gap-1 max-w-[80%]">
                <span className="text-[10px] font-medium text-muted-foreground ml-1">
                  {user?.firstName} is typing...
                </span>
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-card/95 dark:bg-zinc-800/95 rounded-2xl rounded-bl-sm border border-border/60 shadow-sm backdrop-blur-sm w-fit">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Context Menu Bottom Sheet */}
        {selectedMessageId !== null && (() => {
          const selectedMsg = messages?.find(m => m.id === selectedMessageId);
          const isMyMsg = selectedMsg?.senderId === currentUser?.id;
          return (
            <div
              className="fixed inset-0 z-[200] flex items-end"
              onClick={() => { setSelectedMessageId(null); setShowReactionPicker(false); }}
            >
              <div
                className="w-full bg-background rounded-t-3xl border-t border-border shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
                onClick={e => e.stopPropagation()}
              >
                {/* Quick Reactions */}
                <div className="flex justify-center gap-3 px-4 pt-4 pb-3 border-b border-border/50">
                  {QUICK_REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => selectedMsg && addReaction(selectedMsg.id, emoji)}
                      className="text-2xl hover:scale-125 active:scale-95 transition-transform p-1 rounded-full hover:bg-muted"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowReactionPicker(true)}
                    className="text-xl hover:scale-125 active:scale-95 transition-transform p-2 rounded-full hover:bg-muted text-muted-foreground"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview of selected message */}
                {selectedMsg && (
                  <div className="px-4 py-2 bg-muted/30">
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedMsg.type === "text"
                        ? (selectedMsg.content.includes("\n\n")
                            ? selectedMsg.content.split("\n\n").slice(1).join(" ")
                            : selectedMsg.content)
                        : `📎 ${selectedMsg.type}`}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-4 divide-x divide-border/50">
                  <button
                    onClick={() => { selectedMsg && setReplyingTo(selectedMsg); setSelectedMessageId(null); }}
                    className="flex flex-col items-center gap-1.5 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <Reply className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground">Reply</span>
                  </button>
                  <button
                    onClick={() => {
                      const text = selectedMsg?.type === "text"
                        ? (selectedMsg.content.includes("\n\n")
                            ? selectedMsg.content.split("\n\n").slice(1).join(" ")
                            : selectedMsg.content)
                        : selectedMsg?.content || "";
                      copyMessage(text);
                    }}
                    className="flex flex-col items-center gap-1.5 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <Copy className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground">Copy</span>
                  </button>
                  <button
                    onClick={() => { selectedMsg && toggleStar(selectedMsg.id); setSelectedMessageId(null); toast({ title: starredMsgs.includes(selectedMsg!.id) ? "Unstarred" : "Message starred ⭐" }); }}
                    className="flex flex-col items-center gap-1.5 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <Star className={cn("w-5 h-5", selectedMsg && starredMsgs.includes(selectedMsg.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                    <span className="text-[10px] font-bold text-muted-foreground">Star</span>
                  </button>
                  <button
                    onClick={() => { toast({ title: "Forward (coming soon)" }); setSelectedMessageId(null); }}
                    className="flex flex-col items-center gap-1.5 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <Forward className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground">Forward</span>
                  </button>
                </div>

                <div className="border-t border-border/50 divide-y divide-border/50">
                  {isMyMsg && selectedMsg?.type === "text" && selectedMsg?.isDeleted !== "true" && (
                    <button
                      onClick={() => { setEditingId(selectedMsg!.id); setEditContent(selectedMsg!.content.includes("\n\n") ? selectedMsg!.content.split("\n\n").slice(1).join("\n\n") : selectedMsg!.content); setSelectedMessageId(null); }}
                      className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Edit Message</span>
                    </button>
                  )}
                  {isMyMsg && selectedMsg?.isDeleted !== "true" && (
                    <button
                      onClick={() => { handleDelete(selectedMsg!.id); setSelectedMessageId(null); }}
                      className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-destructive/10 transition-colors text-left text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete Message</span>
                    </button>
                  )}
                  <button
                    onClick={() => { toast({ title: `Message info — sent ${selectedMsg?.createdAt ? format(new Date(selectedMsg.createdAt), "PPp") : "unknown"}` }); setSelectedMessageId(null); }}
                    className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Message Info</span>
                  </button>
                  <button
                    onClick={() => { setSelectedMessageId(null); setShowReactionPicker(false); }}
                    className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-muted/50 transition-colors text-left text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Cancel</span>
                  </button>
                </div>
                <div className="h-safe-area-inset-bottom pb-4" />
              </div>
            </div>
          );
        })()}

        {isFollowing && (
          <div className="bg-background border-t border-border sticky bottom-0 z-[100] flex-shrink-0">
            {/* Quick reply chips */}
            {!content && !replyingTo && (
              <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 scrollbar-hide">
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => sendQuickReply(qr)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full border border-border/70 bg-secondary/60 text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 transition-all duration-150"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}
            <div className="p-4">
            {replyingTo && (
              <div className="mb-2 p-3 bg-muted rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1 h-8 bg-primary rounded-full" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-primary">
                      Replying to
                    </span>
                    <p className="text-xs truncate max-w-[200px] opacity-70">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1.5 hover:bg-background rounded-full transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 rotate-45" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 max-w-4xl mx-auto relative">
              <div className="flex flex-col items-center">
                {/* Hidden file inputs */}
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, "video")} />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "image")} />
                <input type="file" ref={gifInputRef} className="hidden" accept="image/gif" onChange={(e) => handleFileUpload(e, "gif")} />
                <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" onChange={(e) => handleFileUpload(e, "document")} />
                <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={(e) => handleFileUpload(e, "audio")} />
                {/* @ts-ignore */}
                <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => handleFileUpload(e, "image")} />

                {showMediaOptions && (
                  <div className="fixed inset-0 z-[150] flex items-end" onClick={() => setShowMediaOptions(false)}>
                    <div
                      className="w-full bg-background/98 backdrop-blur-lg border-t border-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 pb-8 pt-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
                      <p className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Share</p>
                      <div className="grid grid-cols-4 gap-4 px-6">
                        {[
                          { label: "Camera", icon: Camera, color: "bg-pink-500", action: () => cameraInputRef.current?.click() },
                          { label: "Gallery", icon: ImageIcon, color: "bg-purple-500", action: () => fileInputRef.current?.click() },
                          { label: "Video", icon: Video, color: "bg-blue-500", action: () => videoInputRef.current?.click() },
                          { label: "Audio", icon: Mic, color: "bg-green-500", action: () => audioInputRef.current?.click() },
                          { label: "Document", icon: File, color: "bg-orange-500", action: () => docInputRef.current?.click() },
                          { label: "GIF", icon: Smile, color: "bg-yellow-500", action: () => gifInputRef.current?.click() },
                          { label: "Contact", icon: UserCircle, color: "bg-teal-500", action: () => toast({ title: "Contact sharing coming soon" }) },
                          { label: "Location", icon: Search, color: "bg-red-500", action: () => toast({ title: "Location sharing coming soon" }) },
                        ].map(({ label, icon: Icon, color, action }) => (
                          <button
                            key={label}
                            onClick={() => { action(); setShowMediaOptions(false); }}
                            className="flex flex-col items-center gap-2 group"
                          >
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-active:scale-95 transition-transform", color)}>
                              <Icon className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowMediaOptions(!showMediaOptions)}
                  className={cn(
                    "p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all",
                    showMediaOptions && "bg-primary/10 text-primary rotate-45",
                  )}
                >
                  <Paperclip className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 bg-secondary/50 rounded-2xl p-2 border border-transparent focus-within:bg-background focus-within:border-primary/20 focus-within:ring-2 focus-within:ring-primary/10 transition-all flex items-center relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Smile className="w-6 h-6" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-16 left-0 z-[100] shadow-2xl rounded-2xl overflow-hidden border">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
                <input
                  type="text"
                  value={content}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={isRecording ? "Recording voice..." : "Type a message..."}
                  disabled={isRecording}
                  className="flex-1 bg-transparent px-3 py-2 outline-none min-h-[44px]"
                />
              </div>
              {content.trim() || isRecording ? (
                <button
                  onClick={isRecording ? stopRecording : handleSend}
                  disabled={isSending}
                  className={cn(
                    "p-3 rounded-xl shadow-lg transition-all duration-200",
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-primary text-primary-foreground shadow-primary/25 hover:shadow-xl hover:scale-105 active:scale-95",
                  )}
                >
                  {isSending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isRecording ? (
                    <Square className="w-6 h-6" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="p-3 bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
