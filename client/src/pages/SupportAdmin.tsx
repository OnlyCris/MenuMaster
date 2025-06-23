import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  User,
  Calendar,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SupportTicket = {
  id: number;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  userId: string;
  userEmail: string;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
};

const SupportAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState("");

  // Fetch all support tickets
  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/support/tickets"],
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      return apiRequest("PUT", `/api/admin/support/tickets/${ticketId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Stato aggiornato",
        description: "Lo stato del ticket è stato aggiornato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
    },
  });

  // Send response mutation
  const sendResponseMutation = useMutation({
    mutationFn: async ({ ticketId, response }: { ticketId: number; response: string }) => {
      return apiRequest("PUT", `/api/admin/support/tickets/${ticketId}/response`, { response });
    },
    onSuccess: () => {
      toast({
        title: "Risposta inviata",
        description: "La risposta è stata inviata al cliente.",
      });
      setResponseText("");
      setSelectedTicket(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Aperto";
      case "in_progress":
        return "In lavorazione";
      case "resolved":
        return "Risolto";
      case "closed":
        return "Chiuso";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    urgent: tickets.filter(t => t.priority === "urgent").length,
  };

  const handleStatusUpdate = (ticketId: number, status: string) => {
    updateStatusMutation.mutate({ ticketId, status });
  };

  const handleSendResponse = () => {
    if (!selectedTicket || !responseText.trim()) return;
    sendResponseMutation.mutate({ 
      ticketId: selectedTicket.id, 
      response: responseText 
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Gestione Supporto" showNewButton={false} />
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Totali</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Aperti</p>
                      <p className="text-2xl font-bold text-red-600">{stats.open}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">In Lavorazione</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Risolti</p>
                      <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Urgenti</p>
                      <p className="text-2xl font-bold text-red-800">{stats.urgent}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-800" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Cerca per oggetto, messaggio o email utente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      <SelectItem value="open">Aperti</SelectItem>
                      <SelectItem value="in_progress">In lavorazione</SelectItem>
                      <SelectItem value="resolved">Risolti</SelectItem>
                      <SelectItem value="closed">Chiusi</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le priorità</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Bassa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tickets List */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket di Supporto ({filteredTickets.length})</CardTitle>
                <CardDescription>Gestisci tutte le richieste di assistenza dei clienti</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Caricamento ticket...</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nessun ticket trovato</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets
                      .sort((a, b) => {
                        // Ordina per priorità e data
                        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
                        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
                        
                        if (aPriority !== bPriority) return aPriority - bPriority;
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      })
                      .map((ticket) => (
                        <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {ticket.subject}
                                </h3>
                                <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                                  {ticket.priority.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                                <span className="flex items-center">
                                  <User className="h-4 w-4 mr-1" />
                                  {ticket.userEmail}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}
                                </span>
                                <span>#{ticket.id}</span>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <strong>Categoria:</strong> {ticket.category} | <strong>Messaggio:</strong> {' '}
                                {ticket.message.length > 200 
                                  ? `${ticket.message.substring(0, 200)}...` 
                                  : ticket.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              {getStatusIcon(ticket.status)}
                              <span className="text-sm font-medium">{getStatusText(ticket.status)}</span>
                            </div>
                          </div>

                          {ticket.response && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-3">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Risposta inviata:</p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">{ticket.response}</p>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <div className="flex space-x-2">
                              <Select
                                value={ticket.status}
                                onValueChange={(status) => handleStatusUpdate(ticket.id, status)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Aperto</SelectItem>
                                  <SelectItem value="in_progress">In lavorazione</SelectItem>
                                  <SelectItem value="resolved">Risolto</SelectItem>
                                  <SelectItem value="closed">Chiuso</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedTicket(ticket)}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Rispondi
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Rispondi al Ticket #{ticket.id}</DialogTitle>
                                  <DialogDescription>
                                    Invia una risposta a {ticket.userEmail}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                    <p className="text-sm font-medium mb-1">Richiesta originale:</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.message}</p>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium mb-2">La tua risposta</label>
                                    <Textarea
                                      value={responseText}
                                      onChange={(e) => setResponseText(e.target.value)}
                                      placeholder="Scrivi la tua risposta qui..."
                                      rows={5}
                                    />
                                  </div>
                                  
                                  <div className="flex justify-end space-x-3">
                                    <Button variant="outline" onClick={() => setResponseText("")}>
                                      Cancella
                                    </Button>
                                    <Button 
                                      onClick={handleSendResponse}
                                      disabled={!responseText.trim() || sendResponseMutation.isPending}
                                    >
                                      {sendResponseMutation.isPending ? "Invio..." : "Invia Risposta"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportAdmin;