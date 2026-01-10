import { useUsers, useCurrentUser } from "@/hooks/use-users";
import { Avatar } from "@/components/Avatar";
import { Layout } from "@/components/Layout";
import { Link, useLocation } from "wouter";
import { Search, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function Home() {
  const { data: currentUser } = useCurrentUser();
  const { data: users, isLoading } = useUsers();
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

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
              Get Started with Replit
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {}} // Placeholder for future social login
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/20 transition-all font-semibold text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button 
                onClick={() => {}} // Placeholder for future social login
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/20 transition-all font-semibold text-sm"
              >
                <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </div>
          
          <div className="flex justify-center gap-6 text-xs text-muted-foreground/60 font-bold tracking-widest uppercase">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          </div>
          
          <p className="text-xs text-muted-foreground/60 font-medium">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
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
