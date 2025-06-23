import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Users,
  TrendingUp,
  Filter,
  Reply,
  Eye
} from "lucide-react";

const responseSchema = z.object({
  response: z.string().min(1, "La risposta è obbligatoria"),
});

type ResponseFormData = z.infer<typeof responseSchema>;

const SupportAdmin = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: "",
    },
  });

  // Fetch all support tickets (admin only)
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["/api/admin/support/tickets"],
    enabled: !!user?.isAdmin,
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      return await apiRequest("PUT", `/api/admin/support/tickets/${ticketId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      toast({
        title: "Stato aggiornato",
        description: "Lo stato del ticket è stato aggiornato con successo",
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

  // Send response mutation
  const sendResponseMutation = useMutation({
    mutationFn: async ({ ticketId, response }: { ticketId: number; response: string }) => {
      return await apiRequest("PUT", `/api/admin/support/tickets/${ticketId}/response`, { response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      form.reset();
      setIsResponseDialogOpen(false);
      setSelectedTicket(null);
      toast({
        title: "Risposta inviata",
        description: "La risposta è stata inviata al cliente",
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

  const handleSendResponse = async (data: ResponseFormData) => {
    if (selectedTicket) {
      await sendResponseMutation.mutate({
        ticketId: selectedTicket.id,
        response: data.response,
      });
    }
  };

  const handleStatusChange = async (ticketId: number, status: string) => {
    await updateStatusMutation.mutate({ ticketId, status });
  };

  const openResponseDialog = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsResponseDialogOpen(true);
    form.reset({ response: "" });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Clock className="h-4 w-4" />;
      case "in_progress": return <AlertCircle className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatPriority = (priority: string) => {
    const map = {
      low: "Bassa",
      medium: "Media", 
      high: "Alta",
      urgent: "Urgente"
    };
    return map[priority as keyof typeof map] || priority;
  };

  const formatStatus = (status: string) => {
    const map = {
      open: "Aperto",
      in_progress: "In Lavorazione",
      resolved: "Risolto", 
      closed: "Chiuso"
    };
    return map[status as keyof typeof map] || status;
  };

  const formatCategory = (category: string) => {
    const map = {
      general: "Generale",
      technical: "Tecnico",
      billing: "Fatturazione",
      feature: "Funzionalità",
      bug: "Bug"
    };
    return map[category as keyof typeof map] || category;
  };

  // Filter tickets
  const filteredTickets = tickets?.filter((ticket: any) => {
    const statusMatch = filterStatus === "all" || ticket.status === filterStatus;
    const priorityMatch = filterPriority === "all" || ticket.priority === filterPriority;
    return statusMatch && priorityMatch;
  }) || [];

  // Calculate stats
  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter((t: any) => t.status === "open").length || 0,
    inProgress: tickets?.filter((t: any) => t.status === "in_progress").length || 0,
    resolved: tickets?.filter((t: any) => t.status === "resolved").length || 0,
  };

  if (isAuthLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Topbar />
          <div className="p-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Topbar />
          <div className="p-8">
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Accesso Negato
                </h2>
                <p className="text-gray-600">
                  Solo gli amministratori possono accedere a questa sezione.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Topbar />
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestione Supporto</h1>
            <p className="text-gray-600 mt-1">
              Dashboard amministrativa per la gestione delle richieste di supporto
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <MessageCircle className="h-5 w-5 text-blue-500 mr-2" />
                <CardTitle className="text-sm font-medium">Totale Ticket</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Tutte le richieste
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Clock className="h-5 w-5 text-orange-500 mr-2" />
                <CardTitle className="text-sm font-medium">Aperti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.open}</div>
                <p className="text-xs text-muted-foreground">
                  In attesa di risposta
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                <CardTitle className="text-sm font-medium">In Lavorazione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">
                  Attualmente gestiti
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <CardTitle className="text-sm font-medium">Risolti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.resolved}</div>
                <p className="text-xs text-muted-foreground">
                  Completati con successo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Stato</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="open">Aperti</SelectItem>
                      <SelectItem value="in_progress">In Lavorazione</SelectItem>
                      <SelectItem value="resolved">Risolti</SelectItem>
                      <SelectItem value="closed">Chiusi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Priorità</label>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Bassa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Ticket di Supporto ({filteredTickets.length})
              </CardTitle>
              <CardDescription>
                Gestisci e rispondi alle richieste dei clienti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nessun ticket trovato
                  </h3>
                  <p className="text-gray-500">
                    Non ci sono ticket che corrispondono ai filtri selezionati.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket: any) => (
                    <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {ticket.subject}
                              </h3>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {formatPriority(ticket.priority)}
                              </Badge>
                              <Badge className={getStatusColor(ticket.status)}>
                                {getStatusIcon(ticket.status)}
                                <span className="ml-1">{formatStatus(ticket.status)}</span>
                              </Badge>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">
                              {ticket.message.length > 200 
                                ? `${ticket.message.substring(0, 200)}...`
                                : ticket.message
                              }
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>#{ticket.id}</span>
                              <span>•</span>
                              <span>{ticket.userEmail}</span>
                              <span>•</span>
                              <span>{formatCategory(ticket.category)}</span>
                              <span>•</span>
                              <span>{new Date(ticket.createdAt).toLocaleDateString('it-IT')}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {ticket.status !== "resolved" && ticket.status !== "closed" && (
                              <Button
                                size="sm"
                                onClick={() => openResponseDialog(ticket)}
                              >
                                <Reply className="h-4 w-4 mr-2" />
                                Rispondi
                              </Button>
                            )}
                            <Select
                              value={ticket.status}
                              onValueChange={(status) => handleStatusChange(ticket.id, status)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Aperto</SelectItem>
                                <SelectItem value="in_progress">In Lavorazione</SelectItem>
                                <SelectItem value="resolved">Risolto</SelectItem>
                                <SelectItem value="closed">Chiuso</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {ticket.response && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <div className="flex items-center mb-2">
                              <Reply className="h-4 w-4 text-blue-500 mr-2" />
                              <span className="text-sm font-medium text-blue-800">
                                Risposta Inviata
                              </span>
                            </div>
                            <p className="text-sm text-blue-700">{ticket.response}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Dialog */}
          <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Rispondi al Ticket #{selectedTicket?.id}</DialogTitle>
                <DialogDescription>
                  Scrivi una risposta per il cliente: {selectedTicket?.userEmail}
                </DialogDescription>
              </DialogHeader>
              
              {selectedTicket && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedTicket.subject}</h4>
                  <p className="text-sm text-gray-600">{selectedTicket.message}</p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSendResponse)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="response"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risposta</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Scrivi la tua risposta al cliente..."
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsResponseDialogOpen(false)}
                    >
                      Annulla
                    </Button>
                    <Button type="submit" disabled={sendResponseMutation.isPending}>
                      {sendResponseMutation.isPending ? "Invio..." : "Invia Risposta"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default SupportAdmin;