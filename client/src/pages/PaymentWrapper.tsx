import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Payment from "./Payment";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

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

  // Check if Stripe is properly configured
  if (!stripePublicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle>Configurazione Pagamento Non Disponibile</CardTitle>
            <CardDescription>
              Il sistema di pagamento non è configurato correttamente. 
              Contatta l'amministratore per completare l'attivazione del servizio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Codice errore: STRIPE_CONFIG_MISSING
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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