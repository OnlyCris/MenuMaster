import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import {
  Users,
  Building2,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Settings,
  Database,
  Mail,
  Shield,
  Activity,
  TrendingUp,
  Search,
  UserX,
  DollarSign,
  Globe
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalRestaurants: number;
  paidUsers: number;
  unpaidUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeRestaurants: number;
  totalMenuViews: number;
}

interface UserManagement {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  hasPaid: boolean;
  stripeCustomerId?: string;
  paymentDate?: string;
  restaurantCount: number;
  createdAt: string;
}

interface SystemLog {
  id: number;
  level: string;
  message: string;
  timestamp: string;
  userId?: string;
  metadata?: any;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch all users for management
  const { data: users = [], isLoading: usersLoading } = useQuery<UserManagement[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch system logs
  const { data: logs = [], isLoading: logsLoading } = useQuery<SystemLog[]>({
    queryKey: ["/api/admin/logs"],
  });

  // Toggle admin status mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      return await apiRequest("POST", "/api/admin/toggle-admin", { userId, isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Successo",
        description: "Stato amministratore aggiornato con successo",
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

  // Force payment status mutation
  const forcePaymentMutation = useMutation({
    mutationFn: async ({ userId, hasPaid }: { userId: string; hasPaid: boolean }) => {
      return await apiRequest("POST", "/api/admin/force-payment", { userId, hasPaid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Successo",
        description: "Stato pagamento aggiornato con successo",
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

  // Send support email mutation
  const sendSupportEmailMutation = useMutation({
    mutationFn: async ({ userId, subject, message }: { userId: string; subject: string; message: string }) => {
      return await apiRequest("POST", "/api/admin/send-support-email", { userId, subject, message });
    },
    onSuccess: () => {
      toast({
        title: "Email inviata",
        description: "Email di supporto inviata con successo",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'invio email",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      
      <div className="flex-1 pl-64 overflow-y-auto">
        <Topbar title="Pannello Amministrazione" />
        
        <div className="p-6">
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertTitle>Pannello Amministratore</AlertTitle>
            <AlertDescription>
              Hai accesso completo al sistema per fornire assistenza ai clienti e gestire la piattaforma.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Panoramica</TabsTrigger>
              <TabsTrigger value="users">Gestione Utenti</TabsTrigger>
              <TabsTrigger value="support">Assistenza</TabsTrigger>
              <TabsTrigger value="system">Sistema</TabsTrigger>
              <TabsTrigger value="logs">Log Sistema</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.paidUsers || 0} paganti, {stats?.unpaidUsers || 0} non paganti
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ristoranti</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalRestaurants || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeRestaurants || 0} attivi
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Entrate Mensili</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{stats?.monthlyRevenue || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Totale: €{stats?.totalRevenue || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Visualizzazioni Menu</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalMenuViews || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Questo mese
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestione Utenti</CardTitle>
                  <CardDescription>
                    Gestisci tutti gli utenti della piattaforma, modifica permessi e stato pagamenti
                  </CardDescription>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca utenti per email o nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{user.email}</h3>
                            {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
                            {user.hasPaid ? (
                              <Badge className="bg-green-100 text-green-800">Pagato</Badge>
                            ) : (
                              <Badge variant="destructive">Non Pagato</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.firstName} {user.lastName} • {user.restaurantCount} ristoranti
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Registrato: {new Date(user.createdAt).toLocaleDateString()}
                            {user.paymentDate && ` • Pagamento: ${new Date(user.paymentDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAdminMutation.mutate({ 
                              userId: user.id, 
                              isAdmin: !user.isAdmin 
                            })}
                          >
                            {user.isAdmin ? <UserX className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                            {user.isAdmin ? "Rimuovi Admin" : "Rendi Admin"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => forcePaymentMutation.mutate({ 
                              userId: user.id, 
                              hasPaid: !user.hasPaid 
                            })}
                          >
                            <CreditCard className="h-4 w-4" />
                            {user.hasPaid ? "Annulla Pagamento" : "Forza Pagamento"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Mail className="h-4 w-4" />
                            Contatta
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              {selectedUser && (
                <Card>
                  <CardHeader>
                    <CardTitle>Invia Email di Supporto</CardTitle>
                    <CardDescription>
                      Contatta {selectedUser.email} per assistenza
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Oggetto</Label>
                      <Input id="subject" placeholder="Oggetto dell'email..." />
                    </div>
                    <div>
                      <Label htmlFor="message">Messaggio</Label>
                      <Textarea
                        id="message"
                        placeholder="Scrivi il messaggio di supporto..."
                        rows={6}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          const subject = (document.getElementById('subject') as HTMLInputElement)?.value;
                          const message = (document.getElementById('message') as HTMLTextAreaElement)?.value;
                          if (subject && message) {
                            sendSupportEmailMutation.mutate({
                              userId: selectedUser.id,
                              subject,
                              message
                            });
                          }
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Invia Email
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedUser(null)}>
                        Annulla
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Strumenti di Assistenza</CardTitle>
                  <CardDescription>
                    Funzioni rapide per la gestione del supporto clienti
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <Globe className="h-6 w-6 mb-2" />
                      Verifica Domini
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Database className="h-6 w-6 mb-2" />
                      Backup Database
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Activity className="h-6 w-6 mb-2" />
                      Monitor Sistema
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Settings className="h-6 w-6 mb-2" />
                      Configurazioni
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stato Sistema</CardTitle>
                  <CardDescription>
                    Informazioni sullo stato dei servizi e delle integrazioni
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Database PostgreSQL</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Attivo
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Stripe Payments</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Attivo
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Cloudflare DNS</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Attivo
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Email Service</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Attivo
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Log Sistema</CardTitle>
                  <CardDescription>
                    Visualizza i log del sistema per diagnostica e debug
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-2 p-2 border rounded text-sm">
                        <Badge 
                          variant={log.level === 'error' ? 'destructive' : 
                                  log.level === 'warn' ? 'secondary' : 'default'}
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                        <div className="flex-1">
                          <p>{log.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                            {log.userId && ` • User: ${log.userId}`}
                          </p>
                        </div>
                      </div>
                    ))}
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