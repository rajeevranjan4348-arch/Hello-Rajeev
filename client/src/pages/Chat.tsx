import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { useUser, useCurrentUser } from "@/hooks/use-users";
import { Avatar } from "@/components/Avatar";
import { Layout } from "@/components/Layout";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Phone, Video, Send, Paperclip, Loader2, MoreVertical, Pencil, Trash2, Lock as LockIcon, Camera, Image as ImageIcon, Search, BellOff, Wallpaper, Eraser, UserCircle, FileText, MailCheck, ShieldAlert } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const userId = params?.id || "0";
  
  const { data: user } = useUser(userId);
  const { data: currentUser } = useCurrentUser();
  const { data: messages, isLoading } = useMessages(userId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { toast } = useToast();
  
  const [content, setContent] = useState("");
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isCheckingFollow, setIsCheckingFollow] = useState(true);

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
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem(`wallpaper-${userId}`) || "");
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (msgId: number) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedMessageId(msgId);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
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
    sendMessage({
      senderId: currentUser.id,
      receiverId: userId,
      content: messageContent,
      type: "text",
    }, {
      onSuccess: () => {
        setContent("");
      }
    });
  };

  const handleUpdate = async (id: number) => {
    if (!editContent.trim()) return;
    try {
      await apiRequest("PATCH", `/api/messages/${id}`, { content: editContent.trim() });
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

  if (!user || !currentUser) return null;

  return (
    <Layout showNav={false}>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <header className="px-4 py-3 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <Avatar name={`${user.firstName} ${user.lastName}`} src={user.profileImageUrl} size="sm" isOnline={user.isOnline || false} />
              <div>
                <h3 className="font-bold text-sm leading-none">{user.firstName} {user.lastName}</h3>
                <span className="text-xs text-muted-foreground">
                  {user.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/call/${user.id}?type=voice`}>
              <button className="p-2.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                <Phone className="w-5 h-5" />
              </button>
            </Link>
            <Link href={`/call/${user.id}?type=video`}>
              <button className="p-2.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                <Video className="w-5 h-5" />
              </button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2.5 rounded-full hover:bg-muted transition-colors outline-none">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-border bg-background/95 backdrop-blur-md">
                <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
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
                <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                  <Wallpaper className="w-4 h-4" />
                  <span className="font-medium">Wallpaper</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                  <Eraser className="w-4 h-4" />
                  <span className="font-medium">Clear Chat</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer text-destructive">
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

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-slate-50/50 dark:bg-black/20"
          style={wallpaper ? {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${wallpaper})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
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
                <h2 className="text-2xl font-display font-bold">Privacy Restriction</h2>
                <p className="text-muted-foreground mt-2 max-w-xs">
                  You can only view and send messages once you follow this person.
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
          ) : messages?.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages?.map((msg, idx) => {
              const isMe = msg.senderId === currentUser.id;
              const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
              const isEditing = editingId === msg.id;
              
              return (
                <div 
                  key={msg.id} 
                  className={cn("flex gap-2 max-w-[80%] relative", isMe ? "ml-auto flex-row-reverse" : "")}
                  onMouseDown={() => isMe && handleTouchStart(msg.id)}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                  onTouchStart={() => isMe && handleTouchStart(msg.id)}
                  onTouchEnd={handleTouchEnd}
                >
                  {!isMe && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && <Avatar name={`${user.firstName} ${user.lastName}`} src={user.profileImageUrl} size="sm" />}
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-3.5 rounded-2xl shadow-sm text-sm relative group transition-all",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-white dark:bg-zinc-800 text-foreground rounded-tl-sm border border-border/50",
                    selectedMessageId === msg.id && "ring-4 ring-primary/30 scale-[1.02]"
                  )}>
                    {selectedMessageId === msg.id && isMe && (
                      <div className="absolute -top-12 right-0 flex gap-2 bg-background/95 backdrop-blur-md p-1.5 rounded-xl border shadow-xl z-50 animate-in fade-in zoom-in duration-200">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(msg.id);
                            setEditContent(msg.content);
                            setSelectedMessageId(null);
                          }}
                          className="p-2 hover:bg-muted rounded-lg flex items-center gap-2 text-foreground"
                        >
                          <Pencil className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold">Edit</span>
                        </button>
                        <div className="w-px h-4 bg-border self-center" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(msg.id);
                            setSelectedMessageId(null);
                          }}
                          className="p-2 hover:bg-red-500/10 rounded-lg flex items-center gap-2 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs font-bold">Delete</span>
                        </button>
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
                            if (e.key === 'Enter') handleUpdate(msg.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="text-[10px] uppercase font-bold opacity-70">Cancel</button>
                          <button onClick={() => handleUpdate(msg.id)} className="text-[10px] uppercase font-bold">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>{msg.content}</p>
                        <div className="flex items-center justify-between gap-4 mt-1">
                          <span className={cn(
                            "text-[10px] opacity-70 flex items-center gap-1",
                            isMe ? "text-primary-foreground" : "text-muted-foreground"
                          )}>
                            {msg.isEdited === "true" && "(edited) "}
                            {msg.createdAt && format(new Date(msg.createdAt), 'h:mm a')}
                            {isMe && (
                              <span className={cn(
                                "text-[12px]",
                                msg.readAt ? "text-blue-400" : "text-white/60"
                              )}>
                                ⭐
                              </span>
                            )}
                          </span>
                          {isMe && msg.isDeleted !== "true" && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingId(msg.id);
                                  setEditContent(msg.content);
                                }}
                                className="hover:scale-110 transition-transform"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDelete(msg.id)}
                                className="hover:scale-110 transition-transform text-red-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {isFollowing && (
          <div className="p-4 bg-background border-t border-border">
            <div className="flex items-end gap-2 max-w-4xl mx-auto relative">
              <div className="flex flex-col items-center">
                {showMediaOptions && (
                  <div className="absolute bottom-16 left-0 bg-background/95 backdrop-blur-md p-2 rounded-2xl border shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-200 flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        toast({ title: "Camera Opening...", description: "Requesting permissions" });
                        setShowMediaOptions(false);
                      }}
                      className="p-3 hover:bg-primary/10 rounded-xl flex items-center gap-3 text-foreground transition-colors"
                    >
                      <div className="p-2 bg-blue-500 rounded-lg text-white">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold pr-4">Camera</span>
                    </button>
                    <button 
                      onClick={() => {
                        toast({ title: "Gallery Opening...", description: "Accessing your photos" });
                        setShowMediaOptions(false);
                      }}
                      className="p-3 hover:bg-primary/10 rounded-xl flex items-center gap-3 text-foreground transition-colors"
                    >
                      <div className="p-2 bg-purple-500 rounded-lg text-white">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold pr-4">Gallery</span>
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => setShowMediaOptions(!showMediaOptions)}
                  className={cn(
                    "p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all",
                    showMediaOptions && "bg-primary/10 text-primary rotate-45"
                  )}
                >
                  <Paperclip className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 bg-secondary/50 rounded-2xl p-2 border border-transparent focus-within:bg-background focus-within:border-primary/20 focus-within:ring-2 focus-within:ring-primary/10 transition-all flex items-center">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent px-3 py-2 outline-none min-h-[44px]"
                />
              </div>
              <button 
                onClick={handleSend}
                disabled={!content.trim() || isSending}
                className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:transform-none transition-all duration-200"
              >
                {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
