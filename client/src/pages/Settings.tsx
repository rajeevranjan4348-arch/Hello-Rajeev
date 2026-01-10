import { useCurrentUser } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Avatar } from "@/components/Avatar";
import { Bell, Moon, Lock, HelpCircle, LogOut, ChevronRight, User, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@shared/routes";

export default function Settings() {
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.bio) {
      setBio(user.bio);
    }
  }, [user?.bio]);

  if (!user) return null;

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleUpdateBio = async () => {
    try {
      setIsUpdating(true);
      await apiRequest("PATCH", "/api/user", { bio });
      await queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
      setIsEditingBio(false);
      toast({ title: "Bio updated", description: "Your profile has been updated successfully." });
    } catch (error) {
      toast({ title: "Update failed", description: "Could not update bio. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
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
        { icon: Lock, label: "Privacy Policy", onClick: () => window.location.href = "/privacy" },
        { icon: ChevronRight, label: "Terms of Service", onClick: () => window.location.href = "/terms" },
      ]
    }
  ];

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-3xl mx-auto">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-display font-bold">Settings</h1>
        </header>

        {/* Profile Card */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-blue-600 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-6">
              <Avatar 
                name={`${user.firstName} ${user.lastName}`} 
                src={user.profileImageUrl} 
                size="xl" 
                className="ring-4 ring-white/30 ring-offset-4 ring-offset-primary shadow-xl"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-bold truncate leading-tight tracking-tight">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-white/80 text-lg font-medium truncate">
                  {user.phoneNumber || user.email || "No contact info"}
                </p>
                <div className="mt-4 flex gap-2">
                  <div className="px-4 py-1.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">
                    Free Account
                  </div>
                  {user.isOnline && (
                    <div className="px-4 py-1.5 rounded-full bg-green-400/20 text-green-100 text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-green-400/20">
                      Online
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Bio</h3>
                <button 
                  onClick={() => setIsEditingBio(!isEditingBio)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              
              {isEditingBio ? (
                <div className="space-y-3">
                  <Textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px] rounded-2xl focus:ring-white/20"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/10"
                      onClick={() => {
                        setBio(user.bio || "");
                        setIsEditingBio(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-white text-primary hover:bg-white/90"
                      onClick={handleUpdateBio}
                      disabled={isUpdating}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-white/90 leading-relaxed font-medium">
                  {user.bio || "No bio yet. Tap the pencil to add one!"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-4">{section.title}</h3>
              <div className="bg-card/50 backdrop-blur-xl rounded-[2rem] border border-border/40 overflow-hidden shadow-sm">
                {section.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-all duration-300 border-b border-border/40 last:border-0 group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3 rounded-2xl bg-secondary/50 text-foreground group-hover:scale-110 transition-transform duration-300">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-lg group-hover:text-primary transition-colors">{item.label}</span>
                    </div>
                    {item.toggle ? (
                      <div className={cn(
                        "w-14 h-7 rounded-full p-1.5 transition-all duration-500",
                        item.value ? "bg-primary" : "bg-muted-foreground/20"
                      )}>
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-500",
                          item.value ? "translate-x-7" : "translate-x-0"
                        )} />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button 
            onClick={() => logout()}
            className="w-full p-6 rounded-[2rem] bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg shadow-red-500/5 active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </Layout>
  );
}
