import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Payment from "./Payment";
import { Loader2 } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function PaymentWrapper() {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState("");

  const { data: paymentIntent, isLoading } = useQuery({
    queryKey: ["/api/create-payment-intent"],
    queryFn: async () => {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 349 }),
      });
      return response.json();
    },
    enabled: !!user && !user.hasPaid,
  });

  useEffect(() => {
    if (paymentIntent?.clientSecret) {
      setClientSecret(paymentIntent.clientSecret);
    }
  }, [paymentIntent]);

  if (isLoading || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Preparazione pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <Payment />
    </Elements>
  );
}