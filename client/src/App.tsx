import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Dashboard from "@/pages/Dashboard";
import Restaurants from "@/pages/Restaurants";
import MenuEditor from "@/pages/MenuEditor";
import Templates from "@/pages/Templates";
import Allergens from "@/pages/Allergens";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import RestaurantView from "@/pages/RestaurantView";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/restaurants/:id/menu" component={MenuEditor} />
      <Route path="/templates" component={Templates} />
      <Route path="/allergens" component={Allergens} />
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
