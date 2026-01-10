import { useCurrentUser } from "@/hooks/use-users";
import { Layout } from "@/components/Layout";
import { Avatar } from "@/components/Avatar";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@shared/routes";

export default function PersonalInfo() {
  const { data: user } = useCurrentUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhoneNumber(user.phoneNumber || "");
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      await apiRequest("PATCH", "/api/user", {
        firstName,
        lastName,
        phoneNumber
      });
      await queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
      toast({ title: "Profile updated", description: "Your personal information has been saved." });
      setLocation("/settings");
    } catch (error) {
      toast({ title: "Update failed", description: "Could not update profile. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Layout showNav={false}>
      <div className="min-h-screen bg-background">
        <header className="px-4 py-4 flex items-center gap-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <Link href="/settings">
            <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-xl font-display font-bold">Personal Info</h1>
        </header>

        <main className="p-6 max-w-2xl mx-auto space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <Avatar 
                name={`${user.firstName} ${user.lastName}`} 
                src={user.profileImageUrl} 
                size="xl" 
                className="w-32 h-32 ring-4 ring-primary/10 shadow-2xl"
              />
              <button className="absolute bottom-0 right-0 p-3 bg-primary text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Tap to change profile picture</p>
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">First Name</Label>
                <Input 
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-14 rounded-2xl bg-secondary/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name</Label>
                <Input 
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-14 rounded-2xl bg-secondary/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
              <Input 
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-14 rounded-2xl bg-secondary/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
              <div className="h-14 rounded-2xl bg-muted/50 flex items-center px-4 text-muted-foreground font-medium border border-border/50">
                {user.email}
              </div>
              <p className="text-[10px] text-muted-foreground/60 ml-1">Email is managed via your account provider and cannot be changed here.</p>
            </div>
          </div>

          <Button 
            onClick={handleSave}
            disabled={isUpdating}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all gap-3"
          >
            {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            Save Changes
          </Button>
        </main>
      </div>
    </Layout>
  );
}
