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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Users, CreditCard, Settings, Search, Ban, CheckCircle, Mail, Calendar, DollarSign, AlertTriangle, Eye, Trash2, UserCheck, Database, Shield, Server, HardDrive, Activity, Globe } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  hasPaid: boolean;
  paymentDate?: string;
  createdAt: string;
  maxRestaurants: number;
}

interface PaymentStats {
  totalUsers: number;
  paidUsers: number;
  activeUsers: number;
}

interface SystemStats {
  totalRestaurants: number;
  totalMenuItems: number;
  totalVisits: number;
  totalQrScans: number;
  uptime: string;
  memoryUsage: number;
  diskUsage: number;
}

interface Restaurant {
  id: number;
  name: string;
  subdomain: string;
  ownerId: string;
  createdAt: string;
  ownerEmail: string;
}

export default function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Verify admin access
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna alla Dashboard
              </Link>
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Accesso Negato
            </h1>
          </div>
        </div>
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
    );
  }

  // Fetch data
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { data: paymentStats, isLoading: statsLoading } = useQuery<PaymentStats>({
    queryKey: ["/api/admin/payment-stats"],
    retry: false,
  });

  const { data: systemStats, isLoading: systemStatsLoading } = useQuery<SystemStats>({
    queryKey: ["/api/admin/system-stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/admin/restaurants"],
    retry: false,
  });

  // Mutations
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Utente eliminato con successo" });
      refetchUsers();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione dell'utente", variant: "destructive" });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}/toggle-admin`, { isAdmin });
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Stato admin aggiornato" });
      refetchUsers();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento", variant: "destructive" });
    },
  });

  const updateMaxRestaurantsMutation = useMutation({
    mutationFn: async ({ userId, maxRestaurants }: { userId: string; maxRestaurants: number }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}/max-restaurants`, { maxRestaurants });
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Limite ristoranti aggiornato" });
      refetchUsers();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento", variant: "destructive" });
    },
  });

  const forcePaymentMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/admin/users/${userId}/force-payment`);
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Pagamento forzato applicato" });
      refetchUsers();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'applicazione del pagamento", variant: "destructive" });
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("POST", "/api/admin/maintenance/toggle", { enabled });
    },
    onSuccess: (_, enabled) => {
      setIsMaintenanceMode(enabled);
      toast({ 
        title: "Successo", 
        description: `Modalità manutenzione ${enabled ? 'attivata' : 'disattivata'}` 
      });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nel toggle manutenzione", variant: "destructive" });
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/backup");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Successo", description: `Backup creato: ${data.filename}` });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione del backup", variant: "destructive" });
    },
  });

  // Filter users
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla Dashboard
            </Link>
          </Button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Pannello di Amministrazione
          </h1>
          <Badge variant="destructive" className="ml-auto">Admin</Badge>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <CardTitle className="text-sm font-medium">Utenti Paganti</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{paymentStats?.paidUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {paymentStats?.totalUsers ? ((paymentStats.paidUsers / paymentStats.totalUsers) * 100).toFixed(1) : 0}% conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ristoranti Attivi</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.totalRestaurants || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visite Totali</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.totalVisits || 0}</div>
              <p className="text-xs text-muted-foreground">
                {systemStats?.totalQrScans || 0} scansioni QR
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Utenti</TabsTrigger>
            <TabsTrigger value="restaurants">Ristoranti</TabsTrigger>
            <TabsTrigger value="support">Supporto</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gestione Utenti</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca utenti..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utente</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Ristoranti</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Registrazione</TableHead>
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
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {user.isAdmin && <Badge variant="destructive">Admin</Badge>}
                            <Badge variant={user.hasPaid ? "default" : "secondary"}>
                              {user.hasPaid ? "Pagato" : "Gratuito"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{restaurants.filter(r => r.ownerId === user.id).length}</span>
                            <span className="text-muted-foreground">/ {user.maxRestaurants}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.paymentDate ? (
                            <div className="text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 inline mr-1" />
                              {new Date(user.paymentDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <Badge variant="outline">Non pagato</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <UserActionsDropdown 
                              user={user}
                              onToggleAdmin={(isAdmin) => toggleAdminMutation.mutate({ userId: user.id, isAdmin })}
                              onUpdateMaxRestaurants={(maxRestaurants) => updateMaxRestaurantsMutation.mutate({ userId: user.id, maxRestaurants })}
                              onForcePayment={() => forcePaymentMutation.mutate(user.id)}
                              onDelete={() => deleteUserMutation.mutate(user.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Invia Email di Supporto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SupportEmailForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Template Email Predefiniti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Benvenuto nuovo utente
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Problemi tecnici risolti
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Aggiornamento servizio
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Promemoria pagamento
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Stato Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <Badge variant="outline">{systemStats?.uptime || "N/A"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Memoria:</span>
                    <Badge variant={systemStats?.memoryUsage && systemStats.memoryUsage > 80 ? "destructive" : "default"}>
                      {systemStats?.memoryUsage || 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Disco:</span>
                    <Badge variant={systemStats?.diskUsage && systemStats.diskUsage > 90 ? "destructive" : "default"}>
                      {systemStats?.diskUsage || 0}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Operazioni Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance">Modalità Manutenzione</Label>
                    <Switch
                      id="maintenance"
                      checked={isMaintenanceMode}
                      onCheckedChange={(checked) => maintenanceMutation.mutate(checked)}
                    />
                  </div>
                  <Button 
                    onClick={() => createBackupMutation.mutate()}
                    disabled={createBackupMutation.isPending}
                    className="w-full"
                  >
                    <HardDrive className="h-4 w-4 mr-2" />
                    {createBackupMutation.isPending ? "Creando..." : "Crea Backup Database"}
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Activity className="h-4 w-4 mr-2" />
                    Visualizza Log Sistema
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tabs remain similar but with enhanced functionality */}
        </Tabs>
      </div>
    </div>
  );
}

// Support Email Form Component
function SupportEmailForm() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const templates = {
    welcome: {
      subject: "Benvenuto in MenuIsland",
      message: "Ciao!\n\nBenvenuto nella famiglia MenuIsland. Siamo entusiasti di averti a bordo!\n\nSe hai domande o hai bisogno di assistenza, non esitare a contattarci.\n\nBuona giornata!\nTeam MenuIsland"
    },
    technical: {
      subject: "Risoluzione Problema Tecnico",
      message: "Ciao,\n\nAbbiamo risolto il problema tecnico che ci avevi segnalato. Il servizio dovrebbe ora funzionare correttamente.\n\nSe dovessi ancora riscontrare problemi, ti preghiamo di contattarci immediatamente.\n\nGrazie per la pazienza.\nSupporto Tecnico MenuIsland"
    },
    update: {
      subject: "Aggiornamento Servizio MenuIsland",
      message: "Ciao,\n\nVolevamo informarti che abbiamo rilasciato un importante aggiornamento della piattaforma MenuIsland.\n\nNuove funzionalità:\n- Miglioramenti alle performance\n- Nuovi template disponibili\n- Ottimizzazioni mobile\n\nNon è richiesta alcuna azione da parte tua.\n\nTeam MenuIsland"
    },
    payment: {
      subject: "Promemoria Pagamento - MenuIsland",
      message: "Ciao,\n\nTi ricordiamo che per continuare a utilizzare tutte le funzionalità di MenuIsland è necessario completare il pagamento.\n\nPuoi effettuare il pagamento direttamente dal tuo pannello di controllo.\n\nGrazie per la collaborazione.\nTeam MenuIsland"
    }
  };

  const handleTemplateChange = (templateKey: string) => {
    setTemplate(templateKey);
    if (templateKey && templates[templateKey as keyof typeof templates]) {
      const selectedTemplate = templates[templateKey as keyof typeof templates];
      setSubject(selectedTemplate.subject);
      setMessage(selectedTemplate.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/admin/send-email", {
        to: email,
        subject,
        message,
      });
      
      toast({ title: "Successo", description: "Email inviata con successo" });
      setEmail("");
      setSubject("");
      setMessage("");
      setTemplate("");
    } catch (error) {
      toast({ title: "Errore", description: "Errore nell'invio dell'email", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="template">Template Predefinito</Label>
        <Select value={template} onValueChange={handleTemplateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Seleziona template..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="welcome">Benvenuto</SelectItem>
            <SelectItem value="technical">Problema Tecnico Risolto</SelectItem>
            <SelectItem value="update">Aggiornamento Servizio</SelectItem>
            <SelectItem value="payment">Promemoria Pagamento</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="email">Email Destinatario</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="subject">Oggetto</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="message">Messaggio</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          required
        />
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Invio..." : "Invia Email di Supporto"}
      </Button>
    </form>
  );
}

// User Actions Dropdown Component
function UserActionsDropdown({ 
  user, 
  onToggleAdmin, 
  onUpdateMaxRestaurants, 
  onForcePayment, 
  onDelete 
}: {
  user: User;
  onToggleAdmin: (isAdmin: boolean) => void;
  onUpdateMaxRestaurants: (max: number) => void;
  onForcePayment: () => void;
  onDelete: () => void;
}) {
  const [maxRestaurants, setMaxRestaurants] = useState(user.maxRestaurants.toString());

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestisci Utente: {user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Status Amministratore</Label>
            <Switch
              checked={user.isAdmin}
              onCheckedChange={onToggleAdmin}
            />
          </div>
          
          <div>
            <Label htmlFor="maxRestaurants">Limite Ristoranti</Label>
            <div className="flex space-x-2">
              <Input
                id="maxRestaurants"
                type="number"
                value={maxRestaurants}
                onChange={(e) => setMaxRestaurants(e.target.value)}
                min="1"
                max="50"
              />
              <Button 
                onClick={() => onUpdateMaxRestaurants(parseInt(maxRestaurants))}
                size="sm"
              >
                Aggiorna
              </Button>
            </div>
          </div>
          
          {!user.hasPaid && (
            <Button onClick={onForcePayment} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Forza Pagamento
            </Button>
          )}
          
          <Button onClick={onDelete} variant="destructive" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Elimina Utente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}