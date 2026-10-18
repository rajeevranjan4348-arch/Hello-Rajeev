import { Switch, Route, useLocation, Redirect } from "wouter";
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
import LinkedDevices from "@/pages/LinkedDevices";
import StarredMessages from "@/pages/StarredMessages";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsOfService from "@/pages/legal/TermsOfService";
import Login from "@/pages/Login";
import logoImg from "@/assets/logo.png";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src={logoImg} alt="Zenix" className="w-16 h-16 rounded-2xl shadow-xl animate-pulse" />
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user && location !== "/login") {
    return <Redirect to="/login" />;
  }

  if (user && location === "/login") {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <NotificationManager />
      <div className="flex h-screen w-full overflow-hidden">
        <div className="hidden md:block border-r">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden flex items-center p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger />
            <div className="ml-4 flex items-center gap-2">
              <img src={logoImg} alt="Zenix Logo" className="w-8 h-8 rounded-lg" />
              <span className="font-display font-bold text-xl">Zenix</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto relative">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const [location] = useLocation();

  if (location === "/login") {
    return (
      <Switch>
        <Route path="/login" component={Login} />
      </Switch>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/chat/:id" component={Chat} />
        <Route path="/call/:id" component={Call} />
        <Route path="/calls" component={CallsList} />
        <Route path="/people" component={People} />
        <Route path="/settings" component={Settings} />
        <Route path="/settings/personal" component={PersonalInfo} />
        <Route path="/settings/privacy" component={PrivacySecurity} />
        <Route path="/devices" component={LinkedDevices} />
        <Route path="/starred" component={StarredMessages} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthGuard>
          <Router />
        </AuthGuard>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
