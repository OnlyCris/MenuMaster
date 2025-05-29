import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function InviteAccept() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'processing' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // Extract invitation code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('code');

  const { data: invitation, isLoading: invitationLoading } = useQuery({
    queryKey: [`/api/client-invitations/verify/${inviteCode}`],
    enabled: !!inviteCode,
  });

  const acceptMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest('POST', `/api/client-invitations/accept`, { inviteCode: code });
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

    if (authLoading || invitationLoading) {
      return;
    }

    if (!isAuthenticated) {
      // Redirect to login with return URL
      window.location.href = `/api/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
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

      // Auto-accept the invitation
      setStatus('processing');
      acceptMutation.mutate(inviteCode);
    }
  }, [isAuthenticated, authLoading, invitationLoading, invitation, inviteCode]);

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

  if (authLoading || invitationLoading) {
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