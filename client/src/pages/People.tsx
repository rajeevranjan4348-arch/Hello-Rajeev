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
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or phone number..."
              className="pl-10 h-12 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-people"
            />
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No people found matching your search.
            </div>
          ) : (
            users?.map((user) => (
              <Link key={user.id} href={`/chat/${user.id}`}>
                <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                  <Avatar name={`${user.firstName} ${user.lastName}`} src={user.profileImageUrl} size="lg" isOnline={user.isOnline || false} />
                  <h3 className="mt-4 font-bold text-center truncate w-full group-hover:text-primary transition-colors">{user.firstName} {user.lastName}</h3>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-full text-center">
                    {user.phoneNumber || user.email}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
