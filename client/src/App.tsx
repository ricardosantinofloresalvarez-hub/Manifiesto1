import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/Welcome";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import TripDetail from "@/pages/TripDetail";
import Verify from "@/pages/Verify";
import Profile from "@/pages/Profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/auth" component={Auth} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/trip/:id" component={TripDetail} />
      <Route path="/manifests" component={Dashboard} />
      <Route path="/verify" component={Verify} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
