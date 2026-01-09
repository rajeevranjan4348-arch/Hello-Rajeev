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
      <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 bg-primary rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground">
            Connect freely.
            <br />
            <span className="text-primary">Chat securely.</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Experience the next generation of messaging with crystal clear calls and instant chat.
          </p>
          <button 
            onClick={() => window.location.href = "/api/login"}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300"
          >
            Get Started
          </button>
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
