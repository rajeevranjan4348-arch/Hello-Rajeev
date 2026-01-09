import { useRoute, useLocation } from "wouter";
import { useUser, useCurrentUser } from "@/hooks/use-users";
import { useCreateCall } from "@/hooks/use-calls";
import { Avatar } from "@/components/Avatar";
import { PhoneOff, Mic, MicOff, Video, VideoOff, MoreVertical, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Call() {
  const [, params] = useRoute("/call/:id");
  const [, setLocation] = useLocation();
  const userId = parseInt(params?.id || "0");
  const searchParams = new URLSearchParams(window.location.search);
  const type = (searchParams.get("type") as "video" | "voice") || "voice";

  const { data: user } = useUser(userId);
  const { data: currentUser } = useCurrentUser();
  const { mutate: createCall } = useCreateCall();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === "voice");
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    if (user && currentUser) {
      createCall({ calleeId: user.id, type });
      const timer = setTimeout(() => setStatus("Ringing..."), 1000);
      const timer2 = setTimeout(() => setStatus("Connected"), 3000);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [user, currentUser, createCall, type]);

  if (!user) return null;

  return (
    <div className="h-screen w-full bg-zinc-900 relative overflow-hidden flex flex-col items-center justify-between py-12 text-white">
      {/* Background Image Effect */}
      <div 
        className="absolute inset-0 opacity-20 blur-3xl scale-110 z-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${user.avatarUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-0" />

      {/* Header Info */}
      <div className="z-10 text-center space-y-2 mt-8 animate-in slide-in-from-top-10 fade-in duration-700">
        <Avatar 
          name={user.displayName} 
          src={user.avatarUrl} 
          size="xl" 
          className="border-4 border-white/10 shadow-2xl shadow-black/50" 
        />
        <h2 className="text-3xl font-display font-bold mt-4">{user.displayName}</h2>
        <p className="text-white/60 font-medium tracking-wide animate-pulse">{status}</p>
      </div>

      {/* Video Placeholder (Self View) */}
      {!isVideoOff && type === 'video' && (
        <div className="absolute top-8 right-8 w-32 h-48 bg-zinc-800 rounded-2xl border border-white/20 shadow-2xl z-20 overflow-hidden">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="Me" className="w-full h-full object-cover opacity-80" />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-xs text-white/50">Camera</div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="z-10 w-full max-w-sm px-8 mb-8">
        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md",
              isMuted ? "bg-white text-black" : "bg-white/10 hover:bg-white/20 text-white"
            )}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={() => setLocation(`/chat/${userId}`)}
            className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 hover:scale-110 transition-all duration-200"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {type === 'video' && (
             <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md",
                isVideoOff ? "bg-white text-black" : "bg-white/10 hover:bg-white/20 text-white"
              )}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all">
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
