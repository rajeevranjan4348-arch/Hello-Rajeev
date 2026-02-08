import { Layout } from "@/components/Layout";
import { ArrowLeft, Star, MessageSquare, Search } from "lucide-react";
import { Link } from "wouter";

export default function StarredMessages() {
  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link href="/settings">
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-2xl font-display font-bold">Starred Messages</h1>
        </header>

        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <Star className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold">No starred messages</h2>
            <p className="text-sm max-w-xs mx-auto mt-2">
              Tap and hold any message in a chat to star it, so you can easily find it later.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
