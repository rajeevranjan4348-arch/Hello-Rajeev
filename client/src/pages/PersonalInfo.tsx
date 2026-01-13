import { useCurrentUser } from "@/hooks/use-users";
import { Layout } from "@/components/Layout";
import { Avatar } from "@/components/Avatar";
import { ArrowLeft, Camera, Loader2, Save, Trash2 } from "lucide-react";
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
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isPhoneNumberPublic, setIsPhoneNumberPublic] = useState(false);
  const [isBioPublic, setIsBioPublic] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhoneNumber(user.phoneNumber || "");
      setBio(user.bio || "");
      setBirthDate(user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "");
      setIsPhoneNumberPublic(user.isPhoneNumberPublic || false);
      setIsBioPublic(user.isBioPublic !== false);
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      await apiRequest("PATCH", "/api/user", {
        firstName,
        lastName,
        phoneNumber,
        bio,
        birthDate: birthDate ? new Date(birthDate).toISOString() : null,
        isPhoneNumberPublic,
        isBioPublic
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Simulate upload - in a real app we'd upload to storage
      // For now we use object URL as a mock persistable string if the backend supported it, 
      // but we'll just send a mock URL for now.
      const imageUrl = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&size=256`;
      await apiRequest("PATCH", "/api/user", { profileImageUrl: imageUrl });
      await queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
      toast({ title: "Profile photo updated" });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);
    try {
      await apiRequest("PATCH", "/api/user", { profileImageUrl: null });
      await queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
      toast({ title: "Profile photo removed" });
    } catch (err) {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
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
              <label className="absolute bottom-0 right-0 p-3 bg-primary text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
              </label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground font-medium">Tap camera to change profile picture</p>
              {user.profileImageUrl && (
                <button 
                  onClick={handleRemovePhoto}
                  disabled={isUploading}
                  className="text-xs font-bold text-destructive uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Photo
                </button>
              )}
            </div>
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
                placeholder="+91 0000000000"
                className="h-14 rounded-2xl bg-secondary/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg font-medium"
              />
              <div className="flex items-center gap-2 ml-1">
                <input 
                  type="checkbox" 
                  id="phonePublic" 
                  checked={isPhoneNumberPublic} 
                  onChange={(e) => setIsPhoneNumberPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="phonePublic" className="text-xs font-medium text-muted-foreground">Visible to others</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Date of Birth</Label>
              <Input 
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-14 rounded-2xl bg-secondary/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Bio / About</Label>
              <textarea 
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full min-h-[100px] p-4 rounded-2xl bg-secondary/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg font-medium resize-none"
              />
              <div className="flex items-center gap-2 ml-1">
                <input 
                  type="checkbox" 
                  id="bioPublic" 
                  checked={isBioPublic} 
                  onChange={(e) => setIsBioPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="bioPublic" className="text-xs font-medium text-muted-foreground">Visible to others</Label>
              </div>
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
