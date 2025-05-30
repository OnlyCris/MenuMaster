import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, CreditCard } from "lucide-react";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ clientSecret }: { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Pagamento Fallito",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else if (paymentIntent?.status === "succeeded") {
      // Confirm payment on backend
      try {
        await apiRequest("POST", "/api/confirm-payment", {
          paymentIntentId: paymentIntent.id
        });
        
        toast({
          title: "Pagamento Completato!",
          description: "Benvenuto in MenuMaster! Ora puoi accedere a tutte le funzionalità.",
        });
        
        // Redirect to dashboard
        setLocation("/dashboard");
      } catch (confirmError) {
        console.error("Error confirming payment:", confirmError);
        toast({
          title: "Errore di Verifica",
          description: "Il pagamento è stato processato ma c'è stato un problema nella verifica. Contatta il supporto.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Elaborazione...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Paga €49.99
          </>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {});
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        if (error.message.includes("400")) {
          setError("Il pagamento non è richiesto per il tuo account.");
        } else {
          setError("Errore durante l'inizializzazione del pagamento. Riprova più tardi.");
        }
        toast({
          title: "Errore",
          description: "Impossibile inizializzare il pagamento.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Inizializzazione pagamento...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Tutto a Posto!</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = "/dashboard"} 
              className="w-full"
            >
              Vai al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive">Errore durante l'inizializzazione del pagamento.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Accesso a MenuMaster</CardTitle>
            <CardDescription>
              Pagamento una tantum per accedere a tutte le funzionalità della piattaforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing info */}
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Accesso completo alla piattaforma</span>
                <span className="text-2xl font-bold">€49.99</span>
              </div>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                <li>• Gestione ristoranti illimitati</li>
                <li>• Menu digitali personalizzabili</li>
                <li>• QR codes e analytics</li>
                <li>• Traduzione automatica</li>
                <li>• Supporto tecnico incluso</li>
              </ul>
            </div>

            {/* Stripe Payment Form */}
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} />
            </Elements>

            <p className="text-xs text-center text-muted-foreground">
              I tuoi dati di pagamento sono protetti e crittografati da Stripe.
              Il pagamento è sicuro al 100%.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}