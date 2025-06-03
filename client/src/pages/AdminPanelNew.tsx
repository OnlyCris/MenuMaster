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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Users, CreditCard, Settings, Search, Ban, CheckCircle, Mail, Calendar, DollarSign, AlertTriangle, Eye, Trash2, UserCheck, Database, Shield, Server, HardDrive, Activity, Globe, MoreVertical } from "lucide-react";

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

interface EmailTemplate {
  id: number;
  type: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Check if user is admin
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accesso Negato</h1>
          <p className="text-gray-600 mb-4">Non hai i permessi per accedere a questa sezione.</p>
          <Button asChild>
            <Link href="/">Torna alla Dashboard</Link>
          </Button>
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

  const { data: emailTemplates = [], isLoading: emailTemplatesLoading, refetch: refetchEmailTemplates } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
    retry: false,
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Utente eliminato con successo",
      });
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-stats"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione dell'utente",
        variant: "destructive",
      });
    },
  });

  // Toggle user payment status
  const togglePaymentMutation = useMutation({
    mutationFn: async ({ userId, hasPaid }: { userId: string; hasPaid: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/payment`, {
        hasPaid,
        paymentDate: hasPaid ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Stato pagamento aggiornato",
      });
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-stats"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dello stato pagamento",
        variant: "destructive",
      });
    },
  });

  // Toggle admin status
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/toggle-admin`, { isAdmin });
      return response.json();
    },
    onSuccess: () => {
      refetchUsers();
      toast({
        title: "Successo",
        description: "Stato amministratore aggiornato",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update max restaurants
  const updateMaxRestaurantsMutation = useMutation({
    mutationFn: async ({ userId, maxRestaurants }: { userId: string; maxRestaurants: number }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/max-restaurants`, { maxRestaurants });
      return response.json();
    },
    onSuccess: () => {
      refetchUsers();
      toast({
        title: "Successo",
        description: "Limite ristoranti aggiornato",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Email template mutations
  const createEmailTemplateMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const response = await apiRequest("POST", "/api/admin/email-templates", template);
      return response.json();
    },
    onSuccess: () => {
      refetchEmailTemplates();
      toast({
        title: "Successo",
        description: "Template email creato",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEmailTemplateMutation = useMutation({
    mutationFn: async ({ id, template }: { id: number; template: Partial<EmailTemplate> }) => {
      const response = await apiRequest("PUT", `/api/admin/email-templates/${id}`, template);
      return response.json();
    },
    onSuccess: () => {
      refetchEmailTemplates();
      toast({
        title: "Successo",
        description: "Template email aggiornato",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEmailTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/email-templates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      refetchEmailTemplates();
      toast({
        title: "Successo",
        description: "Template email eliminato",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Header with back navigation */}
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
            Pannello Amministrativo
          </h1>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ristoranti Attivi</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemStatsLoading ? "..." : systemStats?.totalRestaurants || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Monitoring */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-medium">
                  {systemStatsLoading ? "..." : systemStats?.uptime || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Memoria</span>
                <span className="text-sm font-medium">
                  {systemStatsLoading ? "..." : `${systemStats?.memoryUsage || 0}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Disco</span>
                <span className="text-sm font-medium">
                  {systemStatsLoading ? "..." : `${systemStats?.diskUsage || 0}%`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Menu Items</span>
                <span className="text-sm font-medium">
                  {systemStatsLoading ? "..." : systemStats?.totalMenuItems || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Visite Totali</span>
                <span className="text-sm font-medium">
                  {systemStatsLoading ? "..." : systemStats?.totalVisits?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Scansioni QR</span>
                <span className="text-sm font-medium">
                  {systemStatsLoading ? "..." : systemStats?.totalQrScans?.toLocaleString() || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Manutenzione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Modalità Manutenzione</span>
                <Switch
                  checked={isMaintenanceMode}
                  onCheckedChange={setIsMaintenanceMode}
                />
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <HardDrive className="h-4 w-4 mr-2" />
                Backup Database
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Verifica Sicurezza
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Gestione Utenti</TabsTrigger>
            <TabsTrigger value="restaurants">Ristoranti</TabsTrigger>
            <TabsTrigger value="emails">Template Email</TabsTrigger>
            <TabsTrigger value="support">Supporto Tecnico</TabsTrigger>
            <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-6">
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
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Ristoranti</TableHead>
                      <TableHead>Data Registrazione</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Caricamento utenti...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Nessun utente trovato
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            {user.firstName || user.lastName 
                              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                              : "Non specificato"
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {user.isAdmin && (
                                <Badge variant="destructive">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                              <Badge variant={user.hasPaid ? "default" : "secondary"}>
                                {user.hasPaid ? "Attivo" : "Non pagato"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.hasPaid ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">
                                  {user.paymentDate ? formatDate(user.paymentDate) : "Confermato"}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center text-red-600">
                                <Ban className="h-4 w-4 mr-1" />
                                <span className="text-sm">Non pagato</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {user.maxRestaurants || 1}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell>
                            <UserActionsDropdown 
                              user={user}
                              togglePaymentMutation={togglePaymentMutation}
                              toggleAdminMutation={toggleAdminMutation}
                              updateMaxRestaurantsMutation={updateMaxRestaurantsMutation}
                              deleteUserMutation={deleteUserMutation}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gestione Template Email</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Mail className="h-4 w-4 mr-2" />
                        Nuovo Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Crea Nuovo Template Email</DialogTitle>
                      </DialogHeader>
                      <EmailTemplateForm 
                        onSubmit={(template: any) => createEmailTemplateMutation.mutate(template)}
                        isLoading={createEmailTemplateMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Oggetto</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Data Creazione</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailTemplatesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Caricamento template...
                        </TableCell>
                      </TableRow>
                    ) : emailTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Nessun template trovato
                        </TableCell>
                      </TableRow>
                    ) : (
                      emailTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {template.type === 'support' && 'Supporto'}
                              {template.type === 'welcome' && 'Benvenuto'}
                              {template.type === 'invitation' && 'Invito'}
                              {template.type === 'payment_confirmation' && 'Conferma Pagamento'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                          <TableCell>
                            <Badge variant={template.isActive ? "default" : "secondary"}>
                              {template.isActive ? "Attivo" : "Inattivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(template.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>Modifica Template: {template.name}</DialogTitle>
                                  </DialogHeader>
                                  <EmailTemplateForm 
                                    template={template}
                                    onSubmit={(updatedTemplate) => 
                                      updateEmailTemplateMutation.mutate({ 
                                        id: template.id, 
                                        template: updatedTemplate 
                                      })
                                    }
                                    isLoading={updateEmailTemplateMutation.isPending}
                                  />
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (confirm("Sei sicuro di voler eliminare questo template?")) {
                                    deleteEmailTemplateMutation.mutate(template.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restaurants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestione Ristoranti</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Subdomain</TableHead>
                      <TableHead>Proprietario</TableHead>
                      <TableHead>Data Creazione</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurantsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Caricamento ristoranti...
                        </TableCell>
                      </TableRow>
                    ) : restaurants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Nessun ristorante trovato
                        </TableCell>
                      </TableRow>
                    ) : (
                      restaurants.map((restaurant) => (
                        <TableRow key={restaurant.id}>
                          <TableCell className="font-medium">{restaurant.name}</TableCell>
                          <TableCell>
                            <a 
                              href={`https://${restaurant.subdomain}.menuisland.it`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {restaurant.subdomain}.menuisland.it
                            </a>
                          </TableCell>
                          <TableCell>{restaurant.ownerEmail}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(restaurant.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <a 
                                  href={`https://${restaurant.subdomain}.menuisland.it`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supporto Tecnico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Mail className="h-4 w-4 mr-2" />
                        Invia Email di Supporto
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invia Email di Supporto</DialogTitle>
                      </DialogHeader>
                      <SupportEmailForm emailTemplates={emailTemplates} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Impostazioni Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="maintenance-mode">Modalità Manutenzione</Label>
                    <p className="text-sm text-muted-foreground">
                      Disabilita l'accesso per tutti gli utenti non amministratori
                    </p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={isMaintenanceMode}
                    onCheckedChange={setIsMaintenanceMode}
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Backup Database
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Support Email Form Component
function SupportEmailForm({ emailTemplates }: { emailTemplates: EmailTemplate[] }) {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [useTemplate, setUseTemplate] = useState(true);
  const { toast } = useToast();

  // Get the active support template
  const supportTemplate = emailTemplates.find((t: EmailTemplate) => t.type === 'support' && t.isActive);

  const sendEmailMutation = useMutation({
    mutationFn: async ({ to, subject, message, templateId, variables }: { 
      to: string; 
      subject: string; 
      message: string;
      templateId?: number;
      variables?: Record<string, string>;
    }) => {
      const response = await apiRequest("POST", "/api/admin/send-email", { 
        to, 
        subject, 
        message,
        templateId,
        variables
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email inviata",
        description: "Email di supporto inviata con successo",
      });
      setEmail("");
      setSubject("");
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      toast({
        title: "Errore",
        description: "Email destinatario e messaggio sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    if (useTemplate && supportTemplate) {
      // Use template with variables
      const variables = {
        name: email.split('@')[0], // Extract name from email
        supportMessage: message
      };
      
      sendEmailMutation.mutate({ 
        to: email, 
        subject: supportTemplate.subject, 
        message: "",
        templateId: supportTemplate.id,
        variables
      });
    } else {
      // Use custom subject and message
      if (!subject) {
        toast({
          title: "Errore",
          description: "Oggetto è obbligatorio quando non si usa un template",
          variant: "destructive",
        });
        return;
      }
      sendEmailMutation.mutate({ to: email, subject, message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email Destinatario</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cliente@esempio.com"
          required
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="useTemplate"
          checked={useTemplate}
          onCheckedChange={setUseTemplate}
        />
        <Label htmlFor="useTemplate">
          Usa template di supporto {supportTemplate ? `(${supportTemplate.name})` : "(Nessun template attivo)"}
        </Label>
      </div>

      {!useTemplate && (
        <div>
          <Label htmlFor="subject">Oggetto</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Oggetto dell'email"
            required={!useTemplate}
          />
        </div>
      )}

      <div>
        <Label htmlFor="message">
          {useTemplate ? "Messaggio di supporto" : "Messaggio"}
        </Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={useTemplate ? "Il messaggio sarà inserito nel template..." : "Il tuo messaggio..."}
          rows={6}
          required
        />
        {useTemplate && supportTemplate && (
          <p className="text-sm text-muted-foreground mt-1">
            Variabili disponibili: {supportTemplate.variables.join(", ")}
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={sendEmailMutation.isPending}
      >
        {sendEmailMutation.isPending ? "Invio..." : "Invia Email"}
      </Button>
    </form>
  );
}

// Email Template Form Component
function EmailTemplateForm({ 
  template, 
  onSubmit, 
  isLoading 
}: { 
  template?: EmailTemplate;
  onSubmit: (template: Partial<EmailTemplate>) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(template?.name || "");
  const [type, setType] = useState(template?.type || "support");
  const [subject, setSubject] = useState(template?.subject || "");
  const [htmlContent, setHtmlContent] = useState(template?.htmlContent || "");
  const [textContent, setTextContent] = useState(template?.textContent || "");
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [variables, setVariables] = useState(template?.variables?.join(", ") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !subject || !htmlContent) {
      alert("Nome, oggetto e contenuto HTML sono obbligatori");
      return;
    }

    onSubmit({
      name,
      type,
      subject,
      htmlContent,
      textContent: textContent || undefined,
      isActive,
      variables: variables ? variables.split(",").map(v => v.trim()).filter(Boolean) : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome Template</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Email di supporto"
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="support">Supporto</SelectItem>
              <SelectItem value="welcome">Benvenuto</SelectItem>
              <SelectItem value="invitation">Invito</SelectItem>
              <SelectItem value="payment_confirmation">Conferma Pagamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
        <Label htmlFor="variables">Variabili disponibili (separate da virgola)</Label>
        <Input
          id="variables"
          value={variables}
          onChange={(e) => setVariables(e.target.value)}
          placeholder="name, email, restaurantName, supportMessage"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Usa {`{{variableName}}`} nel contenuto per sostituire i valori dinamici
        </p>
      </div>

      <div>
        <Label htmlFor="htmlContent">Contenuto HTML</Label>
        <Textarea
          id="htmlContent"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          placeholder="<html><body><h1>Ciao {{name}}!</h1><p>{{message}}</p></body></html>"
          rows={12}
          className="font-mono text-sm"
          required
        />
      </div>

      <div>
        <Label htmlFor="textContent">Contenuto Testo (opzionale)</Label>
        <Textarea
          id="textContent"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Versione testuale dell'email..."
          rows={6}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor="isActive">Template attivo</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvataggio..." : template ? "Aggiorna Template" : "Crea Template"}
        </Button>
      </div>
    </form>
  );
}

// User Actions Dropdown Component
function UserActionsDropdown({ 
  user, 
  togglePaymentMutation, 
  toggleAdminMutation, 
  updateMaxRestaurantsMutation, 
  deleteUserMutation 
}: { 
  user: User;
  togglePaymentMutation?: any;
  toggleAdminMutation?: any;
  updateMaxRestaurantsMutation?: any;
  deleteUserMutation?: any;
}) {
  const [maxRestaurants, setMaxRestaurants] = useState(user.maxRestaurants || 1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => togglePaymentMutation?.mutate({ 
            userId: user.id, 
            hasPaid: !user.hasPaid 
          })}
        >
          {user.hasPaid ? (
            <>
              <Ban className="h-4 w-4 mr-2" />
              Rimuovi Pagamento
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Conferma Pagamento
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => toggleAdminMutation?.mutate({ 
            userId: user.id, 
            isAdmin: !user.isAdmin 
          })}
        >
          {user.isAdmin ? (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Rimuovi Admin
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Rendi Admin
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            const newMax = prompt("Numero massimo di ristoranti:", user.maxRestaurants?.toString() || "1");
            if (newMax && !isNaN(parseInt(newMax))) {
              updateMaxRestaurantsMutation?.mutate({ 
                userId: user.id, 
                maxRestaurants: parseInt(newMax) 
              });
            }
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Modifica Limite Ristoranti
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            if (confirm("Sei sicuro di voler eliminare questo utente?")) {
              deleteUserMutation?.mutate(user.id);
            }
          }}
          className="text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Elimina Utente
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}