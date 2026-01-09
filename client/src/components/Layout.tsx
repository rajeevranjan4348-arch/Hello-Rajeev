import { BottomNav } from "./BottomNav";
import { ReactNode } from "react";
import { useCurrentUser } from "@/hooks/use-users";
import { Loader2 } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="mt-4 font-medium text-muted-foreground animate-pulse">Loading SwiftChat...</p>
      </div>
    );
  }

  // If user is not logged in, we might want to redirect to a landing/login page
  // But for now we render children (which might be the landing page)
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 pb-20 relative overflow-hidden">
        {children}
      </main>
      {showNav && user && <BottomNav />}
    </div>
  );
}
