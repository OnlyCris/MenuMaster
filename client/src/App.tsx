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
import Analytics from "@/pages/Analytics";
import RestaurantAnalytics from "@/pages/RestaurantAnalytics";
import Templates from "@/pages/Templates";
import Allergens from "@/pages/Allergens";
import Settings from "@/pages/Settings";
import ClientInvitations from "@/pages/ClientInvitations";
import ClientRegistration from "@/pages/ClientRegistration";
import InviteAccept from "@/pages/InviteAccept";
import NotFound from "@/pages/not-found";
import RestaurantView from "@/pages/RestaurantView";
import RestaurantMenu from "@/pages/RestaurantMenu";
import Login from "@/pages/Login";
import PaymentWrapper from "@/pages/PaymentWrapper";
import PaymentSuccess from "@/pages/PaymentSuccess";
import AdminPanel from "@/pages/AdminPanelNew";

function Router() {
  const [location, setLocation] = useLocation();
  const [isSubdomain, setIsSubdomain] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect non-paying users to payment immediately after authentication
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.isAdmin && !user.hasPaid) {
      // Don't redirect if already on payment pages
      if (!location.startsWith('/payment') && !location.startsWith('/invite')) {
        setLocation('/payment');
      }
    }
  }, [user, isAuthenticated, isLoading, location, setLocation]);

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
    return <Login />;
  }

  // Redirect non-paying users to payment page (except admin)
  if (user && !user.hasPaid && !user.isAdmin && location !== "/payment" && location !== "/payment-success" && location !== "/settings") {
    return <PaymentWrapper />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/payment" component={PaymentWrapper} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/restaurants/:id/menu" component={MenuEditor} />
      <Route path="/restaurants/:id/analytics" component={RestaurantAnalytics} />
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
