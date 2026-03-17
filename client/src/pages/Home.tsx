import { useUsers, useCurrentUser } from "@/hooks/use-users";
import { Avatar } from "@/components/Avatar";
import { Layout } from "@/components/Layout";
import { Link, useLocation } from "wouter";
import {
  Search, Plus, Loader2, MoreVertical, Users, Radio,
  Laptop, Star, Archive, Settings, LogOut, Camera,
  CheckCheck, Check, Mic, Image as ImageIcon, Video,
  File, Pin, BellOff, MessageCircle, Phone, Bell,
  UserPlus, HelpCircle, Edit3, X, ChevronRight
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useMessageNotifications } from "@/hooks/use-notifications";
import { format, isToday, isYesterday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

type TabType = "all" | "unread" | "favorites" | "groups";

function formatChatTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd/MM/yy");
}

function getMessagePreview(msg: any): { icon: React.ReactNode; text: string } | null {
  if (!msg) return null;
  const type = msg.type || "text";
  if (msg.isDeleted === "true") return { icon: null, text: "🚫 This message was deleted" };
  if (type === "image") return { icon: <ImageIcon className="w-3 h-3" />, text: "Photo" };
  if (type === "video") return { icon: <Video className="w-3 h-3" />, text: "Video" };
  if (type === "voice") return { icon: <Mic className="w-3 h-3" />, text: "Voice message" };
  if (type === "audio") return { icon: <Mic className="w-3 h-3" />, text: "Audio" };
  if (type === "document") return { icon: <File className="w-3 h-3" />, text: "Document" };
  const content = msg.content?.includes("\n\n")
    ? msg.content.split("\n\n").slice(1).join(" ")
    : msg.content;
  return { icon: null, text: content || "" };
}

function DeliveryTick({ msg, isMe }: { msg: any; isMe: boolean }) {
  if (!isMe) return null;
  if (msg.readAt) {
    return <CheckCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  }
  return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
}

const PINNED_IDS_KEY = "zenix-pinned-chats";
const ARCHIVED_IDS_KEY = "zenix-archived-chats";
const MUTED_IDS_KEY = "zenix-muted-chats";

