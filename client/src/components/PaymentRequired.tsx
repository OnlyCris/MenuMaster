import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, Users, QrCode, Globe, BarChart } from "lucide-react";
import { useLocation } from "wouter";

export default function PaymentRequired() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">Benvenuto in MenuMaster</CardTitle>
          <CardDescription className="text-lg">
            Per accedere a tutte le funzionalità della piattaforma è richiesto un pagamento una tantum
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Users className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Gestione Ristoranti</h3>
                <p className="text-sm text-muted-foreground">Crea e gestisci ristoranti illimitati</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <QrCode className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">QR Codes</h3>
                <p className="text-sm text-muted-foreground">Genera codici QR personalizzati</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Globe className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Traduzione Automatica</h3>
                <p className="text-sm text-muted-foreground">Menu tradotti in 10+ lingue</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <BarChart className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">Statistiche dettagliate sui visitatori</p>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-primary/5 p-6 rounded-lg border-2 border-primary/20">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Accesso Completo</h3>
                <p className="text-muted-foreground">Pagamento una tantum - nessun abbonamento</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">€49.99</div>
                <div className="text-sm text-muted-foreground">Una volta sola</div>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Accesso completo a tutte le funzionalità</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Supporto tecnico incluso</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Aggiornamenti futuri gratuiti</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Nessun limite sui ristoranti</span>
              </div>
            </div>

            <Button 
              onClick={() => setLocation("/checkout")} 
              className="w-full" 
              size="lg"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Procedi al Pagamento
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Pagamento sicuro elaborato da Stripe. I tuoi dati sono protetti e crittografati.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}