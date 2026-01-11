import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { useUser, useCurrentUser } from "@/hooks/use-users";
import { Avatar } from "@/components/Avatar";
import { Layout } from "@/components/Layout";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Phone, Video, Send, Paperclip, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const userId = params?.id || "0";
  
  const { data: user } = useUser(userId);
  const { data: currentUser } = useCurrentUser();
  const { data: messages, isLoading } = useMessages(userId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { toast } = useToast();
  
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem(`wallpaper-${userId}`) || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        // Notify user locally for feedback
        toast({
          title: "Message Sent",
          description: "Your message has been delivered",
          duration: 2000,
        });
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
            <button 
              onClick={() => {
                const url = prompt("Enter HD Wallpaper URL (e.g. from Unsplash):");
                if (url !== null) {
                  setWallpaper(url);
                  localStorage.setItem(`wallpaper-${userId}`, url);
                }
              }}
              className="p-2.5 rounded-full hover:bg-muted transition-colors"
              title="Set Chat Wallpaper"
            >
              <Paperclip className="w-5 h-5 rotate-45" />
            </button>
            <button className="p-2.5 rounded-full hover:bg-muted transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
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
          {isLoading ? (
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
                  className={cn("flex gap-2 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "")}
                >
                  {!isMe && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && <Avatar name={`${user.firstName} ${user.lastName}`} src={user.profileImageUrl} size="sm" />}
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-3.5 rounded-2xl shadow-sm text-sm relative group",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-white dark:bg-zinc-800 text-foreground rounded-tl-sm border border-border/50"
                  )}>
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
                            "text-[10px] opacity-70",
                            isMe ? "text-primary-foreground" : "text-muted-foreground"
                          )}>
                            {msg.isEdited === "true" && "(edited) "}
                            {msg.createdAt && format(new Date(msg.createdAt), 'h:mm a')}
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
        <div className="p-4 bg-background border-t border-border">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <button className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
              <Paperclip className="w-6 h-6" />
            </button>
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
      </div>
    </Layout>
  );
}