export default function Home() {
  const { data: currentUser } = useCurrentUser();
  const { data: users, isLoading } = useUsers();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(PINNED_IDS_KEY) || "[]"); } catch { return []; }
  });
  const [mutedIds, setMutedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(MUTED_IDS_KEY) || "[]"); } catch { return []; }
  });
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(ARCHIVED_IDS_KEY) || "[]"); } catch { return []; }
  });

  // Swipe-to-archive state
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({});
  const [swipeStartX, setSwipeStartX] = useState<Record<string, number>>({});
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);

  const handleSwipeStart = useCallback((id: string, clientX: number) => {
    setSwipeStartX(prev => ({ ...prev, [id]: clientX }));
  }, []);

  const handleSwipeMove = useCallback((id: string, clientX: number) => {
    const start = swipeStartX[id];
    if (start === undefined) return;
    const diff = start - clientX;
    if (diff > 0) {
      setSwipeOffsets(prev => ({ ...prev, [id]: Math.min(diff, 90) }));
    }
  }, [swipeStartX]);

  const handleSwipeEnd = useCallback((id: string) => {
    const offset = swipeOffsets[id] || 0;
    if (offset > 60) {
      setArchiveConfirmId(id);
    }
    setSwipeOffsets(prev => ({ ...prev, [id]: 0 }));
    setSwipeStartX(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, [swipeOffsets]);

  // Message notifications
  useMessageNotifications(users, currentUser?.id, mutedIds);

  const togglePin = (id: string) => {
    const next = pinnedIds.includes(id) ? pinnedIds.filter(x => x !== id) : [id, ...pinnedIds];
    setPinnedIds(next);
    localStorage.setItem(PINNED_IDS_KEY, JSON.stringify(next));
  };
  const toggleMute = (id: string) => {
    const next = mutedIds.includes(id) ? mutedIds.filter(x => x !== id) : [...mutedIds, id];
    setMutedIds(next);
    localStorage.setItem(MUTED_IDS_KEY, JSON.stringify(next));
  };
  const toggleArchive = (id: string) => {
    const next = archivedIds.includes(id) ? archivedIds.filter(x => x !== id) : [...archivedIds, id];
    setArchivedIds(next);
    localStorage.setItem(ARCHIVED_IDS_KEY, JSON.stringify(next));
  };

  if (!currentUser) return null;

  const allUsers = (users || []).filter(u => u.id !== currentUser.id && !archivedIds.includes(u.id));

  const filteredUsers = allUsers.filter(u => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchesSearch = !search || fullName.includes(search.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(search));
    if (!matchesSearch) return false;

    const lastMsg = (u as any).lastMessage;
    if (activeTab === "unread") return lastMsg && !lastMsg.readAt && lastMsg.senderId !== currentUser.id;
    if (activeTab === "favorites") return pinnedIds.includes(u.id);
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aPin = pinnedIds.includes(a.id) ? 0 : 1;
    const bPin = pinnedIds.includes(b.id) ? 0 : 1;
    if (aPin !== bPin) return aPin - bPin;
    const aTime = (a as any).lastMessage?.createdAt;
    const bTime = (b as any).lastMessage?.createdAt;
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  const unreadCount = allUsers.filter(u => {
    const lm = (u as any).lastMessage;
    return lm && !lm.readAt && lm.senderId !== currentUser.id;
  }).length;

  const archivedCount = archivedIds.filter(id => allUsers.find(u => u.id === id) === undefined && users?.find(u => u.id === id)).length;

  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { id: "favorites", label: "Favorites" },
    { id: "groups", label: "Groups" },
  ];

  return (
    <Layout>
      <div className="flex flex-col h-full max-w-3xl mx-auto">

        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          {showSearch ? (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
              <button onClick={() => { setShowSearch(false); setSearch(""); }} className="p-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search chats..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 rounded-full bg-secondary border border-transparent focus:border-primary/20 outline-none text-sm font-medium"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Zenix" className="w-8 h-8 rounded-xl" />
                <h1 className="text-2xl font-display font-black text-foreground">Zenix</h1>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50); }}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
                <Link href="/chat/camera">
                  <button className="p-2 rounded-full hover:bg-muted transition-colors">
                    <Camera className="w-5 h-5" />
                  </button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-full hover:bg-muted transition-colors outline-none">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-border bg-background/95 backdrop-blur-md">
                    <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">New Group</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                      <Radio className="w-4 h-4" />
                      <span className="font-medium">New Broadcast</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                      <Laptop className="w-4 h-4" />
                      <span className="font-medium">Linked Devices</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer" onClick={() => setLocation("/starred")}>
                      <Star className="w-4 h-4" />
                      <span className="font-medium">Starred Messages</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                        <Settings className="w-4 h-4" />
                        <span className="font-medium">Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                      <HelpCircle className="w-4 h-4" />
                      <span className="font-medium">Help</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="rounded-xl flex items-center gap-3 py-3 cursor-pointer text-destructive"
                      onClick={() => {
                        fetch("/api/otp/logout", { method: "POST", credentials: "include" })
                          .then(() => { window.location.href = "/login"; })
                          .catch(() => { window.location.href = "/api/logout"; });
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        {!search && (
          <div className="flex-shrink-0 px-4 pb-2">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {/* My Status */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <Avatar
                      name={`${currentUser.firstName} ${currentUser.lastName}`}
                      src={currentUser.profileImageUrl}
                      size="md"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[56px]">My Status</span>
              </div>

              {/* Other users' statuses (simulated) */}
              {(sortedUsers.slice(0, 8)).map((user, idx) => {
                const hasStatus = idx % 2 === 0;
                return (
                  <div key={user.id} className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group">
                    <div className={cn(
                      "w-14 h-14 rounded-full p-0.5",
                      hasStatus ? "bg-gradient-to-tr from-primary via-accent to-pink-500" : "border-2 border-border"
                    )}>
                      <div className="w-full h-full rounded-full border-2 border-background overflow-hidden">
                        <Avatar
                          name={`${user.firstName} ${user.lastName}`}
                          src={user.profileImageUrl}
                          size="md"
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[56px]">
                      {user.firstName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-2xl">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8 opacity-60">
              <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-bold">
                {activeTab === "unread" ? "No unread messages" :
                 activeTab === "favorites" ? "No pinned chats" :
                 search ? "No chats found" : "No conversations yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Try a different search" : "Start a new chat to get going!"}
              </p>
            </div>
          ) : (
            <div>
              {/* Pinned section header */}
              {sortedUsers.some(u => pinnedIds.includes(u.id)) && (
                <div className="px-4 py-2">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Pin className="w-3 h-3" />
                    PINNED
                  </div>
                </div>
              )}

              {sortedUsers.map((user, idx) => {
                const lastMsg = (user as any).lastMessage;
                const preview = getMessagePreview(lastMsg);
                const isMe = lastMsg?.senderId === currentUser.id;
                const isPinned = pinnedIds.includes(user.id);
                const isMuted = mutedIds.includes(user.id);
                const isUnread = lastMsg && !lastMsg.readAt && !isMe;
                const showDivider = idx > 0 && pinnedIds.includes(sortedUsers[idx - 1].id) && !isPinned;

                return (
                  <div key={user.id} className="relative overflow-hidden">
                    {showDivider && (
                      <div className="px-4 py-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ALL CHATS</div>
                      </div>
                    )}

                    {/* Archive action (revealed by swipe) */}
                    <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 bg-primary">
                      <div className="flex flex-col items-center gap-1 text-white w-16">
                        <Archive className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Archive</span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-full relative"
                          style={{ transform: `translateX(-${swipeOffsets[user.id] || 0}px)`, transition: swipeStartX[user.id] !== undefined ? 'none' : 'transform 0.3s ease' }}
                          onTouchStart={(e) => handleSwipeStart(user.id, e.touches[0].clientX)}
                          onTouchMove={(e) => handleSwipeMove(user.id, e.touches[0].clientX)}
                          onTouchEnd={() => handleSwipeEnd(user.id)}
                        >
                          <div
                            onClick={() => setLocation(`/chat/${user.id}`)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors relative bg-background",
                              isUnread && "bg-primary/[0.03]"
                            )}
                          >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <Avatar
                                name={`${user.firstName} ${user.lastName}`}
                                src={user.profileImageUrl}
                                isOnline={user.isOnline || false}
                                size="lg"
                              />
                              {isPinned && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-muted rounded-full flex items-center justify-center border border-background">
                                  <Pin className="w-2.5 h-2.5 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <div className="flex items-center gap-1 min-w-0">
                                  <h3 className={cn(
                                    "font-semibold truncate text-sm",
                                    isUnread ? "text-foreground font-bold" : "text-foreground"
                                  )}>
                                    {user.firstName} {user.lastName}
                                  </h3>
                                  {isMuted && <BellOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className={cn(
                                    "text-xs",
                                    isUnread ? "text-primary font-bold" : "text-muted-foreground"
                                  )}>
                                    {formatChatTime(lastMsg?.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1 min-w-0 text-xs text-muted-foreground">
                                  {isMe && <DeliveryTick msg={lastMsg} isMe={isMe} />}
                                  {preview?.icon && <span className="flex-shrink-0">{preview.icon}</span>}
                                  <span className={cn("truncate", isUnread && "text-foreground font-medium")}>
                                    {isMe && <span className="text-muted-foreground">You: </span>}
                                    {preview?.text || (user.bio || user.phoneNumber || "Tap to message")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {isMuted && (
                                    <BellOff className="w-3 h-3 text-muted-foreground" />
                                  )}
                                  {isUnread && (
                                    <div className={cn(
                                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                                      isMuted ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                                    )}>
                                      1
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-52 rounded-2xl p-2 shadow-xl bg-background/95 backdrop-blur-md">
                        <DropdownMenuItem
                          className="rounded-xl flex items-center gap-3 py-2.5 cursor-pointer"
                          onClick={() => togglePin(user.id)}
                        >
                          <Pin className="w-4 h-4" />
                          <span className="font-medium">{isPinned ? "Unpin Chat" : "Pin Chat"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-xl flex items-center gap-3 py-2.5 cursor-pointer"
                          onClick={() => toggleMute(user.id)}
                        >
                          <BellOff className="w-4 h-4" />
                          <span className="font-medium">{isMuted ? "Unmute" : "Mute Notifications"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-xl flex items-center gap-3 py-2.5 cursor-pointer"
                          onClick={() => { toggleArchive(user.id); toast({ title: "Chat archived" }); }}
                        >
                          <Archive className="w-4 h-4" />
                          <span className="font-medium">Archive Chat</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="rounded-xl flex items-center gap-3 py-2.5 cursor-pointer"
                          onClick={() => setLocation(`/chat/${user.id}`)}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="font-medium">Open Chat</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}

              {/* Archived chats row */}
              {archivedIds.length > 0 && (
                <div className="border-t border-border/30 mt-1">
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Archive className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">Archived Chats</p>
                      <p className="text-xs text-muted-foreground">{archivedIds.length} chat{archivedIds.length > 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white bg-primary px-2 py-0.5 rounded-full">{archivedIds.length}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex gap-2 px-4 pb-3">
                    <button
                      onClick={() => {
                        setArchivedIds([]);
                        localStorage.setItem(ARCHIVED_IDS_KEY, "[]");
                        toast({ title: "All chats unarchived" });
                      }}
                      className="flex-1 py-2 rounded-xl bg-muted text-xs font-bold text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      Unarchive All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Archive Confirm Dialog */}
        {archiveConfirmId && (
          <div className="fixed inset-0 z-[300] flex items-end bg-black/50 backdrop-blur-sm" onClick={() => setArchiveConfirmId(null)}>
            <div className="w-full bg-background rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Archive className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-base">Archive this chat?</p>
                  <p className="text-xs text-muted-foreground">You can unarchive it anytime from the archived section</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setArchiveConfirmId(null)}
                  className="flex-1 py-3 rounded-2xl bg-muted font-bold text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toggleArchive(archiveConfirmId);
                    toast({ title: "Chat archived", description: "Swipe the archive section to unarchive" });
                    setArchiveConfirmId(null);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                >
                  Archive
                </button>
              </div>
              <div className="h-4" />
            </div>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-40">
          <Link href="/people">
            <button className="w-12 h-12 bg-secondary text-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all hover:bg-muted">
              <UserPlus className="w-5 h-5" />
            </button>
          </Link>
          <button
            onClick={() => setShowSearch(true)}
            className="w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            <Edit3 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
