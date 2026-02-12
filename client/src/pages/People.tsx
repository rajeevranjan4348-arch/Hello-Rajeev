import { useUsers } from "@/hooks/use-users";
import { Layout } from "@/components/Layout";
import { Avatar } from "@/components/Avatar";
import { Link } from "wouter";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function People() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users, isLoading } = useUsers(searchTerm);

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <header className="space-y-4">
          <div>
            <h1 className="text-3xl font-display font-bold">People</h1>
            <p className="text-muted-foreground font-medium">Find friends to chat with</p>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by name, email or phone..."
              className="pl-12 h-14 rounded-2xl bg-secondary/50 border-none focus-visible:ring-4 focus-visible:ring-primary/10 transition-all font-medium text-lg placeholder:text-muted-foreground/70"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-people"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium animate-pulse">Finding connections...</p>
            </div>
          ) : users?.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold">No matches found</p>
                <p className="text-muted-foreground">Try a different name or number</p>
              </div>
            </div>
          ) : (
            users?.map((user) => (
              <Link key={user.id} href={`/chat/${user.id}`}>
                <div className="flex flex-col items-center p-8 rounded-[2rem] bg-card border border-border/40 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors" />
                  <Avatar name={`${user.firstName} ${user.lastName}`} src={user.profileImageUrl} size="xl" isOnline={user.isOnline || false} />
                  <div className="mt-6 space-y-1 text-center w-full">
                    <h3 className="font-bold text-xl truncate group-hover:text-primary transition-colors tracking-tight">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground truncate opacity-80">
                      {user.phoneNumber || user.email}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground/50 truncate uppercase tracking-widest mt-1">
                      ID: {user.id}
                    </p>
                  </div>
                  <div className="mt-6 w-full pt-6 border-t border-border/40">
                    <button className="w-full py-3 rounded-xl bg-secondary/50 group-hover:bg-primary group-hover:text-white transition-all font-bold text-sm">
                      Send Message
                    </button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
