import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { useUser, useCurrentUser } from "@/hooks/use-users";
import { Avatar } from "@/components/Avatar";
import { Layout } from "@/components/Layout";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Phone, Video, Send, Paperclip, Loader2, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const userId = parseInt(params?.id || "0");
  
  const { data: user } = useUser(userId);
  const { data: currentUser } = useCurrentUser();
  const { data: messages, isLoading } = useMessages(userId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!content.trim() || !currentUser) return;
    
    sendMessage({
      senderId: currentUser.id,
      receiverId: userId,
      content,
      type: "text",
    }, {
      onSuccess: () => {
        setContent("");
      }
    });
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
              <Avatar name={user.displayName} src={user.avatarUrl} size="sm" isOnline={user.isOnline || false} />
              <div>
                <h3 className="font-bold text-sm leading-none">{user.displayName}</h3>
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
            <button className="p-2.5 rounded-full hover:bg-muted transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-slate-50/50 dark:bg-black/20">
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
              
              return (
                <div 
                  key={msg.id} 
                  className={cn("flex gap-2 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "")}
                >
                  {!isMe && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && <Avatar name={user.displayName} src={user.avatarUrl} size="sm" />}
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-3.5 rounded-2xl shadow-sm text-sm relative group",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-white dark:bg-zinc-800 text-foreground rounded-tl-sm border border-border/50"
                  )}>
                    <p>{msg.content}</p>
                    <span className={cn(
                      "text-[10px] block text-right mt-1 opacity-70",
                      isMe ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {msg.createdAt && format(new Date(msg.createdAt), 'h:mm a')}
                    </span>
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
