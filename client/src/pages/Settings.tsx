import { useCurrentUser } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Avatar } from "@/components/Avatar";
import { Bell, Moon, Lock, HelpCircle, LogOut, ChevronRight, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  if (!user) return null;

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Personal Info", onClick: () => {} },
        { icon: Lock, label: "Privacy & Security", onClick: () => {} },
      ]
    },
    {
      title: "App Settings",
      items: [
        { icon: Bell, label: "Notifications", onClick: () => {} },
        { icon: Moon, label: "Dark Mode", onClick: toggleTheme, toggle: true, value: isDark },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help & FAQ", onClick: () => {} },
      ]
    }
  ];

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-3xl mx-auto">
        <header>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
        </header>

        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl shadow-blue-500/20">
          <div className="flex items-center gap-5">
            <Avatar 
              name={`${user.firstName} ${user.lastName}`} 
              src={user.profileImageUrl} 
              size="xl" 
              className="border-4 border-white/20"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate leading-tight">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-white/80 text-sm truncate opacity-90">
                {user.phoneNumber || user.email || "No contact info"}
              </p>
              <div className="mt-4 inline-flex px-4 py-1.5 rounded-full bg-white/25 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
                Free Account
              </div>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-2">{section.title}</h3>
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                {section.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-secondary text-foreground">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.toggle ? (
                      <div className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                        item.value ? "bg-primary" : "bg-muted-foreground/30"
                      )}>
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                          item.value ? "translate-x-6" : "translate-x-0"
                        )} />
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button 
            onClick={() => logout()}
            className="w-full p-4 rounded-2xl bg-red-50 text-red-600 font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </Layout>
  );
}
