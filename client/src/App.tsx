import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import TripDetail from "@/pages/TripDetail";
import Verify from "@/pages/Verify"; // Nombre exacto de tu archivo
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/trip/:id" component={TripDetail} />
      {/* Ajustamos la ruta para que Verify pueda leer el hash de la URL */}
      <Route path="/verify" component={Verify} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}