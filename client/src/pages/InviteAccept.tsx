import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function InviteAccept() {
  const [location] = useLocation();
  const [status, setStatus] = useState<'loading' | 'form' | 'processing' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');

  // Extract invitation code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('code');

  const { data: invitation, isLoading: invitationLoading } = useQuery({
    queryKey: [`/api/client-invitations/verify/${inviteCode}`],
    enabled: !!inviteCode,
  });

  const acceptMutation = useMutation({
    mutationFn: async (data: { inviteCode: string; userEmail: string; password: string }) => {
      return await apiRequest('POST', `/api/client-invitations/accept`, data);
    },
    onSuccess: () => {
      setStatus('success');
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
    },
    onError: (error: any) => {
      setStatus('error');
      setErrorMessage(error.message || 'Errore durante l\'accettazione dell\'invito');
    },
  });

  useEffect(() => {
    if (!inviteCode) {
      setStatus('error');
      setErrorMessage('Codice invito mancante');
      return;
    }

    if (invitationLoading) {
      return;
    }

    if (invitation) {
      if (invitation.usedAt) {
        setStatus('error');
        setErrorMessage('Questo invito è già stato utilizzato');
        return;
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        setStatus('error');
        setErrorMessage('Questo invito è scaduto');
        return;
      }

      // Show form to collect user email
      setStatus('form');
    }
  }, [invitationLoading, invitation, inviteCode]);

  const handleAcceptInvitation = () => {
    if (!userEmail) {
      setErrorMessage('Email richiesta');
      return;
    }
    
    if (!password) {
      setErrorMessage('Password richiesta');
      return;
    }

    setStatus('processing');
    setErrorMessage('');
    acceptMutation.mutate({ inviteCode: inviteCode!, userEmail, password });
  };

  if (!inviteCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-700">Link Non Valido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Il link di invito non è valido o è malformato.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-center text-gray-600">Caricamento...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'form' && invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-blue-700">Completa Registrazione</CardTitle>
            <CardDescription>
              Gestisci il menu di {invitation.restaurantName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">La tua email</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="inserisci@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Crea una password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {errorMessage && (
              <p className="text-red-600 text-sm">{errorMessage}</p>
            )}
            <Button 
              onClick={handleAcceptInvitation}
              className="w-full"
              disabled={!userEmail || !password}
            >
              Accedi al Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-center text-gray-600">
                Sto configurando il tuo ristorante...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-green-700">Invito Accettato!</CardTitle>
            <CardDescription>
              Il tuo ristorante è stato configurato con successo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Ora puoi accedere al pannello di gestione per personalizzare il tuo menu.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Vai al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-700">Errore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              {errorMessage}
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Torna alla Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}