import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Book,
  Video,
  Search,
  Plus
} from "lucide-react";
import { format } from "date-fns";

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

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "medium" as const,
    category: "general"
  });

  // Fetch user's support tickets
  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    enabled: !!user,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: typeof formData) => {
      return apiRequest("POST", "/api/support/tickets", ticketData);
    },
    onSuccess: () => {
      toast({
        title: "Richiesta inviata",
        description: "La tua richiesta di assistenza è stata inviata con successo. Ti risponderemo presto.",
      });
      setFormData({
        subject: "",
        message: "",
        priority: "medium",
        category: "general"
      });
      setIsCreatingTicket(false);
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio della richiesta.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Compila tutti i campi richiesti.",
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate(formData);
  };

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
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const faqs = [
    {
      question: "Come creare un nuovo ristorante?",
      answer: "Vai nella dashboard e clicca su 'Nuovo Ristorante'. Compila i dati richiesti e scegli un template per il tuo menu digitale."
    },
    {
      question: "Come modificare il menu del ristorante?",
      answer: "Dalla lista ristoranti, clicca sull'icona menu accanto al ristorante. Potrai aggiungere categorie e piatti con descrizioni e prezzi."
    },
    {
      question: "Come generare codici QR?",
      answer: "Nella sezione ristoranti, clicca sull'icona QR. Potrai generare e scaricare codici QR personalizzati per i tuoi tavoli."
    },
    {
      question: "Come visualizzare le analitiche?",
      answer: "Clicca sull'icona grafici nella lista ristoranti per vedere statistiche dettagliate su visite, scansioni QR e piatti più visualizzati."
    },
    {
      question: "Come funziona la traduzione automatica?",
      answer: "I menu sono automaticamente tradotti in 10 lingue. I clienti possono selezionare la lingua preferita dal menu a tendina."
    },
    {
      question: "Cosa include il piano a pagamento?",
      answer: "Il piano premium include ristoranti illimitati, templates avanzati, analitiche dettagliate e supporto prioritario."
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Centro Assistenza" showNewButton={false} />
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Centro Assistenza MenuIsland
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Siamo qui per aiutarti. Trova risposte alle tue domande o contatta il nostro team di supporto.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setIsCreatingTicket(true)}>
                <CardHeader className="text-center">
                  <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <CardTitle>Nuova Richiesta</CardTitle>
                  <CardDescription>Invia una richiesta di assistenza al nostro team</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Book className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <CardTitle>Documentazione</CardTitle>
                  <CardDescription>Guide complete e tutorial per l'utilizzo</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Video className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                  <CardTitle>Video Tutorial</CardTitle>
                  <CardDescription>Impara guardando i nostri video tutorial</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Contact Info */}
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Contatti Diretti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-gray-600">support@menuisland.it</p>
                      <p className="text-xs text-gray-500">Risposta entro 24 ore</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Chat Live</p>
                      <p className="text-sm text-gray-600">Disponibile dalle 9:00 alle 18:00</p>
                      <p className="text-xs text-gray-500">Lunedì - Venerdì</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>Domande Frequenti</CardTitle>
                <CardDescription>Trova risposte immediate alle domande più comuni</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* New Ticket Form */}
            {isCreatingTicket && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Nuova Richiesta di Assistenza</CardTitle>
                  <CardDescription>Descrivi il tuo problema e ti aiuteremo a risolverlo</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Oggetto *</label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Descrivi brevemente il problema"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Categoria</label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">Generale</SelectItem>
                            <SelectItem value="technical">Problema Tecnico</SelectItem>
                            <SelectItem value="billing">Fatturazione</SelectItem>
                            <SelectItem value="feature">Richiesta Funzionalità</SelectItem>
                            <SelectItem value="bug">Segnalazione Bug</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Priorità</label>
                        <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Bassa</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Descrizione *</label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Descrivi dettagliatamente il problema o la richiesta"
                        rows={5}
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreatingTicket(false)}
                      >
                        Annulla
                      </Button>
                      <Button
                        type="submit"
                        disabled={createTicketMutation.isPending}
                      >
                        {createTicketMutation.isPending ? "Invio..." : "Invia Richiesta"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* My Tickets */}
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Le Mie Richieste</CardTitle>
                    <CardDescription>Stato delle tue richieste di assistenza</CardDescription>
                  </div>
                  <Button onClick={() => setIsCreatingTicket(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Richiesta
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Cerca nelle tue richieste..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Caricamento richieste...</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchQuery ? "Nessuna richiesta trovata" : "Non hai ancora inviato richieste di assistenza"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets.map((ticket) => (
                      <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                              {ticket.subject}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>#{ticket.id}</span>
                              <span>{format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}</span>
                              <Badge className={getPriorityColor(ticket.priority)} variant="secondary">
                                {ticket.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(ticket.status)}
                            <span className="text-sm font-medium">{getStatusText(ticket.status)}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {ticket.message.length > 150 
                            ? `${ticket.message.substring(0, 150)}...` 
                            : ticket.message}
                        </p>

                        {ticket.response && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mt-3">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Risposta del Support:</p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{ticket.response}</p>
                          </div>
                        )}
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

export default Support;