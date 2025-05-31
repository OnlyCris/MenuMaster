import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentIntentId = urlParams.get('payment_intent');
      
      if (paymentIntentId) {
        const response = await apiRequest("POST", "/api/confirm-payment", {
          paymentIntentId,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get('payment_intent');
    const status = urlParams.get('redirect_status');

    if (paymentIntentId && status === 'succeeded' && !user?.hasPaid) {
      confirmPaymentMutation.mutate();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-700">Pagamento Completato!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              Il tuo account MenuMaster è ora attivo!
            </p>
            <p className="text-sm text-gray-500">
              Hai accesso completo a tutte le funzionalità del servizio.
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-green-800">Cosa puoi fare ora:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Creare il tuo primo ristorante</li>
              <li>• Personalizzare menu e template</li>
              <li>• Generare QR codes</li>
              <li>• Accedere alle analytics</li>
            </ul>
          </div>

          <Button 
            onClick={() => setLocation("/dashboard")} 
            className="w-full"
            size="lg"
          >
            Inizia a Usare MenuMaster
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-gray-400">
            Riceverai una conferma via email a breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}