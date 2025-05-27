import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function ClientRegistration() {
  const [location] = useLocation();
  const [status, setStatus] = useState<'loading' | 'valid' | 'expired' | 'used'>('loading');
  
  // Extract invitation code from URL
  const params = new URLSearchParams(location.split('?')[1] || '');
  const inviteCode = params.get('code');

  const { data: invitation, isLoading } = useQuery({
    queryKey: [`/api/client-invitations/verify/${inviteCode}`],
    enabled: !!inviteCode,
  });

  useEffect(() => {
    if (!isLoading && invitation) {
      if (invitation.usedAt) {
        setStatus('used');
      } else if (new Date(invitation.expiresAt) < new Date()) {
        setStatus('expired');
      } else {
        setStatus('valid');
      }
    }
  }, [invitation, isLoading]);

  const handleAcceptInvitation = async () => {
    try {
      const response = await fetch(`/api/client-invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });

      if (response.ok) {
        // Redirect to Replit Auth login
        window.location.href = '/api/login';
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  if (!inviteCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Link Non Valido</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Il link di invito non è valido o è malformato.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifica invito in corso...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Invito MenuMaster
          </CardTitle>
          {invitation && (
            <CardDescription className="text-lg">
              Gestisci il menu di <span className="font-semibold">{invitation.restaurantName}</span>
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'valid' && (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Sei stato invitato a gestire il menu del ristorante <strong>{invitation?.restaurantName}</strong>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Clicca il pulsante qui sotto per accedere al sistema di gestione menu.
                  Potrai modificare menu, aggiungere piatti e gestire allergeni.
                </p>
                
                <Button 
                  onClick={handleAcceptInvitation}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Accedi al Sistema
                </Button>
              </div>
            </>
          )}

          {status === 'expired' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Questo invito è scaduto. Contatta chi ti ha inviato l'invito per riceverne uno nuovo.
              </AlertDescription>
            </Alert>
          )}

          {status === 'used' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Questo invito è già stato utilizzato. Se hai problemi di accesso, contatta il supporto.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}