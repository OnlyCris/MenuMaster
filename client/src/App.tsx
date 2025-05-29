import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Dashboard from "@/pages/Dashboard";
import Restaurants from "@/pages/Restaurants";
import MenuEditor from "@/pages/MenuEditor";
import Templates from "@/pages/Templates";
import Allergens from "@/pages/Allergens";
import Settings from "@/pages/Settings";
import ClientInvitations from "@/pages/ClientInvitations";
import ClientRegistration from "@/pages/ClientRegistration";
import InviteAccept from "@/pages/InviteAccept";
import NotFound from "@/pages/not-found";
import RestaurantView from "@/pages/RestaurantView";
import RestaurantMenu from "@/pages/RestaurantMenu";

function Router() {
  const [location] = useLocation();
  const [isSubdomain, setIsSubdomain] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Check if we're on a restaurant subdomain
    const host = window.location.hostname;
    setIsSubdomain(host.includes(".menuisland.it") && !host.startsWith("www."));
  }, []);

  // If we're on a subdomain, show the restaurant menu
  if (isSubdomain) {
    return <RestaurantMenu />;
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/invite', '/accept-invite', '/view'];
  const isPublicRoute = publicRoutes.some(route => location.startsWith(route));

  if (isPublicRoute) {
    return (
      <Switch>
        <Route path="/invite" component={ClientRegistration} />
        <Route path="/accept-invite" component={InviteAccept} />
        <Route path="/view/:subdomain" component={RestaurantView} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Protected routes - require authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Show login page or redirect to login
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">MenuMaster</h1>
          <p className="text-gray-600 mb-6">Accedi per gestire i tuoi menu</p>
          <a
            href="/api/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Accedi
          </a>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/restaurants/:id/menu" component={MenuEditor} />
      <Route path="/templates" component={Templates} />
      <Route path="/allergens" component={Allergens} />
      <Route path="/clients" component={ClientInvitations} />
      <Route path="/settings" component={Settings} />
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
