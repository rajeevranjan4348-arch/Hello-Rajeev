import { Layout } from "@/components/Layout";
import { ArrowLeft, Shield, Lock, Eye, Ban, BellRing, Smartphone, Image, FileText, Camera, Share2, MapPin, Mic, Music, HardDrive, Bell } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function PrivacySecurity() {
  const [settings, setSettings] = useState({
    lastSeen: true,
    readReceipts: true,
    profilePhoto: "everyone",
    twoStep: false
  });

  const [permissions, setPermissions] = useState([
    { id: 'nearby', label: 'Nearby devices', icon: HardDrive, allowed: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, allowed: true },
    { id: 'phone', label: 'Phone', icon: Smartphone, allowed: true, subtitle: 'Accessed in past 24 hours' },
    { id: 'photos', label: 'Photos and videos', icon: Image, allowed: true, subtitle: 'Accessed in past 24 hours' },
    { id: 'sms', label: 'SMS', icon: FileText, allowed: true },
    { id: 'call_logs', label: 'Call logs', icon: HardDrive, allowed: true, subtitle: 'Accessed in past 24 hours' },
    { id: 'camera', label: 'Camera', icon: Camera, allowed: true, subtitle: 'Last accessed yesterday at 8:33 PM' },
    { id: 'contacts', label: 'Contacts', icon: Share2, allowed: true, subtitle: 'Accessed in past 24 hours' },
    { id: 'location', label: 'Location', icon: MapPin, allowed: true, subtitle: 'Last accessed yesterday at 3:46 PM' },
    { id: 'microphone', label: 'Microphone', icon: Mic, allowed: true, subtitle: 'Last accessed yesterday at 11:39 AM' },
    { id: 'music', label: 'Music and audio', icon: Music, allowed: true, subtitle: 'Accessed in past 24 hours' },
  ]);

  const toggleSetting = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const togglePermission = (id: string) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, allowed: !p.allowed } : p));
  };

  const sections = [
    {
      title: "Privacy",
      items: [
        { 
          icon: Eye, 
          label: "Last Seen & Online", 
          value: settings.lastSeen ? "Enabled" : "Disabled",
          onClick: () => toggleSetting("lastSeen"),
          toggle: true,
          active: settings.lastSeen
        },
        { 
          icon: BellRing, 
          label: "Read Receipts", 
          value: settings.readReceipts ? "Enabled" : "Disabled",
          onClick: () => toggleSetting("readReceipts"),
          toggle: true,
          active: settings.readReceipts
        },
        { 
          icon: Shield, 
          label: "Profile Photo", 
          value: "Everyone",
          onClick: () => {} 
        },
      ]
    },
    {
      title: "App Permissions",
      items: permissions.map(p => ({
        icon: p.icon,
        label: p.label,
        value: p.subtitle || (p.allowed ? "Allowed" : "Not allowed"),
        onClick: () => togglePermission(p.id),
        toggle: true,
        active: p.allowed
      }))
    },
    {
      title: "Security",
      items: [
        { 
          icon: Lock, 
          label: "Two-Step Verification", 
          value: settings.twoStep ? "On" : "Off",
          onClick: () => toggleSetting("twoStep"),
          toggle: true,
          active: settings.twoStep
        },
        { 
          icon: Ban, 
          label: "Blocked Contacts", 
          value: "0 users",
          onClick: () => {} 
        },
      ]
    }
  ];

  return (
    <Layout showNav={false}>
      <div className="min-h-screen bg-background pb-20">
        <header className="px-4 py-4 flex items-center gap-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <Link href="/settings">
            <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-xl font-display font-bold">Privacy & Permissions</h1>
        </header>

        <main className="p-6 max-w-2xl mx-auto space-y-8">
          <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10 flex items-start gap-4">
            <div className="p-3 bg-primary text-white rounded-2xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Your privacy matters</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                SwiftChat uses end-to-end encryption for all your messages and calls. Only you and the person you're communicating with can read or listen to them.
              </p>
            </div>
          </div>

          <div className="space-y-8">
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
                        <div className="text-left">
                          <span className="font-bold block group-hover:text-primary transition-colors">{item.label}</span>
                          <span className="text-xs text-muted-foreground font-medium">{item.value}</span>
                        </div>
                      </div>
                      {item.toggle && (
                        <div className={cn(
                          "w-12 h-6 rounded-full p-1 transition-all duration-300",
                          item.active ? "bg-primary" : "bg-muted-foreground/20"
                        )}>
                          <div className={cn(
                            "w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300",
                            item.active ? "translate-x-6" : "translate-x-0"
                          )} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="bg-muted/30 p-6 rounded-[2rem] space-y-4">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4">Unused app settings</h3>
              <div className="flex items-center justify-between p-5 bg-card/50 rounded-2xl border border-border/20">
                <div className="text-left">
                  <span className="font-bold block">Pause app activity if unused</span>
                </div>
                <div className="w-12 h-6 rounded-full bg-primary p-1">
                  <div className="w-4 h-4 rounded-full bg-white translate-x-6 shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
