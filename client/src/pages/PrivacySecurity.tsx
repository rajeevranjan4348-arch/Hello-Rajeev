import { Layout } from "@/components/Layout";
import { ArrowLeft, Shield, Lock, Eye, Ban, BellRing } from "lucide-react";
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

  const toggleSetting = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    }
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
      <div className="min-h-screen bg-background">
        <header className="px-4 py-4 flex items-center gap-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <Link href="/settings">
            <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-xl font-display font-bold">Privacy & Security</h1>
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
          </div>
        </main>
      </div>
    </Layout>
  );
}
