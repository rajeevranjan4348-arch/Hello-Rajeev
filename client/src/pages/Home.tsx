import { useUsers, useCurrentUser } from "@/hooks/use-users";
import { Avatar } from "@/components/Avatar";
import { Layout } from "@/components/Layout";
import { Link, useLocation } from "wouter";
import { Search, Plus, Loader2, Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { data: currentUser } = useCurrentUser();
  const { data: users, isLoading } = useUsers();
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Notification sound logic (simulated for demo/capability)
    const playNotification = (msg?: string) => {
      if (!audioRef.current) {
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
      }
      audioRef.current.play().catch(() => {});
      toast({
        title: "New Message",
        description: msg || "You have a new notification",
        className: "bg-primary text-primary-foreground border-none shadow-2xl rounded-2xl",
      });
    };

    // If users change and there's a new "online" status, trigger notification as a demo
    const onlineCount = users?.filter(u => u.isOnline).length || 0;
    if (onlineCount > 0 && currentUser) {
      // Small delay to simulate incoming event
      const timer = setTimeout(playNotification, 3000);
      return () => clearTimeout(timer);
    }
  }, [users?.length, currentUser]);

  if (!currentUser) {
    // Landing page for unauthenticated users
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/10 overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700" />
        
        <div className="text-center space-y-8 max-w-sm relative z-10">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-primary rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-primary/40 rotate-6 hover:rotate-0 transition-transform duration-500 cursor-pointer group">
              <svg className="w-12 h-12 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">New</div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-display font-black text-foreground leading-[1.1] tracking-tight">
              Messaging 
              <br />
              <span className="text-primary italic">Reimagined.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed font-medium px-4">
              Private, secure, and beautiful. Connect with anyone, anywhere, instantly.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <button 
              onClick={() => window.location.href = "/api/login"}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              Sign in with Replit
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-bold tracking-widest">Or</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <span className="text-sm font-bold">+1</span>
                </div>
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary/50 border border-transparent focus:bg-background focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium placeholder:text-muted-foreground/70"
                />
              </div>
              <button className="w-full py-4 rounded-2xl bg-secondary text-foreground font-bold hover:bg-secondary/80 transition-all active:scale-95">
                Continue with Number
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground/60 font-medium">
              We currently support Replit Auth for secure sign-in.
            </p>

            <div className="flex justify-center gap-6 text-xs text-muted-foreground/60 font-bold tracking-widest uppercase">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            </div>
            
            <p className="text-xs text-muted-foreground/60 font-medium">
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users?.filter(u => 
    u.id !== currentUser.id && 
    ((u.firstName + " " + u.lastName).toLowerCase().includes(search.toLowerCase()) || 
     (u.phoneNumber && u.phoneNumber.includes(search)))
  );

  return (
    <Layout>
      <div className="p-6 pb-2 space-y-6 max-w-3xl mx-auto">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Messages</h1>
            <p className="text-muted-foreground font-medium">{filteredUsers?.length || 0} contacts available</p>
          </div>
          <Link href="/settings">
            <Avatar name={`${currentUser.firstName} ${currentUser.lastName}`} src={currentUser.profileImageUrl} size="md" />
          </Link>
        </header>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary/50 border border-transparent focus:bg-background focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <div className="px-6 pb-24 overflow-y-auto max-w-3xl mx-auto space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers?.length === 0 ? (
          <div className="text-center py-20 opacity-60">
            <p className="text-xl font-semibold">No contacts found</p>
            <p className="text-sm mt-2">Try searching for someone else</p>
          </div>
        ) : (
          filteredUsers?.map((user) => (
            <div
              key={user.id}
              onClick={() => setLocation(`/chat/${user.id}`)}
              className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-border/50 hover:shadow-sm cursor-pointer transition-all duration-200"
            >
              <Avatar 
                name={`${user.firstName} ${user.lastName}`} 
                src={user.profileImageUrl} 
                isOnline={user.isOnline || false}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {user.firstName} {user.lastName}
                  </h3>
                  {user.lastSeen && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(user.lastSeen), 'h:mm a')}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground truncate text-sm">
                  {user.phoneNumber || user.bio || "Available for chat"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-40">
        <Plus className="w-7 h-7" />
      </button>
    </Layout>
  );
}
