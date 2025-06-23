import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SupportTicket, InsertSupportTicket } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HelpCircle, MessageCircle, Plus, ChevronDown, ChevronRight, Mail, Phone, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/hooks/useAuth";

const supportSchema = z.object({
  subject: z.string().min(1, "Oggetto obbligatorio").max(200, "Oggetto troppo lungo"),
  message: z.string().min(10, "Messaggio deve contenere almeno 10 caratteri").max(2000, "Messaggio troppo lungo"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.enum(["general", "technical", "billing", "feature", "bug"]),
});

type SupportFormData = z.infer<typeof supportSchema>;

// FAQ Data
const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "Come creo il mio primo ristorante?",
        a: "Vai nella sezione 'Ristoranti' e clicca su 'Nuovo Ristorante'. Inserisci il nome, la posizione e scegli un template. Il tuo menu digitale sarà disponibile su [nome].menuisland.it"
      },
      {
        q: "Come aggiungo piatti al mio menu?",
        a: "Entra nel tuo ristorante, vai su 'Gestisci Menu', crea le categorie (Antipasti, Primi, etc.) e poi aggiungi i piatti con foto, descrizioni e prezzi."
      },
      {
        q: "Come funzionano i QR code?",
        a: "I QR code vengono generati automaticamente per ogni tavolo. I clienti scansionano il codice e vedono il menu digitale del tuo ristorante sul loro telefono."
      }
    ]
  },
  {
    category: "Features",
    questions: [
      {
        q: "Posso cambiare il design del mio menu?",
        a: "Sì! Abbiamo 5 template professionali. Puoi cambiarli in qualsiasi momento dalla sezione 'Template' del tuo ristorante."
      },
      {
        q: "Il menu supporta più lingue?",
        a: "Sì, supportiamo 10 lingue con traduzione automatica. I clienti possono scegliere la loro lingua preferita dal menu."
      },
      {
        q: "Posso vedere le statistiche del mio menu?",
        a: "Certo! La sezione 'Analytics' ti mostra visite, scansioni QR, piatti più visti e statistiche delle lingue utilizzate."
      }
    ]
  },
  {
    category: "Technical Issues",
    questions: [
      {
        q: "Le immagini non si caricano",
        a: "Assicurati che le immagini siano in formato JPG/PNG e non superino 5MB. Se il problema persiste, contattaci."
      },
      {
        q: "Il menu non si aggiorna",
        a: "Prova a ricaricare la pagina (Ctrl+F5). Le modifiche sono immediate ma potrebbero essere necessari alcuni secondi per la sincronizzazione."
      },
      {
        q: "Non riesco ad accedere al mio account",
        a: "Verifica email e password. Se hai dimenticato la password, usa il link 'Password dimenticata' nella pagina di login."
      }
    ]
  },
  {
    category: "Billing & Plans",
    questions: [
      {
        q: "Quanto costa il servizio?",
        a: "Offriamo 1 ristorante gratuito. Per ristoranti illimitati, il piano premium costa €19.99/mese con pagamento sicuro via Stripe."
      },
      {
        q: "Posso cancellare in qualsiasi momento?",
        a: "Sì, puoi cancellare il tuo abbonamento in qualsiasi momento dalle impostazioni del tuo account."
      },
      {
        q: "Che metodi di pagamento accettate?",
        a: "Accettiamo tutte le principali carte di credito e debito tramite Stripe, il sistema di pagamento più sicuro al mondo."
      }
    ]
  }
];

export default function Help() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [openFaqItems, setOpenFaqItems] = useState<string[]>([]);

  // Form
  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      subject: "",
      message: "",
      priority: "medium",
      category: "general",
    },
  });

  // Fetch user's support tickets
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    enabled: !!user,
  });

  // Create support ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: SupportFormData) => {
      return await apiRequest("POST", "/api/support/tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      form.reset();
      setIsTicketDialogOpen(false);
      toast({
        title: "Ticket inviato!",
        description: "La tua richiesta è stata inviata al nostro team di supporto. Ti risponderemo presto!",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore nell'invio del ticket",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: SupportFormData) => {
    await createTicketMutation.mutate(data);
  };

  const toggleFaqItem = (id: string) => {
    setOpenFaqItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
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
      case "closed": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      
      <div className="flex-1 lg:pl-64 overflow-y-auto">
        <Topbar 
          title="Centro Assistenza" 
          showNewButton={false}
        />
        
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Centro Assistenza MenuIsland
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Trova risposte alle tue domande o contatta il nostro supporto
            </p>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsTicketDialogOpen(true)}>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Apri un Ticket</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Invia una richiesta di supporto dettagliata
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Mail className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Email Supporto</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  support@menuisland.it
                </p>
                <p className="text-xs text-gray-500">Risposta entro 24h</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chat Live</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  Lun-Ven 9:00-18:00
                </p>
                <p className="text-xs text-gray-500">Supporto immediato</p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Domande Frequenti (FAQ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqData.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-primary">{category.category}</h3>
                    <div className="space-y-2">
                      {category.questions.map((faq, faqIndex) => {
                        const itemId = `${categoryIndex}-${faqIndex}`;
                        const isOpen = openFaqItems.includes(itemId);
                        
                        return (
                          <Collapsible key={faqIndex}>
                            <CollapsibleTrigger 
                              className="flex items-center w-full text-left p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              onClick={() => toggleFaqItem(itemId)}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                              )}
                              <span className="font-medium">{faq.q}</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-6 pb-3">
                              <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User's Support Tickets */}
          {user && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  I Tuoi Ticket di Supporto
                </CardTitle>
                <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Crea Nuovo Ticket di Supporto</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleziona categoria" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="general">Generale</SelectItem>
                                    <SelectItem value="technical">Tecnico</SelectItem>
                                    <SelectItem value="billing">Fatturazione</SelectItem>
                                    <SelectItem value="feature">Nuova Funzionalità</SelectItem>
                                    <SelectItem value="bug">Segnalazione Bug</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priorità</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleziona priorità" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Bassa</SelectItem>
                                    <SelectItem value="medium">Media</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="urgent">Urgente</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Oggetto</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Descrivi brevemente il problema" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrizione Dettagliata</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Descrivi il problema in dettaglio, includi i passaggi per riprodurlo se è un bug..."
                                  rows={6}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createTicketMutation.isPending}
                        >
                          {createTicketMutation.isPending ? "Invio in corso..." : "Invia Ticket"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingTickets ? (
                  <div className="text-center py-8">Caricamento ticket...</div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Non hai ancora creato nessun ticket di supporto.</p>
                    <p className="text-sm mt-2">Clicca su "Nuovo Ticket" per iniziare!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Oggetto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Priorità</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Creato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ticket.subject}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {ticket.message}
                              </div>
                              {ticket.response && (
                                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                  <strong>Risposta:</strong> {ticket.response}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatCategory(ticket.category)}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {formatPriority(ticket.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1">{formatStatus(ticket.status)}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(ticket.createdAt!)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resource Links */}
          <Card>
            <CardHeader>
              <CardTitle>Risorse Utili</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Guide e Tutorial</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Guida completa alla creazione del menu</li>
                    <li>• Come utilizzare i QR code</li>
                    <li>• Personalizzazione dei template</li>
                    <li>• Gestione delle analytics</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Video Tutorial</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Setup iniziale del ristorante</li>
                    <li>• Aggiunta di foto ai piatti</li>
                    <li>• Configurazione multilingua</li>
                    <li>• Lettura delle statistiche</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}