import { useUsers } from "@/hooks/use-users";
import { Layout } from "@/components/Layout";
import { Avatar } from "@/components/Avatar";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function People() {
  const { data: users, isLoading } = useUsers();

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <header>
          <h1 className="text-3xl font-display font-bold">People</h1>
          <p className="text-muted-foreground font-medium">Find friends to chat with</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            users?.map((user) => (
              <Link key={user.id} href={`/chat/${user.id}`}>
                <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                  <Avatar name={user.displayName} src={user.avatarUrl} size="lg" isOnline={user.isOnline || false} />
                  <h3 className="mt-4 font-bold text-center truncate w-full group-hover:text-primary transition-colors">{user.displayName}</h3>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-full text-center">
                    {user.username}
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
