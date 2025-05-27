import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

// Pages
import Dashboard from "@/pages/Dashboard";
import Restaurants from "@/pages/Restaurants";
import MenuEditor from "@/pages/MenuEditor";
import Templates from "@/pages/Templates";
import Allergens from "@/pages/Allergens";
import Settings from "@/pages/Settings";
import ClientInvitations from "@/pages/ClientInvitations";
import NotFound from "@/pages/not-found";
import RestaurantView from "@/pages/RestaurantView";
import RestaurantMenu from "@/pages/RestaurantMenu";

function Router() {
  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    // Check if we're on a restaurant subdomain
    const host = window.location.hostname;
    setIsSubdomain(host.includes(".menuisland.it") && !host.startsWith("www."));
  }, []);

  // If we're on a subdomain, show the restaurant menu
  if (isSubdomain) {
    return <RestaurantMenu />;
  }

  // Otherwise show the admin dashboard
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/restaurants/:id/menu" component={MenuEditor} />
      <Route path="/templates" component={Templates} />
      <Route path="/allergens" component={Allergens} />
      <Route path="/clients" component={ClientInvitations} />
      <Route path="/settings" component={Settings} />
      <Route path="/view/:subdomain" component={RestaurantView} />
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
