import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface PaymentRedirectProps {
  children: React.ReactNode;
}

export function PaymentRedirect({ children }: PaymentRedirectProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user && !user.isAdmin && !user.hasPaid) {
      // Redirect non-paying users directly to payment
      setLocation("/payment");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Show payment redirect for non-paying users (except admins)
  if (user && !user.isAdmin && !user.hasPaid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Reindirizzamento al pagamento...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}