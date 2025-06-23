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
import { Input } from "@/components/ui/input";
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
import { 
  MessageCircle, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Mail,
  Phone,
  MessageSquare,
  HelpCircle
} from "lucide-react";

const supportTicketSchema = z.object({
  subject: z.string().min(1, "L'oggetto è obbligatorio"),
  message: z.string().min(10, "Il messaggio deve essere di almeno 10 caratteri"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.string().min(1, "Seleziona una categoria"),
});

type SupportTicketFormData = z.infer<typeof supportTicketSchema>;

const Support = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SupportTicketFormData>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      subject: "",
      message: "",
      priority: "medium",
      category: "general",
    },
  });

  // Fetch user's support tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["/api/support/tickets"],
    enabled: !!user,
  });

  // Create support ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: SupportTicketFormData) => {
      return await apiRequest("POST", "/api/support/tickets", {
        ...data,
        userId: user?.id,
        userEmail: user?.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      form.reset();
      setIsDialogOpen(false);
      toast({
        title: "Ticket creato",
        description: "La tua richiesta di supporto è stata inviata con successo",
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

  const handleSubmit = async (data: SupportTicketFormData) => {
    await createTicketMutation.mutate(data);
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

  if (isAuthLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Topbar />
          <div className="p-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Topbar />
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Centro Supporto</h1>
              <p className="text-gray-600 mt-1">
                Gestisci le tue richieste di supporto e ottieni assistenza
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Richiesta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Nuova Richiesta di Supporto</DialogTitle>
                  <DialogDescription>
                    Descrivi il tuo problema o la tua richiesta. Ti risponderemo il prima possibile.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                              <SelectItem value="technical">Problema Tecnico</SelectItem>
                              <SelectItem value="billing">Fatturazione</SelectItem>
                              <SelectItem value="feature">Richiesta Funzionalità</SelectItem>
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

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Oggetto</FormLabel>
                          <FormControl>
                            <Input placeholder="Descrivi brevemente il problema" {...field} />
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
                          <FormLabel>Messaggio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descrivi dettagliatamente il problema o la richiesta..."
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
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Annulla
                      </Button>
                      <Button type="submit" disabled={createTicketMutation.isPending}>
                        {createTicketMutation.isPending ? "Invio..." : "Invia Richiesta"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Mail className="h-5 w-5 text-blue-500 mr-2" />
                <CardTitle className="text-sm font-medium">Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">support@menuisland.it</div>
                <p className="text-xs text-muted-foreground">
                  Risposta entro 24 ore
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <MessageSquare className="h-5 w-5 text-green-500 mr-2" />
                <CardTitle className="text-sm font-medium">Chat Live</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">9:00 - 18:00</div>
                <p className="text-xs text-muted-foreground">
                  Lun-Ven, supporto immediato
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <HelpCircle className="h-5 w-5 text-purple-500 mr-2" />
                <CardTitle className="text-sm font-medium">FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">50+ Guide</div>
                <p className="text-xs text-muted-foreground">
                  Soluzioni comuni e tutorial
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Support Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Le Mie Richieste di Supporto
              </CardTitle>
              <CardDescription>
                Gestisci e monitora le tue richieste di assistenza
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !tickets || tickets.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nessuna richiesta di supporto
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Non hai ancora inviato richieste di supporto.
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crea Prima Richiesta
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket: any) => (
                    <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {ticket.subject}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3">
                              {ticket.message.length > 150 
                                ? `${ticket.message.substring(0, 150)}...`
                                : ticket.message
                              }
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>#{ticket.id}</span>
                              <span>•</span>
                              <span>{new Date(ticket.createdAt).toLocaleDateString('it-IT')}</span>
                              <span>•</span>
                              <span className="capitalize">{ticket.category}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {formatPriority(ticket.priority)}
                            </Badge>
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1">{formatStatus(ticket.status)}</span>
                            </Badge>
                          </div>
                        </div>
                        
                        {ticket.response && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                            <div className="flex items-center mb-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm font-medium text-green-800">
                                Risposta del Supporto
                              </span>
                            </div>
                            <p className="text-sm text-green-700">{ticket.response}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;