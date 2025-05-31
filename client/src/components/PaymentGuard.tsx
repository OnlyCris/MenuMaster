import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock } from "lucide-react";

interface PaymentGuardProps {
  children: React.ReactNode;
  feature?: string;
}

export function PaymentGuard({ children, feature = "questa funzionalità" }: PaymentGuardProps) {
  const { user } = useAuth();

  if (!user?.hasPaid && !user?.isAdmin) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-orange-100 dark:bg-orange-900 w-fit">
              <Lock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-orange-700 dark:text-orange-400">
              Accesso Limitato
            </CardTitle>
            <CardDescription>
              Per utilizzare {feature}, devi attivare il servizio MenuMaster
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Il servizio MenuMaster richiede un pagamento unico di <strong>€349</strong> per accedere a tutte le funzionalità della piattaforma.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Con l'attivazione ottieni:</h4>
              <ul className="text-sm text-left space-y-1 max-w-sm mx-auto">
                <li>• Creazione ristoranti illimitati</li>
                <li>• Template personalizzabili</li>
                <li>• Menu tradotti automaticamente</li>
                <li>• QR code e analytics</li>
                <li>• Gestione allergeni avanzata</li>
                <li>• Supporto prioritario</li>
              </ul>
            </div>
            <Button asChild size="lg" className="w-full">
              <a href="/payment" className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Attiva Servizio - €349
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}