import { Switch, Route } from "wouter";
import FoundLuggage from "@/pages/FoundLuggage";
import AuthCallback from "@/pages/AuthCallback";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '@/lib/auth';
import i18n from './lib/i18n';
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/Welcome";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import TripDetail from "@/pages/TripDetail";
import Manifests from "@/pages/Manifests";
import Verify from "@/pages/Verify";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Plans from "@/pages/Plans";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/trip/:id" component={TripDetail} />
      <Route path="/manifests" component={Manifests} />
      <Route path="/verify" component={Verify} />
      <Route path="/found/:token" component={FoundLuggage} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route path="/planes" component={Plans} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;