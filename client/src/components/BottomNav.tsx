import { Link, useLocation } from "wouter";
import { MessageSquare, Phone, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: MessageSquare, label: "Chats", path: "/" },
    { icon: Phone, label: "Calls", path: "/calls" },
    { icon: Users, label: "People", path: "/people" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-safe pt-2 px-6">
      <div className="flex justify-between items-center max-w-md mx-auto h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "flex flex-col items-center justify-center space-y-1 w-16 cursor-pointer transition-colors duration-200 group",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/10" : "group-hover:bg-muted"
                )}>
                  <item.icon className={cn(
                    "w-6 h-6 transition-all duration-200",
                    isActive && "scale-105"
                  )} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
