import { apiRequest } from "@/lib/queryClient";
import { useUsers, useCurrentUser } from "@/hooks/use-users";
import { Avatar } from "@/components/Avatar";
import { Layout } from "@/components/Layout";
import { Link, useLocation } from "wouter";
import { Search, Plus, Loader2, Bell, Shield, MoreVertical, UserPlus, Users, Radio, Laptop, Star, History, Archive, CheckSquare, Settings, HelpCircle, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { data: currentUser } = useCurrentUser();
  const { data: users, isLoading } = useUsers();
  const [search, setSearch] = useState("");
  const [showPermissionDialog, setShowPermissionDialog] = useState(() => !localStorage.getItem("zenix-permissions-accepted"));
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(0);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      toast({ title: "Invalid Number", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", "/api/otp/send", { phoneNumber: `+91${phoneNumber}` });
      setShowOtpScreen(true);
      setTimer(120); // 2 minutes
      toast({ title: "OTP Sent", description: "Check server logs for code (Demo)" });
    } catch (err) {
      toast({ title: "Failed to send OTP", variant: "destructive" });
    }
  };

  const handleOtpChange = async (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== "")) {
      const code = newOtp.join("");
      try {
        const res = await apiRequest("POST", "/api/otp/verify", { 
          phoneNumber: `+91${phoneNumber}`, 
          code 
        });
        
        // Request permissions after OTP verification but before redirecting
        if ("Notification" in window) {
          await Notification.requestPermission();
        }
        
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (e) {
          console.log("Media permissions denied or not supported");
        }

        toast({ title: "Success", description: "OTP Verified!" });
        // Redirect to real login to establish session
        window.location.href = "/api/login";
      } catch (err) {
        toast({ title: "Verification Failed", description: "Invalid or expired code", variant: "destructive" });
        setOtp(["", "", "", "", "", ""]);
        const firstInput = otpInputs.current[0];
        if (firstInput) firstInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = otpInputs.current[index - 1];
      if (prevInput) prevInput.focus();
    }
  };

  const handleAcceptPermissions = () => {
    localStorage.setItem("zenix-permissions-accepted", "true");
    setShowPermissionDialog(false);
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  if (!currentUser) {
    if (showOtpScreen) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background">
          <div className="w-full max-w-sm space-y-8 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-display font-black">Verify Number</h1>
              <p className="text-muted-foreground font-medium">
                Enter the code sent to <span className="text-foreground">+91 {phoneNumber}</span>
              </p>
            </div>

            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-secondary/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                />
              ))}
            </div>

            <div className="space-y-4">
              <button
                disabled={timer > 0}
                onClick={() => {
                  setTimer(30);
                  toast({ title: "Code Resent" });
                }}
                className="text-sm font-bold text-primary disabled:text-muted-foreground uppercase tracking-widest"
              >
                {timer > 0 ? `Resend code in ${timer}s` : "Resend code"}
              </button>
              <button
                onClick={() => setShowOtpScreen(false)}
                className="w-full py-4 text-muted-foreground font-bold hover:text-foreground transition-colors"
              >
                Edit Number
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/10 overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700" />
        
        <div className="text-center space-y-8 max-w-sm relative z-10">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-primary rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-primary/40 rotate-6 hover:rotate-0 transition-transform duration-500 cursor-pointer group">
              <svg className="w-12 h-12 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">New</div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-display font-black text-foreground leading-[1.1] tracking-tight">
              Zenix 
              <br />
              <span className="text-primary italic">Messaging.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed font-medium px-4">
              Private, secure, and beautiful. Connect with anyone, anywhere, instantly.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <button 
              onClick={() => window.location.href = "/api/login"}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              Sign in with Replit
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-bold tracking-widest">Or</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <span className="text-sm font-bold">+91</span>
                </div>
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  value={phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhoneNumber(val);
                  }}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary/50 border border-transparent focus:bg-background focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium placeholder:text-muted-foreground/70"
                />
              </div>
              <button 
                onClick={handleSendOtp}
                className="w-full py-4 rounded-2xl bg-secondary text-foreground font-bold hover:bg-secondary/80 transition-all active:scale-95"
              >
                Continue with Number
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground/60 font-medium">
              We currently support Replit Auth for secure sign-in.
            </p>

            <div className="flex justify-center gap-6 text-xs text-muted-foreground/60 font-bold tracking-widest uppercase">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            </div>
            
            <p className="text-xs text-muted-foreground/60 font-medium">
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users?.filter(u => 
    u.id !== currentUser.id && 
    ((u.firstName + " " + u.lastName).toLowerCase().includes(search.toLowerCase()) || 
     (u.phoneNumber && u.phoneNumber.includes(search)))
  );

  return (
    <Layout>
      <div className="p-6 pb-2 space-y-6 max-w-3xl mx-auto">
        <header className="flex justify-between items-center">
          <Link href="/settings">
            <Avatar name={`${currentUser.firstName} ${currentUser.lastName}`} src={currentUser.profileImageUrl} size="md" />
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-display font-bold">Messages</h1>
            <p className="text-muted-foreground font-medium">{filteredUsers?.length || 0} contacts available</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2.5 rounded-full hover:bg-muted transition-colors outline-none">
                <MoreVertical className="w-6 h-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-border bg-background/95 backdrop-blur-md">
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                <Plus className="w-4 h-4" />
                <span className="font-medium">New Chat</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                <Users className="w-4 h-4" />
                <span className="font-medium">New Group</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                <Radio className="w-4 h-4" />
                <span className="font-medium">New Broadcast</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                <Laptop className="w-4 h-4" />
                <span className="font-medium">Linked Devices</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                <Star className="w-4 h-4" />
                <span className="font-medium">Starred Messages</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                <History className="w-4 h-4" />
                <span className="font-medium">Status / Stories</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                <Archive className="w-4 h-4" />
                <span className="font-medium">Archived Chats</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                <CheckSquare className="w-4 h-4" />
                <span className="font-medium">Select Chats</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">App Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                <HelpCircle className="w-4 h-4" />
                <span className="font-medium">Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 py-3 cursor-pointer text-primary">
                <UserPlus className="w-4 h-4" />
                <span className="font-medium">Invite Friends</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem 
                className="rounded-xl flex items-center gap-3 py-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => window.location.href = "/api/logout"}
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary/50 border border-transparent focus:bg-background focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <div className="px-6 pb-24 overflow-y-auto max-w-3xl mx-auto space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers?.length === 0 ? (
          <div className="text-center py-20 opacity-60">
            <p className="text-xl font-semibold">No contacts found</p>
            <p className="text-sm mt-2">Try searching for someone else</p>
          </div>
        ) : (
          filteredUsers?.map((user) => (
            <div
              key={user.id}
              onClick={() => setLocation(`/chat/${user.id}`)}
              className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-border/50 hover:shadow-sm cursor-pointer transition-all duration-200"
            >
              <Avatar 
                name={`${user.firstName} ${user.lastName}`} 
                src={user.profileImageUrl} 
                isOnline={user.isOnline || false}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {user.firstName} {user.lastName}
                  </h3>
                  {(user as any).lastMessage?.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date((user as any).lastMessage.createdAt), 'h:mm a')}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground truncate text-sm">
                  {(user as any).lastMessage?.content || user.phoneNumber || user.bio || "No messages yet"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Permission Dialog */}
      {showPermissionDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm p-8 rounded-[2.5rem] border border-border shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold">Permissions Required</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Zenix needs the following permissions to provide a complete messaging experience:
              </p>
            </div>
            
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-secondary rounded-xl">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Contacts</p>
                  <p className="text-xs text-muted-foreground">Sync and find friends easily</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-secondary rounded-xl">
                  <Laptop className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Storage</p>
                  <p className="text-xs text-muted-foreground">Send and save photos/videos</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-secondary rounded-xl">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Camera & Mic</p>
                  <p className="text-xs text-muted-foreground">For photos, voice messages & calls</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-secondary rounded-xl">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Notifications</p>
                  <p className="text-xs text-muted-foreground">Get instant message alerts</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleAcceptPermissions}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Allow All Permissions
              </button>
              <div className="flex justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <button className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-40">
        <Plus className="w-7 h-7" />
      </button>
    </Layout>
  );
}
