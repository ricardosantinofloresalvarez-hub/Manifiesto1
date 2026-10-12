import { useEffect, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import FoundLuggage from "@/pages/FoundLuggage";
import RecoveryLabelPage from "@/pages/RecoveryLabelPage";
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
import { getSeoMetadata } from "@shared/seo";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function RouteSeo() {
  const [location] = useLocation();
  const lastPageView = useRef<string | null>(null);

  useEffect(() => {
    const pathname = location.split("?")[0] || "/";
    const seo = getSeoMetadata(pathname);
    const setContent = (id: string, content: string) => {
      document.getElementById(id)?.setAttribute("content", content);
    };

    document.title = seo.title;
    setContent("seo-description", seo.description);
    setContent("seo-robots", seo.robots);
    setContent("seo-og-title", seo.title);
    setContent("seo-og-description", seo.description);
    setContent("seo-og-url", seo.canonical || "https://manifiesto.app/");
    setContent("seo-twitter-title", seo.title);
    setContent("seo-twitter-description", seo.description);

    let canonical = document.getElementById("seo-canonical") as HTMLLinkElement | null;
    if (seo.canonical) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.id = "seo-canonical";
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = seo.canonical;
    } else {
      canonical?.remove();
    }

    document.getElementById("seo-jsonld")?.remove();
    if (seo.jsonLd) {
      const jsonLd = document.createElement("script");
      jsonLd.id = "seo-jsonld";
      jsonLd.type = "application/ld+json";
      jsonLd.textContent = JSON.stringify(seo.jsonLd);
      document.head.appendChild(jsonLd);
    }

    if (lastPageView.current !== pathname) {
      lastPageView.current = pathname;
      window.gtag?.("event", "page_view", {
        page_path: pathname,
        page_title: seo.title,
        page_location: `${window.location.origin}${pathname}`,
      });
    }
  }, [location]);

  return null;
}

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
      <Route path="/label/:token" component={RecoveryLabelPage} />
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
              <RouteSeo />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;