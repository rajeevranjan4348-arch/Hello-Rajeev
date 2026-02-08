import { Layout } from "@/components/Layout";
import { ArrowLeft, Monitor, Smartphone, Globe, Shield, Lock } from "lucide-react";
import { Link } from "wouter";

export default function LinkedDevices() {
  const devices = [
    { name: "Windows PC", location: "Mumbai, India", active: "Active now", icon: Monitor },
    { name: "Chrome on Android", location: "Delhi, India", active: "Last active 2 hours ago", icon: Smartphone },
    { name: "MacBook Pro", location: "Bangalore, India", active: "Last active yesterday", icon: Monitor },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link href="/settings">
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-2xl font-display font-bold">Linked Devices</h1>
        </header>

        <div className="bg-primary/10 p-8 rounded-[2.5rem] text-center space-y-4">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <Monitor className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Use SwiftChat on other devices</h2>
          <p className="text-muted-foreground">Link up to 4 devices to your account</p>
          <button className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg">
            Link a Device
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4">Your Devices</h3>
          <div className="bg-card rounded-[2rem] border border-border/40 overflow-hidden">
            {devices.map((device, idx) => (
              <div key={idx} className="flex items-center gap-4 p-5 border-b border-border/40 last:border-0">
                <div className="p-3 rounded-2xl bg-secondary/50">
                  <device.icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">{device.name}</h4>
                  <p className="text-xs text-muted-foreground">{device.location} • {device.active}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/30 p-6 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">Your personal messages are end-to-end encrypted on all your linked devices.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
