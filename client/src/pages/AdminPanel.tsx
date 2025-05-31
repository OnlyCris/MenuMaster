import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { 
  Users, 
  CreditCard, 
  Settings, 
  Search, 
  Ban, 
  CheckCircle, 
  Mail, 
  Calendar,
  DollarSign,
  AlertTriangle,
  Eye,
  Trash2,
  Database,
  Server,
  Download,
  Upload
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  hasPaid: boolean;
  paymentDate?: string;
  createdAt: string;
}

interface PaymentStats {
  totalUsers: number;
  paidUsers: number;
  activeUsers: number;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Verify admin access
  if (!user?.isAdmin) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
        <Sidebar />
        <div className="flex-1 pl-64 overflow-y-auto">
          <Topbar title="Accesso Negato" showNewButton={false} />
          <div className="p-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Accesso Non Autorizzato
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Solo gli amministratori possono accedere a questa sezione.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Fetch users data
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch payment stats
  const { data: paymentStats, isLoading: statsLoading } = useQuery<PaymentStats>({
    queryKey: ["/api/admin/payment-stats"],
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-stats"] });
      toast({
        title: "Utente eliminato",
        description: "L'utente è stato rimosso dal sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'eliminazione",
        variant: "destructive",
      });
    },
  });

  // Update user payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ userId, hasPaid }: { userId: string; hasPaid: boolean }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}/payment`, { hasPaid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-stats"] });
      toast({
        title: "Stato pagamento aggiornato",
        description: "Lo stato del pagamento è stato modificato con successo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    },
  });

  // Send admin email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ to, subject, message }: { to: string; subject: string; message: string }) => {
      await apiRequest("POST", "/api/admin/send-email", { to, subject, message });
    },
    onSuccess: () => {
      toast({
        title: "Email inviata",
        description: "Il messaggio è stato inviato con successo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore invio email",
        description: error instanceof Error ? error.message : "Errore durante l'invio",
        variant: "destructive",
      });
    },
  });

  // Backup system mutations
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/backup");
      return response.blob();
    },
    onSuccess: (blob) => {
      // Download the backup file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `menuisland-backup-${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Backup creato",
        description: "Il backup è stato generato e scaricato con successo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore backup",
        description: error instanceof Error ? error.message : "Errore durante la creazione del backup",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      
      <div className="flex-1 pl-64 overflow-y-auto">
        <Topbar 
          title="Pannello Amministrativo" 
          showNewButton={false}
        />
        
        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : paymentStats?.totalUsers || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utenti Paganti</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {statsLoading ? "..." : paymentStats?.paidUsers || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ricavi Totali</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  €{statsLoading ? "..." : ((paymentStats?.paidUsers || 0) * 349).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Gestione Utenti</TabsTrigger>
              <TabsTrigger value="system">Sistema</TabsTrigger>
              <TabsTrigger value="maintenance">Manutenzione</TabsTrigger>
            </TabsList>

            {/* Users Management Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gestione Utenti</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cerca utenti..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="text-center py-8">Caricamento utenti...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utente</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Stato Pagamento</TableHead>
                          <TableHead>Ruolo</TableHead>
                          <TableHead>Registrato</TableHead>
                          <TableHead>Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="font-medium">
                                {u.firstName && u.lastName 
                                  ? `${u.firstName} ${u.lastName}` 
                                  : "Nome non impostato"
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{u.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={u.hasPaid}
                                  onCheckedChange={(checked) => 
                                    updatePaymentMutation.mutate({ userId: u.id, hasPaid: checked })
                                  }
                                  disabled={updatePaymentMutation.isPending}
                                />
                                {u.hasPaid ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Pagato
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <Ban className="h-3 w-3 mr-1" />
                                    Non Pagato
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {u.isAdmin ? (
                                <Badge variant="secondary">
                                  <Settings className="h-3 w-3 mr-1" />
                                  Admin
                                </Badge>
                              ) : (
                                <Badge variant="outline">Utente</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{formatDate(u.createdAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Invia Email a {u.email}</DialogTitle>
                                    </DialogHeader>
                                    <AdminEmailForm 
                                      userEmail={u.email}
                                      onSend={sendEmailMutation.mutate}
                                      isLoading={sendEmailMutation.isPending}
                                    />
                                  </DialogContent>
                                </Dialog>
                                
                                {!u.isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteUserMutation.mutate(u.id)}
                                    disabled={deleteUserMutation.isPending}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Management Tab */}
            <TabsContent value="system" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Gestione Database
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Crea backup del database e gestisci i dati del sistema.
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => createBackupMutation.mutate()}
                        disabled={createBackupMutation.isPending}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {createBackupMutation.isPending ? "Creando Backup..." : "Crea Backup"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Stato Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Modalità Manutenzione</span>
                      <Switch
                        checked={isMaintenanceMode}
                        onCheckedChange={setIsMaintenanceMode}
                      />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Quando attiva, solo gli admin possono accedere al sistema.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Manutenzione Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Funzionalità di manutenzione avanzata per la gestione del sistema MenuIsland.
                    </p>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                            Funzionalità in Sviluppo
                          </h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Le funzionalità di manutenzione avanzata saranno disponibili nella prossima versione.
                            Include: pulizia cache, ottimizzazione database, gestione log di sistema.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Admin Email Form Component
function AdminEmailForm({ 
  userEmail, 
  onSend, 
  isLoading 
}: { 
  userEmail: string; 
  onSend: (data: { to: string; subject: string; message: string }) => void; 
  isLoading: boolean;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim() && message.trim()) {
      onSend({ to: userEmail, subject, message });
      setSubject("");
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="subject">Oggetto</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Oggetto dell'email"
          required
        />
      </div>
      <div>
        <Label htmlFor="message">Messaggio</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Scrivi il tuo messaggio..."
          rows={4}
          required
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Invio..." : "Invia Email"}
      </Button>
    </form>
  );
}