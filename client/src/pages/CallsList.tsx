import { useCalls } from "@/hooks/use-calls";
import { useCurrentUser } from "@/hooks/use-users";
import { Layout } from "@/components/Layout";
import { Avatar } from "@/components/Avatar";
import { Phone, Video, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function CallsList() {
  const { data: calls, isLoading } = useCalls();
  const { data: user } = useCurrentUser();

  return (
    <Layout>
      <div className="p-6 pb-2 space-y-6 max-w-3xl mx-auto">
        <header>
          <h1 className="text-3xl font-display font-bold">Calls</h1>
          <p className="text-muted-foreground font-medium">Recent history</p>
        </header>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : calls?.length === 0 ? (
            <div className="text-center py-20 opacity-60">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-xl font-semibold">No recent calls</p>
              <p className="text-sm mt-2 text-muted-foreground">Start a call from the chat screen</p>
            </div>
          ) : (
            calls?.map((call) => {
              const isOutgoing = call.callerId === user?.id;
              const otherPerson = isOutgoing ? (call as any).callee : (call as any).caller;
              
              const displayName = otherPerson 
                ? `${otherPerson.firstName} ${otherPerson.lastName}`
                : "Unknown User";
              const avatarUrl = otherPerson?.profileImageUrl;

              return (
                <div key={call.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                  <div className="flex items-center gap-4">
                    <Avatar name={displayName} src={avatarUrl} size="md" />
                    <div>
                      <h3 className="font-semibold">{displayName}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {isOutgoing ? (
                          <ArrowUpRight className="w-3 h-3 text-green-500" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3 text-red-500" />
                        )}
                        <span>{format(new Date(call.startedAt || new Date()), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/call/${otherPerson?.id || call.calleeId}?type=${call.type}`}>
                    <button className="p-3 rounded-full bg-secondary text-foreground hover:bg-primary hover:text-white transition-all">
                      {call.type === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                    </button>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
