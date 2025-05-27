import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClientInvitation, InsertClientInvitation } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Mail, Trash2, Copy, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

const invitationSchema = z.object({
  email: z.string().email("Email non valida"),
  restaurantName: z.string().min(1, "Nome ristorante obbligatorio"),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

export default function ClientInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch invitations
  const { data: invitations = [], isLoading, refetch } = useQuery<ClientInvitation[]>({
    queryKey: ["/api/client-invitations"],
  });

  // Form
  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      restaurantName: "",
    },
  });

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: async (data: InsertClientInvitation) => {
      return await apiRequest("POST", "/api/client-invitations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-invitations"] });
      form.reset();
      setIsDialogOpen(false);
      toast({
        title: "Invito creato!",
        description: "L'invito è stato generato con successo. Puoi ora inviarlo al tuo cliente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  // Delete invitation mutation
  const deleteInvitationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/client-invitations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-invitations"] });
      toast({
        title: "Invito eliminato",
        description: "L'invito è stato eliminato con successo",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: InvitationFormData) => {
    await createInvitationMutation.mutate(data as InsertClientInvitation);
  };

  const copyInviteLink = (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}/invite?code=${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link copiato!",
      description: `Link copiato: ${inviteUrl}`,
    });
  };

  const getStatusBadge = (status: string, expiresAt: Date | string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired) {
      return <Badge variant="destructive">Scaduto</Badge>;
    }
    
    switch (status) {
      case "pending":
        return <Badge variant="secondary">In attesa</Badge>;
      case "accepted":
        return <Badge variant="default">Accettato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      
      <div className="flex-1 pl-64 overflow-y-auto">
        <Topbar 
          title="Gestione Clienti" 
          showNewButton={false}
        />
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inviti Clienti</h1>
              <p className="text-gray-500 dark:text-gray-400">Gestisci gli inviti per i tuoi clienti ristoratori</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Invito
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crea Nuovo Invito Cliente</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Cliente</FormLabel>
                          <FormControl>
                            <Input placeholder="cliente@esempio.it" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="restaurantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Ristorante</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome del ristorante" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Annulla
                      </Button>
                      <Button type="submit" disabled={createInvitationMutation.isPending}>
                        {createInvitationMutation.isPending ? "Creazione..." : "Crea Invito"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista Inviti</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Caricamento inviti...</div>
              ) : !invitations || invitations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nessun invito creato ancora. Inizia creando il primo invito per un cliente!
                  <div className="mt-2 text-sm">
                    <button onClick={() => refetch()} className="text-blue-600 hover:underline">
                      Ricarica lista
                    </button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Ristorante</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Creato</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{invitation.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{invitation.restaurantName}</TableCell>
                        <TableCell>{getStatusBadge(invitation.status, invitation.expiresAt)}</TableCell>
                        <TableCell>{formatDate(invitation.createdAt!)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(invitation.expiresAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyInviteLink(invitation.inviteCode)}
                              className="text-primary hover:text-accent"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminare l'invito?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questa azione eliminerà definitivamente l'invito per {invitation.email}.
                                    Il link non sarà più valido.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Come funziona</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none dark:prose-invert">
              <ol className="list-decimal list-inside space-y-2">
                <li>Crea un nuovo invito inserendo l'email del cliente e il nome del ristorante</li>
                <li>Copia il link di invito generato automaticamente</li>
                <li>Invia il link al tuo cliente via email o WhatsApp</li>
                <li>Il cliente userà il link per registrarsi e accedere al suo ristorante</li>
                <li>Una volta registrato, potrà gestire autonomamente il suo menu digitale</li>
              </ol>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">💡 Suggerimento</h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Gli inviti scadono dopo 30 giorni. I clienti potranno accedere al loro menu su 
                  <strong> nomeristorante.menuisland.it</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}