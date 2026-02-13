import { Avatar } from "@/components/Avatar";
import { 
  Phone, Video, Search, Bell, Lock, Shield, 
  Globe, Star, List, Ban, AlertTriangle, Trash2, 
  ChevronRight, ArrowLeft, MoreVertical, FileText, Link2, ImageIcon
} from "lucide-react";
import { Link } from "wouter";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-users";

interface ContactInfoProps {
  userId: string;
  onClose: () => void;
}

export function ContactInfo({ userId, onClose }: ContactInfoProps) {
  const { data: user } = useUser(userId);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-background animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
      <header className="flex items-center p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="ml-4 font-bold text-xl flex-1">Contact info</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <MoreVertical className="w-6 h-6" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Verify security code</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center py-8 px-4 bg-card/30">
          <Avatar 
            name={`${user.firstName} ${user.lastName}`} 
            src={user.profileImageUrl} 
            size="xl" 
            className="w-40 h-40 border-4 border-background shadow-xl mb-6"
          />
          <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
          <p className="text-muted-foreground font-medium mt-1">{user.phoneNumber}</p>
          
          <div className="flex justify-center gap-8 mt-8 w-full">
            <Link href={`/call/${user.id}?type=voice`}>
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <Phone className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-primary group-hover:text-foreground">Voice</span>
              </div>
            </Link>
            <Link href={`/call/${user.id}?type=video`}>
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <Video className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-primary group-hover:text-foreground">Video</span>
              </div>
            </Link>
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <Search className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-primary group-hover:text-foreground">Search</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 pb-20">
          {/* Status & Phone */}
          <section className="bg-card/50 rounded-2xl p-4 space-y-2 border border-border/40">
            <p className="text-sm text-muted-foreground font-medium">About and phone number</p>
            <p className="text-base font-medium">{user.bio || "Hey there! I am using Zenix."}</p>
            <p className="text-sm text-muted-foreground">{format(new Date(user.createdAt || Date.now()), "MMMM d, yyyy")}</p>
            <div className="pt-2 border-t mt-2 flex justify-between items-center">
              <span className="font-bold">{user.phoneNumber}</span>
              <div className="flex gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <Video className="w-4 h-4 text-primary" />
              </div>
            </div>
          </section>

          {/* Media, Links and Docs */}
          <section className="bg-card/50 rounded-2xl border border-border/40 overflow-hidden">
            <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
              <span className="font-bold text-sm">Media, links, and docs</span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs font-bold uppercase">124</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
              <div className="w-20 h-20 bg-muted rounded-xl flex-shrink-0 flex items-center justify-center"><ImageIcon className="opacity-20" /></div>
              <div className="w-20 h-20 bg-muted rounded-xl flex-shrink-0 flex items-center justify-center"><Link2 className="opacity-20" /></div>
              <div className="w-20 h-20 bg-muted rounded-xl flex-shrink-0 flex items-center justify-center"><FileText className="opacity-20" /></div>
              <div className="w-20 h-20 bg-muted rounded-xl flex-shrink-0 flex items-center justify-center"><ImageIcon className="opacity-20" /></div>
            </div>
          </section>

          {/* Settings */}
          <section className="bg-card/50 rounded-2xl border border-border/40 overflow-hidden divide-y divide-border/20">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 opacity-70" />
                <span className="font-medium text-sm">Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <ImageIcon className="w-5 h-5 opacity-70" />
                <span className="font-medium text-sm">Media visibility</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <Lock className="w-5 h-5 opacity-70" />
                <div>
                  <p className="font-medium text-sm">Encryption</p>
                  <p className="text-[10px] text-muted-foreground">Messages and calls are end-to-end encrypted.</p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-primary opacity-50" />
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <Lock className="w-5 h-5 opacity-70" />
                <span className="font-medium text-sm">Chat lock</span>
              </div>
              <Switch />
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 opacity-70" />
                <span className="font-medium text-sm">Advanced privacy settings</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <Globe className="w-5 h-5 opacity-70" />
                <span className="font-medium text-sm">Translate messages</span>
              </div>
              <Switch />
            </div>
          </section>

          {/* Dangerous/Social Options */}
          <section className="bg-card/50 rounded-2xl border border-border/40 overflow-hidden divide-y divide-border/20">
            <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors text-primary">
              <Star className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wider">Add to Favorites</span>
            </div>
            <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors text-primary">
              <List className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wider">Add to list</span>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-destructive/10 transition-colors text-destructive">
                  <Ban className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase tracking-wider">Block {user.firstName}</span>
                </div>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle>Block contact?</DialogTitle>
                  <DialogDescription>Blocked contacts will no longer be able to call you or send you messages.</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" className="rounded-xl font-bold">Cancel</Button>
                  <Button variant="destructive" className="rounded-xl font-bold">Block</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-destructive/10 transition-colors text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase tracking-wider">Report {user.firstName}</span>
                </div>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle>Report this contact to Zenix?</DialogTitle>
                  <DialogDescription>The last 5 messages from this contact will be forwarded to Zenix. No one in this chat will be notified.</DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 px-1">
                  <Switch id="block-and-delete" />
                  <label htmlFor="block-and-delete" className="text-sm font-medium">Block contact and delete chat</label>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" className="rounded-xl font-bold">Cancel</Button>
                  <Button variant="destructive" className="rounded-xl font-bold">Report</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-destructive/10 transition-colors text-destructive">
                  <Trash2 className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase tracking-wider">Delete Chat</span>
                </div>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle>Delete this chat?</DialogTitle>
                  <DialogDescription>Are you sure you want to delete all messages in this chat? This action cannot be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" className="rounded-xl font-bold">Cancel</Button>
                  <Button variant="destructive" className="rounded-xl font-bold">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

import { format } from "date-fns";