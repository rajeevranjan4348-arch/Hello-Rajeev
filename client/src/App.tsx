import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Call from "@/pages/Call";
import CallsList from "@/pages/CallsList";
import People from "@/pages/People";
import Settings from "@/pages/Settings";
import PersonalInfo from "@/pages/PersonalInfo";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsOfService from "@/pages/legal/TermsOfService";

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
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
