import { useRoute, useLocation } from "wouter";
import { useUser, useCurrentUser } from "@/hooks/use-users";
import { useCreateCall } from "@/hooks/use-calls";
import { Avatar } from "@/components/Avatar";
import { PhoneOff, Mic, MicOff, Video, VideoOff, MoreVertical, MessageSquare, Phone } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function Call() {
  const [, params] = useRoute("/call/:id");
  const [, setLocation] = useLocation();
  const userId = params?.id || "0";
  const searchParams = new URLSearchParams(window.location.search);
  const type = (searchParams.get("type") as "video" | "voice") || "voice";
  const isIncoming = searchParams.get("incoming") === "true";

  const { data: user } = useUser(userId);
  const { data: currentUser } = useCurrentUser();
  const { mutate: createCall } = useCreateCall();
  
  const [callTime, setCallTime] = useState(0);
  const [isVideoOff, setIsVideoOff] = useState(type === "voice");
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState(isIncoming ? "Incoming Call..." : "Calling...");
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    socketRef.current = io(window.location.origin, {
      query: { userId: currentUser.id }
    });

    socketRef.current.on("call-answered", async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setStatus("Connected");
      }
    });

    socketRef.current.on("ice-candidate", async ({ candidate }) => {
      if (pcRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socketRef.current.on("call-rejected", () => {
      setStatus("Call Rejected");
      setTimeout(() => setLocation("/"), 2000);
    });

    socketRef.current.on("call-ended", () => {
      handleEndCall();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (status === "Connected") {
        setCallTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const setupPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);
    
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", { to: userId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (type === "video") {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      } else {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const handleStartCall = async () => {
    try {
      const constraints = { audio: true, video: type === "video" };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;

      const pc = setupPeerConnection(mediaStream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socketRef.current?.emit("call-user", { to: userId, offer, type });
      setStatus("Ringing...");
      createCall({ calleeId: userId, type: type as any });
    } catch (err) {
      console.error("Call start failed:", err);
      setStatus("Error starting call");
    }
  };

  const handleAcceptCall = async () => {
    try {
      const constraints = { audio: true, video: type === "video" };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;

      const pc = setupPeerConnection(mediaStream);
      // In a real app, the offer would be passed via state/context
      // For this simplified version, we'll assume the offer is stored or handled
      setStatus("Connected");
    } catch (err) {
      console.error("Accept failed:", err);
    }
  };

  const handleEndCall = () => {
    socketRef.current?.emit("end-call", { to: userId });
    stream?.getTracks().forEach(track => track.stop());
    pcRef.current?.close();
    setLocation("/");
  };

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  useEffect(() => {
    if (user && currentUser && !isIncoming) {
      handleStartCall();
    }
  }, [user, currentUser, isIncoming]);

  if (!user) return null;

  return (
    <div className="h-screen w-full bg-zinc-900 relative overflow-hidden flex flex-col items-center justify-between py-12 text-white">
      <audio ref={remoteAudioRef} autoPlay />
      
      <div 
        className="absolute inset-0 opacity-20 blur-3xl scale-110 z-0 bg-center bg-cover"
        style={{ backgroundImage: user.profileImageUrl ? `url(${user.profileImageUrl})` : "none" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-0" />

      <div className="z-10 text-center space-y-2 mt-8">
        <Avatar 
          name={`${user.firstName} ${user.lastName}`} 
          src={user.profileImageUrl} 
          size="xl" 
          className="border-4 border-white/10 shadow-2xl mx-auto" 
        />
        <h2 className="text-3xl font-display font-bold mt-4">{user.firstName} {user.lastName}</h2>
        <p className="text-white/60 font-medium tracking-wide">{status}</p>
        <p className="text-2xl font-mono mt-2 opacity-60 tabular-nums">
          {formatTime(callTime)}
        </p>
      </div>

      <div className="relative w-full flex-1 flex items-center justify-center">
        {type === "video" && (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
        {!isVideoOff && type === 'video' && (
          <div className="absolute top-8 right-8 w-32 h-48 bg-zinc-800 rounded-2xl border border-white/20 shadow-2xl z-20 overflow-hidden">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="z-10 w-full max-w-sm px-8 mb-8">
        <div className="flex items-center justify-center gap-6">
          {isIncoming && status === "Incoming Call..." ? (
            <>
              <button onClick={handleAcceptCall} className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                <Phone className="w-8 h-8" />
              </button>
              <button onClick={handleEndCall} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                <PhoneOff className="w-8 h-8" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={toggleMute}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                  isMuted ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"
                )}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <button onClick={handleEndCall} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600">
                <PhoneOff className="w-8 h-8" />
              </button>

              {type === 'video' && (
                <button 
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                    isVideoOff ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"
                  )}
                >
                  {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
