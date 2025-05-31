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
  Trash2
} from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Accesso Negato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Non hai i permessi per accedere a questa sezione.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Fetch payment statistics
  const { data: paymentStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/payment-stats"],
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle payment status
  const togglePaymentMutation = useMutation({
    mutationFn: async ({ userId, hasPaid }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/payment`, {
        hasPaid,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-stats"] });
      toast({
        title: "Stato Pagamento Aggiornato",
        description: "Lo stato del pagamento è stato modificato con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato del pagamento.",
        variant: "destructive",
      });
    },
  });

  // Send email to user
  const sendEmailMutation = useMutation({
    mutationFn: async ({ userId, subject, message }) => {
      const response = await apiRequest("POST", `/api/admin/send-email`, {
        userId,
        subject,
        message,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Inviata",
        description: "L'email è stata inviata con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile inviare l'email.",
        variant: "destructive",
      });
    },
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Utente Eliminato",
        description: "L'utente è stato eliminato con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'utente.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pannello Amministratore</h1>
            <p className="text-gray-600">Gestione utenti e sistema MenuMaster</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Admin Dashboard
          </Badge>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats?.totalUsers || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamenti Completati</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{paymentStats?.paidUsers || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entrate Totali</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{((paymentStats?.paidUsers || 0) * 349).toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utenti Attivi</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats?.activeUsers || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Gestione Utenti</TabsTrigger>
            <TabsTrigger value="payments">Pagamenti</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            {/* Search and filters */}
            <Card>
              <CardHeader>
                <CardTitle>Ricerca Utenti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cerca per email, nome o cognome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Users table */}
            <Card>
              <CardHeader>
                <CardTitle>Utenti Registrati ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Stato Pagamento</TableHead>
                      <TableHead>Data Registrazione</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.isAdmin && (
                              <Badge variant="outline" className="text-xs">Admin</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.hasPaid ? "default" : "secondary"}>
                              {user.hasPaid ? "Pagato" : "Non Pagato"}
                            </Badge>
                            <Switch
                              checked={user.hasPaid}
                              onCheckedChange={(checked) => 
                                togglePaymentMutation.mutate({ 
                                  userId: user.id, 
                                  hasPaid: checked 
                                })
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Dettagli Utente</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Nome Completo</Label>
                                    <p>{user.firstName} {user.lastName}</p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p>{user.email}</p>
                                  </div>
                                  <div>
                                    <Label>Data Registrazione</Label>
                                    <p>{new Date(user.createdAt).toLocaleString()}</p>
                                  </div>
                                  {user.paymentDate && (
                                    <div>
                                      <Label>Data Pagamento</Label>
                                      <p>{new Date(user.paymentDate).toLocaleString()}</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Invia Email</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.target);
                                  sendEmailMutation.mutate({
                                    userId: user.id,
                                    subject: formData.get('subject'),
                                    message: formData.get('message'),
                                  });
                                }}>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="subject">Oggetto</Label>
                                      <Input name="subject" required />
                                    </div>
                                    <div>
                                      <Label htmlFor="message">Messaggio</Label>
                                      <Textarea name="message" rows={4} required />
                                    </div>
                                    <Button type="submit" disabled={sendEmailMutation.isPending}>
                                      {sendEmailMutation.isPending ? "Invio..." : "Invia Email"}
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questo utente?")) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistiche Pagamenti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tasso di Conversione</Label>
                    <p className="text-2xl font-bold">
                      {paymentStats ? Math.round((paymentStats.paidUsers / paymentStats.totalUsers) * 100) : 0}%
                    </p>
                  </div>
                  <div>
                    <Label>Entrate Medie per Utente</Label>
                    <p className="text-2xl font-bold">
                      €{paymentStats ? Math.round((paymentStats.paidUsers * 349) / paymentStats.totalUsers) : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Impostazioni Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Manutenzione Sistema</Label>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Gestisci
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Backup Database</Label>
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Pianifica
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}