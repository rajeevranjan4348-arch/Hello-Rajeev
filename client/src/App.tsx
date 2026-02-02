import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationManager } from "@/components/NotificationManager";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Call from "@/pages/Call";
import CallsList from "@/pages/CallsList";
import People from "@/pages/People";
import Settings from "@/pages/Settings";
import PersonalInfo from "@/pages/PersonalInfo";
import PrivacySecurity from "@/pages/PrivacySecurity";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsOfService from "@/pages/legal/TermsOfService";
import { Briefcase } from "lucide-react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/call/:id" component={Call} />
      <Route path="/calls" component={CallsList} />
      <Route path="/people" component={People} />
      <Route path="/settings" component={Settings} />
      <Route path="/settings/personal" component={PersonalInfo} />
      <Route path="/settings/privacy" component={PrivacySecurity} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/work">
        <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <Briefcase className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold">Work Mode</h1>
          <p className="text-muted-foreground max-w-sm">
            Focus on your professional collaborations. This area is specifically for work-related chats and tasks.
          </p>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <NotificationManager />
          <div className="flex h-screen w-full overflow-hidden">
            <div className="hidden md:block border-r">
              <AppSidebar />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <header className="md:hidden flex items-center p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <SidebarTrigger />
                <span className="ml-4 font-display font-bold text-xl">SwiftChat</span>
              </header>
              <main className="flex-1 overflow-auto relative">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
